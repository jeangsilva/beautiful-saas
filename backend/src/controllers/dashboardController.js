// ===========================
// backend/src/controllers/DashboardController.js (8/8)
// ===========================
const { Booking, Customer, User, Service, Company } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');

class DashboardController {
  // Dashboard principal com métricas
  async index(req, res) {
    try {
      const { period = '30' } = req.query; // últimos X dias
      const startDate = moment().subtract(period, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      // Métricas gerais
      const [
        totalBookings,
        totalCustomers,
        totalRevenue,
        pendingBookings,
        todayBookings,
        recentBookings,
        topServices,
        topProfessionals
      ] = await Promise.all([
        this.getTotalBookings(req.company.id, startDate, endDate),
        this.getTotalCustomers(req.company.id),
        this.getTotalRevenue(req.company.id, startDate, endDate),
        this.getPendingBookings(req.company.id),
        this.getTodayBookings(req.company.id),
        this.getRecentBookings(req.company.id),
        this.getTopServices(req.company.id, startDate, endDate),
        this.getTopProfessionals(req.company.id, startDate, endDate)
      ]);

      // Dados para gráficos
      const bookingsChart = await this.getBookingsChart(req.company.id, period);
      const revenueChart = await this.getRevenueChart(req.company.id, period);

      res.json({
        success: true,
        data: {
          metrics: {
            total_bookings: totalBookings,
            total_customers: totalCustomers,
            total_revenue: totalRevenue,
            pending_bookings: pendingBookings,
            today_bookings: todayBookings
          },
          recent_bookings: recentBookings,
          top_services: topServices,
          top_professionals: topProfessionals,
          charts: {
            bookings: bookingsChart,
            revenue: revenueChart
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao carregar dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Total de agendamentos no período
  async getTotalBookings(companyId, startDate, endDate) {
    return await Booking.count({
      where: {
        company_id: companyId,
        booking_date: {
          [Op.between]: [startDate, endDate]
        },
        status: { [Op.notIn]: ['cancelled'] }
      }
    });
  }

  // Total de clientes únicos
  async getTotalCustomers(companyId) {
    return await Customer.count({
      where: {
        company_id: companyId,
        is_active: true
      }
    });
  }

  // Receita total no período
  async getTotalRevenue(companyId, startDate, endDate) {
    const result = await Booking.findOne({
      where: {
        company_id: companyId,
        booking_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('final_price')), 'total']
      ]
    });

    return parseFloat(result?.dataValues?.total || 0);
  }

  // Agendamentos pendentes
  async getPendingBookings(companyId) {
    return await Booking.count({
      where: {
        company_id: companyId,
        status: 'pending',
        booking_date: { [Op.gte]: moment().format('YYYY-MM-DD') }
      }
    });
  }

  // Agendamentos de hoje
  async getTodayBookings(companyId) {
    return await Booking.count({
      where: {
        company_id: companyId,
        booking_date: moment().format('YYYY-MM-DD'),
        status: { [Op.notIn]: ['cancelled'] }
      }
    });
  }

  // Agendamentos recentes
  async getRecentBookings(companyId) {
    return await Booking.findAll({
      where: {
        company_id: companyId,
        booking_date: { [Op.gte]: moment().format('YYYY-MM-DD') }
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone']
        },
        {
          model: User,
          as: 'professional',
          attributes: ['id', 'name']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name']
        }
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
      limit: 10
    });
  }

  // Serviços mais populares
  async getTopServices(companyId, startDate, endDate) {
    return await Service.findAll({
      where: { company_id: companyId },
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: {
            booking_date: {
              [Op.between]: [startDate, endDate]
            },
            status: { [Op.notIn]: ['cancelled'] }
          },
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        'price',
        [require('sequelize').fn('COUNT', require('sequelize').col('bookings.id')), 'booking_count']
      ],
      group: ['Service.id'],
      order: [[require('sequelize').literal('booking_count'), 'DESC']],
      limit: 5
    });
  }

  // Profissionais com mais agendamentos
  async getTopProfessionals(companyId, startDate, endDate) {
    return await User.findAll({
      where: {
        company_id: companyId,
        role: 'professional',
        is_active: true
      },
      include: [
        {
          model: Booking,
          as: 'professionalBookings',
          where: {
            booking_date: {
              [Op.between]: [startDate, endDate]
            },
            status: { [Op.notIn]: ['cancelled'] }
          },
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        'specialty',
        'avatar_url',
        [require('sequelize').fn('COUNT', require('sequelize').col('professionalBookings.id')), 'booking_count']
      ],
      group: ['User.id'],
      order: [[require('sequelize').literal('booking_count'), 'DESC']],
      limit: 5
    });
  }

  // Dados para gráfico de agendamentos
  async getBookingsChart(companyId, period) {
    const days = parseInt(period);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      
      const count = await Booking.count({
        where: {
          company_id: companyId,
          booking_date: date,
          status: { [Op.notIn]: ['cancelled'] }
        }
      });

      data.push({
        date: moment(date).format('DD/MM'),
        count
      });
    }

    return data;
  }

  // Dados para gráfico de receita
  async getRevenueChart(companyId, period) {
    const days = parseInt(period);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      
      const result = await Booking.findOne({
        where: {
          company_id: companyId,
          booking_date: date,
          status: 'completed'
        },
        attributes: [
          [require('sequelize').fn('SUM', require('sequelize').col('final_price')), 'total']
        ]
      });

      const revenue = parseFloat(result?.dataValues?.total || 0);

      data.push({
        date: moment(date).format('DD/MM'),
        revenue
      });
    }

    return data;
  }

  // Relatório de agendamentos por status
  async bookingsByStatus(req, res) {
    try {
      const { period = '30' } = req.query;
      const startDate = moment().subtract(period, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const statusCount = await Booking.findAll({
        where: {
          company_id: req.company.id,
          booking_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status'],
        order: [[require('sequelize').literal('count'), 'DESC']]
      });

      res.json({
        success: true,
        data: { status_count: statusCount }
      });
    } catch (error) {
      logger.error('Erro ao buscar relatório por status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Relatório financeiro
  async financialReport(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'start_date e end_date são obrigatórios'
        });
      }

      const [
        totalRevenue,
        completedBookings,
        averageTicket,
        revenueByService,
        revenueByProfessional,
        dailyRevenue
      ] = await Promise.all([
        this.getTotalRevenue(req.company.id, start_date, end_date),
        this.getCompletedBookings(req.company.id, start_date, end_date),
        this.getAverageTicket(req.company.id, start_date, end_date),
        this.getRevenueByService(req.company.id, start_date, end_date),
        this.getRevenueByProfessional(req.company.id, start_date, end_date),
        this.getDailyRevenue(req.company.id, start_date, end_date)
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            total_revenue: totalRevenue,
            completed_bookings: completedBookings,
            average_ticket: averageTicket
          },
          revenue_by_service: revenueByService,
          revenue_by_professional: revenueByProfessional,
          daily_revenue: dailyRevenue
        }
      });
    } catch (error) {
      logger.error('Erro ao gerar relatório financeiro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Agendamentos concluídos
  async getCompletedBookings(companyId, startDate, endDate) {
    return await Booking.count({
      where: {
        company_id: companyId,
        booking_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      }
    });
  }

  // Ticket médio
  async getAverageTicket(companyId, startDate, endDate) {
    const result = await Booking.findOne({
      where: {
        company_id: companyId,
        booking_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('final_price')), 'average']
      ]
    });

    return parseFloat(result?.dataValues?.average || 0);
  }

  // Receita por serviço
  async getRevenueByService(companyId, startDate, endDate) {
    return await Service.findAll({
      where: { company_id: companyId },
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: {
            booking_date: {
              [Op.between]: [startDate, endDate]
            },
            status: 'completed'
          },
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        [require('sequelize').fn('SUM', require('sequelize').col('bookings.final_price')), 'total_revenue'],
        [require('sequelize').fn('COUNT', require('sequelize').col('bookings.id')), 'booking_count']
      ],
      group: ['Service.id'],
      order: [[require('sequelize').literal('total_revenue'), 'DESC']]
    });
  }

  // Receita por profissional
  async getRevenueByProfessional(companyId, startDate, endDate) {
    return await User.findAll({
      where: {
        company_id: companyId,
        role: 'professional',
        is_active: true
      },
      include: [
        {
          model: Booking,
          as: 'professionalBookings',
          where: {
            booking_date: {
              [Op.between]: [startDate, endDate]
            },
            status: 'completed'
          },
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        [require('sequelize').fn('SUM', require('sequelize').col('professionalBookings.final_price')), 'total_revenue'],
        [require('sequelize').fn('COUNT', require('sequelize').col('professionalBookings.id')), 'booking_count']
      ],
      group: ['User.id'],
      order: [[require('sequelize').literal('total_revenue'), 'DESC']]
    });
  }

  // Receita diária
  async getDailyRevenue(companyId, startDate, endDate) {
    return await Booking.findAll({
      where: {
        company_id: companyId,
        booking_date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      attributes: [
        'booking_date',
        [require('sequelize').fn('SUM', require('sequelize').col('final_price')), 'daily_revenue'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'booking_count']
      ],
      group: ['booking_date'],
      order: [['booking_date', 'ASC']]
    });
  }
}

module.exports = new DashboardController();
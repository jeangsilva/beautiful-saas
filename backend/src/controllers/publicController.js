// ===========================
// backend/src/controllers/PublicController.js (6/8)
// ===========================
const { Company, Service, ServiceCategory, User, Booking, Customer } = require('../models');
const { Op } = require('sequelize');
const BookingController = require('./bookingController');
const { validateBooking } = require('../utils/validators');
const logger = require('../utils/logger');

class PublicController {
  // Buscar empresa por slug
  async getCompany(req, res) {
    try {
      const { slug } = req.params;
      
      const company = await Company.findOne({
        where: { 
          slug, 
          is_active: true,
          subscription_status: { [Op.in]: ['trial', 'active'] }
        },
        attributes: [
          'id', 'name', 'slug', 'email', 'phone', 'address', 'city', 'state',
          'logo_url', 'website', 'instagram', 'whatsapp',
          'working_start_time', 'working_end_time', 'booking_advance_days',
          'booking_interval_minutes', 'cancellation_hours'
        ]
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada ou inativa'
        });
      }

      res.json({
        success: true,
        data: { company }
      });
    } catch (error) {
      logger.error('Erro ao buscar empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar serviços da empresa
  async getServices(req, res) {
    try {
      const { slug } = req.params;
      
      const company = await Company.findOne({
        where: { 
          slug, 
          is_active: true,
          subscription_status: { [Op.in]: ['trial', 'active'] }
        }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      const categories = await ServiceCategory.findAll({
        where: { company_id: company.id, is_active: true },
        include: [{
          model: Service,
          as: 'services',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'name', 'description', 'price', 'duration_minutes', 'image_url']
        }],
        order: [
          ['sort_order', 'ASC'], 
          ['name', 'ASC'],
          [{ model: Service, as: 'services' }, 'name', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Erro ao buscar serviços:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar profissionais da empresa
  async getProfessionals(req, res) {
    try {
      const { slug } = req.params;
      
      const company = await Company.findOne({
        where: { 
          slug, 
          is_active: true,
          subscription_status: { [Op.in]: ['trial', 'active'] }
        }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      const professionals = await User.findAll({
        where: { 
          company_id: company.id, 
          role: 'professional',
          is_active: true 
        },
        attributes: ['id', 'name', 'specialty', 'bio', 'avatar_url', 'rating', 'total_reviews'],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: { professionals }
      });
    } catch (error) {
      logger.error('Erro ao buscar profissionais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar agendamento público
  async createBooking(req, res) {
    try {
      const { slug } = req.params;
      
      const company = await Company.findOne({
        where: { 
          slug, 
          is_active: true,
          subscription_status: { [Op.in]: ['trial', 'active'] }
        }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      // Simular req.company para reutilizar BookingController
      req.company = company;
      req.user = { role: 'public' }; // Role fictício para logs
      
      // Validar dados de agendamento
      const { error } = validateBooking(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Usar método do BookingController
      await BookingController.store(req, res);
      
    } catch (error) {
      logger.error('Erro ao criar agendamento público:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar horários disponíveis público
  async getAvailableSlots(req, res) {
    try {
      const { slug } = req.params;
      
      const company = await Company.findOne({
        where: { 
          slug, 
          is_active: true,
          subscription_status: { [Op.in]: ['trial', 'active'] }
        }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      // Simular req.company para reutilizar BookingController
      req.company = company;
      
      // Usar método do BookingController
      await BookingController.availableSlots(req, res);
      
    } catch (error) {
      logger.error('Erro ao buscar horários disponíveis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar agendamento por ID (para confirmação)
  async getBooking(req, res) {
    try {
      const { slug, bookingId } = req.params;
      
      const company = await Company.findOne({
        where: { 
          slug, 
          is_active: true,
          subscription_status: { [Op.in]: ['trial', 'active'] }
        }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      const booking = await Booking.findOne({
        where: { 
          id: bookingId,
          company_id: company.id 
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
            attributes: ['id', 'name', 'duration_minutes'] 
          }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: { 
          booking,
          company: {
            name: company.name,
            address: company.address,
            phone: company.phone
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new PublicController();// ===========================
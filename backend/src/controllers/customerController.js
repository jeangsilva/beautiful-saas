// ===========================
// backend/src/controllers/CustomerController.js (3/8)
// ===========================
const { Customer, Booking, User, Service } = require('../models');
const { Op } = require('sequelize');
const { validateCustomer } = require('../utils/validators');
const logger = require('../utils/logger');

class CustomerController {
  // Listar clientes
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        sort_by = 'name',
        sort_order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { 
        company_id: req.company.id,
        is_active: true
      };

      // Busca por nome, email ou telefone
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: customers } = await Customer.findAndCountAll({
        where,
        order: [[sort_by, sort_order.toUpperCase()]],
        limit: parseInt(limit),
        offset,
        include: [
          {
            model: User,
            as: 'preferredProfessional',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao listar clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar cliente
  async store(req, res) {
    try {
      const { error } = validateCustomer(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Verificar se já existe cliente com mesmo telefone ou email
      const existingCustomer = await Customer.findOne({
        where: {
          company_id: req.company.id,
          [Op.or]: [
            { phone: req.body.phone },
            ...(req.body.email ? [{ email: req.body.email }] : [])
          ]
        }
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: 'Cliente já existe com este telefone ou email'
        });
      }

      const customer = await Customer.create({
        ...req.body,
        company_id: req.company.id
      });

      logger.info(`Cliente criado: ${customer.name} - ${customer.phone}`);

      res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        data: { customer }
      });
    } catch (error) {
      logger.error('Erro ao criar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar cliente por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const customer = await Customer.findOne({
        where: { 
          id, 
          company_id: req.company.id,
          is_active: true 
        },
        include: [
          {
            model: User,
            as: 'preferredProfessional',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: Booking,
            as: 'bookings',
            limit: 10,
            order: [['booking_date', 'DESC']],
            include: [
              {
                model: User,
                as: 'professional',
                attributes: ['id', 'name']
              },
              {
                model: Service,
                as: 'service',
                attributes: ['id', 'name', 'price']
              }
            ]
          }
        ]
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      res.json({
        success: true,
        data: { customer }
      });
    } catch (error) {
      logger.error('Erro ao buscar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar cliente
  async update(req, res) {
    try {
      const { id } = req.params;
      const { error } = validateCustomer(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const customer = await Customer.findOne({
        where: { 
          id, 
          company_id: req.company.id,
          is_active: true 
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      // Verificar se não há conflito com outro cliente
      if (req.body.phone || req.body.email) {
        const existingCustomer = await Customer.findOne({
          where: {
            company_id: req.company.id,
            id: { [Op.ne]: id },
            [Op.or]: [
              ...(req.body.phone ? [{ phone: req.body.phone }] : []),
              ...(req.body.email ? [{ email: req.body.email }] : [])
            ]
          }
        });

        if (existingCustomer) {
          return res.status(409).json({
            success: false,
            message: 'Já existe outro cliente com este telefone ou email'
          });
        }
      }

      await customer.update(req.body);

      logger.info(`Cliente atualizado: ${customer.name} - ${customer.phone}`);

      res.json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        data: { customer }
      });
    } catch (error) {
      logger.error('Erro ao atualizar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Deletar cliente (soft delete)
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const customer = await Customer.findOne({
        where: { 
          id, 
          company_id: req.company.id,
          is_active: true 
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      // Verificar se há agendamentos futuros
      const futureBookings = await Booking.count({
        where: {
          customer_id: id,
          booking_date: { [Op.gte]: new Date() },
          status: { [Op.notIn]: ['cancelled', 'completed'] }
        }
      });

      if (futureBookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir cliente com agendamentos futuros'
        });
      }

      await customer.update({ is_active: false });

      logger.info(`Cliente desativado: ${customer.name} - ${customer.phone}`);

      res.json({
        success: true,
        message: 'Cliente desativado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao desativar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Histórico de agendamentos do cliente
  async bookingHistory(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Verificar se cliente existe e pertence à empresa
      const customer = await Customer.findOne({
        where: { 
          id, 
          company_id: req.company.id,
          is_active: true 
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where: { customer_id: id },
        include: [
          {
            model: User,
            as: 'professional',
            attributes: ['id', 'name']
          },
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name', 'price', 'duration_minutes']
          }
        ],
        order: [['booking_date', 'DESC'], ['start_time', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          customer,
          bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new CustomerController();
// ===========================
// backend/src/controllers/ServiceController.js (4/8)
// ===========================
const { Service, ServiceCategory, Booking } = require('../models');
const { Op } = require('sequelize');
const { validateService } = require('../utils/validators');
const logger = require('../utils/logger');

class ServiceController {
  // Listar serviços
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        category_id,
        search = '',
        is_active = true
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { company_id: req.company.id };

      if (category_id) where.category_id = category_id;
      if (is_active !== 'all') where.is_active = is_active === 'true';
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: services } = await Service.findAndCountAll({
        where,
        include: [
          {
            model: ServiceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          services,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao listar serviços:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar serviço
  async store(req, res) {
    try {
      const { error } = validateService(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Verificar se já existe serviço com mesmo nome
      const existingService = await Service.findOne({
        where: {
          company_id: req.company.id,
          name: req.body.name
        }
      });

      if (existingService) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um serviço com este nome'
        });
      }

      const service = await Service.create({
        ...req.body,
        company_id: req.company.id
      });

      const serviceWithCategory = await Service.findByPk(service.id, {
        include: [
          {
            model: ServiceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }
        ]
      });

      logger.info(`Serviço criado: ${service.name} - R$ ${service.price}`);

      res.status(201).json({
        success: true,
        message: 'Serviço criado com sucesso',
        data: { service: serviceWithCategory }
      });
    } catch (error) {
      logger.error('Erro ao criar serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar serviço por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const service = await Service.findOne({
        where: { 
          id, 
          company_id: req.company.id 
        },
        include: [
          {
            model: ServiceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }
        ]
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      res.json({
        success: true,
        data: { service }
      });
    } catch (error) {
      logger.error('Erro ao buscar serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar serviço
  async update(req, res) {
    try {
      const { id } = req.params;
      const { error } = validateService(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const service = await Service.findOne({
        where: { 
          id, 
          company_id: req.company.id 
        }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      // Verificar se não há conflito com outro serviço
      if (req.body.name && req.body.name !== service.name) {
        const existingService = await Service.findOne({
          where: {
            company_id: req.company.id,
            id: { [Op.ne]: id },
            name: req.body.name
          }
        });

        if (existingService) {
          return res.status(409).json({
            success: false,
            message: 'Já existe outro serviço com este nome'
          });
        }
      }

      await service.update(req.body);

      const updatedService = await Service.findByPk(service.id, {
        include: [
          {
            model: ServiceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }
        ]
      });

      logger.info(`Serviço atualizado: ${service.name}`);

      res.json({
        success: true,
        message: 'Serviço atualizado com sucesso',
        data: { service: updatedService }
      });
    } catch (error) {
      logger.error('Erro ao atualizar serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Deletar serviço
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const service = await Service.findOne({
        where: { 
          id, 
          company_id: req.company.id 
        }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      // Verificar se há agendamentos futuros com este serviço
      const futureBookings = await Booking.count({
        where: {
          service_id: id,
          booking_date: { [Op.gte]: new Date() },
          status: { [Op.notIn]: ['cancelled', 'completed'] }
        }
      });

      if (futureBookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir serviço com agendamentos futuros'
        });
      }

      await service.destroy();

      logger.info(`Serviço excluído: ${service.name}`);

      res.json({
        success: true,
        message: 'Serviço excluído com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar categorias de serviços
  async categories(req, res) {
    try {
      const categories = await ServiceCategory.findAll({
        where: { 
          company_id: req.company.id,
          is_active: true 
        },
        include: [
          {
            model: Service,
            as: 'services',
            where: { is_active: true },
            required: false,
            attributes: ['id', 'name', 'price', 'duration_minutes']
          }
        ],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Erro ao listar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new ServiceController();
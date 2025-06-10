// ===========================
// backend/src/controllers/UserController.js (5/8)
// ===========================
const { User, Company } = require('../models');
const { Op } = require('sequelize');
const { validateUserCreation, validateUserUpdate } = require('../utils/validators');
const logger = require('../utils/logger');

class UserController {
  // Listar usuários da empresa
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        search = '',
        is_active = true
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { company_id: req.company.id };

      if (role) where.role = role;
      if (is_active !== 'all') where.is_active = is_active === 'true';
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { specialty: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password_hash'] },
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar usuário
  async store(req, res) {
    try {
      const { error } = validateUserCreation(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({
        where: { email: req.body.email }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }

      const user = await User.create({
        ...req.body,
        company_id: req.company.id,
        email_verified_at: new Date()
      });

      const userResponse = user.getPublicProfile();

      logger.info(`Usuário criado: ${user.name} - ${user.email} - ${user.role}`);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: { user: userResponse }
      });
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar usuário por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      // Se não for admin da empresa, só pode ver próprio perfil
      if (!req.user.canManageCompany() && parseInt(id) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const where = { id };
      
      // Se não for super admin, filtrar por empresa
      if (req.user.role !== 'super_admin') {
        where.company_id = req.company.id;
      }

      const user = await User.findOne({
        where,
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar usuário
  async update(req, res) {
    try {
      const { id } = req.params;
      const { error } = validateUserUpdate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Se não for admin da empresa, só pode editar próprio perfil
      if (!req.user.canManageCompany() && parseInt(id) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const where = { id };
      
      // Se não for super admin, filtrar por empresa
      if (req.user.role !== 'super_admin') {
        where.company_id = req.company.id;
      }

      const user = await User.findOne({ where });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se email não está em uso por outro usuário
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: req.body.email,
            id: { [Op.ne]: id }
          }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Este email já está em uso'
          });
        }
      }

      // Usuários não-admin não podem alterar o role
      if (!req.user.canManageCompany() && req.body.role) {
        delete req.body.role;
      }

      await user.update(req.body);

      const updatedUser = user.getPublicProfile();

      logger.info(`Usuário atualizado: ${user.name} - ${user.email}`);

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar usuário
  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Apenas admins da empresa podem desativar usuários
      if (!req.user.canManageCompany()) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      // Não pode desativar a si mesmo
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Você não pode desativar sua própria conta'
        });
      }

      const user = await User.findOne({
        where: { 
          id, 
          company_id: req.company.id,
          is_active: true 
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      await user.update({ is_active: false });

      logger.info(`Usuário desativado: ${user.name} - ${user.email}`);

      res.json({
        success: true,
        message: 'Usuário desativado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao desativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar profissionais ativos
  async professionals(req, res) {
    try {
      const professionals = await User.findAll({
        where: {
          company_id: req.company.id,
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
      logger.error('Erro ao listar profissionais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Alterar senha
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias'
        });
      }

      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Nova senha deve ter pelo menos 8 caracteres'
        });
      }

      const user = await User.findByPk(req.user.id);

      // Verificar senha atual
      const isCurrentPasswordValid = await user.checkPassword(current_password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      await user.update({ password_hash: new_password });

      logger.info(`Senha alterada para usuário: ${user.email}`);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new UserController();

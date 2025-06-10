// ===========================
// backend/src/controllers/AuthController.js (1/8)
// ===========================
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');
const jwtConfig = require('../config/jwt');
const { validateLogin, validateRegister } = require('../utils/validators');
const logger = require('../utils/logger');

class AuthController {
  // Login
  async login(req, res) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { email, password } = req.body;

      // Buscar usuário com empresa
      const user = await User.findOne({
        where: { email, is_active: true },
        include: [{ 
          model: Company, 
          as: 'company',
          where: { is_active: true },
          required: false
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar senha
      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se a empresa está ativa (exceto super_admin)
      if (user.role !== 'super_admin' && user.company_id && (!user.company || !user.company.isSubscriptionActive())) {
        return res.status(401).json({
          success: false,
          message: 'Conta da empresa suspensa ou vencida'
        });
      }

      // Gerar tokens
      const tokens = this.generateTokens(user);

      // Atualizar último login
      await user.update({ last_login_at: new Date() });

      logger.info(`Login realizado: ${user.email}`);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: user.getPublicProfile(),
          company: user.company,
          tokens
        }
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Registro de nova empresa
  async register(req, res) {
    try {
      const { error } = validateRegister(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { company_name, user_name, email, password, phone } = req.body;

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }

      // Criar empresa
      const company = await Company.create({
        name: company_name,
        email: email,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      });

      // Criar usuário administrador
      const user = await User.create({
        company_id: company.id,
        name: user_name,
        email: email,
        password_hash: password, // será hasheado no hook
        phone: phone,
        role: 'company_admin',
        email_verified_at: new Date()
      });

      // Buscar usuário completo
      const userWithCompany = await User.findByPk(user.id, {
        include: [{ model: Company, as: 'company' }]
      });

      // Gerar tokens
      const tokens = this.generateTokens(userWithCompany);

      logger.info(`Nova empresa registrada: ${company.name} - ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Conta criada com sucesso! Você tem 7 dias gratuitos.',
        data: {
          user: userWithCompany.getPublicProfile(),
          company: company,
          tokens
        }
      });
    } catch (error) {
      logger.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar usuário autenticado
  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Company, as: 'company' }]
      });

      res.json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          company: user.company
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // Aqui você pode invalidar o token no Redis se estiver usando
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Gerar tokens JWT
  generateTokens(user) {
    const payload = jwtConfig.generatePayload(user);

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600 // 1 hora em segundos
    };
  }
}

module.exports = new AuthController();
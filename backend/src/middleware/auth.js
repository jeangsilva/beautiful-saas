// ===========================
// backend/src/middleware/auth.js (1/4)
// ===========================
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Buscar usuário no banco
    const user = await User.findByPk(decoded.userId, {
      include: [{ 
        model: Company, 
        as: 'company',
        where: { is_active: true },
        required: false 
      }],
      where: { is_active: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar se a empresa está ativa (exceto super_admin)
    if (user.role !== 'super_admin' && user.company_id) {
      if (!user.company) {
        return res.status(401).json({
          success: false,
          message: 'Empresa não encontrada',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      if (!user.company.isSubscriptionActive()) {
        return res.status(402).json({
          success: false,
          message: 'Assinatura vencida ou suspensa',
          code: 'SUBSCRIPTION_EXPIRED',
          company_status: user.company.subscription_status
        });
      }
    }

    // Anexar usuário e empresa à requisição
    req.user = user;
    req.company = user.company;
    
    // Log de acesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Acesso autorizado: ${user.email} (${user.role})`);
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }

    logger.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar permissões por role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Normalizar allowedRoles para array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.',
        code: 'INSUFFICIENT_PERMISSION',
        required_roles: roles,
        user_role: req.user.role
      });
    }

    next();
  };
};

// Middleware para verificar se o usuário pode acessar dados de outra empresa
const requireCompanyAccess = (req, res, next) => {
  const companyId = req.params.company_id || req.body.company_id || req.query.company_id;
  
  // Super admin pode acessar qualquer empresa
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Outros usuários só podem acessar sua própria empresa
  if (companyId && parseInt(companyId) !== req.user.company_id) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Você só pode acessar dados da sua empresa.',
      code: 'COMPANY_ACCESS_DENIED'
    });
  }

  next();
};

// Middleware para verificar permissões específicas
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = req.user.permissions || jwtConfig.generatePayload(req.user).permissions;
    
    // Super admin tem todas as permissões
    if (userPermissions.includes('*')) {
      return next();
    }

    // Verificar se tem a permissão específica
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Permissão '${permission}' requerida.`,
        code: 'PERMISSION_DENIED',
        required_permission: permission,
        user_permissions: userPermissions
      });
    }

    next();
  };
};

// Middleware para verificar se o usuário pode gerenciar outros usuários
const canManageUsers = (req, res, next) => {
  const targetUserId = req.params.id || req.params.user_id;
  
  // Admins podem gerenciar qualquer usuário da empresa
  if (req.user.canManageCompany()) {
    return next();
  }

  // Usuários normais só podem gerenciar a si mesmos
  if (targetUserId && parseInt(targetUserId) !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Você só pode gerenciar seu próprio perfil',
      code: 'SELF_MANAGEMENT_ONLY'
    });
  }

  next();
};

// Middleware para verificar se o usuário pode gerenciar agendamentos
const canManageBookings = (req, res, next) => {
  const professionalId = req.body.professional_id || req.query.professional_id;
  
  // Admins e recepcionistas podem gerenciar qualquer agendamento
  if (req.user.canManageBookings()) {
    return next();
  }

  // Profissionais só podem gerenciar seus próprios agendamentos
  if (req.user.role === 'professional') {
    if (professionalId && parseInt(professionalId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Você só pode gerenciar seus próprios agendamentos',
        code: 'PROFESSIONAL_BOOKING_ONLY'
      });
    }
  }

  next();
};

// Middleware opcional - só autentica se token estiver presente
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Sem token, continua sem autenticar
    return next();
  }

  // Com token, aplica autenticação normal
  return authenticateToken(req, res, next);
};

module.exports = {
  authenticateToken,
  requireRole,
  requireCompanyAccess,
  requirePermission,
  canManageUsers,
  canManageBookings,
  optionalAuth
};
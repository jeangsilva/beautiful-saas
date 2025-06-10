// ===========================
// backend/src/middleware/rateLimiting.js (4/4)
// ===========================
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limiting para todas as rotas da API
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas, tente novamente em 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Retornar rate limit info nos headers
  legacyHeaders: false, // Desabilitar headers X-RateLimit-*
  
  // Função para gerar chave única do cliente
  keyGenerator: (req) => {
    // Usar IP + User ID se autenticado, senão só IP
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || 'anonymous';
    return `${ip}:${userId}`;
  },
  
  // Handler quando limite é excedido
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}, User: ${req.user?.email || 'anonymous'}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas, tente novamente em 15 minutos',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: Math.round(req.rateLimit.resetTime / 1000)
    });
  },
  
  // Pular rate limiting em certas condições
  skip: (req) => {
    // Pular para super admins
    if (req.user && req.user.role === 'super_admin') {
      return true;
    }
    
    // Pular em desenvolvimento se configurado
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
      return true;
    }
    
    return false;
  }
});

// Rate limiting rigoroso para autenticação
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    // Para login, usar apenas IP (mais restritivo)
    return req.ip || req.connection.remoteAddress;
  },
  
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    logger.warn(`Rate limit de autenticação excedido para IP: ${ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login, tente novamente em 15 minutos',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retry_after: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting para criação de recursos
const createResourceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 criações por minuto por usuário
  message: {
    success: false,
    message: 'Muitas criações, aguarde 1 minuto',
    code: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    // Usar User ID para rate limiting por usuário
    const userId = req.user?.id || req.ip;
    return `create:${userId}`;
  },
  
  handler: (req, res) => {
    logger.warn(`Rate limit de criação excedido para usuário: ${req.user?.email || req.ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas criações, aguarde 1 minuto',
      code: 'CREATE_RATE_LIMIT_EXCEEDED',
      retry_after: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting para agendamentos públicos
const publicBookingRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 agendamentos por IP em 5 minutos
  message: {
    success: false,
    message: 'Muitos agendamentos, aguarde 5 minutos',
    code: 'BOOKING_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    // Para agendamentos públicos, usar IP + telefone se fornecido
    const ip = req.ip || req.connection.remoteAddress;
    const phone = req.body?.customer_data?.phone || '';
    return `booking:${ip}:${phone}`;
  },
  
  handler: (req, res) => {
    logger.warn(`Rate limit de agendamento público excedido para IP: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitos agendamentos, aguarde 5 minutos',
      code: 'BOOKING_RATE_LIMIT_EXCEEDED',
      retry_after: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting para busca de horários disponíveis
const availableSlotsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 consultas por minuto
  message: {
    success: false,
    message: 'Muitas consultas de horários, aguarde 1 minuto',
    code: 'SLOTS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || 'anonymous';
    return `slots:${ip}:${userId}`;
  }
});

// Rate limiting para webhooks do Stripe
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo 100 webhooks por minuto
  message: {
    success: false,
    message: 'Webhook rate limit exceeded',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: false,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    // Para webhooks, usar header específico do Stripe ou IP
    const stripeSignature = req.headers['stripe-signature'];
    return `webhook:${stripeSignature || req.ip}`;
  },
  
  handler: (req, res) => {
    logger.error('Webhook rate limit excedido');
    res.status(429).send('Webhook rate limit exceeded');
  }
});

// Rate limiting personalizado por empresa
const companyBasedRateLimit = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message: 'Limite de requisições da empresa excedido',
      code: 'COMPANY_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => {
      // Rate limiting por empresa
      const companyId = req.company?.id || req.user?.company_id || 'unknown';
      return `company:${companyId}`;
    },
    
    handler: (req, res) => {
      logger.warn(`Rate limit da empresa excedido: ${req.company?.name || 'Unknown'}`);
      
      res.status(429).json({
        success: false,
        message: 'Limite de requisições da empresa excedido',
        code: 'COMPANY_RATE_LIMIT_EXCEEDED',
        retry_after: Math.round(req.rateLimit.resetTime / 1000)
      });
    },
    
    skip: (req) => {
      // Pular para super admins
      return req.user && req.user.role === 'super_admin';
    }
  });
};

// Rate limiting adaptativo baseado no plano da empresa
const adaptiveRateLimit = (req, res, next) => {
  if (!req.user || !req.company) {
    return next();
  }

  // Definir limites baseados no plano
  const planLimits = {
    trial: { max: 500, windowMs: 15 * 60 * 1000 }, // 500 req/15min
    starter: { max: 1000, windowMs: 15 * 60 * 1000 }, // 1k req/15min
    professional: { max: 2000, windowMs: 15 * 60 * 1000 }, // 2k req/15min
    business: { max: 5000, windowMs: 15 * 60 * 1000 } // 5k req/15min
  };

  // Obter plano da empresa (via assinatura ou status)
  const subscription = req.company.subscription;
  const plan = subscription?.plan || req.company.subscription_status || 'trial';
  const limits = planLimits[plan] || planLimits.trial;

  // Aplicar rate limiting dinâmico
  const dynamicLimiter = rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    message: {
      success: false,
      message: `Limite do plano ${plan} excedido`,
      code: 'PLAN_RATE_LIMIT_EXCEEDED',
      current_plan: plan,
      limit: limits.max
    },
    keyGenerator: (req) => `plan:${req.company.id}:${plan}`,
    standardHeaders: true,
    legacyHeaders: false
  });

  dynamicLimiter(req, res, next);
};

// Middleware para monitorar uso da API
const apiUsageMonitor = (req, res, next) => {
  // Registrar timestamp da requisição
  req.requestStartTime = Date.now();
  
  // Log de uso (apenas em produção)
  if (process.env.NODE_ENV === 'production') {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      user_id: req.user?.id,
      company_id: req.company?.id,
      company_plan: req.company?.subscription?.plan || req.company?.subscription_status
    };
    
    // Log assíncrono para não bloquear requisição
    setImmediate(() => {
      logger.info('API Usage:', logData);
    });
  }
  
  // Interceptar resposta para medir tempo
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.requestStartTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log tempo de resposta se for muito lento (> 2s)
    if (responseTime > 2000) {
      logger.warn(`Slow API response: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Rate limiting para uploads de arquivos
const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 uploads por minuto
  message: {
    success: false,
    message: 'Muitos uploads, aguarde 1 minuto',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const userId = req.user?.id || req.ip;
    return `upload:${userId}`;
  }
});

// Rate limiting para emails
const emailRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máximo 5 emails por minuto
  message: {
    success: false,
    message: 'Muitos emails enviados, aguarde 1 minuto',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const userId = req.user?.id || req.ip;
    return `email:${userId}`;
  }
});

module.exports = {
  globalRateLimit,
  authRateLimit,
  createResourceRateLimit,
  publicBookingRateLimit,
  availableSlotsRateLimit,
  webhookRateLimit,
  companyBasedRateLimit,
  adaptiveRateLimit,
  apiUsageMonitor,
  fileUploadRateLimit,
  emailRateLimit
};
// ===========================
// backend/src/utils/logger.js (1/3)
// ===========================
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logsDir = path.join(process.cwd(), 'storage', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar formato dos logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const serviceStr = service ? `[${service}] ` : '';
    return `${timestamp} ${level}: ${serviceStr}${message}${metaStr}`;
  })
);

// Configuração dos transportes
const transports = [
  // Log de erros (arquivo separado)
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    format: logFormat
  }),

  // Log combinado (todos os níveis)
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    format: logFormat
  }),

  // Log de acesso HTTP
  new winston.transports.File({
    filename: path.join(logsDir, 'access.log'),
    level: 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  })
];

// Adicionar console apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
}

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'beautiful-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  // Não sair do processo em caso de erro
  exitOnError: false
});

// Logger específico para requests HTTP
const httpLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'http' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Logger específico para banco de dados
const dbLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'database.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Logger específico para Stripe
const stripeLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'stripe' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'stripe.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Métodos auxiliares para logging estruturado
const loggers = {
  // Logger principal
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Log de requisições HTTP
  http: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      companyId: req.company?.id,
      timestamp: new Date().toISOString()
    };

    // Log com nível baseado no status code
    if (res.statusCode >= 500) {
      httpLogger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      httpLogger.warn('HTTP Request', logData);
    } else {
      httpLogger.info('HTTP Request', logData);
    }
  },

  // Log de operações do banco
  database: (operation, table, meta = {}) => {
    dbLogger.info(`Database ${operation}`, { table, ...meta });
  },

  // Log de operações do Stripe
  stripe: (operation, meta = {}) => {
    stripeLogger.info(`Stripe ${operation}`, meta);
  },

  // Log de autenticação
  auth: (action, user, meta = {}) => {
    logger.info(`Auth ${action}`, {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      companyId: user?.company_id,
      ...meta
    });
  },

  // Log de agendamentos
  booking: (action, booking, meta = {}) => {
    logger.info(`Booking ${action}`, {
      bookingId: booking?.id,
      customerId: booking?.customer_id,
      professionalId: booking?.professional_id,
      serviceId: booking?.service_id,
      companyId: booking?.company_id,
      status: booking?.status,
      ...meta
    });
  },

  // Log de notificações
  notification: (type, recipient, status, meta = {}) => {
    logger.info(`Notification ${type}`, {
      recipient,
      status,
      ...meta
    });
  },

  // Log de performance
  performance: (operation, duration, meta = {}) => {
    if (duration > 1000) { // Log apenas operações > 1s
      logger.warn(`Slow operation: ${operation}`, {
        duration: `${duration}ms`,
        ...meta
      });
    }
  },

  // Log de segurança
  security: (event, meta = {}) => {
    logger.warn(`Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
};

// Stream para integração com Morgan (HTTP logging)
loggers.stream = {
  write: (message) => {
    httpLogger.info(message.trim());
  }
};

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { 
    reason: reason instanceof Error ? reason.stack : reason,
    promise 
  });
});

module.exports = loggers;
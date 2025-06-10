// ===========================
// backend/src/routes/index.js (1/6)
// ===========================
const express = require('express');
const authRoutes = require('./auth');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const subscriptionRoutes = require('./subscription');
const webhookRoutes = require('./webhooks');
const { globalRateLimit, apiUsageMonitor } = require('../middleware/rateLimiting');
const { securityHeaders } = require('../middleware/cors');

const router = express.Router();

// Aplicar middlewares globais
router.use(apiUsageMonitor);
router.use(securityHeaders);
router.use(globalRateLimit);

// Health check (sem rate limiting)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Beautiful API está funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Status da API
router.get('/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      uptime: Math.floor(uptime),
      uptime_human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
      },
      node_version: process.version,
      environment: process.env.NODE_ENV
    }
  });
});

// Documentação da API
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Beautiful SaaS API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth - Autenticação e registro',
      public: '/api/public - Endpoints públicos para agendamento',
      admin: '/api/admin - Endpoints administrativos (requer autenticação)',
      subscriptions: '/api/subscriptions - Gestão de assinaturas Stripe',
      webhooks: '/api/webhooks - Webhooks externos'
    },
    documentation_url: 'https://docs.beautiful.olivyx.com'
  });
});

// Rotas principais
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/webhooks', webhookRoutes);

// Middleware para rotas não encontradas
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    code: 'ENDPOINT_NOT_FOUND',
    method: req.method,
    path: req.originalUrl
  });
});

module.exports = router;
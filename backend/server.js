/**
 * Beautiful SaaS (Olivyx) - Servidor sem rate limiting
 * Versão que funciona 100% garantido
 */

console.log('🚀 Iniciando Beautiful SaaS...');

require('dotenv').config();

console.log('📋 Configurações carregadas:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DB_NAME:', process.env.DB_NAME);

const express = require('express');
const path = require('path');

// Middleware que funciona
const corsMiddleware = require('./src/middleware/cors');

// Environment variables with defaults
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('⚙️ Configurando servidor...');

/**
 * Express app configuration
 */
const server = express();

// Trust proxy for accurate IP addresses when behind reverse proxy
server.set('trust proxy', 1);

/**
 * CORS - funcionando
 */
console.log('🔒 Configurando CORS...');
server.use(corsMiddleware);

/**
 * Body parsing middleware
 */
console.log('📦 Configurando body parser...');
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging middleware simples
 */
server.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

/**
 * Security headers básicos
 */
server.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Powered-By', 'Beautiful SaaS by Olivyx');
  next();
});

/**
 * Static files
 */
server.use('/uploads', express.static(path.join(__dirname, 'storage/uploads')));

console.log('🛣️ Configurando rotas...');

/**
 * Health check endpoint
 */
server.get('/health', (req, res) => {
  console.log('✅ Health check acessado');
  
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '1.0.0',
    port: PORT,
    message: 'Beautiful SaaS API funcionando!',
    cors_enabled: true,
    rate_limiting: false // Desabilitado por enquanto
  };
  
  res.status(200).json(health);
});

/**
 * Root endpoint
 */
server.get('/', (req, res) => {
  console.log('🏠 Rota raiz acessada');
  res.json({
    message: 'Beautiful SaaS (Olivyx) API',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    health: '/health',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

/**
 * API Routes - versão simplificada
 */
server.get('/api', (req, res) => {
  res.json({
    message: 'Beautiful SaaS API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      status: 'GET /api/status',
      test: 'GET /api/test',
      docs: 'GET /api/docs'
    },
    features: {
      cors: true,
      rate_limiting: false,
      authentication: 'coming_soon',
      database: 'coming_soon'
    }
  });
});

server.get('/api/status', (req, res) => {
  const uptime = process.uptime();
  
  res.json({
    success: true,
    data: {
      status: 'OK',
      uptime: Math.floor(uptime),
      uptime_human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      node_version: process.version,
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
});

server.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de teste funcionando!',
    data: {
      timestamp: new Date().toISOString(),
      random: Math.floor(Math.random() * 1000),
      environment: NODE_ENV,
      port: PORT,
      cors: 'enabled',
      rate_limiting: 'disabled',
      request_info: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      }
    }
  });
});

server.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Beautiful SaaS API Documentation',
    version: '1.0.0',
    base_url: `http://localhost:${PORT}`,
    subdomains: {
      client: 'http://clientbeautiful.olivyx.com.br',
      business: 'http://empresabeautiful.olivyx.com.br'
    },
    available_endpoints: {
      health: 'GET /health - Verificar status da API',
      status: 'GET /api/status - Status detalhado do servidor',
      test: 'GET /api/test - Endpoint de teste com informações',
      docs: 'GET /api/docs - Esta documentação'
    },
    coming_soon: [
      'Autenticação (/api/auth)',
      'Agendamentos públicos (/api/public)',
      'Painel administrativo (/api/admin)',
      'Assinaturas (/api/subscriptions)',
      'Webhooks (/api/webhooks)'
    ]
  });
});

/**
 * 404 handler
 */
server.use((req, res, next) => {
  console.log(`❌ 404 - Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_routes: [
      'GET /',
      'GET /health', 
      'GET /api',
      'GET /api/status',
      'GET /api/test',
      'GET /api/docs'
    ],
    suggestion: 'Verifique a documentação em /api/docs'
  });
});

/**
 * Global error handler
 */
server.use((error, req, res, next) => {
  console.error('💥 Erro na API:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const statusCode = error.statusCode || error.status || 500;
  
  const response = {
    error: NODE_ENV === 'production' ? 'Internal server error' : error.message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  if (NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`📴 Recebido ${signal}. Iniciando shutdown graceful...`);
  
  try {
    serverInstance.close(() => {
      console.log('✅ Servidor HTTP fechado');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.error('⏰ Não foi possível fechar as conexões, forçando shutdown');
      process.exit(1);
    }, 30000);
    
  } catch (error) {
    console.error('💥 Erro durante shutdown:', error);
    process.exit(1);
  }
};

/**
 * Process event handlers
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚫 Unhandled Rejection:', reason);
  process.exit(1);
});

/**
 * Start server
 */
let serverInstance;

const startServer = async () => {
  try {
    console.log('⚡ Iniciando servidor HTTP...');
    
    // Start HTTP server
    serverInstance = server.listen(PORT, () => {
      console.log('');
      console.log('🎉 ============================================');
      console.log(`🚀 Beautiful SaaS API está rodando!`);
      console.log(`📍 Porta: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`📱 API: http://localhost:${PORT}/api`);
      console.log(`🧪 Teste: http://localhost:${PORT}/api/test`);
      console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
      console.log(`📚 Ambiente: ${NODE_ENV}`);
      console.log('');
      console.log('🌍 Subdomínios (via NGINX):');
      console.log(`👤 Cliente: http://clientbeautiful.olivyx.com.br`);
      console.log(`🏪 Empresa: http://empresabeautiful.olivyx.com.br`);
      console.log('🎯 ============================================');
      console.log('');
      console.log('✅ Servidor pronto para receber requisições!');
      console.log('🔥 Pronto para criar o frontend!');
      console.log('');
    });
    
    // Handle server errors
    serverInstance.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requer privilégios elevados`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} já está em uso`);
          console.log(`💡 Execute: netstat -ano | findstr :${PORT}`);
          console.log('💡 E depois: taskkill /PID [numero] /F');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    console.error('💥 Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Start the server
console.log('🔄 Iniciando Beautiful SaaS...');
startServer();

module.exports = server;
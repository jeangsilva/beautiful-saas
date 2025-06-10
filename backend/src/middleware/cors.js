/**
 * Beautiful SaaS (Olivyx) - CORS Middleware
 * Configuração CORS corrigida
 */

const cors = require('cors');

// Configuração CORS flexível
const allowedOrigins = [
  process.env.FRONTEND_CLIENT_URL || 'http://localhost:5100',
  process.env.FRONTEND_BUSINESS_URL || 'http://localhost:5101',
  'http://localhost:5100',
  'http://localhost:5101',
  'https://clientbeautiful.olivyx.com.br',
  'https://empresabeautiful.olivyx.com.br'
];

// Em desenvolvimento, permitir origens adicionais
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://localhost:5173', // Vite
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5100',
    'http://127.0.0.1:5101',
    'http://127.0.0.1:5173'
  );
}

// Configuração do CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requisições sem origem (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Em desenvolvimento, ser mais permissivo
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Bloquear origem não autorizada
    console.log(`❌ CORS: Origem ${origin} não permitida`);
    const msg = `Origem ${origin} não permitida pelo CORS`;
    return callback(new Error(msg), false);
  },
  
  credentials: true, // Permitir cookies e headers de autenticação
  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Company-Slug'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Rate-Limit-Remaining'
  ],
  
  // Cache preflight por 24 horas
  maxAge: 86400,
  
  // Para requisições OPTIONS
  optionsSuccessStatus: 200
};

// Criar o middleware CORS
const corsMiddleware = cors(corsOptions);

// Middleware para adicionar headers de segurança específicos
const securityHeaders = (req, res, next) => {
  // Headers de segurança para API
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Headers específicos para API
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Powered-By', 'Beautiful SaaS by Olivyx');
  
  next();
};

// Middleware para lidar com preflight requests
const handlePreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
};

// Exportar diretamente o middleware (não uma função)
module.exports = corsMiddleware;

// Exportar outros middlewares também
module.exports.securityHeaders = securityHeaders;
module.exports.handlePreflight = handlePreflight;
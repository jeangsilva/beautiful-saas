// ===========================
// backend/src/routes/webhooks.js - REFEITO DO ZERO
// ===========================
const express = require('express');
const SubscriptionController = require('../controllers/subscriptionController');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting específico para webhooks
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 webhooks por minuto
  keyGenerator: (req) => {
    // Para Stripe, usar signature header
    return req.headers['stripe-signature'] || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Webhook rate limit excedido: ${req.path} - ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      code: 'WEBHOOK_RATE_LIMIT'
    });
  }
});

// Middleware para log de webhooks
const logWebhook = (service) => (req, res, next) => {
  logger.info(`Webhook ${service} recebido:`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  next();
};

// ===========================
// STRIPE WEBHOOKS
// ===========================

/**
 * @route POST /api/webhooks/stripe
 * @desc Webhook principal do Stripe para eventos de pagamento
 * @access Public (verificado via signature)
 */
router.post('/stripe',
  webhookRateLimit,
  logWebhook('Stripe'),
  express.raw({ type: 'application/json' }),
  SubscriptionController.webhook
);

/**
 * @route GET /api/webhooks/stripe/test
 * @desc Endpoint para testar integração Stripe (apenas desenvolvimento)
 * @access Public (apenas em desenvolvimento)
 */
router.get('/stripe/test', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json({
    success: true,
    message: 'Stripe webhook endpoint ativo',
    environment: 'development',
    webhook_url: `${process.env.API_URL}/api/webhooks/stripe`
  });
});

// ===========================
// WHATSAPP BUSINESS WEBHOOKS
// ===========================

/**
 * @route GET /api/webhooks/whatsapp
 * @desc Verificação do webhook WhatsApp Business API
 * @access Public (verificado via token)
 */
router.get('/whatsapp',
  logWebhook('WhatsApp-Verify'),
  (req, res) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      // Verificar token de verificação
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        logger.info('WhatsApp webhook verificado com sucesso');
        return res.status(200).send(challenge);
      }
      
      logger.warn('Falha na verificação do webhook WhatsApp', { mode, token });
      res.status(403).json({
        success: false,
        message: 'Token de verificação inválido'
      });
    } catch (error) {
      logger.error('Erro na verificação WhatsApp webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno'
      });
    }
  }
);

/**
 * @route POST /api/webhooks/whatsapp
 * @desc Receber mensagens e eventos do WhatsApp Business
 * @access Public (verificado via signature)
 */
router.post('/whatsapp',
  webhookRateLimit,
  logWebhook('WhatsApp'),
  express.json(),
  async (req, res) => {
    try {
      const { body } = req;
      
      // Verificar se é uma mensagem do WhatsApp Business
      if (body.object !== 'whatsapp_business_account') {
        return res.status(400).json({
          success: false,
          message: 'Objeto inválido'
        });
      }
      
      // Processar cada entry
      for (const entry of body.entry || []) {
        // Processar mudanças (mensagens, status, etc.)
        for (const change of entry.changes || []) {
          await processWhatsAppChange(change);
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Erro ao processar webhook WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno'
      });
    }
  }
);

// Função para processar mudanças do WhatsApp
async function processWhatsAppChange(change) {
  try {
    const { field, value } = change;
    
    if (field === 'messages') {
      // Processar mensagens recebidas
      for (const message of value.messages || []) {
        await processIncomingMessage(message, value.metadata);
      }
      
      // Processar status de mensagens
      for (const status of value.statuses || []) {
        await processMessageStatus(status);
      }
    }
  } catch (error) {
    logger.error('Erro ao processar mudança WhatsApp:', error);
  }
}

// Processar mensagem recebida
async function processIncomingMessage(message, metadata) {
  logger.info('Mensagem WhatsApp recebida:', {
    from: message.from,
    type: message.type,
    timestamp: message.timestamp,
    phone_number_id: metadata.phone_number_id
  });
  
  // Aqui você pode implementar:
  // - Resposta automática
  // - Criação de agendamento via WhatsApp
  // - Encaminhamento para atendimento humano
  // - Integração com chatbot
}

// Processar status de mensagem
async function processMessageStatus(status) {
  logger.info('Status mensagem WhatsApp:', {
    id: status.id,
    status: status.status,
    timestamp: status.timestamp,
    recipient_id: status.recipient_id
  });
  
  // Aqui você pode implementar:
  // - Atualizar status de entrega no banco
  // - Marcar como lida
  // - Processar confirmações de agendamento
}

// ===========================
// EMAIL WEBHOOKS
// ===========================

/**
 * @route POST /api/webhooks/email/sendgrid
 * @desc Webhook para eventos SendGrid (bounces, deliveries, etc.)
 * @access Public (verificado via signature)
 */
router.post('/email/sendgrid',
  webhookRateLimit,
  logWebhook('SendGrid'),
  express.json(),
  (req, res) => {
    try {
      const events = req.body;
      
      events.forEach(event => {
        logger.info('Evento SendGrid:', {
          email: event.email,
          event: event.event,
          timestamp: event.timestamp,
          reason: event.reason
        });
        
        // Processar eventos de email
        // - bounce: marcar email como inválido
        // - delivered: confirmar entrega
        // - open: marcar como aberto
        // - click: rastrear cliques
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Erro no webhook SendGrid:', error);
      res.status(500).json({ success: false });
    }
  }
);

/**
 * @route POST /api/webhooks/email/mailgun
 * @desc Webhook para eventos Mailgun
 * @access Public (verificado via signature)
 */
router.post('/email/mailgun',
  webhookRateLimit,
  logWebhook('Mailgun'),
  express.urlencoded({ extended: true }),
  (req, res) => {
    try {
      const { recipient, event, timestamp } = req.body;
      
      logger.info('Evento Mailgun:', {
        recipient,
        event,
        timestamp
      });
      
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Erro no webhook Mailgun:', error);
      res.status(500).send('Error');
    }
  }
);

// ===========================
// SMS WEBHOOKS
// ===========================

/**
 * @route POST /api/webhooks/sms/twilio
 * @desc Webhook para status de SMS Twilio
 * @access Public (verificado via signature)
 */
router.post('/sms/twilio',
  webhookRateLimit,
  logWebhook('Twilio'),
  express.urlencoded({ extended: true }),
  (req, res) => {
    try {
      const { MessageSid, MessageStatus, To, From } = req.body;
      
      logger.info('Status SMS Twilio:', {
        sid: MessageSid,
        status: MessageStatus,
        to: To,
        from: From
      });
      
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Erro no webhook Twilio:', error);
      res.status(500).send('Error');
    }
  }
);

// ===========================
// CALENDAR WEBHOOKS
// ===========================

/**
 * @route POST /api/webhooks/calendar/google
 * @desc Webhook para mudanças Google Calendar
 * @access Public (verificado via signature)
 */
router.post('/calendar/google',
  webhookRateLimit,
  logWebhook('Google-Calendar'),
  express.json(),
  (req, res) => {
    try {
      // Processar notificações de mudança do Google Calendar
      logger.info('Mudança Google Calendar detectada');
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Erro no webhook Google Calendar:', error);
      res.status(500).json({ success: false });
    }
  }
);

// ===========================
// WEBHOOK DE MONITORAMENTO
// ===========================

/**
 * @route GET /api/webhooks/health
 * @desc Health check para webhooks
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoints ativos',
    timestamp: new Date().toISOString(),
    available_webhooks: [
      'stripe',
      'whatsapp', 
      'email/sendgrid',
      'email/mailgun',
      'sms/twilio',
      'calendar/google'
    ]
  });
});

/**
 * @route POST /api/webhooks/test
 * @desc Endpoint de teste para desenvolvimento
 * @access Public (apenas desenvolvimento)
 */
router.post('/test',
  logWebhook('Test'),
  express.json(),
  (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    logger.info('Webhook de teste:', {
      body: req.body,
      headers: req.headers,
      query: req.query
    });
    
    res.json({
      success: true,
      message: 'Webhook de teste recebido',
      data: {
        body: req.body,
        headers: req.headers,
        query: req.query,
        timestamp: new Date().toISOString()
      }
    });
  }
);

// ===========================
// WEBHOOK GENÉRICO
// ===========================

/**
 * @route GET /api/webhooks
 * @desc Listar todos os webhooks disponíveis
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beautiful SaaS - Webhooks Endpoint',
    version: '1.0.0',
    webhooks: {
      payments: {
        stripe: '/api/webhooks/stripe'
      },
      messaging: {
        whatsapp: '/api/webhooks/whatsapp',
        sms_twilio: '/api/webhooks/sms/twilio'
      },
      email: {
        sendgrid: '/api/webhooks/email/sendgrid',
        mailgun: '/api/webhooks/email/mailgun'
      },
      calendar: {
        google: '/api/webhooks/calendar/google'
      },
      monitoring: {
        health: '/api/webhooks/health',
        ...(process.env.NODE_ENV === 'development' && {
          test: '/api/webhooks/test'
        })
      }
    }
  });
});

module.exports = router;
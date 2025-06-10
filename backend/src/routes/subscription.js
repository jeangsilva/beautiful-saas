// ===========================
// backend/src/routes/subscriptions.js - REFEITO DO ZERO
// ===========================
const express = require('express');
const SubscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting para operações de assinatura
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 operações por IP
  message: {
    success: false,
    message: 'Muitas operações de assinatura, tente novamente em 15 minutos',
    code: 'SUBSCRIPTION_RATE_LIMIT'
  }
});

// Schema para validação de planos
const planSelectionSchema = {
  plan: require('joi').string().valid('starter', 'professional', 'business').required()
};

const cancelSubscriptionSchema = {
  cancel_immediately: require('joi').boolean().default(false),
  cancellation_reason: require('joi').string().max(500).optional()
};

const changePlanSchema = {
  new_plan: require('joi').string().valid('starter', 'professional', 'business').required()
};

// ===========================
// ROTAS PÚBLICAS
// ===========================

/**
 * @route GET /api/subscriptions/plans
 * @desc Listar todos os planos disponíveis (público)
 * @access Public
 */
router.get('/plans', SubscriptionController.getPlans);

/**
 * @route GET /api/subscriptions/features/:plan
 * @desc Obter funcionalidades de um plano específico
 * @access Public
 */
router.get('/features/:plan', (req, res) => {
  const { plan } = req.params;
  const { SUBSCRIPTION_PLANS } = require('../config/stripe');
  
  const planDetails = SUBSCRIPTION_PLANS[plan];
  
  if (!planDetails) {
    return res.status(404).json({
      success: false,
      message: 'Plano não encontrado'
    });
  }
  
  res.json({
    success: true,
    data: {
      plan: plan,
      features: planDetails.features,
      limits: {
        max_professionals: planDetails.max_professionals,
        max_bookings_monthly: planDetails.max_bookings_monthly
      }
    }
  });
});

// ===========================
// ROTAS PROTEGIDAS (REQUER AUTENTICAÇÃO)
// ===========================

// Aplicar autenticação e rate limiting para rotas protegidas
router.use(authenticateToken);
router.use(subscriptionRateLimit);

/**
 * @route GET /api/subscriptions/current
 * @desc Obter informações da assinatura atual da empresa
 * @access Private (company_admin apenas)
 */
router.get('/current',
  requireRole(['company_admin']),
  SubscriptionController.getCurrentSubscription
);

/**
 * @route POST /api/subscriptions/create-checkout
 * @desc Criar sessão de checkout do Stripe
 * @access Private (company_admin apenas)
 */
router.post('/create-checkout',
  requireRole(['company_admin']),
  validate(require('joi').object(planSelectionSchema)),
  SubscriptionController.createCheckoutSession
);

/**
 * @route POST /api/subscriptions/create-portal
 * @desc Criar sessão do portal de gerenciamento do Stripe
 * @access Private (company_admin apenas)
 */
router.post('/create-portal',
  requireRole(['company_admin']),
  SubscriptionController.createPortalSession
);

/**
 * @route GET /api/subscriptions/verify-checkout/:session_id
 * @desc Verificar status de uma sessão de checkout
 * @access Private (company_admin apenas)
 */
router.get('/verify-checkout/:session_id',
  requireRole(['company_admin']),
  SubscriptionController.checkCheckoutSession
);

/**
 * @route POST /api/subscriptions/cancel
 * @desc Cancelar assinatura atual
 * @access Private (company_admin apenas)
 */
router.post('/cancel',
  requireRole(['company_admin']),
  validate(require('joi').object(cancelSubscriptionSchema)),
  SubscriptionController.cancelSubscription
);

/**
 * @route POST /api/subscriptions/reactivate
 * @desc Reativar assinatura que estava marcada para cancelamento
 * @access Private (company_admin apenas)
 */
router.post('/reactivate',
  requireRole(['company_admin']),
  SubscriptionController.reactivateSubscription
);

/**
 * @route POST /api/subscriptions/change-plan
 * @desc Alterar plano da assinatura atual
 * @access Private (company_admin apenas)
 */
router.post('/change-plan',
  requireRole(['company_admin']),
  validate(require('joi').object(changePlanSchema)),
  SubscriptionController.changePlan
);

/**
 * @route GET /api/subscriptions/billing-history
 * @desc Obter histórico de faturas e pagamentos
 * @access Private (company_admin apenas)
 */
router.get('/billing-history',
  requireRole(['company_admin']),
  SubscriptionController.getInvoices
);

/**
 * @route GET /api/subscriptions/next-invoice
 * @desc Obter informações da próxima cobrança
 * @access Private (company_admin apenas)
 */
router.get('/next-invoice',
  requireRole(['company_admin']),
  SubscriptionController.getUpcomingInvoice
);

/**
 * @route POST /api/subscriptions/update-payment
 * @desc Atualizar método de pagamento padrão
 * @access Private (company_admin apenas)
 */
router.post('/update-payment',
  requireRole(['company_admin']),
  validate(require('joi').object({
    payment_method_id: require('joi').string().required()
  })),
  SubscriptionController.updateDefaultPaymentMethod
);

/**
 * @route GET /api/subscriptions/usage
 * @desc Obter uso atual dos limites do plano
 * @access Private (company_admin apenas)
 */
router.get('/usage',
  requireRole(['company_admin']),
  async (req, res) => {
    try {
      const { Booking, User } = require('../models');
      const moment = require('moment');
      
      // Calcular uso do mês atual
      const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
      
      const [monthlyBookings, totalProfessionals] = await Promise.all([
        Booking.count({
          where: {
            company_id: req.company.id,
            booking_date: {
              [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
            }
          }
        }),
        User.count({
          where: {
            company_id: req.company.id,
            role: 'professional',
            is_active: true
          }
        })
      ]);
      
      // Obter limites do plano atual
      const subscription = await req.company.getSubscription();
      const { SUBSCRIPTION_PLANS } = require('../config/stripe');
      const currentPlan = subscription ? SUBSCRIPTION_PLANS[subscription.plan] : null;
      
      res.json({
        success: true,
        data: {
          current_usage: {
            bookings_this_month: monthlyBookings,
            active_professionals: totalProfessionals
          },
          plan_limits: currentPlan ? {
            max_bookings_monthly: currentPlan.max_bookings_monthly,
            max_professionals: currentPlan.max_professionals
          } : null,
          usage_percentage: currentPlan ? {
            bookings: currentPlan.max_bookings_monthly > 0 ? 
              Math.round((monthlyBookings / currentPlan.max_bookings_monthly) * 100) : 0,
            professionals: currentPlan.max_professionals > 0 ? 
              Math.round((totalProfessionals / currentPlan.max_professionals) * 100) : 0
          } : null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter dados de uso'
      });
    }
  }
);

module.exports = router;
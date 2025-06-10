// ===========================
// backend/src/routes/public.js (3/6)
// ===========================
const express = require('express');
const PublicController = require('../controllers/publicController');
const { validateBooking, validatePagination } = require('../middleware/validation');
const { publicBookingRateLimit, availableSlotsRateLimit } = require('../middleware/rateLimiting');

const router = express.Router();

/**
 * @route GET /api/public/company/:slug
 * @desc Buscar informações da empresa por slug
 * @access Public
 */
router.get('/company/:slug', PublicController.getCompany);

/**
 * @route GET /api/public/company/:slug/services
 * @desc Listar serviços da empresa com categorias
 * @access Public
 */
router.get('/company/:slug/services', PublicController.getServices);

/**
 * @route GET /api/public/company/:slug/professionals
 * @desc Listar profissionais da empresa
 * @access Public
 */
router.get('/company/:slug/professionals', PublicController.getProfessionals);

/**
 * @route GET /api/public/company/:slug/available-slots
 * @desc Buscar horários disponíveis
 * @access Public
 * @params professional_id, service_id, date (query)
 */
router.get('/company/:slug/available-slots', 
  availableSlotsRateLimit,
  PublicController.getAvailableSlots
);

/**
 * @route POST /api/public/company/:slug/booking
 * @desc Criar agendamento público
 * @access Public
 */
router.post('/company/:slug/booking', 
  publicBookingRateLimit,
  validateBooking,
  PublicController.createBooking
);

/**
 * @route GET /api/public/company/:slug/booking/:bookingId
 * @desc Buscar agendamento por ID (para confirmação)
 * @access Public
 */
router.get('/company/:slug/booking/:bookingId', PublicController.getBooking);

/**
 * @route GET /api/public/companies
 * @desc Listar empresas ativas (para busca)
 * @access Public
 */
router.get('/companies', validatePagination, (req, res) => {
  // Implementar busca de empresas se necessário
  res.json({
    success: true,
    data: {
      companies: [],
      message: 'Funcionalidade de busca de empresas disponível sob demanda'
    }
  });
});

/**
 * @route GET /api/public/plans
 * @desc Listar planos de assinatura disponíveis
 * @access Public
 */
router.get('/plans', (req, res) => {
  const { SUBSCRIPTION_PLANS } = require('../config/stripe');
  
  const plans = Object.keys(SUBSCRIPTION_PLANS).map(key => {
    const plan = SUBSCRIPTION_PLANS[key];
    return {
      key,
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      max_professionals: plan.max_professionals,
      max_bookings_monthly: plan.max_bookings_monthly
    };
  });

  res.json({
    success: true,
    data: { plans }
  });
});

module.exports = router;

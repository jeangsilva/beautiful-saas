// ===========================
// backend/src/routes/admin.js (4/6)
// ===========================
const express = require('express');
const BookingController = require('../controllers/bookingController');
const CustomerController = require('../controllers/customerController');
const ServiceController = require('../controllers/serviceController');
const UserController = require('../controllers/userController');
const DashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireRole, canManageUsers, canManageBookings } = require('../middleware/auth');
const { 
  validateBooking, 
  validateCustomer, 
  validateService, 
  validateUser, 
  validateUserUpdate, 
  validateChangePassword,
  validateParamId,
  validatePagination 
} = require('../middleware/validation');
const { createResourceRateLimit, adaptiveRateLimit } = require('../middleware/rateLimiting');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rate limiting adaptativo baseado no plano
router.use(adaptiveRateLimit);

// ===========================
// DASHBOARD
// ===========================

/**
 * @route GET /api/admin/dashboard
 * @desc Dashboard principal com métricas
 * @access Private (todos os roles)
 */
router.get('/dashboard', DashboardController.index);

/**
 * @route GET /api/admin/dashboard/bookings-by-status
 * @desc Relatório de agendamentos por status
 * @access Private
 */
router.get('/dashboard/bookings-by-status', DashboardController.bookingsByStatus);

/**
 * @route GET /api/admin/dashboard/financial-report
 * @desc Relatório financeiro
 * @access Private (admin e company_admin)
 */
router.get('/dashboard/financial-report', 
  requireRole(['super_admin', 'company_admin']),
  DashboardController.financialReport
);

// ===========================
// AGENDAMENTOS
// ===========================

/**
 * @route GET /api/admin/bookings
 * @desc Listar agendamentos com filtros
 * @access Private
 */
router.get('/bookings', validatePagination, BookingController.index);

/**
 * @route POST /api/admin/bookings
 * @desc Criar novo agendamento
 * @access Private (admin, receptionist)
 */
router.post('/bookings', 
  requireRole(['super_admin', 'company_admin', 'professional', 'receptionist']),
  createResourceRateLimit,
  validateBooking,
  canManageBookings,
  BookingController.store
);

/**
 * @route GET /api/admin/bookings/available-slots
 * @desc Buscar horários disponíveis
 * @access Private
 */
router.get('/bookings/available-slots', BookingController.availableSlots);

/**
 * @route GET /api/admin/bookings/:id
 * @desc Buscar agendamento por ID
 * @access Private
 */
router.get('/bookings/:id', validateParamId, BookingController.show);

/**
 * @route PATCH /api/admin/bookings/:id/status
 * @desc Atualizar status do agendamento
 * @access Private (admin, professional, receptionist)
 */
router.patch('/bookings/:id/status', 
  validateParamId,
  requireRole(['super_admin', 'company_admin', 'professional', 'receptionist']),
  canManageBookings,
  BookingController.updateStatus
);

// ===========================
// CLIENTES
// ===========================

/**
 * @route GET /api/admin/customers
 * @desc Listar clientes
 * @access Private
 */
router.get('/customers', validatePagination, CustomerController.index);

/**
 * @route POST /api/admin/customers
 * @desc Criar novo cliente
 * @access Private (admin, receptionist)
 */
router.post('/customers', 
  requireRole(['super_admin', 'company_admin', 'receptionist']),
  createResourceRateLimit,
  validateCustomer,
  CustomerController.store
);

/**
 * @route GET /api/admin/customers/:id
 * @desc Buscar cliente por ID
 * @access Private
 */
router.get('/customers/:id', validateParamId, CustomerController.show);

/**
 * @route PUT /api/admin/customers/:id
 * @desc Atualizar cliente
 * @access Private (admin, receptionist)
 */
router.put('/customers/:id', 
  validateParamId,
  requireRole(['super_admin', 'company_admin', 'receptionist']),
  validateCustomer,
  CustomerController.update
);

/**
 * @route DELETE /api/admin/customers/:id
 * @desc Desativar cliente
 * @access Private (admin)
 */
router.delete('/customers/:id', 
  validateParamId,
  requireRole(['super_admin', 'company_admin']),
  CustomerController.destroy
);

/**
 * @route GET /api/admin/customers/:id/bookings
 * @desc Histórico de agendamentos do cliente
 * @access Private
 */
router.get('/customers/:id/bookings', 
  validateParamId,
  validatePagination,
  CustomerController.bookingHistory
);

// ===========================
// SERVIÇOS
// ===========================

/**
 * @route GET /api/admin/services
 * @desc Listar serviços
 * @access Private
 */
router.get('/services', validatePagination, ServiceController.index);

/**
 * @route POST /api/admin/services
 * @desc Criar novo serviço
 * @access Private (admin)
 */
router.post('/services', 
  requireRole(['super_admin', 'company_admin']),
  createResourceRateLimit,
  validateService,
  ServiceController.store
);

/**
 * @route GET /api/admin/services/categories
 * @desc Listar categorias de serviços
 * @access Private
 */
router.get('/services/categories', ServiceController.categories);

/**
 * @route GET /api/admin/services/:id
 * @desc Buscar serviço por ID
 * @access Private
 */
router.get('/services/:id', validateParamId, ServiceController.show);

/**
 * @route PUT /api/admin/services/:id
 * @desc Atualizar serviço
 * @access Private (admin)
 */
router.put('/services/:id', 
  validateParamId,
  requireRole(['super_admin', 'company_admin']),
  validateService,
  ServiceController.update
);

/**
 * @route DELETE /api/admin/services/:id
 * @desc Excluir serviço
 * @access Private (admin)
 */
router.delete('/services/:id', 
  validateParamId,
  requireRole(['super_admin', 'company_admin']),
  ServiceController.destroy
);

// ===========================
// USUÁRIOS
// ===========================

/**
 * @route GET /api/admin/users
 * @desc Listar usuários da empresa
 * @access Private (admin)
 */
router.get('/users', 
  requireRole(['super_admin', 'company_admin']),
  validatePagination,
  UserController.index
);

/**
 * @route POST /api/admin/users
 * @desc Criar novo usuário
 * @access Private (admin)
 */
router.post('/users', 
  requireRole(['super_admin', 'company_admin']),
  createResourceRateLimit,
  validateUser,
  UserController.store
);

/**
 * @route GET /api/admin/users/professionals
 * @desc Listar profissionais ativos
 * @access Private
 */
router.get('/users/professionals', UserController.professionals);

/**
 * @route GET /api/admin/users/:id
 * @desc Buscar usuário por ID
 * @access Private
 */
router.get('/users/:id', 
  validateParamId,
  canManageUsers,
  UserController.show
);

/**
 * @route PUT /api/admin/users/:id
 * @desc Atualizar usuário
 * @access Private
 */
router.put('/users/:id', 
  validateParamId,
  canManageUsers,
  validateUserUpdate,
  UserController.update
);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Desativar usuário
 * @access Private (admin)
 */
router.delete('/users/:id', 
  validateParamId,
  requireRole(['super_admin', 'company_admin']),
  UserController.destroy
);

/**
 * @route POST /api/admin/users/change-password
 * @desc Alterar senha do usuário autenticado
 * @access Private
 */
router.post('/users/change-password', 
  validateChangePassword,
  UserController.changePassword
);

module.exports = router;
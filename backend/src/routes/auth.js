// ===========================
// backend/src/routes/auth.js (2/6)
// ===========================
const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { authRateLimit } = require('../middleware/rateLimiting');

const router = express.Router();

// Aplicar rate limiting rigoroso para todas as rotas de auth
router.use(authRateLimit);

/**
 * @route POST /api/auth/login
 * @desc Login do usuário
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route POST /api/auth/register
 * @desc Registro de nova empresa
 * @access Public
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário autenticado
 * @access Private
 */
router.get('/me', authenticateToken, AuthController.me);

/**
 * @route POST /api/auth/logout
 * @desc Logout do usuário
 * @access Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route POST /api/auth/refresh
 * @desc Renovar token de acesso
 * @access Public (mas requer refresh token)
 */
router.post('/refresh', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidade de refresh token não implementada nesta versão'
  });
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Solicitar reset de senha
 * @access Public
 */
router.post('/forgot-password', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidade de reset de senha não implementada nesta versão'
  });
});

/**
 * @route POST /api/auth/reset-password
 * @desc Redefinir senha com token
 * @access Public
 */
router.post('/reset-password', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidade de reset de senha não implementada nesta versão'
  });
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verificar email com token
 * @access Public
 */
router.post('/verify-email', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidade de verificação de email não implementada nesta versão'
  });
});

module.exports = router;
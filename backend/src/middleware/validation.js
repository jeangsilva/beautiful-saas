// ===========================
// backend/src/middleware/validation.js (2/4)
// ===========================
const Joi = require('joi');
const logger = require('../utils/logger');

// Middleware genérico para validação usando Joi
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Retornar todos os erros
      allowUnknown: false, // Não permitir campos extras
      stripUnknown: true // Remover campos desconhecidos
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      });
    }

    // Substituir dados originais pelos validados/sanitizados
    req[source] = value;
    next();
  };
};

// Schemas de validação específicos
const schemas = {
  // Validação de login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Senha deve ter pelo menos 6 caracteres',
        'any.required': 'Senha é obrigatória'
      }),
    remember_me: Joi.boolean().optional()
  }),

  // Validação de registro
  register: Joi.object({
    company_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Nome da empresa deve ter pelo menos 2 caracteres',
        'string.max': 'Nome da empresa deve ter no máximo 100 caracteres',
        'any.required': 'Nome da empresa é obrigatório'
      }),
    user_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Nome deve ter pelo menos 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número',
        'any.required': 'Senha é obrigatória'
      }),
    phone: Joi.string()
      .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Telefone deve estar no formato (11) 99999-9999'
      }),
    terms_accepted: Joi.boolean()
      .valid(true)
      .required()
      .messages({
        'any.only': 'Você deve aceitar os termos de uso',
        'any.required': 'Aceitação dos termos é obrigatória'
      })
  }),

  // Validação de agendamento
  booking: Joi.object({
    customer_data: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .required(),
      email: Joi.string()
        .email()
        .allow(null, ''),
      phone: Joi.string()
        .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
        .required()
        .messages({
          'string.pattern.base': 'Telefone deve estar no formato (11) 99999-9999'
        }),
      birth_date: Joi.date()
        .max('now')
        .allow(null),
      gender: Joi.string()
        .valid('M', 'F', 'Other')
        .allow(null)
    }).required(),
    professional_id: Joi.number()
      .integer()
      .positive()
      .required(),
    service_id: Joi.number()
      .integer()
      .positive()
      .required(),
    booking_date: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': 'Data do agendamento deve ser futura'
      }),
    start_time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'Horário deve estar no formato HH:MM'
      }),
    customer_notes: Joi.string()
      .max(500)
      .allow(null, '')
  }),

  // Validação de serviço
  service: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required(),
    category_id: Joi.number()
      .integer()
      .positive()
      .allow(null),
    description: Joi.string()
      .max(1000)
      .allow(null, ''),
    price: Joi.number()
      .positive()
      .precision(2)
      .required(),
    duration_minutes: Joi.number()
      .integer()
      .min(15)
      .max(480)
      .required(),
    buffer_time_minutes: Joi.number()
      .integer()
      .min(0)
      .max(60)
      .default(0),
    requires_deposit: Joi.boolean()
      .default(false),
    deposit_amount: Joi.number()
      .min(0)
      .precision(2)
      .default(0),
    is_active: Joi.boolean()
      .default(true)
  }),

  // Validação de cliente
  customer: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required(),
    email: Joi.string()
      .email()
      .allow(null, ''),
    phone: Joi.string()
      .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .required(),
    birth_date: Joi.date()
      .max('now')
      .allow(null),
    gender: Joi.string()
      .valid('M', 'F', 'Other')
      .allow(null),
    address: Joi.string()
      .max(200)
      .allow(null, ''),
    city: Joi.string()
      .max(50)
      .allow(null, ''),
    state: Joi.string()
      .length(2)
      .uppercase()
      .allow(null, ''),
    zip_code: Joi.string()
      .pattern(/^\d{5}-?\d{3}$/)
      .allow(null, ''),
    notes: Joi.string()
      .max(1000)
      .allow(null, ''),
    accepts_marketing: Joi.boolean()
      .default(true)
  }),

  // Validação de usuário
  user: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    phone: Joi.string()
      .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .allow(null, ''),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required(),
    role: Joi.string()
      .valid('company_admin', 'professional', 'receptionist')
      .default('professional'),
    specialty: Joi.string()
      .max(100)
      .allow(null, ''),
    bio: Joi.string()
      .max(500)
      .allow(null, ''),
    experience_years: Joi.number()
      .integer()
      .min(0)
      .max(50)
      .allow(null)
  }),

  // Validação de atualização de usuário (senha opcional)
  userUpdate: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100),
    email: Joi.string()
      .email(),
    phone: Joi.string()
      .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
      .allow(null, ''),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .optional(),
    role: Joi.string()
      .valid('company_admin', 'professional', 'receptionist'),
    specialty: Joi.string()
      .max(100)
      .allow(null, ''),
    bio: Joi.string()
      .max(500)
      .allow(null, ''),
    experience_years: Joi.number()
      .integer()
      .min(0)
      .max(50)
      .allow(null),
    notifications_email: Joi.boolean(),
    notifications_sms: Joi.boolean(),
    notifications_whatsapp: Joi.boolean()
  }),

  // Validação de alteração de senha
  changePassword: Joi.object({
    current_password: Joi.string()
      .required(),
    new_password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'
      }),
    confirm_password: Joi.string()
      .valid(Joi.ref('new_password'))
      .required()
      .messages({
        'any.only': 'Confirmação de senha deve ser igual à nova senha'
      })
  }),

  // Validação de ID de parâmetro
  paramId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
  }),

  // Validação de paginação
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
    search: Joi.string()
      .max(100)
      .allow(''),
    sort_by: Joi.string()
      .max(50)
      .default('created_at'),
    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
  })
};

// Middleware de validação pré-configurados
const validateLogin = validate(schemas.login);
const validateRegister = validate(schemas.register);
const validateBooking = validate(schemas.booking);
const validateService = validate(schemas.service);
const validateCustomer = validate(schemas.customer);
const validateUser = validate(schemas.user);
const validateUserUpdate = validate(schemas.userUpdate);
const validateChangePassword = validate(schemas.changePassword);
const validateParamId = validate(schemas.paramId, 'params');
const validatePagination = validate(schemas.pagination, 'query');

// Middleware para sanitizar dados de entrada
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remover caracteres perigosos
    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+="[^"]*"/gi, '') // Remove eventos inline
      .replace(/on\w+='[^']*'/gi, ''); // Remove eventos inline com aspas simples
  };

  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitizar body, query e params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

module.exports = {
  validate,
  schemas,
  validateLogin,
  validateRegister,
  validateBooking,
  validateService,
  validateCustomer,
  validateUser,
  validateUserUpdate,
  validateChangePassword,
  validateParamId,
  validatePagination,
  sanitizeInput
};
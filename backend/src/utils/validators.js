// ===========================
// backend/src/utils/validators.js (2/3)
// ===========================
const Joi = require('joi');

// Validadores customizados reutilizáveis
const validators = {
  // Validação de CPF
  cpf: (value, helpers) => {
    const cpf = value.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
      return helpers.error('any.invalid');
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return helpers.error('any.invalid');
    }
    
    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
      return helpers.error('any.invalid');
    }
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
      return helpers.error('any.invalid');
    }
    
    return value;
  },

  // Validação de CNPJ
  cnpj: (value, helpers) => {
    const cnpj = value.replace(/\D/g, '');
    
    if (cnpj.length !== 14) {
      return helpers.error('any.invalid');
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return helpers.error('any.invalid');
    }
    
    // Validar primeiro dígito verificador
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit1 !== parseInt(cnpj.charAt(12))) {
      return helpers.error('any.invalid');
    }
    
    // Validar segundo dígito verificador
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit2 !== parseInt(cnpj.charAt(13))) {
      return helpers.error('any.invalid');
    }
    
    return value;
  },

  // Validação de telefone brasileiro
  phone: (value, helpers) => {
    const phone = value.replace(/\D/g, '');
    
    // Verificar se tem 10 ou 11 dígitos (com ou sem 9 no celular)
    if (phone.length < 10 || phone.length > 11) {
      return helpers.error('any.invalid');
    }
    
    // Verificar se começa com código de área válido (11-99)
    const areaCode = parseInt(phone.substring(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return helpers.error('any.invalid');
    }
    
    // Se tiver 11 dígitos, o terceiro deve ser 9 (celular)
    if (phone.length === 11 && phone.charAt(2) !== '9') {
      return helpers.error('any.invalid');
    }
    
    return value;
  },

  // Validação de CEP
  cep: (value, helpers) => {
    const cep = value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      return helpers.error('any.invalid');
    }
    
    return value;
  },

  // Validação de slug (URL-friendly)
  slug: (value, helpers) => {
    if (!/^[a-z0-9-]+$/.test(value)) {
      return helpers.error('any.invalid');
    }
    
    if (value.startsWith('-') || value.endsWith('-')) {
      return helpers.error('any.invalid');
    }
    
    if (value.includes('--')) {
      return helpers.error('any.invalid');
    }
    
    return value;
  },

  // Validação de senha forte
  strongPassword: (value, helpers) => {
    const password = value;
    
    // Pelo menos 8 caracteres
    if (password.length < 8) {
      return helpers.error('password.tooShort');
    }
    
    // Pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      return helpers.error('password.missingLowercase');
    }
    
    // Pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return helpers.error('password.missingUppercase');
    }
    
    // Pelo menos um número
    if (!/\d/.test(password)) {
      return helpers.error('password.missingNumber');
    }
    
    // Pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      return helpers.error('password.missingSpecial');
    }
    
    return value;
  },

  // Validação de horário (HH:MM)
  time: (value, helpers) => {
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      return helpers.error('any.invalid');
    }
    
    return value;
  }
};

// Registrar validadores customizados no Joi
const customJoi = Joi.extend(
  {
    type: 'cpf',
    base: Joi.string(),
    messages: {
      'any.invalid': 'CPF inválido'
    },
    validate: validators.cpf
  },
  {
    type: 'cnpj',
    base: Joi.string(),
    messages: {
      'any.invalid': 'CNPJ inválido'
    },
    validate: validators.cnpj
  },
  {
    type: 'phone',
    base: Joi.string(),
    messages: {
      'any.invalid': 'Telefone deve ter formato válido brasileiro'
    },
    validate: validators.phone
  },
  {
    type: 'cep',
    base: Joi.string(),
    messages: {
      'any.invalid': 'CEP deve ter 8 dígitos'
    },
    validate: validators.cep
  },
  {
    type: 'slug',
    base: Joi.string(),
    messages: {
      'any.invalid': 'Slug deve conter apenas letras minúsculas, números e hífens'
    },
    validate: validators.slug
  },
  {
    type: 'strongPassword',
    base: Joi.string(),
    messages: {
      'password.tooShort': 'Senha deve ter pelo menos 8 caracteres',
      'password.missingLowercase': 'Senha deve ter pelo menos uma letra minúscula',
      'password.missingUppercase': 'Senha deve ter pelo menos uma letra maiúscula',
      'password.missingNumber': 'Senha deve ter pelo menos um número',
      'password.missingSpecial': 'Senha deve ter pelo menos um caractere especial'
    },
    validate: validators.strongPassword
  },
  {
    type: 'time',
    base: Joi.string(),
    messages: {
      'any.invalid': 'Horário deve estar no formato HH:MM'
    },
    validate: validators.time
  }
);

// Schemas de validação pré-definidos
const schemas = {
  // Login
  login: customJoi.object({
    email: customJoi.string().email().required(),
    password: customJoi.string().min(6).required(),
    remember_me: customJoi.boolean().default(false)
  }),

  // Registro de empresa
  register: customJoi.object({
    company_name: customJoi.string().min(2).max(100).required(),
    user_name: customJoi.string().min(2).max(100).required(),
    email: customJoi.string().email().required(),
    password: customJoi.strongPassword().required(),
    phone: customJoi.phone().optional(),
    terms_accepted: customJoi.boolean().valid(true).required()
  }),

  // Agendamento
  booking: customJoi.object({
    customer_data: customJoi.object({
      name: customJoi.string().min(2).max(100).required(),
      email: customJoi.string().email().allow(null, ''),
      phone: customJoi.phone().required(),
      birth_date: customJoi.date().max('now').allow(null),
      gender: customJoi.string().valid('M', 'F', 'Other').allow(null)
    }).required(),
    professional_id: customJoi.number().integer().positive().required(),
    service_id: customJoi.number().integer().positive().required(),
    booking_date: customJoi.date().min('now').required(),
    start_time: customJoi.time().required(),
    customer_notes: customJoi.string().max(500).allow(null, '')
  }),

  // Serviço
  service: customJoi.object({
    name: customJoi.string().min(2).max(100).required(),
    category_id: customJoi.number().integer().positive().allow(null),
    description: customJoi.string().max(1000).allow(null, ''),
    price: customJoi.number().positive().precision(2).required(),
    duration_minutes: customJoi.number().integer().min(15).max(480).required(),
    buffer_time_minutes: customJoi.number().integer().min(0).max(60).default(0),
    requires_deposit: customJoi.boolean().default(false),
    deposit_amount: customJoi.number().min(0).precision(2).default(0),
    is_active: customJoi.boolean().default(true)
  }),

  // Cliente
  customer: customJoi.object({
    name: customJoi.string().min(2).max(100).required(),
    email: customJoi.string().email().allow(null, ''),
    phone: customJoi.phone().required(),
    birth_date: customJoi.date().max('now').allow(null),
    gender: customJoi.string().valid('M', 'F', 'Other').allow(null),
    address: customJoi.string().max(200).allow(null, ''),
    city: customJoi.string().max(50).allow(null, ''),
    state: customJoi.string().length(2).uppercase().allow(null, ''),
    zip_code: customJoi.cep().allow(null, ''),
    notes: customJoi.string().max(1000).allow(null, ''),
    accepts_marketing: customJoi.boolean().default(true)
  }),

  // Usuário
  user: customJoi.object({
    name: customJoi.string().min(2).max(100).required(),
    email: customJoi.string().email().required(),
    phone: customJoi.phone().allow(null, ''),
    password: customJoi.strongPassword().required(),
    role: customJoi.string().valid('company_admin', 'professional', 'receptionist').default('professional'),
    specialty: customJoi.string().max(100).allow(null, ''),
    bio: customJoi.string().max(500).allow(null, ''),
    experience_years: customJoi.number().integer().min(0).max(50).allow(null)
  }),

  // Atualização de usuário
  userUpdate: customJoi.object({
    name: customJoi.string().min(2).max(100),
    email: customJoi.string().email(),
    phone: customJoi.phone().allow(null, ''),
    password: customJoi.strongPassword().optional(),
    role: customJoi.string().valid('company_admin', 'professional', 'receptionist'),
    specialty: customJoi.string().max(100).allow(null, ''),
    bio: customJoi.string().max(500).allow(null, ''),
    experience_years: customJoi.number().integer().min(0).max(50).allow(null),
    notifications_email: customJoi.boolean(),
    notifications_sms: customJoi.boolean(),
    notifications_whatsapp: customJoi.boolean()
  }),

  // Empresa
  company: customJoi.object({
    name: customJoi.string().min(2).max(100).required(),
    slug: customJoi.slug().min(3).max(100).required(),
    email: customJoi.string().email().required(),
    phone: customJoi.phone().allow(null, ''),
    document: customJoi.alternatives().try(
      customJoi.cpf(),
      customJoi.cnpj()
    ).allow(null, ''),
    address: customJoi.string().max(200).allow(null, ''),
    city: customJoi.string().max(50).allow(null, ''),
    state: customJoi.string().length(2).uppercase().allow(null, ''),
    zip_code: customJoi.cep().allow(null, ''),
    website: customJoi.string().uri().allow(null, ''),
    instagram: customJoi.string().max(100).allow(null, ''),
    whatsapp: customJoi.phone().allow(null, ''),
    working_start_time: customJoi.time().default('08:00'),
    working_end_time: customJoi.time().default('18:00'),
    booking_advance_days: customJoi.number().integer().min(1).max(365).default(30),
    booking_interval_minutes: customJoi.number().integer().valid(15, 30, 60).default(30),
    cancellation_hours: customJoi.number().integer().min(0).max(48).default(2)
  }),

  // Alteração de senha
  changePassword: customJoi.object({
    current_password: customJoi.string().required(),
    new_password: customJoi.strongPassword().required(),
    confirm_password: customJoi.string().valid(customJoi.ref('new_password')).required()
  }),

  // Paginação
  pagination: customJoi.object({
    page: customJoi.number().integer().min(1).default(1),
    limit: customJoi.number().integer().min(1).max(100).default(20),
    search: customJoi.string().max(100).allow(''),
    sort_by: customJoi.string().max(50).default('created_at'),
    sort_order: customJoi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // ID de parâmetro
  paramId: customJoi.object({
    id: customJoi.number().integer().positive().required()
  })
};

// Função para validar dados
const validateData = (schema, data, options = {}) => {
  const defaultOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  };

  const { error, value } = schema.validate(data, { ...defaultOptions, ...options });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return { success: false, errors };
  }

  return { success: true, data: value };
};

// Função para sanitizar dados de entrada
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
};

module.exports = {
  joi: customJoi,
  schemas,
  validators,
  validateData,
  sanitizeInput
};

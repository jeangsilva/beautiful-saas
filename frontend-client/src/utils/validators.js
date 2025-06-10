/**
 * Beautiful SaaS - Validators Utils
 * Funções para validação de dados
 */

// ===== BASIC VALIDATORS =====

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  };
  
  /**
   * Check if value is not empty
   */
  export const isNotEmpty = (value) => !isEmpty(value);
  
  /**
   * Check minimum length
   */
  export const hasMinLength = (value, minLength) => {
    if (!value) return false;
    return value.toString().length >= minLength;
  };
  
  /**
   * Check maximum length
   */
  export const hasMaxLength = (value, maxLength) => {
    if (!value) return true;
    return value.toString().length <= maxLength;
  };
  
  /**
   * Check if value is within length range
   */
  export const isLengthBetween = (value, min, max) => {
    return hasMinLength(value, min) && hasMaxLength(value, max);
  };
  
  // ===== EMAIL VALIDATORS =====
  
  /**
   * Basic email validation
   */
  export const isValidEmail = (email) => {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  };
  
  /**
   * Advanced email validation
   */
  export const isValidEmailAdvanced = (email) => {
    if (!email) return false;
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim());
  };
  
  /**
   * Check if email domain is blacklisted
   */
  export const isEmailDomainAllowed = (email) => {
    if (!isValidEmail(email)) return false;
    
    const blacklistedDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      // Add more temporary email domains as needed
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return !blacklistedDomains.includes(domain);
  };
  
  // ===== PHONE VALIDATORS =====
  
  /**
   * Validate Brazilian phone number
   */
  export const isValidBrazilianPhone = (phone) => {
    if (!phone) return false;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Check for valid Brazilian phone patterns
    // Mobile: 11 digits (with area code and 9)
    // Landline: 10 digits (with area code)
    if (digits.length === 11) {
      // Mobile: should start with area code and have 9 as third digit
      const areaCode = parseInt(digits.slice(0, 2));
      const thirdDigit = digits[2];
      
      return areaCode >= 11 && areaCode <= 99 && thirdDigit === '9';
    } else if (digits.length === 10) {
      // Landline: should start with valid area code
      const areaCode = parseInt(digits.slice(0, 2));
      const thirdDigit = digits[2];
      
      return areaCode >= 11 && areaCode <= 99 && ['2', '3', '4', '5'].includes(thirdDigit);
    }
    
    return false;
  };
  
  /**
   * Validate international phone number (basic)
   */
  export const isValidInternationalPhone = (phone) => {
    if (!phone) return false;
    
    // Remove all non-digits except + at the beginning
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Should start with + and have 7-15 digits
    const internationalRegex = /^\+\d{7,15}$/;
    return internationalRegex.test(cleaned);
  };
  
  // ===== NAME VALIDATORS =====
  
  /**
   * Validate person name
   */
  export const isValidName = (name) => {
    if (!name) return false;
    
    const trimmedName = name.trim();
    
    // Should have at least 2 characters and contain only letters, spaces, and common name characters
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00C0-\u017F\s'.-]{2,50}$/;
    
    return nameRegex.test(trimmedName) && trimmedName.length >= 2;
  };
  
  /**
   * Validate full name (first + last name)
   */
  export const isValidFullName = (name) => {
    if (!isValidName(name)) return false;
    
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 && parts.every(part => part.length >= 1);
  };
  
  // ===== PASSWORD VALIDATORS =====
  
  /**
   * Basic password validation
   */
  export const isValidPassword = (password) => {
    if (!password) return false;
    
    // At least 8 characters
    return password.length >= 8;
  };
  
  /**
   * Strong password validation
   */
  export const isStrongPassword = (password) => {
    if (!password) return false;
    
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  };
  
  /**
   * Very strong password validation
   */
  export const isVeryStrongPassword = (password) => {
    if (!password) return false;
    
    // At least 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const veryStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return veryStrongRegex.test(password);
  };
  
  /**
   * Get password strength score
   */
  export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: 'Digite uma senha' };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Pelo menos 8 caracteres');
    
    if (password.length >= 12) score += 1;
    else if (password.length >= 8) feedback.push('12+ caracteres é mais seguro');
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Adicione letras minúsculas');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Adicione letras maiúsculas');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Adicione números');
    
    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push('Adicione símbolos (@$!%*?&)');
    
    // Common patterns (reduce score)
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Evite caracteres repetidos');
    }
    
    if (/123|abc|qwe/i.test(password)) {
      score -= 1;
      feedback.push('Evite sequências comuns');
    }
    
    const strength = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte', 'Muito forte'];
    const strengthIndex = Math.max(0, Math.min(5, score));
    
    return {
      score: Math.max(0, score),
      strength: strength[strengthIndex],
      feedback: feedback.slice(0, 3), // Show max 3 suggestions
    };
  };
  
  // ===== DATE VALIDATORS =====
  
  /**
   * Check if date is valid
   */
  export const isValidDate = (date) => {
    if (!date) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  };
  
  /**
   * Check if date is in the future
   */
  export const isFutureDate = (date) => {
    if (!isValidDate(date)) return false;
    
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dateObj >= today;
  };
  
  /**
   * Check if date is within business hours
   */
  export const isBusinessDate = (date, excludeWeekends = true) => {
    if (!isValidDate(date)) return false;
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false; // Sunday or Saturday
    }
    
    return true;
  };
  
  /**
   * Check if time is valid (HH:mm format)
   */
  export const isValidTime = (time) => {
    if (!time) return false;
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };
  
  // ===== ZIP CODE VALIDATORS =====
  
  /**
   * Validate Brazilian ZIP code (CEP)
   */
  export const isValidBrazilianZipCode = (zipCode) => {
    if (!zipCode) return false;
    
    // Remove non-digits
    const digits = zipCode.replace(/\D/g, '');
    
    // Brazilian ZIP code has 8 digits
    if (digits.length !== 8) return false;
    
    // Check for invalid patterns (all same digits)
    if (/^(\d)\1{7}$/.test(digits)) return false;
    
    return true;
  };
  
  // ===== DOCUMENT VALIDATORS =====
  
  /**
   * Validate Brazilian CPF
   */
  export const isValidCPF = (cpf) => {
    if (!cpf) return false;
    
    // Remove non-digits
    const digits = cpf.replace(/\D/g, '');
    
    // Check basic format
    if (digits.length !== 11) return false;
    
    // Check for invalid patterns
    if (/^(\d)\1{10}$/.test(digits)) return false;
    
    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i);
    }
    
    let checkDigit1 = 11 - (sum % 11);
    if (checkDigit1 >= 10) checkDigit1 = 0;
    
    if (parseInt(digits[9]) !== checkDigit1) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * (11 - i);
    }
    
    let checkDigit2 = 11 - (sum % 11);
    if (checkDigit2 >= 10) checkDigit2 = 0;
    
    return parseInt(digits[10]) === checkDigit2;
  };
  
  /**
   * Validate Brazilian CNPJ
   */
  export const isValidCNPJ = (cnpj) => {
    if (!cnpj) return false;
    
    // Remove non-digits
    const digits = cnpj.replace(/\D/g, '');
    
    // Check basic format
    if (digits.length !== 14) return false;
    
    // Check for invalid patterns
    if (/^(\d)\1{13}$/.test(digits)) return false;
    
    // Validate check digits
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * weights1[i];
    }
    
    let checkDigit1 = sum % 11;
    checkDigit1 = checkDigit1 < 2 ? 0 : 11 - checkDigit1;
    
    if (parseInt(digits[12]) !== checkDigit1) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * weights2[i];
    }
    
    let checkDigit2 = sum % 11;
    checkDigit2 = checkDigit2 < 2 ? 0 : 11 - checkDigit2;
    
    return parseInt(digits[13]) === checkDigit2;
  };
  
  // ===== URL VALIDATORS =====
  
  /**
   * Validate URL
   */
  export const isValidUrl = (url) => {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  /**
   * Validate social media username
   */
  export const isValidSocialUsername = (username) => {
    if (!username) return false;
    
    // Remove @ if present
    const cleanUsername = username.replace('@', '');
    
    // 1-30 characters, alphanumeric, dots, underscores
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return usernameRegex.test(cleanUsername);
  };
  
  // ===== BOOKING VALIDATORS =====
  
  /**
   * Validate booking data
   */
  export const validateBookingData = (data) => {
    const errors = {};
    
    // Service selection
    if (!data.serviceId) {
      errors.serviceId = 'Selecione um serviço';
    }
    
    // Professional selection
    if (!data.professionalId) {
      errors.professionalId = 'Selecione um profissional';
    }
    
    // Date validation
    if (!data.date) {
      errors.date = 'Selecione uma data';
    } else if (!isFutureDate(data.date)) {
      errors.date = 'Data deve ser no futuro';
    }
    
    // Time validation
    if (!data.time) {
      errors.time = 'Selecione um horário';
    } else if (!isValidTime(data.time)) {
      errors.time = 'Horário inválido';
    }
    
    // Customer name validation
    if (!data.customerName) {
      errors.customerName = 'Nome é obrigatório';
    } else if (!isValidName(data.customerName)) {
      errors.customerName = 'Nome inválido';
    }
    
    // Customer phone validation
    if (!data.customerPhone) {
      errors.customerPhone = 'Telefone é obrigatório';
    } else if (!isValidBrazilianPhone(data.customerPhone)) {
      errors.customerPhone = 'Telefone inválido';
    }
    
    // Customer email validation
    if (!data.customerEmail) {
      errors.customerEmail = 'E-mail é obrigatório';
    } else if (!isValidEmail(data.customerEmail)) {
      errors.customerEmail = 'E-mail inválido';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // ===== FORM VALIDATORS =====
  
  /**
   * Validate contact form
   */
  export const validateContactForm = (data) => {
    const errors = {};
    
    if (!data.name || !isValidName(data.name)) {
      errors.name = 'Nome válido é obrigatório';
    }
    
    if (!data.email || !isValidEmail(data.email)) {
      errors.email = 'E-mail válido é obrigatório';
    }
    
    if (data.phone && !isValidBrazilianPhone(data.phone)) {
      errors.phone = 'Telefone inválido';
    }
    
    if (!data.message || !hasMinLength(data.message, 10)) {
      errors.message = 'Mensagem deve ter pelo menos 10 caracteres';
    }
    
    if (data.message && !hasMaxLength(data.message, 1000)) {
      errors.message = 'Mensagem muito longa (máximo 1000 caracteres)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validate review form
   */
  export const validateReviewForm = (data) => {
    const errors = {};
    
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.rating = 'Avaliação é obrigatória (1-5 estrelas)';
    }
    
    if (data.comment && !hasMinLength(data.comment, 10)) {
      errors.comment = 'Comentário deve ter pelo menos 10 caracteres';
    }
    
    if (data.comment && !hasMaxLength(data.comment, 500)) {
      errors.comment = 'Comentário muito longo (máximo 500 caracteres)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // ===== FILE VALIDATORS =====
  
  /**
   * Validate file type
   */
  export const isValidFileType = (file, allowedTypes) => {
    if (!file || !allowedTypes) return false;
    
    const fileType = file.type.toLowerCase();
    const allowedTypesArray = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    
    return allowedTypesArray.some(type => 
      fileType.includes(type.toLowerCase()) || 
      file.name.toLowerCase().endsWith(type.toLowerCase())
    );
  };
  
  /**
   * Validate file size
   */
  export const isValidFileSize = (file, maxSizeInMB) => {
    if (!file || !maxSizeInMB) return false;
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  };
  
  /**
   * Validate image file
   */
  export const isValidImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5; // 5MB
    
    return isValidFileType(file, allowedTypes) && isValidFileSize(file, maxSize);
  };
  
  // ===== SEARCH VALIDATORS =====
  
  /**
   * Validate search query
   */
  export const isValidSearchQuery = (query) => {
    if (!query) return false;
    
    const trimmedQuery = query.trim();
    
    // At least 2 characters, max 100
    return trimmedQuery.length >= 2 && trimmedQuery.length <= 100;
  };
  
  /**
   * Sanitize search query
   */
  export const sanitizeSearchQuery = (query) => {
    if (!query) return '';
    
    return query
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially harmful characters
      .substring(0, 100); // Limit length
  };
  
  // ===== LOCATION VALIDATORS =====
  
  /**
   * Validate coordinates
   */
  export const isValidCoordinates = (lat, lng) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    return (
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  };
  
  /**
   * Validate Brazilian coordinates (approximate bounds)
   */
  export const isValidBrazilianCoordinates = (lat, lng) => {
    if (!isValidCoordinates(lat, lng)) return false;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Approximate bounds of Brazil
    return (
      latitude >= -34 && latitude <= 6 &&
      longitude >= -74 && longitude <= -32
    );
  };
  
  // ===== COMBINED VALIDATORS =====
  
  /**
   * Validate all required fields are present
   */
  export const validateRequiredFields = (data, requiredFields) => {
    const missing = [];
    
    requiredFields.forEach(field => {
      if (isEmpty(data[field])) {
        missing.push(field);
      }
    });
    
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };
  
  /**
   * Generic form validator
   */
  export const createValidator = (rules) => {
    return (data) => {
      const errors = {};
      
      Object.keys(rules).forEach(field => {
        const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
        const value = data[field];
        
        for (const rule of fieldRules) {
          if (typeof rule === 'function') {
            const result = rule(value, data);
            if (result !== true) {
              errors[field] = result;
              break; // Stop at first error for this field
            }
          }
        }
      });
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    };
  };
  
  // ===== EXPORT ALL =====
  export default {
    // Basic
    isEmpty,
    isNotEmpty,
    hasMinLength,
    hasMaxLength,
    isLengthBetween,
    
    // Email
    isValidEmail,
    isValidEmailAdvanced,
    isEmailDomainAllowed,
    
    // Phone
    isValidBrazilianPhone,
    isValidInternationalPhone,
    
    // Name
    isValidName,
    isValidFullName,
    
    // Password
    isValidPassword,
    isStrongPassword,
    isVeryStrongPassword,
    getPasswordStrength,
    
    // Date
    isValidDate,
    isFutureDate,
    isBusinessDate,
    isValidTime,
    
    // Documents
    isValidCPF,
    isValidCNPJ,
    isValidBrazilianZipCode,
    
    // URL
    isValidUrl,
    isValidSocialUsername,
    
    // Forms
    validateBookingData,
    validateContactForm,
    validateReviewForm,
    
    // Files
    isValidFileType,
    isValidFileSize,
    isValidImageFile,
    
    // Search
    isValidSearchQuery,
    sanitizeSearchQuery,
    
    // Location
    isValidCoordinates,
    isValidBrazilianCoordinates,
    
    // Generic
    validateRequiredFields,
    createValidator,
  };
// ===========================
// backend/src/utils/formatters.js
// Beautiful SaaS - Formatadores e Utilitários
// ===========================
const moment = require('moment');

// Configurar moment para português brasileiro
moment.locale('pt-br');

const formatters = {
  // ===========================
  // FORMATAÇÃO MONETÁRIA
  // ===========================
  
  // Formatar valores em reais
  currency: (value, currency = 'BRL') => {
    if (value === null || value === undefined) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  },

  // Formatar números
  number: (value, decimals = 0) => {
    if (value === null || value === undefined) return '0';
    
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(value));
  },

  // Formatar percentual
  percentage: (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(value) / 100);
  },

  // ===========================
  // FORMATAÇÃO DE DOCUMENTOS
  // ===========================

  // Formatar telefone brasileiro
  phone: (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      // Telefone fixo: (11) 1234-5678
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11) {
      // Celular: (11) 91234-5678
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  },

  // Formatar CPF
  cpf: (cpf) => {
    if (!cpf) return '';
    
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    return cpf;
  },

  // Formatar CNPJ
  cnpj: (cnpj) => {
    if (!cnpj) return '';
    
    const cleaned = cnpj.replace(/\D/g, '');
    
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpj;
  },

  // Formatar CEP
  cep: (cep) => {
    if (!cep) return '';
    
    const cleaned = cep.replace(/\D/g, '');
    
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    return cep;
  },

  // ===========================
  // FORMATAÇÃO DE DATAS E TEMPO
  // ===========================

  // Formatar data
  date: (date, format = 'DD/MM/YYYY') => {
    if (!date) return '';
    return moment(date).format(format);
  },

  // Formatar data e hora
  datetime: (datetime, format = 'DD/MM/YYYY HH:mm') => {
    if (!datetime) return '';
    return moment(datetime).format(format);
  },

  // Formatar data por extenso
  dateExtended: (date) => {
    if (!date) return '';
    return moment(date).format('dddd, DD [de] MMMM [de] YYYY');
  },

  // Tempo relativo (há X tempo)
  timeAgo: (date) => {
    if (!date) return '';
    return moment(date).fromNow();
  },

  // Formatar duração em minutos
  duration: (minutes) => {
    if (!minutes || minutes === 0) return '0min';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  },

  // Formatar horário (HH:MM)
  time: (time) => {
    if (!time) return '';
    
    // Se for um objeto Date
    if (time instanceof Date) {
      return moment(time).format('HH:mm');
    }
    
    // Se for string no formato HH:MM:SS, extrair apenas HH:MM
    if (typeof time === 'string' && time.includes(':')) {
      return time.substring(0, 5);
    }
    
    return time;
  },

  // ===========================
  // FORMATAÇÃO DE TEXTO
  // ===========================

  // Criar slug (URL-friendly)
  slug: (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim
  },

  // Primeira letra maiúscula
  titleCase: (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Truncar texto
  truncate: (text, maxLength = 100, suffix = '...') => {
    if (!text) return '';
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  // Capitalizar primeira letra
  capitalize: (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // ===========================
  // FORMATAÇÃO DE DADOS COMPLEXOS
  // ===========================

  // Formatar endereço completo
  address: (addressData) => {
    if (!addressData) return '';
    
    const parts = [
      addressData.address,
      addressData.city,
      addressData.state,
      formatters.cep(addressData.zip_code)
    ].filter(Boolean);
    
    return parts.join(', ');
  },

  // Formatar dados do agendamento
  bookingInfo: (booking) => {
    if (!booking) return {};
    
    return {
      id: booking.id,
      date: formatters.date(booking.booking_date),
      time: formatters.time(booking.start_time),
      duration: formatters.duration(booking.service?.duration_minutes),
      customer: formatters.titleCase(booking.customer?.name),
      professional: formatters.titleCase(booking.professional?.name),
      service: booking.service?.name,
      price: formatters.currency(booking.final_price),
      status: formatters.statusLabel(booking.status)
    };
  },

  // Labels de status traduzidos
  statusLabel: (status) => {
    const statusLabels = {
      // Status de agendamento
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não Compareceu',
      
      // Status gerais
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      
      // Status de assinatura
      trial: 'Período Gratuito',
      past_due: 'Vencido',
      canceled: 'Cancelado',
      trialing: 'Teste Grátis',
      unpaid: 'Não Pago'
    };
    
    return statusLabels[status] || formatters.capitalize(status);
  },

  // Formatar dados do cliente
  customerInfo: (customer) => {
    if (!customer) return {};
    
    return {
      id: customer.id,
      name: formatters.titleCase(customer.name),
      phone: formatters.phone(customer.phone),
      email: customer.email,
      age: customer.birth_date ? moment().diff(customer.birth_date, 'years') : null,
      totalBookings: customer.total_bookings || 0,
      totalSpent: formatters.currency(customer.total_spent),
      lastBooking: customer.last_booking_at ? formatters.timeAgo(customer.last_booking_at) : null,
      isFrequent: (customer.total_bookings || 0) >= 5
    };
  },

  // Formatar dados do profissional
  professionalInfo: (professional) => {
    if (!professional) return {};
    
    return {
      id: professional.id,
      name: formatters.titleCase(professional.name),
      specialty: professional.specialty,
      experience: professional.experience_years ? `${professional.experience_years} anos` : null,
      rating: professional.rating ? `${formatters.number(professional.rating, 1)}/5` : null,
      totalReviews: professional.total_reviews || 0,
      avatar: professional.avatar_url
    };
  },

  // ===========================
  // FORMATAÇÃO PARA NOTIFICAÇÕES
  // ===========================

  // Dados para WhatsApp
  whatsappMessage: {
    bookingConfirmation: (booking) => {
      return `🎉 *Agendamento Confirmado!*

📅 *Data:* ${formatters.dateExtended(booking.booking_date)}
🕒 *Horário:* ${formatters.time(booking.start_time)}
💇‍♀️ *Serviço:* ${booking.service.name}
👨‍💼 *Profissional:* ${formatters.titleCase(booking.professional.name)}
💰 *Valor:* ${formatters.currency(booking.final_price)}

📍 *Local:*
${booking.company.name}
${booking.company.address || 'Endereço não informado'}

📞 *Contato:* ${formatters.phone(booking.company.phone)}

_Precisando remarcar ou cancelar, entre em contato até 2 horas antes do horário._

Obrigado por escolher nossos serviços! ✨`;
    },

    bookingReminder: (booking) => {
      return `⏰ *Lembrete de Agendamento*

Olá ${formatters.titleCase(booking.customer.name)}! 

Você tem um agendamento *amanhã*:

📅 ${formatters.dateExtended(booking.booking_date)}
🕒 ${formatters.time(booking.start_time)}
💇‍♀️ ${booking.service.name}
👨‍💼 ${formatters.titleCase(booking.professional.name)}

📍 ${booking.company.name}

Nos vemos em breve! 😊`;
    },

    bookingCancellation: (booking) => {
      return `❌ *Agendamento Cancelado*

Olá ${formatters.titleCase(booking.customer.name)},

Seu agendamento foi cancelado:

📅 ${formatters.dateExtended(booking.booking_date)}
🕒 ${formatters.time(booking.start_time)}
💇‍♀️ ${booking.service.name}

${booking.cancellation_reason ? `*Motivo:* ${booking.cancellation_reason}` : ''}

Para reagendar, entre em contato conosco! 📞`;
    }
  },

  // Dados para templates de email
  emailData: (type, data) => {
    const commonData = {
      company_name: data.company?.name || '',
      app_url: process.env.APP_URL || 'http://localhost:3000'
    };

    switch (type) {
      case 'booking_confirmation':
        return {
          ...commonData,
          customer_name: formatters.titleCase(data.customer?.name || ''),
          service_name: data.service?.name || '',
          professional_name: formatters.titleCase(data.professional?.name || ''),
          booking_date: formatters.dateExtended(data.booking_date),
          start_time: formatters.time(data.start_time),
          duration: formatters.duration(data.service?.duration_minutes),
          price: formatters.currency(data.final_price),
          company_address: formatters.address(data.company),
          company_phone: formatters.phone(data.company?.phone)
        };

      case 'booking_reminder':
        return {
          ...commonData,
          customer_name: formatters.titleCase(data.customer?.name || ''),
          service_name: data.service?.name || '',
          professional_name: formatters.titleCase(data.professional?.name || ''),
          booking_date: formatters.dateExtended(data.booking_date),
          start_time: formatters.time(data.start_time)
        };

      case 'company_welcome':
        return {
          ...commonData,
          user_name: formatters.titleCase(data.user?.name || ''),
          booking_url: formatters.bookingUrl(data.company?.slug),
          plan_name: data.plan_name || 'Trial Gratuito'
        };

      default:
        return commonData;
    }
  },

  // ===========================
  // FORMATAÇÃO PARA API
  // ===========================

  // Formatar URL de agendamento
  bookingUrl: (companySlug, params = {}) => {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    return `${baseUrl}/${companySlug}${queryString}`;
  },

  // Sanitizar dados para API (remover informações sensíveis)
  sanitizeApiResponse: (data) => {
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
      return data.map(formatters.sanitizeApiResponse);
    }
    
    if (typeof data === 'object') {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Remover campos sensíveis
        if (['password_hash', 'stripe_customer_id', 'access_token', 'refresh_token'].includes(key)) {
          continue;
        }
        
        // Formatar datas
        if (key.includes('_at') || key.includes('_date')) {
          sanitized[key] = value ? moment(value).toISOString() : null;
          continue;
        }
        
        // Formatar preços e valores monetários
        if (key.includes('price') || key.includes('amount') || key.includes('total_spent')) {
          sanitized[key] = value ? Number(value) : 0;
          continue;
        }
        
        // Recursivo para objetos aninhados
        sanitized[key] = formatters.sanitizeApiResponse(value);
      }
      
      return sanitized;
    }
    
    return data;
  },

  // Resposta padronizada da API
  apiResponse: (success, data = null, message = null, meta = {}) => {
    const response = {
      success,
      timestamp: moment().toISOString()
    };

    if (message) response.message = message;
    if (data !== null) response.data = formatters.sanitizeApiResponse(data);
    if (Object.keys(meta).length > 0) response.meta = meta;

    return response;
  },

  // Formatar dados de paginação
  paginationMeta: (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };
  },

  // ===========================
  // FORMATAÇÃO DE MÉTRICAS
  // ===========================

  // Formatar métricas do dashboard
  dashboardMetrics: (metrics) => {
    return {
      totalBookings: formatters.number(metrics.total_bookings),
      totalRevenue: formatters.currency(metrics.total_revenue),
      averageTicket: formatters.currency(metrics.average_ticket),
      growthRate: formatters.percentage(metrics.growth_rate),
      customerRetention: formatters.percentage(metrics.customer_retention),
      pendingBookings: formatters.number(metrics.pending_bookings),
      todayBookings: formatters.number(metrics.today_bookings)
    };
  },

  // Formatar dados para gráficos
  chartData: (data, xKey, yKey, formatter = null) => {
    return data.map(item => ({
      [xKey]: item[xKey],
      [yKey]: formatter ? formatter(item[yKey]) : item[yKey]
    }));
  },

  // ===========================
  // UTILITÁRIOS DIVERSOS
  // ===========================

  // Gerar initials de um nome
  initials: (name) => {
    if (!name) return '';
    
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  },

  // Formatar tamanho de arquivo
  fileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Gerar cor baseada em string (para avatars)
  stringToColor: (str) => {
    if (!str) return '#6B7280';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#10B981', 
      '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  },

  // Validar se é uma URL válida
  isValidUrl: (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Extrair domínio de uma URL
  extractDomain: (url) => {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return url;
    }
  },

  // Formatar logs estruturados
  logData: (action, entity, data = {}) => {
    return {
      action,
      entity,
      timestamp: moment().toISOString(),
      data: formatters.sanitizeApiResponse(data)
    };
  }
};

module.exports = formatters;
// ===========================
// backend/src/services/WhatsAppService.js (3/4)
// ===========================
const axios = require('axios');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  }

  // Verificar se WhatsApp está configurado
  isConfigured() {
    return !!(this.accessToken && this.phoneNumberId);
  }

  // Enviar mensagem de texto
  async sendTextMessage(to, message) {
    try {
      if (!this.isConfigured()) {
        logger.warn('WhatsApp não configurado, pulando envio de mensagem');
        return { success: false, reason: 'not_configured' };
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Mensagem WhatsApp enviada para ${to}:`, response.data);
      
      return {
        success: true,
        message_id: response.data.messages[0].id,
        whatsapp_id: response.data.messages[0].whatsapp_id
      };
    } catch (error) {
      logger.error('Erro ao enviar mensagem WhatsApp:', {
        to,
        error: error.response?.data || error.message
      });
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Enviar confirmação de agendamento
  async sendBookingConfirmation(booking) {
    try {
      const { customer, professional, service, company } = booking;
      
      if (!customer.phone) {
        return { success: false, reason: 'no_phone' };
      }

      const message = `🎉 *Agendamento Confirmado!*

📅 *Data:* ${this.formatDate(booking.booking_date)}
🕒 *Horário:* ${booking.start_time.substring(0, 5)}
💇‍♀️ *Serviço:* ${service.name}
👨‍💼 *Profissional:* ${professional.name}
💰 *Valor:* R$ ${booking.final_price.toFixed(2).replace('.', ',')}

📍 *Local:*
${company.name}
${company.address || 'Endereço não informado'}

📞 *Contato:* ${company.phone || company.whatsapp}

_Precisando remarcar ou cancelar, entre em contato até 2 horas antes do horário._

Obrigado por escolher nossos serviços! ✨`;

      return await this.sendTextMessage(customer.phone, message);
    } catch (error) {
      logger.error('Erro ao enviar confirmação WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar lembrete de agendamento
  async sendBookingReminder(booking) {
    try {
      const { customer, professional, service, company } = booking;
      
      if (!customer.phone) {
        return { success: false, reason: 'no_phone' };
      }

      const message = `⏰ *Lembrete de Agendamento*

Olá ${customer.name}! 

Você tem um agendamento *amanhã*:

📅 ${this.formatDate(booking.booking_date)}
🕒 ${booking.start_time.substring(0, 5)}
💇‍♀️ ${service.name}
👨‍💼 ${professional.name}

📍 ${company.name}
${company.address || ''}

Nos vemos em breve! 😊`;

      return await this.sendTextMessage(customer.phone, message);
    } catch (error) {
      logger.error('Erro ao enviar lembrete WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar cancelamento de agendamento
  async sendBookingCancellation(booking) {
    try {
      const { customer, service } = booking;
      
      if (!customer.phone) {
        return { success: false, reason: 'no_phone' };
      }

      const message = `❌ *Agendamento Cancelado*

Olá ${customer.name},

Seu agendamento foi cancelado:

📅 ${this.formatDate(booking.booking_date)}
🕒 ${booking.start_time.substring(0, 5)}
💇‍♀️ ${service.name}

${booking.cancellation_reason ? `*Motivo:* ${booking.cancellation_reason}` : ''}

Para reagendar, entre em contato conosco! 📞`;

      return await this.sendTextMessage(customer.phone, message);
    } catch (error) {
      logger.error('Erro ao enviar cancelamento WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar mensagem com template
  async sendTemplateMessage(to, templateName, languageCode = 'pt_BR', components = []) {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Template WhatsApp enviado para ${to}:`, response.data);
      
      return {
        success: true,
        message_id: response.data.messages[0].id
      };
    } catch (error) {
      logger.error('Erro ao enviar template WhatsApp:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Marcar mensagem como lida
  async markAsRead(messageId) {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Erro ao marcar mensagem como lida:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter perfil do business
  async getBusinessProfile() {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/whatsapp_business_profile`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        success: true,
        profile: response.data.data[0]
      };
    } catch (error) {
      logger.error('Erro ao obter perfil WhatsApp Business:', error);
      return { success: false, error: error.message };
    }
  }

  // Atualizar perfil do business
  async updateBusinessProfile(profileData) {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/whatsapp_business_profile`;
      
      const response = await axios.post(url, profileData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Erro ao atualizar perfil WhatsApp Business:', error);
      return { success: false, error: error.message };
    }
  }

  // Formatar número de telefone para padrão internacional
  formatPhoneNumber(phone) {
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se começar com 0, remove o 0
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Se não começar com 55 (código do Brasil), adiciona
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  // Formatar data para português
  formatDate(date) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString('pt-BR', options);
  }

  // Processar mensagem recebida
  async processIncomingMessage(message, metadata) {
    try {
      logger.info('Processando mensagem WhatsApp recebida:', {
        from: message.from,
        type: message.type,
        timestamp: message.timestamp
      });

      // Marcar como lida
      await this.markAsRead(message.id);

      // Processar diferentes tipos de mensagem
      switch (message.type) {
        case 'text':
          await this.processTextMessage(message);
          break;
        case 'button':
          await this.processButtonMessage(message);
          break;
        case 'interactive':
          await this.processInteractiveMessage(message);
          break;
        default:
          logger.info(`Tipo de mensagem não suportado: ${message.type}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Erro ao processar mensagem recebida:', error);
      return { success: false, error: error.message };
    }
  }

  // Processar mensagem de texto
  async processTextMessage(message) {
    const messageText = message.text.body.toLowerCase().trim();
    const phoneNumber = message.from;

    // Respostas automáticas simples
    if (messageText.includes('oi') || messageText.includes('olá') || messageText.includes('ola')) {
      await this.sendTextMessage(phoneNumber, 
        `Olá! 👋 Bem-vindo ao nosso atendimento pelo WhatsApp!\n\nPara agendar um horário, acesse: ${process.env.APP_URL}\n\nOu digite *AJUDA* para ver as opções disponíveis.`
      );
    } else if (messageText.includes('ajuda') || messageText.includes('menu')) {
      await this.sendTextMessage(phoneNumber,
        `🔹 *MENU DE OPÇÕES* 🔹\n\n1️⃣ Digite *AGENDAR* para fazer um agendamento\n2️⃣ Digite *HORARIOS* para ver horários disponíveis\n3️⃣ Digite *SERVICOS* para ver nossos serviços\n4️⃣ Digite *CONTATO* para falar com atendente\n\nOu acesse nosso site: ${process.env.APP_URL}`
      );
    } else if (messageText.includes('agendar')) {
      await this.sendTextMessage(phoneNumber,
        `📅 *AGENDAMENTO ONLINE*\n\nPara agendar seu horário de forma rápida e prática, acesse nosso site:\n\n🔗 ${process.env.APP_URL}\n\nLá você pode:\n✅ Escolher o serviço\n✅ Selecionar o profissional\n✅ Verificar horários disponíveis\n✅ Confirmar agendamento\n\nÉ rápido e fácil! 😊`
      );
    } else if (messageText.includes('contato')) {
      await this.sendTextMessage(phoneNumber,
        `📞 *FALE CONOSCO*\n\nPara atendimento personalizado:\n\n📱 WhatsApp: ${process.env.WHATSAPP_PHONE || 'Este número'}\n📧 Email: ${process.env.SMTP_USER}\n\nHorário de atendimento:\nSegunda a Sexta: 8h às 18h\nSábado: 8h às 16h\n\nAguardamos seu contato! ✨`
      );
    } else {
      // Resposta padrão para mensagens não reconhecidas
      await this.sendTextMessage(phoneNumber,
        `Obrigado pela sua mensagem! 😊\n\nPara um atendimento mais rápido, digite *AJUDA* para ver o menu de opções.\n\nOu acesse nosso site para agendamentos: ${process.env.APP_URL}`
      );
    }
  }

  // Processar mensagem de botão
  async processButtonMessage(message) {
    const buttonText = message.button.text;
    const phoneNumber = message.from;

    logger.info(`Botão pressionado: ${buttonText} por ${phoneNumber}`);
    
    // Implementar lógica baseada no botão pressionado
    await this.sendTextMessage(phoneNumber, 
      `Você selecionou: ${buttonText}\n\nEm breve implementaremos esta funcionalidade! 🚀`
    );
  }

  // Processar mensagem interativa
  async processInteractiveMessage(message) {
    const interactiveType = message.interactive.type;
    const phoneNumber = message.from;

    logger.info(`Mensagem interativa recebida: ${interactiveType} de ${phoneNumber}`);
    
    if (interactiveType === 'list_reply') {
      const listId = message.interactive.list_reply.id;
      await this.sendTextMessage(phoneNumber, 
        `Você selecionou a opção: ${listId}\n\nEm breve implementaremos esta funcionalidade! 🚀`
      );
    }
  }
}

module.exports = new WhatsAppService();
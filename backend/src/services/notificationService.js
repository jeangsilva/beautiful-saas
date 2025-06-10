// ===========================
// backend/src/services/NotificationService.js (4/4)
// ===========================
const EmailService = require('./emailService');
const WhatsAppService = require('./whatsappService');
const { Booking, Customer, User, Service, Company } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');

class NotificationService {
  // Enviar notificação de confirmação de agendamento
  async sendBookingConfirmation(booking) {
    try {
      const results = {
        email: { sent: false, error: null },
        whatsapp: { sent: false, error: null }
      };

      // Enviar por email
      try {
        await EmailService.sendBookingConfirmation(booking);
        results.email.sent = true;
      } catch (error) {
        results.email.error = error.message;
        logger.error('Erro ao enviar email de confirmação:', error);
      }

      // Enviar por WhatsApp
      try {
        const whatsappResult = await WhatsAppService.sendBookingConfirmation(booking);
        if (whatsappResult.success) {
          results.whatsapp.sent = true;
        } else {
          results.whatsapp.error = whatsappResult.error || whatsappResult.reason;
        }
      } catch (error) {
        results.whatsapp.error = error.message;
        logger.error('Erro ao enviar WhatsApp de confirmação:', error);
      }

      logger.info(`Notificações de confirmação enviadas:`, results);
      return results;
    } catch (error) {
      logger.error('Erro geral ao enviar confirmação:', error);
      throw error;
    }
  }

  // Enviar lembrete de agendamento
  async sendBookingReminder(booking) {
    try {
      const results = {
        email: { sent: false, error: null },
        whatsapp: { sent: false, error: null }
      };

      // Verificar preferências do cliente
      const customer = booking.customer || await Customer.findByPk(booking.customer_id);
      
      // Enviar por email se cliente permitir
      if (customer.email && customer.accepts_marketing) {
        try {
          await EmailService.sendBookingReminder(booking);
          results.email.sent = true;
        } catch (error) {
          results.email.error = error.message;
        }
      }

      // Enviar por WhatsApp (sempre, se tiver telefone)
      if (customer.phone) {
        try {
          const whatsappResult = await WhatsAppService.sendBookingReminder(booking);
          if (whatsappResult.success) {
            results.whatsapp.sent = true;
          } else {
            results.whatsapp.error = whatsappResult.error || whatsappResult.reason;
          }
        } catch (error) {
          results.whatsapp.error = error.message;
        }
      }

      return results;
    } catch (error) {
      logger.error('Erro ao enviar lembrete:', error);
      throw error;
    }
  }

  // Enviar cancelamento de agendamento
  async sendBookingCancellation(booking) {
    try {
      const results = {
        email: { sent: false, error: null },
        whatsapp: { sent: false, error: null }
      };

      // Enviar por email
      if (booking.customer.email) {
        try {
          await EmailService.sendBookingCancellation(booking);
          results.email.sent = true;
        } catch (error) {
          results.email.error = error.message;
        }
      }

      // Enviar por WhatsApp
      if (booking.customer.phone) {
        try {
          const whatsappResult = await WhatsAppService.sendBookingCancellation(booking);
          if (whatsappResult.success) {
            results.whatsapp.sent = true;
          } else {
            results.whatsapp.error = whatsappResult.error || whatsappResult.reason;
          }
        } catch (error) {
          results.whatsapp.error = error.message;
        }
      }

      return results;
    } catch (error) {
      logger.error('Erro ao enviar cancelamento:', error);
      throw error;
    }
  }

  // Enviar conclusão de agendamento
  async sendBookingCompletion(booking) {
    try {
      const results = {
        email: { sent: false, error: null },
        whatsapp: { sent: false, error: null }
      };

      // Mensagem de conclusão via WhatsApp
      if (booking.customer.phone) {
        try {
          const message = `✅ *Atendimento Concluído!*

Obrigado por visitar nosso estabelecimento, ${booking.customer.name}! 

Esperamos que tenha gostado do resultado! ✨

Que tal avaliar nosso atendimento? Sua opinião é muito importante para nós! ⭐⭐⭐⭐⭐

Até a próxima! 😊`;

          const whatsappResult = await WhatsAppService.sendTextMessage(
            booking.customer.phone, 
            message
          );
          
          if (whatsappResult.success) {
            results.whatsapp.sent = true;
          } else {
            results.whatsapp.error = whatsappResult.error || whatsappResult.reason;
          }
        } catch (error) {
          results.whatsapp.error = error.message;
        }
      }

      return results;
    } catch (error) {
      logger.error('Erro ao enviar conclusão:', error);
      throw error;
    }
  }

  // Agendar e enviar lembretes automáticos
  async scheduleReminders() {
    try {
      logger.info('Iniciando envio de lembretes automáticos...');

      // Buscar agendamentos para amanhã que ainda não receberam lembrete
      const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
      
      const bookings = await Booking.findAll({
        where: {
          booking_date: tomorrow,
          status: { [Op.in]: ['confirmed', 'pending'] },
          reminder_sent_at: null
        },
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'professional' },
          { model: Service, as: 'service' },
          { model: Company, as: 'company' }
        ]
      });

      logger.info(`Encontrados ${bookings.length} agendamentos para envio de lembrete`);

      const results = {
        total: bookings.length,
        sent: 0,
        failed: 0,
        errors: []
      };

      for (const booking of bookings) {
        try {
          await this.sendBookingReminder(booking);
          
          // Marcar lembrete como enviado
          await booking.update({ reminder_sent_at: new Date() });
          
          results.sent++;
          
          // Pausa entre envios para não sobrecarregar APIs
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          results.failed++;
          results.errors.push({
            booking_id: booking.id,
            customer: booking.customer.name,
            error: error.message
          });
          
          logger.error(`Erro ao enviar lembrete para agendamento ${booking.id}:`, error);
        }
      }

      logger.info('Lembretes automáticos finalizados:', results);
      return results;
    } catch (error) {
      logger.error('Erro no processo de lembretes automáticos:', error);
      throw error;
    }
  }

  // Notificar assinatura vencendo
  async notifySubscriptionExpiring() {
    try {
      logger.info('Verificando assinaturas próximas do vencimento...');

      const companies = await Company.findAll({
        where: {
          subscription_status: 'active',
          subscription_expires_at: {
            [Op.between]: [
              moment().format('YYYY-MM-DD'),
              moment().add(7, 'days').format('YYYY-MM-DD')
            ]
          }
        },
        include: [{
          model: User,
          as: 'users',
          where: { role: 'company_admin' },
          limit: 1
        }]
      });

      const results = {
        total: companies.length,
        notified: 0,
        failed: 0
      };

      for (const company of companies) {
        try {
          const daysRemaining = moment(company.subscription_expires_at).diff(moment(), 'days');
          const admin = company.users[0];

          if (admin && admin.email) {
            await EmailService.sendSubscriptionExpiring(company, admin, daysRemaining);
            results.notified++;
          }
        } catch (error) {
          results.failed++;
          logger.error(`Erro ao notificar empresa ${company.name}:`, error);
        }
      }

      logger.info('Notificações de vencimento enviadas:', results);
      return results;
    } catch (error) {
      logger.error('Erro ao notificar vencimentos:', error);
      throw error;
    }
  }

  // Enviar relatório diário para empresas
  async sendDailyReports() {
    try {
      logger.info('Enviando relatórios diários...');

      const companies = await Company.findAll({
        where: {
          is_active: true,
          subscription_status: { [Op.in]: ['active', 'trial'] }
        },
        include: [{
          model: User,
          as: 'users',
          where: { 
            role: 'company_admin',
            notifications_email: true
          },
          limit: 1
        }]
      });

      const results = {
        total: companies.length,
        sent: 0,
        failed: 0
      };

      for (const company of companies) {
        try {
          // Gerar dados do relatório
          const today = moment().format('YYYY-MM-DD');
          
          const [totalBookings, confirmedBookings, completedBookings, totalRevenue] = await Promise.all([
            Booking.count({
              where: { company_id: company.id, booking_date: today }
            }),
            Booking.count({
              where: { 
                company_id: company.id, 
                booking_date: today,
                status: 'confirmed'
              }
            }),
            Booking.count({
              where: { 
                company_id: company.id, 
                booking_date: today,
                status: 'completed'
              }
            }),
            Booking.sum('final_price', {
              where: { 
                company_id: company.id, 
                booking_date: today,
                status: 'completed'
              }
            }) || 0
          ]);

          const reportData = {
            total_bookings: totalBookings,
            confirmed_bookings: confirmedBookings,
            completed_bookings: completedBookings,
            total_revenue: totalRevenue
          };

          const admin = company.users[0];
          if (admin && reportData.total_bookings > 0) {
            await EmailService.sendDailyReport(company, admin, reportData);
            results.sent++;
          }
        } catch (error) {
          results.failed++;
          logger.error(`Erro ao enviar relatório para ${company.name}:`, error);
        }
      }

      logger.info('Relatórios diários enviados:', results);
      return results;
    } catch (error) {
      logger.error('Erro ao enviar relatórios diários:', error);
      throw error;
    }
  }

  // Processar notificações em lote
  async processBulkNotifications(type, filters = {}) {
    try {
      logger.info(`Processando notificações em lote: ${type}`);

      let bookings = [];

      switch (type) {
        case 'reminders':
          bookings = await this.getBookingsForReminders(filters);
          break;
        case 'confirmations':
          bookings = await this.getBookingsForConfirmations(filters);
          break;
        case 'follow_ups':
          bookings = await this.getBookingsForFollowUps(filters);
          break;
        default:
          throw new Error(`Tipo de notificação inválido: ${type}`);
      }

      const results = {
        type,
        total: bookings.length,
        processed: 0,
        failed: 0,
        errors: []
      };

      for (const booking of bookings) {
        try {
          switch (type) {
            case 'reminders':
              await this.sendBookingReminder(booking);
              await booking.update({ reminder_sent_at: new Date() });
              break;
            case 'confirmations':
              await this.sendBookingConfirmation(booking);
              await booking.update({ confirmation_sent_at: new Date() });
              break;
            case 'follow_ups':
              await this.sendBookingCompletion(booking);
              break;
          }

          results.processed++;
          
          // Pausa entre envios
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          results.failed++;
          results.errors.push({
            booking_id: booking.id,
            error: error.message
          });
        }
      }

      logger.info(`Notificações em lote finalizadas:`, results);
      return results;
    } catch (error) {
      logger.error('Erro no processamento em lote:', error);
      throw error;
    }
  }

  // Buscar agendamentos para lembretes
  async getBookingsForReminders(filters) {
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
    
    return await Booking.findAll({
      where: {
        booking_date: tomorrow,
        status: { [Op.in]: ['confirmed', 'pending'] },
        reminder_sent_at: null,
        ...filters
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'professional' },
        { model: Service, as: 'service' },
        { model: Company, as: 'company' }
      ]
    });
  }

  // Buscar agendamentos para confirmações
  async getBookingsForConfirmations(filters) {
    return await Booking.findAll({
      where: {
        status: 'confirmed',
        confirmation_sent_at: null,
        ...filters
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'professional' },
        { model: Service, as: 'service' },
        { model: Company, as: 'company' }
      ]
    });
  }

  // Buscar agendamentos para follow-up
  async getBookingsForFollowUps(filters) {
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    
    return await Booking.findAll({
      where: {
        status: 'completed',
        ...filters
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'professional' },
        { model: Service, as: 'service' },
        { model: Company, as: 'company' }
      ]
    });
  }
}

module.exports = new NotificationService();// ===========================
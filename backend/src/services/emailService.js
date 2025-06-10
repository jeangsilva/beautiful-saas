// ===========================
// backend/src/services/EmailService.js (2/4)
// ===========================
const { sendEmail } = require('../config/email');
const logger = require('../utils/logger');
const moment = require('moment');

class EmailService {
  // Enviar confirmação de agendamento
  async sendBookingConfirmation(booking) {
    try {
      const { customer, professional, service, company } = booking;
      
      if (!customer.email) {
        logger.info('Cliente não possui email, pulando confirmação por email');
        return;
      }

      const variables = {
        customer_name: customer.name,
        company_name: company.name,
        service_name: service.name,
        professional_name: professional.name,
        booking_date: this.formatDate(booking.booking_date),
        start_time: booking.start_time.substring(0, 5),
        duration: service.duration_minutes,
        price: booking.final_price.toFixed(2).replace('.', ','),
        company_address: company.address || 'Endereço não informado',
        company_city: company.city || '',
        company_state: company.state || '',
        company_phone: company.phone || company.whatsapp || ''
      };

      await sendEmail(customer.email, 'booking_confirmation', variables);
      
      // Atualizar agendamento
      await booking.update({ confirmation_sent_at: new Date() });
      
      logger.info(`Email de confirmação enviado para ${customer.name} (${customer.email})`);
    } catch (error) {
      logger.error('Erro ao enviar email de confirmação:', error);
    }
  }

  // Enviar lembrete de agendamento
  async sendBookingReminder(booking) {
    try {
      const { customer, professional, service, company } = booking;
      
      if (!customer.email) {
        return;
      }

      const variables = {
        customer_name: customer.name,
        company_name: company.name,
        service_name: service.name,
        professional_name: professional.name,
        booking_date: this.formatDate(booking.booking_date),
        start_time: booking.start_time.substring(0, 5)
      };

      await sendEmail(customer.email, 'booking_reminder', variables);
      
      // Atualizar agendamento
      await booking.update({ reminder_sent_at: new Date() });
      
      logger.info(`Lembrete enviado para ${customer.name} (${customer.email})`);
    } catch (error) {
      logger.error('Erro ao enviar lembrete:', error);
    }
  }

  // Enviar cancelamento de agendamento
  async sendBookingCancellation(booking) {
    try {
      const { customer, service, company } = booking;
      
      if (!customer.email) {
        return;
      }

      const variables = {
        customer_name: customer.name,
        company_name: company.name,
        service_name: service.name,
        booking_date: this.formatDate(booking.booking_date),
        start_time: booking.start_time.substring(0, 5),
        cancellation_reason: booking.cancellation_reason || 'Motivo não informado'
      };

      await sendEmail(customer.email, 'booking_cancellation', variables);
      
      logger.info(`Email de cancelamento enviado para ${customer.name} (${customer.email})`);
    } catch (error) {
      logger.error('Erro ao enviar email de cancelamento:', error);
    }
  }

  // Enviar conclusão de agendamento
  async sendBookingCompletion(booking) {
    try {
      const { customer, service, company } = booking;
      
      if (!customer.email) {
        return;
      }

      // Usar template de conclusão (criar se necessário)
      const variables = {
        customer_name: customer.name,
        company_name: company.name,
        service_name: service.name,
        booking_date: this.formatDate(booking.booking_date)
      };

      // Por enquanto, usar template de confirmação modificado
      logger.info(`Agendamento concluído para ${customer.name} - email de follow-up pode ser implementado`);
    } catch (error) {
      logger.error('Erro ao enviar email de conclusão:', error);
    }
  }

  // Enviar boas-vindas para nova empresa
  async sendCompanyWelcome(company, user) {
    try {
      const variables = {
        company_name: company.name,
        user_name: user.name,
        booking_url: company.getBookingUrl(),
        plan_name: 'Trial Gratuito'
      };

      await sendEmail(user.email, 'company_welcome', variables);
      
      logger.info(`Email de boas-vindas enviado para ${company.name} (${user.email})`);
    } catch (error) {
      logger.error('Erro ao enviar email de boas-vindas:', error);
    }
  }

  // Enviar notificação de assinatura vencendo
  async sendSubscriptionExpiring(company, user, daysRemaining) {
    try {
      if (!user.email) {
        return;
      }

      // Template personalizado baseado nos dias restantes
      const subject = `Sua assinatura vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
      
      const htmlContent = `
        <h2>Sua assinatura está vencendo</h2>
        <p>Olá ${user.name},</p>
        <p>Sua assinatura do Beautiful SaaS vence em <strong>${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}</strong>.</p>
        <p>Para continuar usando todas as funcionalidades, renove sua assinatura:</p>
        <p><a href="${process.env.APP_URL}/dashboard/billing" style="background-color: #070fef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Renovar Assinatura</a></p>
        <p>Obrigado por usar o Beautiful SaaS!</p>
      `;

      await sendEmail(user.email, null, {}, [], htmlContent, subject);
      
      logger.info(`Notificação de vencimento enviada para ${company.name} (${user.email})`);
    } catch (error) {
      logger.error('Erro ao enviar notificação de vencimento:', error);
    }
  }

  // Enviar relatório diário para empresa
  async sendDailyReport(company, user, reportData) {
    try {
      if (!user.email || !user.notifications_email) {
        return;
      }

      const subject = `Relatório Diário - ${this.formatDate(new Date())}`;
      
      const htmlContent = `
        <h2>Relatório Diário - ${company.name}</h2>
        <p>Olá ${user.name},</p>
        <p>Aqui está o resumo do seu dia:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Agendamentos de Hoje</h3>
          <p><strong>Total:</strong> ${reportData.total_bookings}</p>
          <p><strong>Confirmados:</strong> ${reportData.confirmed_bookings}</p>
          <p><strong>Concluídos:</strong> ${reportData.completed_bookings}</p>
          <p><strong>Receita:</strong> R$ ${reportData.total_revenue.toFixed(2).replace('.', ',')}</p>
        </div>
        
        <p>Continue assim! 💪</p>
      `;

      await sendEmail(user.email, null, {}, [], htmlContent, subject);
      
      logger.info(`Relatório diário enviado para ${company.name} (${user.email})`);
    } catch (error) {
      logger.error('Erro ao enviar relatório diário:', error);
    }
  }

  // Formatar data para português
  formatDate(date) {
    return moment(date).locale('pt-br').format('dddd, DD [de] MMMM [de] YYYY');
  }

  // Agendar envio de lembretes automáticos
  async scheduleReminders() {
    try {
      const { Booking, Customer, User, Service, Company } = require('../models');
      const { Op } = require('sequelize');

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

      logger.info(`Enviando ${bookings.length} lembretes para agendamentos de amanhã`);

      for (const booking of bookings) {
        await this.sendBookingReminder(booking);
        
        // Pequena pausa entre envios para não sobrecarregar o servidor de email
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`${bookings.length} lembretes enviados com sucesso`);
    } catch (error) {
      logger.error('Erro ao enviar lembretes automáticos:', error);
    }
  }
}

module.exports = new EmailService();
// ===========================
// backend/src/controllers/SubscriptionController.js
// ===========================
const { Company, Subscription } = require('../models');
const StripeService = require('../services/stripeService');
const { SUBSCRIPTION_PLANS } = require('../config/stripe');
const logger = require('../utils/logger');

class SubscriptionController {
  // Criar sessão de checkout
  async createCheckoutSession(req, res) {
    try {
      const { plan } = req.body;

      if (!plan || !SUBSCRIPTION_PLANS[plan]) {
        return res.status(400).json({
          success: false,
          message: 'Plano inválido'
        });
      }

      const successUrl = `${process.env.APP_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.APP_URL}/subscription`;

      const session = await StripeService.createCheckoutSession(
        req.company,
        plan,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        data: {
          checkout_url: session.url,
          session_id: session.id
        }
      });
    } catch (error) {
      logger.error('Erro ao criar checkout session:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar portal do cliente
  async createPortalSession(req, res) {
    try {
      const returnUrl = `${process.env.APP_URL}/dashboard/billing`;

      const session = await StripeService.createCustomerPortalSession(
        req.company,
        returnUrl
      );

      res.json({
        success: true,
        data: {
          portal_url: session.url
        }
      });
    } catch (error) {
      logger.error('Erro ao criar portal session:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter informações da assinatura atual
  async getCurrentSubscription(req, res) {
    try {
      const subscription = await Subscription.findOne({
        where: { company_id: req.company.id }
      });

      const planDetails = subscription ? SUBSCRIPTION_PLANS[subscription.plan] : null;

      res.json({
        success: true,
        data: {
          subscription,
          plan_details: planDetails,
          company_status: req.company.subscription_status,
          trial_ends_at: req.company.trial_ends_at,
          is_in_trial: req.company.isInTrial()
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar assinatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar todos os planos disponíveis
  async getPlans(req, res) {
    try {
      const plans = Object.keys(SUBSCRIPTION_PLANS).map(key => ({
        key,
        ...SUBSCRIPTION_PLANS[key]
      }));

      res.json({
        success: true,
        data: { plans }
      });
    } catch (error) {
      logger.error('Erro ao listar planos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Cancelar assinatura
  async cancelSubscription(req, res) {
    try {
      const { cancel_immediately = false } = req.body;

      const subscription = await Subscription.findOne({
        where: { company_id: req.company.id }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Assinatura não encontrada'
        });
      }

      await StripeService.cancelSubscription(
        subscription.stripe_subscription_id,
        cancel_immediately
      );

      const message = cancel_immediately 
        ? 'Assinatura cancelada imediatamente' 
        : 'Assinatura será cancelada no final do período atual';

      logger.info(`${message}: ${req.company.name}`);

      res.json({
        success: true,
        message
      });
    } catch (error) {
      logger.error('Erro ao cancelar assinatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Alterar plano da assinatura
  async changePlan(req, res) {
    try {
      const { new_plan } = req.body;

      if (!new_plan || !SUBSCRIPTION_PLANS[new_plan]) {
        return res.status(400).json({
          success: false,
          message: 'Novo plano inválido'
        });
      }

      const subscription = await Subscription.findOne({
        where: { company_id: req.company.id }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Assinatura não encontrada'
        });
      }

      if (subscription.plan === new_plan) {
        return res.status(400).json({
          success: false,
          message: 'Este já é o plano atual'
        });
      }

      await StripeService.changeSubscriptionPlan(
        subscription.stripe_subscription_id,
        new_plan
      );

      logger.info(`Plano alterado para ${new_plan}: ${req.company.name}`);

      res.json({
        success: true,
        message: 'Plano alterado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alterar plano:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar status da sessão de checkout
  async checkCheckoutSession(req, res) {
    try {
      const { session_id } = req.params;

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'session_id é obrigatório'
        });
      }

      const { stripe } = require('../config/stripe');
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Sessão não encontrada'
        });
      }

      // Verificar se a sessão pertence à empresa atual
      if (session.customer !== req.company.stripe_customer_id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      res.json({
        success: true,
        data: {
          session_id: session.id,
          payment_status: session.payment_status,
          subscription_id: session.subscription,
          customer_email: session.customer_email
        }
      });
    } catch (error) {
      logger.error('Erro ao verificar sessão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar assinatura cancelada
  async reactivateSubscription(req, res) {
    try {
      const subscription = await Subscription.findOne({
        where: { company_id: req.company.id }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Assinatura não encontrada'
        });
      }

      if (!subscription.cancel_at_period_end) {
        return res.status(400).json({
          success: false,
          message: 'Assinatura não está marcada para cancelamento'
        });
      }

      const { stripe } = require('../config/stripe');
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false
      });

      // Atualizar no banco
      await subscription.update({
        cancel_at_period_end: false
      });

      logger.info(`Assinatura reativada: ${req.company.name}`);

      res.json({
        success: true,
        message: 'Assinatura reativada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao reativar assinatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Webhook do Stripe
  async webhook(req, res) {
    try {
      const signature = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.error('STRIPE_WEBHOOK_SECRET não configurado');
        return res.status(400).send('Webhook secret não configurado');
      }

      let event;

      try {
        const { stripe } = require('../config/stripe');
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      } catch (err) {
        logger.error('Erro na verificação do webhook:', err.message);
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
      }

      // Log do evento recebido
      logger.info(`Webhook recebido: ${event.type} - ${event.id}`);

      // Processar evento
      await StripeService.processWebhook(event);

      res.json({ received: true });
    } catch (error) {
      logger.error('Erro ao processar webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter histórico de faturas
  async getInvoices(req, res) {
    try {
      const { limit = 10 } = req.query;

      if (!req.company.stripe_customer_id) {
        return res.json({
          success: true,
          data: { invoices: [] }
        });
      }

      const { stripe } = require('../config/stripe');
      const invoices = await stripe.invoices.list({
        customer: req.company.stripe_customer_id,
        limit: parseInt(limit)
      });

      // Formatar dados das faturas
      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount_paid: invoice.amount_paid / 100, // converter de centavos
        amount_due: invoice.amount_due / 100,
        currency: invoice.currency,
        status: invoice.status,
        created: new Date(invoice.created * 1000),
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf
      }));

      res.json({
        success: true,
        data: { invoices: formattedInvoices }
      });
    } catch (error) {
      logger.error('Erro ao buscar faturas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter próxima fatura
  async getUpcomingInvoice(req, res) {
    try {
      if (!req.company.stripe_customer_id) {
        return res.json({
          success: true,
          data: { invoice: null }
        });
      }

      const { stripe } = require('../config/stripe');
      
      try {
        const invoice = await stripe.invoices.retrieveUpcoming({
          customer: req.company.stripe_customer_id
        });

        const formattedInvoice = {
          id: invoice.id,
          amount_due: invoice.amount_due / 100,
          currency: invoice.currency,
          period_start: new Date(invoice.period_start * 1000),
          period_end: new Date(invoice.period_end * 1000),
          next_payment_attempt: invoice.next_payment_attempt ? 
            new Date(invoice.next_payment_attempt * 1000) : null
        };

        res.json({
          success: true,
          data: { invoice: formattedInvoice }
        });
      } catch (stripeError) {
        // Se não há próxima fatura, retornar null
        if (stripeError.code === 'invoice_upcoming_none') {
          return res.json({
            success: true,
            data: { invoice: null }
          });
        }
        throw stripeError;
      }
    } catch (error) {
      logger.error('Erro ao buscar próxima fatura:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar método de pagamento padrão
  async updateDefaultPaymentMethod(req, res) {
    try {
      const { payment_method_id } = req.body;

      if (!payment_method_id) {
        return res.status(400).json({
          success: false,
          message: 'payment_method_id é obrigatório'
        });
      }

      if (!req.company.stripe_customer_id) {
        return res.status(400).json({
          success: false,
          message: 'Empresa não possui customer no Stripe'
        });
      }

      const { stripe } = require('../config/stripe');

      // Anexar método de pagamento ao customer
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: req.company.stripe_customer_id
      });

      // Definir como método padrão
      await stripe.customers.update(req.company.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: payment_method_id
        }
      });

      logger.info(`Método de pagamento atualizado: ${req.company.name}`);

      res.json({
        success: true,
        message: 'Método de pagamento atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar método de pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new SubscriptionController();
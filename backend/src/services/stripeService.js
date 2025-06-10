// ===========================
// backend/src/services/StripeService.js (1/4)
// ===========================
const { stripe, SUBSCRIPTION_PLANS } = require('../config/stripe');
const { Company, Subscription } = require('../models');
const logger = require('../utils/logger');

class StripeService {
  // Criar customer no Stripe
  async createCustomer(company) {
    try {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.name,
        metadata: {
          company_id: company.id.toString(),
          company_slug: company.slug
        }
      });

      // Atualizar company com stripe_customer_id
      await company.update({
        stripe_customer_id: customer.id
      });

      logger.info(`Customer Stripe criado: ${customer.id} para empresa ${company.name}`);
      return customer;
    } catch (error) {
      logger.error('Erro ao criar customer no Stripe:', error);
      throw error;
    }
  }

  // Criar assinatura
  async createSubscription(company, planKey, paymentMethodId = null) {
    try {
      const plan = SUBSCRIPTION_PLANS[planKey];
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      // Garantir que a empresa tem um customer no Stripe
      if (!company.stripe_customer_id) {
        await this.createCustomer(company);
        await company.reload();
      }

      // Parâmetros da assinatura
      const subscriptionParams = {
        customer: company.stripe_customer_id,
        items: [{ price: plan.price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          company_id: company.id.toString(),
          plan: planKey
        }
      };

      // Se tiver método de pagamento, anexar
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Salvar no banco
      await Subscription.create({
        company_id: company.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: company.stripe_customer_id,
        plan: planKey,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end
      });

      logger.info(`Assinatura criada: ${subscription.id} para empresa ${company.name}`);
      return subscription;
    } catch (error) {
      logger.error('Erro ao criar assinatura:', error);
      throw error;
    }
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId, cancelImmediately = false) {
    try {
      const updateParams = cancelImmediately 
        ? {} 
        : { cancel_at_period_end: true };

      const subscription = await stripe.subscriptions.update(
        subscriptionId,
        updateParams
      );

      if (cancelImmediately) {
        await stripe.subscriptions.del(subscriptionId);
      }

      // Atualizar no banco
      await Subscription.update(
        {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: cancelImmediately ? new Date() : null
        },
        { where: { stripe_subscription_id: subscriptionId } }
      );

      logger.info(`Assinatura ${cancelImmediately ? 'cancelada' : 'marcada para cancelamento'}: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  // Alterar plano da assinatura
  async changeSubscriptionPlan(subscriptionId, newPlanKey) {
    try {
      const newPlan = SUBSCRIPTION_PLANS[newPlanKey];
      if (!newPlan) {
        throw new Error('Novo plano não encontrado');
      }

      // Buscar assinatura atual
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Atualizar para o novo plano
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPlan.price_id
        }],
        proration_behavior: 'create_prorations'
      });

      // Atualizar no banco
      await Subscription.update(
        {
          plan: newPlanKey,
          status: updatedSubscription.status
        },
        { where: { stripe_subscription_id: subscriptionId } }
      );

      logger.info(`Plano alterado para ${newPlanKey}: ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      logger.error('Erro ao alterar plano:', error);
      throw error;
    }
  }

  // Criar sessão de checkout para nova assinatura
  async createCheckoutSession(company, planKey, successUrl, cancelUrl) {
    try {
      const plan = SUBSCRIPTION_PLANS[planKey];
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      // Garantir customer no Stripe
      if (!company.stripe_customer_id) {
        await this.createCustomer(company);
        await company.reload();
      }

      const session = await stripe.checkout.sessions.create({
        customer: company.stripe_customer_id,
        payment_method_types: ['card'],
        line_items: [{
          price: plan.price_id,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          trial_period_days: 7, // 7 dias grátis
          metadata: {
            company_id: company.id.toString(),
            plan: planKey
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        locale: 'pt-BR'
      });

      logger.info(`Checkout session criada: ${session.id} para empresa ${company.name}`);
      return session;
    } catch (error) {
      logger.error('Erro ao criar checkout session:', error);
      throw error;
    }
  }

  // Criar customer portal para gerenciar assinatura
  async createCustomerPortalSession(company, returnUrl) {
    try {
      if (!company.stripe_customer_id) {
        throw new Error('Empresa não possui customer no Stripe');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: company.stripe_customer_id,
        return_url: returnUrl
      });

      return session;
    } catch (error) {
      logger.error('Erro ao criar portal session:', error);
      throw error;
    }
  }

  // Processar webhook do Stripe
  async processWebhook(event) {
    try {
      logger.info(`Processando webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.info(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      logger.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Handler: Assinatura criada
  async handleSubscriptionCreated(subscription) {
    const companyId = parseInt(subscription.metadata.company_id);
    const plan = subscription.metadata.plan;

    await Subscription.upsert({
      company_id: companyId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan: plan,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    });

    // Ativar empresa
    await Company.update(
      { 
        subscription_status: subscription.status === 'trialing' ? 'trial' : 'active',
        subscription_expires_at: new Date(subscription.current_period_end * 1000)
      },
      { where: { id: companyId } }
    );

    logger.info(`Assinatura ativada para empresa ${companyId}`);
  }

  // Handler: Assinatura atualizada
  async handleSubscriptionUpdated(subscription) {
    await Subscription.update(
      {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end
      },
      { where: { stripe_subscription_id: subscription.id } }
    );

    const companyId = parseInt(subscription.metadata.company_id);
    let newStatus = 'suspended';
    
    if (subscription.status === 'active') newStatus = 'active';
    else if (subscription.status === 'trialing') newStatus = 'trial';
    else if (subscription.status === 'past_due') newStatus = 'past_due';
    else if (subscription.status === 'canceled') newStatus = 'canceled';

    await Company.update(
      { 
        subscription_status: newStatus,
        subscription_expires_at: new Date(subscription.current_period_end * 1000)
      },
      { where: { id: companyId } }
    );

    logger.info(`Assinatura atualizada para empresa ${companyId}: ${subscription.status}`);
  }

  // Handler: Assinatura cancelada
  async handleSubscriptionDeleted(subscription) {
    await Subscription.update(
      {
        status: 'canceled',
        canceled_at: new Date()
      },
      { where: { stripe_subscription_id: subscription.id } }
    );

    const companyId = parseInt(subscription.metadata.company_id);
    await Company.update(
      { subscription_status: 'canceled' },
      { where: { id: companyId } }
    );

    logger.info(`Assinatura cancelada para empresa ${companyId}`);
  }

  // Handler: Pagamento bem-sucedido
  async handlePaymentSucceeded(invoice) {
    logger.info(`Pagamento bem-sucedido: ${invoice.id} - R$ ${(invoice.amount_paid / 100).toFixed(2)}`);
    
    // Aqui você pode implementar lógica adicional:
    // - Enviar email de confirmação
    // - Atualizar logs de pagamento
    // - Ativar funcionalidades premium
  }

  // Handler: Pagamento falhou
  async handlePaymentFailed(invoice) {
    logger.warn(`Pagamento falhou: ${invoice.id} - R$ ${(invoice.amount_due / 100).toFixed(2)}`);
    
    // Aqui você pode implementar lógica adicional:
    // - Enviar email de cobrança
    // - Suspender conta após X tentativas
    // - Notificar equipe de suporte
  }
}

module.exports = new StripeService();
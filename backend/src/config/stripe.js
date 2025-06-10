// ===========================
// backend/src/config/stripe.js (3/4)
// ===========================
const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Planos de assinatura
const SUBSCRIPTION_PLANS = {
  starter: {
    price_id: process.env.STRIPE_PRICE_STARTER,
    name: 'Starter',
    amount: 2990, // R$ 29,90 em centavos
    currency: 'brl',
    interval: 'month',
    max_professionals: 1,
    max_bookings_monthly: 100,
    features: [
      'Até 1 profissional',
      'Até 100 agendamentos/mês',
      'Agendamento online',
      'Notificações básicas por email',
      'Relatórios simples',
      'Suporte por email'
    ]
  },
  professional: {
    price_id: process.env.STRIPE_PRICE_PROFESSIONAL,
    name: 'Professional',
    amount: 7990, // R$ 79,90 em centavos
    currency: 'brl',
    interval: 'month',
    max_professionals: 5,
    max_bookings_monthly: 500,
    features: [
      'Até 5 profissionais',
      'Até 500 agendamentos/mês',
      'Agendamento online',
      'Notificações por email e SMS',
      'Integração WhatsApp',
      'Relatórios completos',
      'Lembretes automáticos',
      'Suporte prioritário'
    ]
  },
  business: {
    price_id: process.env.STRIPE_PRICE_BUSINESS,
    name: 'Business',
    amount: 14990, // R$ 149,90 em centavos
    currency: 'brl',
    interval: 'month',
    max_professionals: 15,
    max_bookings_monthly: -1, // ilimitado
    features: [
      'Até 15 profissionais',
      'Agendamentos ilimitados',
      'Todas as funcionalidades do Professional',
      'Multi-unidades',
      'API de integração',
      'Relatórios avançados',
      'Dashboard analytics',
      'Suporte telefônico',
      'Onboarding personalizado'
    ]
  }
};

// Configurações do webhook
const WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated'
];

// Configurações de checkout
const CHECKOUT_CONFIG = {
  mode: 'subscription',
  payment_method_types: ['card'],
  billing_address_collection: 'required',
  locale: 'pt-BR',
  allow_promotion_codes: true,
  subscription_data: {
    trial_period_days: 7 // 7 dias grátis
  }
};

module.exports = {
  stripe,
  SUBSCRIPTION_PLANS,
  WEBHOOK_EVENTS,
  CHECKOUT_CONFIG
};
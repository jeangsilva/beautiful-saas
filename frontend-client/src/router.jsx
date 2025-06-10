/**
 * Beautiful SaaS - Router Configuration
 * Configuração de rotas da aplicação
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import Layout from '@/components/Layout/Layout';

// Pages
import HomePage from '@/pages/HomePage';
import ServicesPage from '@/pages/ServicesPage';
import BookingPage from '@/pages/BookingPage';
import ConfirmationPage from '@/pages/ConfirmationPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PrivacyPage from '@/pages/PrivacyPage';

// Error boundary
import ErrorBoundary from '@/components/Common/ErrorBoundary';

/**
 * Route configuration with nested routing
 */
export const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <HomePage />,
        meta: {
          title: 'Beautiful - Agendamento de Beleza',
          description: 'Agende seus serviços de beleza de forma simples e rápida.',
        },
      },
      {
        path: 'servicos',
        element: <ServicesPage />,
        meta: {
          title: 'Serviços - Beautiful',
          description: 'Conheça todos os nossos serviços de beleza disponíveis.',
        },
      },
      {
        path: 'servicos/:serviceId',
        element: <ServicesPage />,
        meta: {
          title: 'Serviço - Beautiful',
          description: 'Detalhes do serviço e agendamento.',
        },
      },
      {
        path: 'agendar',
        element: <BookingPage />,
        meta: {
          title: 'Agendamento - Beautiful',
          description: 'Faça seu agendamento escolhendo data, horário e profissional.',
        },
      },
      {
        path: 'agendar/:serviceId',
        element: <BookingPage />,
        meta: {
          title: 'Agendamento - Beautiful',
          description: 'Faça seu agendamento escolhendo data, horário e profissional.',
        },
      },
      {
        path: 'confirmacao',
        element: <ConfirmationPage />,
        meta: {
          title: 'Confirmação - Beautiful',
          description: 'Seu agendamento foi confirmado com sucesso.',
        },
      },
      {
        path: 'confirmacao/:bookingId',
        element: <ConfirmationPage />,
        meta: {
          title: 'Confirmação - Beautiful',
          description: 'Detalhes da confirmação do seu agendamento.',
        },
      },
      {
        path: 'sobre',
        element: <AboutPage />,
        meta: {
          title: 'Sobre - Beautiful',
          description: 'Conheça nossa história e missão na área da beleza.',
        },
      },
      {
        path: 'contato',
        element: <ContactPage />,
        meta: {
          title: 'Contato - Beautiful',
          description: 'Entre em contato conosco. Estamos aqui para ajudar.',
        },
      },
      {
        path: 'privacidade',
        element: <PrivacyPage />,
        meta: {
          title: 'Privacidade - Beautiful',
          description: 'Nossa política de privacidade e proteção de dados.',
        },
      },
      // Redirects
      {
        path: 'agendamentos',
        element: <Navigate to="/agendar" replace />,
      },
      {
        path: 'booking',
        element: <Navigate to="/agendar" replace />,
      },
      {
        path: 'services',
        element: <Navigate to="/servicos" replace />,
      },
      {
        path: 'about',
        element: <Navigate to="/sobre" replace />,
      },
      {
        path: 'contact',
        element: <Navigate to="/contato" replace />,
      },
      {
        path: 'privacy',
        element: <Navigate to="/privacidade" replace />,
      },
    ],
  },
  // 404 catch-all
  {
    path: '*',
    element: <Layout />,
    children: [
      {
        path: '*',
        element: <NotFoundPage />,
        meta: {
          title: 'Página não encontrada - Beautiful',
          description: 'A página que você procura não foi encontrada.',
        },
      },
    ],
  },
];

/**
 * Create router instance
 */
export const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});

/**
 * Route metadata for SEO and analytics
 */
export const routeMetadata = {
  '/': {
    title: 'Beautiful - Agendamento de Beleza',
    description: 'Agende seus serviços de beleza de forma simples e rápida.',
    keywords: 'agendamento, beleza, salão, manicure, pedicure, corte',
    canonicalUrl: '/',
  },
  '/servicos': {
    title: 'Serviços - Beautiful',
    description: 'Conheça todos os nossos serviços de beleza disponíveis.',
    keywords: 'serviços, beleza, corte, manicure, tratamentos',
    canonicalUrl: '/servicos',
  },
  '/agendar': {
    title: 'Agendamento - Beautiful',
    description: 'Faça seu agendamento escolhendo data, horário e profissional.',
    keywords: 'agendar, horário, profissional, data',
    canonicalUrl: '/agendar',
  },
  '/confirmacao': {
    title: 'Confirmação - Beautiful',
    description: 'Seu agendamento foi confirmado com sucesso.',
    keywords: 'confirmação, agendamento, sucesso',
    canonicalUrl: '/confirmacao',
  },
  '/sobre': {
    title: 'Sobre - Beautiful',
    description: 'Conheça nossa história e missão na área da beleza.',
    keywords: 'sobre, história, missão, beleza',
    canonicalUrl: '/sobre',
  },
  '/contato': {
    title: 'Contato - Beautiful',
    description: 'Entre em contato conosco. Estamos aqui para ajudar.',
    keywords: 'contato, ajuda, suporte, telefone',
    canonicalUrl: '/contato',
  },
  '/privacidade': {
    title: 'Privacidade - Beautiful',
    description: 'Nossa política de privacidade e proteção de dados.',
    keywords: 'privacidade, dados, proteção, LGPD',
    canonicalUrl: '/privacidade',
  },
};

/**
 * Navigation items for header/footer
 */
export const navigationItems = [
  {
    name: 'Início',
    href: '/',
    icon: 'Home',
  },
  {
    name: 'Serviços',
    href: '/servicos',
    icon: 'Scissors',
  },
  {
    name: 'Agendar',
    href: '/agendar',
    icon: 'Calendar',
    primary: true,
  },
  {
    name: 'Sobre',
    href: '/sobre',
    icon: 'Info',
  },
  {
    name: 'Contato',
    href: '/contato',
    icon: 'Phone',
  },
];

/**
 * Footer navigation items
 */
export const footerNavigationItems = [
  {
    name: 'Empresa',
    items: [
      { name: 'Sobre nós', href: '/sobre' },
      { name: 'Contato', href: '/contato' },
      { name: 'Trabalhe conosco', href: '/contato' },
    ],
  },
  {
    name: 'Serviços',
    items: [
      { name: 'Todos os serviços', href: '/servicos' },
      { name: 'Agendamento', href: '/agendar' },
      { name: 'Profissionais', href: '/servicos' },
    ],
  },
  {
    name: 'Suporte',
    items: [
      { name: 'Central de ajuda', href: '/contato' },
      { name: 'Política de privacidade', href: '/privacidade' },
      { name: 'Termos de uso', href: '/privacidade' },
    ],
  },
];

export default router;
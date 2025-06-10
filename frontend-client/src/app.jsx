/**
 * Beautiful SaaS - App Principal
 * Componente raiz da aplicação cliente
 */

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout Components
import Layout from '@/components/Layout/Layout';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

// Pages
import HomePage from '@/pages/HomePage';
import ServicesPage from '@/pages/ServicesPage';
import BookingPage from '@/pages/BookingPage';
import ConfirmationPage from '@/pages/ConfirmationPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PrivacyPage from '@/pages/PrivacyPage';

// Hooks
import { usePageTracking } from '@/hooks/usePageTracking';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Utils
import { trackPageView } from '@/utils/analytics';

function App() {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  
  // Track page views
  usePageTracking();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Track page views for analytics
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  
  // Handle offline status
  useEffect(() => {
    if (!isOnline) {
      console.warn('App is offline');
    }
  }, [isOnline]);

  return (
    <div className="App min-h-screen bg-white">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          📶 Você está offline. Algumas funcionalidades podem não estar disponíveis.
        </div>
      )}
      
      <Layout>
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* Main Routes */}
              <Route 
                path="/" 
                element={<HomePage />} 
              />
              
              <Route 
                path="/servicos" 
                element={<ServicesPage />} 
              />
              
              <Route 
                path="/servicos/:serviceId" 
                element={<ServicesPage />} 
              />
              
              <Route 
                path="/agendar" 
                element={<BookingPage />} 
              />
              
              <Route 
                path="/agendar/:serviceId" 
                element={<BookingPage />} 
              />
              
              <Route 
                path="/confirmacao" 
                element={<ConfirmationPage />} 
              />
              
              <Route 
                path="/confirmacao/:bookingId" 
                element={<ConfirmationPage />} 
              />
              
              {/* Information Pages */}
              <Route 
                path="/sobre" 
                element={<AboutPage />} 
              />
              
              <Route 
                path="/contato" 
                element={<ContactPage />} 
              />
              
              <Route 
                path="/privacidade" 
                element={<PrivacyPage />} 
              />
              
              {/* 404 Page */}
              <Route 
                path="*" 
                element={<NotFoundPage />} 
              />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </Layout>
    </div>
  );
}

export default App;
/**
 * Beautiful SaaS - Cookie Consent Component
 * Banner de consentimento de cookies LGPD
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const CookieConsent = ({ onAccept, onDecline }) => {
  const bannerVariants = {
    hidden: {
      opacity: 0,
      y: 100,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      y: 100,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 left-6 right-6 z-50 max-w-md mx-auto"
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              🍪 Cookies e Privacidade
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Utilizamos cookies para melhorar sua experiência em nosso site. 
              Ao continuar navegando, você concorda com nossa{' '}
              <Link 
                to="/privacidade" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Política de Privacidade
              </Link>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onAccept}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Aceitar Todos
              </button>
              
              <button
                onClick={onDecline}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Apenas Essenciais
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Link 
                to="/privacidade#cookies"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Configurar Cookies
              </Link>
              
              <button
                onClick={onDecline}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CookieConsent;
/**
 * Beautiful SaaS - Layout Principal
 * Layout base com header e footer
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Header from './Header';
import Footer from './Footer';
import ScrollToTop from '../Common/ScrollToTop';
import CookieConsent from '../Common/CookieConsent';

const Layout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check cookie consent
  useEffect(() => {
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      // Show consent after 2 seconds
      const timer = setTimeout(() => {
        setShowCookieConsent(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCookieAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieConsent(false);
  };

  const handleCookieDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowCookieConsent(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header isScrolled={isScrolled} />
      
      {/* Main Content */}
      <main className="flex-1 pt-16 lg:pt-20">
        <AnimatePresence mode="wait">
          {children || <Outlet />}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
      
      {/* Cookie Consent */}
      <AnimatePresence>
        {showCookieConsent && (
          <CookieConsent
            onAccept={handleCookieAccept}
            onDecline={handleCookieDecline}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
/**
 * Beautiful SaaS - Analytics Service
 * Serviços para tracking de eventos e analytics
 */

import storageService, { STORAGE_KEYS } from './storageService';

class AnalyticsService {
  constructor() {
    this.isEnabled = false;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.init();
  }

  // Initialize analytics
  init() {
    try {
      // Check cookie consent
      const consent = storageService.getCookieConsent();
      this.isEnabled = consent === 'accepted';

      // Generate or get user ID
      this.userId = this.getUserId();

      // Initialize Google Analytics if available
      if (this.isEnabled && typeof gtag !== 'undefined') {
        this.initGoogleAnalytics();
      }

      // Track page load
      if (this.isEnabled) {
        this.trackPageView(window.location.pathname);
      }
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  // Generate session ID
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get or create user ID
  getUserId() {
    let userId = storageService.getItem('analytics_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      storageService.setItem('analytics_user_id', userId);
    }
    return userId;
  }

  // Initialize Google Analytics
  initGoogleAnalytics() {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: this.userId,
        session_id: this.sessionId,
        anonymize_ip: true,
        allow_ad_personalization_signals: false,
      });
    }
  }

  // Enable/disable analytics
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.init();
    }
  }

  // Track page view
  trackPageView(path, title = null) {
    if (!this.isEnabled) return;

    try {
      const data = {
        event: 'page_view',
        page_path: path,
        page_title: title || document.title,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      };

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_title: data.page_title,
          page_location: window.location.href,
          page_path: data.page_path,
        });
      }

      // Custom analytics
      this.sendCustomEvent(data);

    } catch (error) {
      console.error('Page view tracking error:', error);
    }
  }

  // Track custom events
  trackEvent(eventName, parameters = {}) {
    if (!this.isEnabled) return;

    try {
      const data = {
        event: eventName,
        ...parameters,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
        page_path: window.location.pathname,
      };

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
      }

      // Custom analytics
      this.sendCustomEvent(data);

    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  // Track booking events
  trackBookingStarted(serviceId, salonId) {
    this.trackEvent('booking_started', {
      service_id: serviceId,
      salon_id: salonId,
      value: 0,
      currency: 'BRL',
    });
  }

  trackBookingStepCompleted(step, serviceId = null) {
    this.trackEvent('booking_step_completed', {
      step: step, // 'service_selected', 'professional_selected', 'datetime_selected', 'details_filled'
      service_id: serviceId,
    });
  }

  trackBookingCompleted(bookingData) {
    this.trackEvent('booking_completed', {
      service_id: bookingData.service_id,
      salon_id: bookingData.salon_id,
      professional_id: bookingData.professional_id,
      value: bookingData.price || 0,
      currency: 'BRL',
      booking_id: bookingData.id,
    });
  }

  trackBookingCancelled(bookingId, reason = '') {
    this.trackEvent('booking_cancelled', {
      booking_id: bookingId,
      cancellation_reason: reason,
    });
  }

  // Track search events
  trackSearch(query, category = null, results = 0) {
    this.trackEvent('search', {
      search_term: query,
      search_category: category,
      results_count: results,
    });
  }

  // Track service interactions
  trackServiceViewed(serviceId, serviceName, salonId) {
    this.trackEvent('service_viewed', {
      service_id: serviceId,
      service_name: serviceName,
      salon_id: salonId,
    });
  }

  trackServiceFavorited(serviceId, serviceName) {
    this.trackEvent('service_favorited', {
      service_id: serviceId,
      service_name: serviceName,
    });
  }

  // Track salon interactions
  trackSalonViewed(salonId, salonName) {
    this.trackEvent('salon_viewed', {
      salon_id: salonId,
      salon_name: salonName,
    });
  }

  trackSalonContactClicked(salonId, contactType) {
    this.trackEvent('salon_contact_clicked', {
      salon_id: salonId,
      contact_type: contactType, // 'phone', 'whatsapp', 'directions'
    });
  }

  // Track user interactions
  trackButtonClick(buttonName, location = null) {
    this.trackEvent('button_click', {
      button_name: buttonName,
      button_location: location,
    });
  }

  trackFormSubmission(formName, success = true) {
    this.trackEvent('form_submission', {
      form_name: formName,
      success: success,
    });
  }

  trackFileDownload(fileName, fileType) {
    this.trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType,
    });
  }

  // Track errors
  trackError(errorType, errorMessage, errorLocation = null) {
    this.trackEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation,
      fatal: false,
    });
  }

  // Track performance metrics
  trackPerformance(metric, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
    });
  }

  // Track user engagement
  trackTimeOnPage(pagePath, timeSpent) {
    this.trackEvent('time_on_page', {
      page_path: pagePath,
      time_spent: timeSpent,
    });
  }

  trackScrollDepth(percentage) {
    this.trackEvent('scroll_depth', {
      scroll_percentage: percentage,
    });
  }

  // Track business metrics
  trackLeadGenerated(source, campaign = null) {
    this.trackEvent('lead_generated', {
      lead_source: source,
      campaign: campaign,
    });
  }

  trackNewsletterSignup(source = 'website') {
    this.trackEvent('newsletter_signup', {
      signup_source: source,
    });
  }

  // Send custom event to backend
  async sendCustomEvent(eventData) {
    try {
      // Only send to backend in production and if user consented
      if (import.meta.env.PROD && this.isEnabled) {
        // Note: This would need an analytics endpoint in the backend
        // await fetch('/api/analytics/events', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(eventData),
        // });
      }

      // Store locally for debugging in development
      if (import.meta.env.DEV) {
        console.log('📊 Analytics Event:', eventData);
      }
    } catch (error) {
      console.error('Error sending analytics event:', error);
    }
  }

  // Get analytics data for user (if needed)
  getAnalyticsData() {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      isEnabled: this.isEnabled,
      consent: storageService.getCookieConsent(),
    };
  }

  // Privacy compliance
  clearUserData() {
    storageService.removeItem('analytics_user_id');
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  // GDPR compliance - export user data
  exportUserData() {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      createdAt: storageService.getItem('analytics_user_created'),
      events: [], // In real implementation, this would fetch from backend
    };
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();

// Utility functions for common tracking
export const trackPageView = (path, title) => analyticsService.trackPageView(path, title);
export const trackEvent = (name, params) => analyticsService.trackEvent(name, params);
export const trackBookingStarted = (serviceId, salonId) => analyticsService.trackBookingStarted(serviceId, salonId);
export const trackBookingCompleted = (data) => analyticsService.trackBookingCompleted(data);
export const trackSearch = (query, category, results) => analyticsService.trackSearch(query, category, results);
export const trackButtonClick = (name, location) => analyticsService.trackButtonClick(name, location);
export const trackError = (type, message, location) => analyticsService.trackError(type, message, location);

export default analyticsService;
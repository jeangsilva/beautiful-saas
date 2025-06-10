/**
 * Beautiful SaaS - Analytics Utils
 * Funções utilitárias para analytics e tracking
 */

import analyticsService from '../services/analyticsService';
import storageService from '../services/storageService';

// ===== PAGE TRACKING =====

/**
 * Track page view
 */
export const trackPageView = (path, title = null) => {
  try {
    analyticsService.trackPageView(path, title);
    
    // Store last visited page
    storageService.setItem('last_page_visit', {
      path,
      title,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Track page performance
 */
export const trackPagePerformance = (pageName) => {
  try {
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        // Track key performance metrics
        analyticsService.trackPerformance('page_load_time', Math.round(navigation.loadEventEnd - navigation.fetchStart));
        analyticsService.trackPerformance('dom_content_loaded', Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart));
        analyticsService.trackPerformance('first_byte', Math.round(navigation.responseStart - navigation.fetchStart));
        
        // Track slow pages (>3 seconds)
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        if (loadTime > 3000) {
          analyticsService.trackEvent('slow_page_load', {
            page_name: pageName,
            load_time: Math.round(loadTime),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error tracking page performance:', error);
  }
};

// ===== USER INTERACTION TRACKING =====

/**
 * Track button clicks with context
 */
export const trackButtonClick = (buttonName, context = {}) => {
  try {
    analyticsService.trackButtonClick(buttonName, context.location);
    
    // Enhanced tracking with additional context
    analyticsService.trackEvent('button_interaction', {
      button_name: buttonName,
      button_location: context.location,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
      timestamp: Date.now(),
      ...context,
    });
  } catch (error) {
    console.error('Error tracking button click:', error);
  }
};

/**
 * Track form interactions
 */
export const trackFormStart = (formName) => {
  try {
    analyticsService.trackEvent('form_start', {
      form_name: formName,
      page_path: window.location.pathname,
    });
  } catch (error) {
    console.error('Error tracking form start:', error);
  }
};

export const trackFormFieldFocus = (formName, fieldName) => {
  try {
    analyticsService.trackEvent('form_field_focus', {
      form_name: formName,
      field_name: fieldName,
    });
  } catch (error) {
    console.error('Error tracking form field focus:', error);
  }
};

export const trackFormSubmit = (formName, success = true, errors = {}) => {
  try {
    analyticsService.trackFormSubmission(formName, success);
    
    if (!success && Object.keys(errors).length > 0) {
      analyticsService.trackEvent('form_validation_error', {
        form_name: formName,
        error_fields: Object.keys(errors),
        error_count: Object.keys(errors).length,
      });
    }
  } catch (error) {
    console.error('Error tracking form submit:', error);
  }
};

// ===== BOOKING FUNNEL TRACKING =====

/**
 * Track booking funnel steps
 */
export const trackBookingFunnelStep = (step, data = {}) => {
  try {
    const steps = {
      'service_selection': 'Seleção de Serviço',
      'professional_selection': 'Seleção de Profissional',
      'datetime_selection': 'Seleção de Data/Hora',
      'customer_details': 'Dados do Cliente',
      'booking_confirmation': 'Confirmação',
      'booking_completed': 'Agendamento Concluído',
    };
    
    analyticsService.trackEvent('booking_funnel_step', {
      step: step,
      step_name: steps[step] || step,
      step_order: Object.keys(steps).indexOf(step) + 1,
      ...data,
    });
    
    // Store funnel progress
    const funnelProgress = storageService.getItem('booking_funnel_progress') || {};
    funnelProgress[step] = {
      timestamp: Date.now(),
      data,
    };
    storageService.setItem('booking_funnel_progress', funnelProgress);
  } catch (error) {
    console.error('Error tracking booking funnel step:', error);
  }
};

/**
 * Track booking abandonment
 */
export const trackBookingAbandonment = (lastStep, reason = 'unknown') => {
  try {
    const funnelProgress = storageService.getItem('booking_funnel_progress') || {};
    const completedSteps = Object.keys(funnelProgress);
    
    analyticsService.trackEvent('booking_abandoned', {
      last_step: lastStep,
      completed_steps: completedSteps,
      steps_completed: completedSteps.length,
      abandonment_reason: reason,
      time_spent: calculateTimeSpent(funnelProgress),
    });
    
    // Clear funnel progress
    storageService.removeItem('booking_funnel_progress');
  } catch (error) {
    console.error('Error tracking booking abandonment:', error);
  }
};

/**
 * Calculate time spent in booking funnel
 */
const calculateTimeSpent = (funnelProgress) => {
  try {
    const timestamps = Object.values(funnelProgress).map(step => step.timestamp);
    if (timestamps.length < 2) return 0;
    
    const firstStep = Math.min(...timestamps);
    const lastStep = Math.max(...timestamps);
    
    return Math.round((lastStep - firstStep) / 1000); // seconds
  } catch (error) {
    return 0;
  }
};

// ===== SEARCH TRACKING =====

/**
 * Track search with results
 */
export const trackSearchWithResults = (query, filters = {}, results = []) => {
  try {
    analyticsService.trackSearch(query, filters.category, results.length);
    
    // Enhanced search tracking
    analyticsService.trackEvent('search_performed', {
      search_query: query,
      search_filters: filters,
      results_count: results.length,
      has_results: results.length > 0,
      search_location: window.location.pathname,
    });
    
    // Track no results
    if (results.length === 0) {
      analyticsService.trackEvent('search_no_results', {
        search_query: query,
        search_filters: filters,
      });
    }
    
    // Store search in recent searches
    storageService.addRecentSearch(query);
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

/**
 * Track search result click
 */
export const trackSearchResultClick = (query, resultId, position) => {
  try {
    analyticsService.trackEvent('search_result_click', {
      search_query: query,
      result_id: resultId,
      result_position: position,
      click_through_rate: position === 1 ? 'first_result' : 'other_result',
    });
  } catch (error) {
    console.error('Error tracking search result click:', error);
  }
};

// ===== ERROR TRACKING =====

/**
 * Track JavaScript errors
 */
export const trackError = (error, context = {}) => {
  try {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      name: error.name || 'Error',
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: Date.now(),
      ...context,
    };
    
    analyticsService.trackError('javascript_error', errorInfo.message, window.location.pathname);
    
    // Enhanced error tracking
    analyticsService.trackEvent('app_error_detailed', errorInfo);
  } catch (trackingError) {
    console.error('Error tracking error:', trackingError);
  }
};

/**
 * Track API errors
 */
export const trackApiError = (endpoint, status, message, requestData = {}) => {
  try {
    analyticsService.trackEvent('api_error', {
      endpoint,
      status_code: status,
      error_message: message,
      request_method: requestData.method || 'GET',
      request_url: requestData.url || endpoint,
      response_time: requestData.responseTime || 0,
    });
  } catch (error) {
    console.error('Error tracking API error:', error);
  }
};

// ===== BUSINESS METRICS =====

/**
 * Track conversion events
 */
export const trackConversion = (conversionType, value = 0, currency = 'BRL') => {
  try {
    analyticsService.trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      currency,
      page_path: window.location.pathname,
    });
    
    // Track in Google Analytics as conversion
    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', {
        event_category: 'Business',
        event_label: conversionType,
        value: value,
        currency: currency,
      });
    }
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
};

/**
 * Track user engagement
 */
export const trackEngagement = (engagementType, duration = 0, data = {}) => {
  try {
    analyticsService.trackEvent('user_engagement', {
      engagement_type: engagementType,
      engagement_duration: duration,
      page_path: window.location.pathname,
      ...data,
    });
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
};

// ===== SESSION TRACKING =====

/**
 * Track session start
 */
export const trackSessionStart = () => {
  try {
    const sessionData = {
      session_id: analyticsService.getAnalyticsData().sessionId,
      start_time: Date.now(),
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    };
    
    analyticsService.trackEvent('session_start', sessionData);
    storageService.setItem('session_data', sessionData, true); // Use session storage
  } catch (error) {
    console.error('Error tracking session start:', error);
  }
};

/**
 * Track session end
 */
export const trackSessionEnd = () => {
  try {
    const sessionData = storageService.getItem('session_data', true);
    if (sessionData) {
      const sessionDuration = Date.now() - sessionData.start_time;
      
      analyticsService.trackEvent('session_end', {
        session_id: sessionData.session_id,
        session_duration: Math.round(sessionDuration / 1000), // seconds
        pages_visited: getSessionPageCount(),
      });
    }
  } catch (error) {
    console.error('Error tracking session end:', error);
  }
};

/**
 * Get session page count
 */
const getSessionPageCount = () => {
  try {
    const pageViews = storageService.getItem('session_page_views', true) || [];
    return pageViews.length;
  } catch (error) {
    return 0;
  }
};

// ===== SCROLL TRACKING =====

/**
 * Track scroll depth
 */
export const setupScrollTracking = () => {
  try {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 100];
    const trackedMilestones = new Set();
    
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollPercent = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100
      );
      
      maxScroll = Math.max(maxScroll, scrollPercent);
      
      // Track milestone achievements
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone);
          analyticsService.trackScrollDepth(milestone);
        }
      });
    };
    
    // Throttled scroll listener
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScrollDepth, 250);
    }, { passive: true });
    
    // Track max scroll on page unload
    window.addEventListener('beforeunload', () => {
      if (maxScroll > 0) {
        analyticsService.trackEvent('page_scroll_depth', {
          max_scroll_percent: maxScroll,
          page_path: window.location.pathname,
        });
      }
    });
  } catch (error) {
    console.error('Error setting up scroll tracking:', error);
  }
};

// ===== TIME TRACKING =====

/**
 * Track time on page
 */
export const setupTimeTracking = () => {
  try {
    const startTime = Date.now();
    
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      analyticsService.trackTimeOnPage(window.location.pathname, timeSpent);
    };
    
    // Track time on visibility change and page unload
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    });
    
    window.addEventListener('beforeunload', trackTimeOnPage);
    
    // Track engagement time intervals
    const intervals = [30, 60, 120, 300]; // 30s, 1m, 2m, 5m
    intervals.forEach(interval => {
      setTimeout(() => {
        if (!document.hidden) {
          analyticsService.trackEvent('time_on_page_milestone', {
            milestone_seconds: interval,
            page_path: window.location.pathname,
          });
        }
      }, interval * 1000);
    });
  } catch (error) {
    console.error('Error setting up time tracking:', error);
  }
};

// ===== INITIALIZATION =====

/**
 * Initialize all tracking
 */
export const initializeTracking = () => {
  try {
    // Set up automatic tracking
    setupScrollTracking();
    setupTimeTracking();
    
    // Track session start
    trackSessionStart();
    
    // Track page performance after load
    window.addEventListener('load', () => {
      setTimeout(() => {
        trackPagePerformance(window.location.pathname);
      }, 1000);
    });
    
    // Track session end on page unload
    window.addEventListener('beforeunload', trackSessionEnd);
    
    console.log('📊 Analytics tracking initialized');
  } catch (error) {
    console.error('Error initializing tracking:', error);
  }
};

// ===== EXPORT ALL =====
export default {
  trackPageView,
  trackPagePerformance,
  trackButtonClick,
  trackFormStart,
  trackFormFieldFocus,
  trackFormSubmit,
  trackBookingFunnelStep,
  trackBookingAbandonment,
  trackSearchWithResults,
  trackSearchResultClick,
  trackError,
  trackApiError,
  trackConversion,
  trackEngagement,
  trackSessionStart,
  trackSessionEnd,
  setupScrollTracking,
  setupTimeTracking,
  initializeTracking,
};
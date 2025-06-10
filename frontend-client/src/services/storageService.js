/**
 * Beautiful SaaS - Storage Service
 * Serviços para localStorage, sessionStorage e cache
 */

// Storage keys constants
export const STORAGE_KEYS = {
    // User preferences
    USER_PREFERENCES: 'beautiful_user_preferences',
    SELECTED_SALON: 'beautiful_selected_salon',
    RECENT_SEARCHES: 'beautiful_recent_searches',
    FAVORITE_SERVICES: 'beautiful_favorite_services',
    
    // Booking flow
    BOOKING_DRAFT: 'beautiful_booking_draft',
    LAST_BOOKING: 'beautiful_last_booking',
    BOOKING_HISTORY: 'beautiful_booking_history',
    
    // App state
    THEME_PREFERENCE: 'beautiful_theme',
    LANGUAGE_PREFERENCE: 'beautiful_language',
    COOKIE_CONSENT: 'beautiful_cookie_consent',
    ONBOARDING_COMPLETED: 'beautiful_onboarding_completed',
    
    // Cache
    SERVICES_CACHE: 'beautiful_services_cache',
    SALONS_CACHE: 'beautiful_salons_cache',
    PROFESSIONALS_CACHE: 'beautiful_professionals_cache',
  };
  
  class StorageService {
    // Check if storage is available
    isStorageAvailable(type = 'localStorage') {
      try {
        const storage = window[type];
        const test = '__storage_test__';
        storage.setItem(test, 'test');
        storage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    }
  
    // Generic storage methods
    setItem(key, value, useSessionStorage = false) {
      try {
        const storage = useSessionStorage ? sessionStorage : localStorage;
        const serializedValue = JSON.stringify({
          data: value,
          timestamp: Date.now(),
          version: '1.0'
        });
        storage.setItem(key, serializedValue);
        return true;
      } catch (error) {
        console.error('Error setting storage item:', error);
        return false;
      }
    }
  
    getItem(key, useSessionStorage = false) {
      try {
        const storage = useSessionStorage ? sessionStorage : localStorage;
        const item = storage.getItem(key);
        
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        
        // Check if item has expected structure
        if (!parsed || typeof parsed !== 'object' || !parsed.hasOwnProperty('data')) {
          return item; // Return raw value for backward compatibility
        }
        
        return parsed.data;
      } catch (error) {
        console.error('Error getting storage item:', error);
        return null;
      }
    }
  
    removeItem(key, useSessionStorage = false) {
      try {
        const storage = useSessionStorage ? sessionStorage : localStorage;
        storage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing storage item:', error);
        return false;
      }
    }
  
    clear(useSessionStorage = false) {
      try {
        const storage = useSessionStorage ? sessionStorage : localStorage;
        storage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
      }
    }
  
    // Cache methods with expiration
    setCache(key, data, expirationMinutes = 30) {
      const cacheData = {
        data,
        expiration: Date.now() + (expirationMinutes * 60 * 1000),
        version: '1.0'
      };
      
      return this.setItem(key, cacheData);
    }
  
    getCache(key) {
      const cached = this.getItem(key);
      
      if (!cached || !cached.expiration) {
        return null;
      }
      
      // Check if cache is expired
      if (Date.now() > cached.expiration) {
        this.removeItem(key);
        return null;
      }
      
      return cached.data;
    }
  
    // User preferences methods
    getUserPreferences() {
      return this.getItem(STORAGE_KEYS.USER_PREFERENCES) || {
        theme: 'light',
        language: 'pt-BR',
        notifications: true,
        autoLocation: true,
        marketingEmails: false,
      };
    }
  
    setUserPreferences(preferences) {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      return this.setItem(STORAGE_KEYS.USER_PREFERENCES, updated);
    }
  
    // Booking draft methods
    saveBookingDraft(draftData) {
      const draft = {
        ...draftData,
        savedAt: Date.now(),
      };
      return this.setItem(STORAGE_KEYS.BOOKING_DRAFT, draft);
    }
  
    getBookingDraft() {
      const draft = this.getItem(STORAGE_KEYS.BOOKING_DRAFT);
      
      if (!draft) return null;
      
      // Check if draft is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - draft.savedAt > maxAge) {
        this.removeItem(STORAGE_KEYS.BOOKING_DRAFT);
        return null;
      }
      
      return draft;
    }
  
    clearBookingDraft() {
      return this.removeItem(STORAGE_KEYS.BOOKING_DRAFT);
    }
  
    // Recent searches methods
    addRecentSearch(searchTerm) {
      const searches = this.getRecentSearches();
      const filtered = searches.filter(term => 
        term.toLowerCase() !== searchTerm.toLowerCase()
      );
      
      const updated = [searchTerm, ...filtered].slice(0, 10); // Keep last 10
      return this.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
    }
  
    getRecentSearches() {
      return this.getItem(STORAGE_KEYS.RECENT_SEARCHES) || [];
    }
  
    clearRecentSearches() {
      return this.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    }
  
    // Favorite services methods
    addFavoriteService(serviceId) {
      const favorites = this.getFavoriteServices();
      if (!favorites.includes(serviceId)) {
        favorites.push(serviceId);
        return this.setItem(STORAGE_KEYS.FAVORITE_SERVICES, favorites);
      }
      return true;
    }
  
    removeFavoriteService(serviceId) {
      const favorites = this.getFavoriteServices();
      const filtered = favorites.filter(id => id !== serviceId);
      return this.setItem(STORAGE_KEYS.FAVORITE_SERVICES, filtered);
    }
  
    getFavoriteServices() {
      return this.getItem(STORAGE_KEYS.FAVORITE_SERVICES) || [];
    }
  
    isFavoriteService(serviceId) {
      return this.getFavoriteServices().includes(serviceId);
    }
  
    // Booking history methods
    addBookingToHistory(booking) {
      const history = this.getBookingHistory();
      const updated = [booking, ...history].slice(0, 50); // Keep last 50
      return this.setItem(STORAGE_KEYS.BOOKING_HISTORY, updated);
    }
  
    getBookingHistory() {
      return this.getItem(STORAGE_KEYS.BOOKING_HISTORY) || [];
    }
  
    clearBookingHistory() {
      return this.removeItem(STORAGE_KEYS.BOOKING_HISTORY);
    }
  
    // Selected salon methods
    setSelectedSalon(salon) {
      return this.setItem(STORAGE_KEYS.SELECTED_SALON, salon);
    }
  
    getSelectedSalon() {
      return this.getItem(STORAGE_KEYS.SELECTED_SALON);
    }
  
    clearSelectedSalon() {
      return this.removeItem(STORAGE_KEYS.SELECTED_SALON);
    }
  
    // Cookie consent methods
    setCookieConsent(consent) {
      return this.setItem(STORAGE_KEYS.COOKIE_CONSENT, {
        consent,
        timestamp: Date.now(),
      });
    }
  
    getCookieConsent() {
      const data = this.getItem(STORAGE_KEYS.COOKIE_CONSENT);
      return data?.consent || null;
    }
  
    // Onboarding methods
    setOnboardingCompleted(completed = true) {
      return this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
    }
  
    isOnboardingCompleted() {
      return this.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) || false;
    }
  
    // Migration methods
    migrateOldData() {
      // Migrate old storage format to new format
      try {
        const oldKeys = [
          'beautifulBookingDraft',
          'beautifulUserPrefs',
          'beautifulRecentSearches',
        ];
  
        oldKeys.forEach(oldKey => {
          const oldData = localStorage.getItem(oldKey);
          if (oldData) {
            // Migration logic here
            localStorage.removeItem(oldKey);
          }
        });
      } catch (error) {
        console.error('Error during storage migration:', error);
      }
    }
  
    // Cleanup methods
    cleanupExpiredData() {
      try {
        // Clean up expired cache items
        Object.values(STORAGE_KEYS).forEach(key => {
          const item = this.getItem(key);
          if (item && item.expiration && Date.now() > item.expiration) {
            this.removeItem(key);
          }
        });
  
        // Clean up old booking drafts
        const draft = this.getItem(STORAGE_KEYS.BOOKING_DRAFT);
        if (draft && draft.savedAt) {
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          if (Date.now() - draft.savedAt > maxAge) {
            this.removeItem(STORAGE_KEYS.BOOKING_DRAFT);
          }
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  
    // Get storage usage info
    getStorageInfo() {
      try {
        let totalSize = 0;
        let itemCount = 0;
  
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length;
            itemCount++;
          }
        }
  
        return {
          totalSize,
          itemCount,
          sizeInKB: Math.round(totalSize / 1024),
          sizeInMB: Math.round(totalSize / (1024 * 1024)),
        };
      } catch (error) {
        console.error('Error getting storage info:', error);
        return null;
      }
    }
  }
  
  // Create and export singleton instance
  const storageService = new StorageService();
  
  // Initialize cleanup on app start
  if (typeof window !== 'undefined') {
    // Run cleanup on app start
    storageService.cleanupExpiredData();
    
    // Run migration if needed
    storageService.migrateOldData();
    
    // Schedule periodic cleanup
    setInterval(() => {
      storageService.cleanupExpiredData();
    }, 60 * 60 * 1000); // Every hour
  }
  
  export { STORAGE_KEYS };
  export default storageService;
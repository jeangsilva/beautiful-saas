/**
 * Beautiful SaaS - useGeolocation Hook
 * Hook para gerenciar geolocalização do usuário
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import storageService from '../services/storageService';
import { trackEvent } from '../utils/analytics';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 10 * 60 * 1000, // 10 minutes
};

const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

export const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10 * 60 * 1000,
    autoStart = false,
    watchPosition = false,
  } = options;

  // ===== STATE =====
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  
  // ===== REFS =====
  const watchIdRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // ===== HELPERS =====
  
  const geolocationOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  const getErrorMessage = (error) => {
    switch (error.code) {
      case GEOLOCATION_ERRORS.PERMISSION_DENIED:
        return 'Permissão de localização negada. Para uma melhor experiência, permita o acesso à sua localização.';
      case GEOLOCATION_ERRORS.POSITION_UNAVAILABLE:
        return 'Localização indisponível. Verifique se o GPS está ativado.';
      case GEOLOCATION_ERRORS.TIMEOUT:
        return 'Tempo limite esgotado ao obter localização. Tente novamente.';
      default:
        return 'Erro desconhecido ao obter localização.';
    }
  };

  const saveLocationToStorage = (position) => {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      savedAt: Date.now(),
    };
    
    storageService.setCache('last_known_location', locationData, 60); // Cache for 1 hour
  };

  const getLocationFromStorage = () => {
    return storageService.getCache('last_known_location');
  };

  // ===== CALLBACKS =====

  const onSuccess = useCallback((position) => {
    if (!isComponentMountedRef.current) return;

    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    };

    setLocation(locationData);
    setError(null);
    setIsLoading(false);
    
    // Save to storage
    saveLocationToStorage(position);
    
    // Track successful geolocation
    trackEvent('geolocation_success', {
      accuracy: position.coords.accuracy,
      method: 'browser_api',
    });
  }, []);

  const onError = useCallback((error) => {
    if (!isComponentMountedRef.current) return;

    const errorMessage = getErrorMessage(error);
    setError({
      code: error.code,
      message: errorMessage,
      originalError: error,
    });
    setIsLoading(false);
    
    // Update permission state
    if (error.code === GEOLOCATION_ERRORS.PERMISSION_DENIED) {
      setPermission('denied');
    }
    
    // Track geolocation error
    trackEvent('geolocation_error', {
      error_code: error.code,
      error_message: errorMessage,
    });
  }, []);

  // ===== METHODS =====

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      const error = {
        code: 0,
        message: 'Geolocalização não é suportada por este navegador.',
      };
      setError(error);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      geolocationOptions
    );
  }, [onSuccess, onError, geolocationOptions]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      const error = {
        code: 0,
        message: 'Geolocalização não é suportada por este navegador.',
      };
      setError(error);
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      geolocationOptions
    );

    trackEvent('geolocation_watch_started');
  }, [onSuccess, onError, geolocationOptions]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLoading(false);
      
      trackEvent('geolocation_watch_stopped');
    }
  }, []);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'unsupported';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(result.state);
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        setPermission(result.state);
      });
      
      return result.state;
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      return 'unknown';
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      // Requesting permission by attempting to get position
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          ...geolocationOptions,
          timeout: 5000, // Short timeout for permission request
        });
      });
      setPermission('granted');
      return 'granted';
    } catch (error) {
      if (error.code === GEOLOCATION_ERRORS.PERMISSION_DENIED) {
        setPermission('denied');
        return 'denied';
      }
      return 'unknown';
    }
  }, [geolocationOptions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadCachedLocation = useCallback(() => {
    const cachedLocation = getLocationFromStorage();
    if (cachedLocation) {
      setLocation(cachedLocation);
      return true;
    }
    return false;
  }, []);

  // ===== EFFECTS =====

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      // Try to load cached location first
      const hasCachedLocation = loadCachedLocation();
      
      // If no cached location or cache is old, get fresh location
      if (!hasCachedLocation) {
        if (watchPosition) {
          startWatching();
        } else {
          getCurrentPosition();
        }
      }
    }
  }, [autoStart, watchPosition, loadCachedLocation, startWatching, getCurrentPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ===== UTILITY METHODS =====

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }, []);

  const getDistanceToPoint = useCallback((targetLat, targetLon) => {
    if (!location) return null;
    return calculateDistance(
      location.latitude,
      location.longitude,
      targetLat,
      targetLon
    );
  }, [location, calculateDistance]);

  const isWithinRadius = useCallback((targetLat, targetLon, radiusKm) => {
    const distance = getDistanceToPoint(targetLat, targetLon);
    return distance !== null && distance <= radiusKm;
  }, [getDistanceToPoint]);

  const getLocationString = useCallback(() => {
    if (!location) return '';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }, [location]);

  // ===== COMPUTED VALUES =====

  const isSupported = 'geolocation' in navigator;
  const hasLocation = !!location;
  const isWatching = !!watchIdRef.current;
  const isPermissionGranted = permission === 'granted';
  const isPermissionDenied = permission === 'denied';

  // Location age (how old is the current location)
  const locationAge = location 
    ? Math.round((Date.now() - location.timestamp) / 1000) 
    : null;

  const isLocationFresh = locationAge !== null && locationAge < 300; // Less than 5 minutes

  // ===== RETURN =====
  return {
    // State
    location,
    error,
    isLoading,
    permission,
    
    // Computed
    isSupported,
    hasLocation,
    isWatching,
    isPermissionGranted,
    isPermissionDenied,
    locationAge,
    isLocationFresh,
    
    // Methods
    getCurrentPosition,
    startWatching,
    stopWatching,
    checkPermission,
    requestPermission,
    clearError,
    loadCachedLocation,
    
    // Utilities
    calculateDistance,
    getDistanceToPoint,
    isWithinRadius,
    getLocationString,
    
    // Constants
    GEOLOCATION_ERRORS,
  };
};

export default useGeolocation;
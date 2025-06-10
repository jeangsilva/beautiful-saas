/**
 * Beautiful SaaS - API Service
 * Configuração base do Axios e interceptors
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Type': 'client',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;

    // Log responses in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    // Log slow requests
    if (duration > 3000) {
      console.warn(`🐌 Slow API Request (${duration}ms):`, response.config.url);
    }

    return response;
  },
  (error) => {
    const { response, config } = error;
    const duration = config?.metadata ? new Date() - config.metadata.startTime : 0;

    // Log errors
    console.error('❌ API Error:', {
      method: config?.method?.toUpperCase(),
      url: config?.url,
      status: response?.status,
      duration: `${duration}ms`,
      message: error.message,
      data: response?.data,
    });

    // Handle different error types
    if (response) {
      // Server responded with error status
      handleApiError(response);
    } else if (error.request) {
      // Request was made but no response received
      handleNetworkError(error);
    } else {
      // Something else happened
      handleUnknownError(error);
    }

    return Promise.reject(error);
  }
);

// Error handlers
const handleApiError = (response) => {
  const { status, data } = response;
  
  switch (status) {
    case 400:
      toast.error(data?.message || 'Dados inválidos. Verifique as informações enviadas.');
      break;
    case 401:
      toast.error('Sessão expirada. Faça login novamente.');
      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      // Redirect to login if needed
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      break;
    case 403:
      toast.error('Acesso negado. Você não tem permissão para esta ação.');
      break;
    case 404:
      toast.error('Recurso não encontrado.');
      break;
    case 409:
      toast.error(data?.message || 'Conflito de dados. Tente novamente.');
      break;
    case 422:
      // Validation errors
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0]?.[0];
        toast.error(firstError || 'Dados inválidos.');
      } else {
        toast.error(data?.message || 'Dados inválidos.');
      }
      break;
    case 429:
      toast.error('Muitas tentativas. Aguarde um momento e tente novamente.');
      break;
    case 500:
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
      break;
    case 502:
    case 503:
    case 504:
      toast.error('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
      break;
    default:
      toast.error(data?.message || 'Erro inesperado. Tente novamente.');
  }
};

const handleNetworkError = (error) => {
  if (error.code === 'ECONNABORTED') {
    toast.error('Tempo limite excedido. Verifique sua conexão e tente novamente.');
  } else if (!navigator.onLine) {
    toast.error('Sem conexão com a internet. Verifique sua rede.');
  } else {
    toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
  }
};

const handleUnknownError = (error) => {
  console.error('Unknown error:', error);
  toast.error('Erro inesperado. Recarregue a página e tente novamente.');
};

// Helper functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.Authorization;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  delete api.defaults.headers.Authorization;
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// API Health check
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('API Health check failed:', error);
    throw error;
  }
};

// Generic API methods
export const apiMethods = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
};

// Upload helper
export const uploadFile = async (url, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    };
  }

  return api.post(url, formData, config);
};

// Request retry helper
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Cancel token helper
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export default api;
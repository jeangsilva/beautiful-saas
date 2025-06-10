/**
 * Beautiful SaaS - Frontend Cliente
 * Entry point da aplicação
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import './index.css';

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Toast configuration
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  reverseOrder: false,
  gutter: 8,
  containerClassName: '',
  containerStyle: {
    top: 20,
    right: 20,
  },
  toastOptions: {
    className: '',
    duration: 4000,
    style: {
      background: '#fff',
      color: '#1e293b',
      fontSize: '14px',
      fontWeight: '500',
      padding: '12px 16px',
      borderRadius: '12px',
      boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
    },
    success: {
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
      style: {
        border: '1px solid #22c55e',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      style: {
        border: '1px solid #ef4444',
      },
    },
    loading: {
      iconTheme: {
        primary: '#070fef',
        secondary: '#fff',
      },
    },
  },
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to monitoring service in production
    if (import.meta.env.PROD && typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Algo deu errado
              </h1>
              
              <p className="text-gray-600 mb-6">
                Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente mais tarde.
              </p>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200"
              >
                Recarregar Página
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Se o problema persistir, entre em contato conosco.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring for development
if (import.meta.env.DEV && 'performance' in window && 'PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log('Navigation Performance:', {
          dns: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
          tcp: Math.round(entry.connectEnd - entry.connectStart),
          request: Math.round(entry.responseStart - entry.requestStart),
          response: Math.round(entry.responseEnd - entry.responseStart),
          domComplete: Math.round(entry.domComplete - entry.navigationStart),
          loadComplete: Math.round(entry.loadEventEnd - entry.navigationStart),
        });
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    console.log('Performance observer not supported');
  }
}

// App initialization
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster {...toastOptions} />
          </BrowserRouter>
          
          {/* React Query DevTools - only in development */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              position="bottom-right"
            />
          )}
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Service Worker registration for production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  });
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  if (import.meta.env.PROD && typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      description: event.error?.toString() || 'Unknown error',
      fatal: false,
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (import.meta.env.PROD && typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      description: event.reason?.toString() || 'Unhandled promise rejection',
      fatal: false,
    });
  }
});

// Export query client for use in other parts of the app
export { queryClient };
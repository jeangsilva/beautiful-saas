/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        // Beautiful SaaS Brand Colors
        colors: {
          primary: {
            50: '#eff3ff',
            100: '#dbe4ff',
            200: '#bfcfff',
            300: '#93b1ff',
            400: '#6088ff',
            500: '#3b60ff',
            600: '#070fef', // Brand Primary
            700: '#1e2df5',
            800: '#1e2bc4',
            900: '#1e2a9b',
            950: '#161d5c',
          },
          secondary: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
          },
          beauty: {
            pink: '#ff6b9d',
            purple: '#8b5cf6',
            gold: '#fbbf24',
            rose: '#f43f5e',
            lavender: '#a78bfa'
          },
          success: {
            50: '#f0fdf4',
            500: '#22c55e',
            600: '#16a34a',
          },
          warning: {
            50: '#fffbeb',
            500: '#f59e0b',
            600: '#d97706',
          },
          error: {
            50: '#fef2f2',
            500: '#ef4444',
            600: '#dc2626',
          }
        },
        
        // Typography
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          display: ['Poppins', 'system-ui', 'sans-serif'],
          body: ['Inter', 'system-ui', 'sans-serif'],
        },
        
        // Spacing
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '128': '32rem',
        },
        
        // Border radius
        borderRadius: {
          '4xl': '2rem',
          '5xl': '2.5rem',
        },
        
        // Box shadows
        boxShadow: {
          'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
          'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          'large': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          'glow': '0 0 20px rgba(7, 15, 239, 0.3)',
          'glow-lg': '0 0 40px rgba(7, 15, 239, 0.4)',
        },
        
        // Animations
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in-out',
          'fade-in-up': 'fadeInUp 0.5s ease-out',
          'fade-in-down': 'fadeInDown 0.5s ease-out',
          'slide-in-right': 'slideInRight 0.5s ease-out',
          'slide-in-left': 'slideInLeft 0.5s ease-out',
          'bounce-gentle': 'bounceGentle 2s infinite',
          'pulse-gentle': 'pulseGentle 2s infinite',
          'float': 'float 3s ease-in-out infinite',
          'gradient': 'gradient 3s ease infinite',
        },
        
        // Keyframes
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          fadeInUp: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          fadeInDown: {
            '0%': { opacity: '0', transform: 'translateY(-10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideInRight: {
            '0%': { opacity: '0', transform: 'translateX(10px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
          slideInLeft: {
            '0%': { opacity: '0', transform: 'translateX(-10px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
          bounceGentle: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' },
          },
          pulseGentle: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.8' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          gradient: {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
          },
        },
        
        // Background images
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'beauty-gradient': 'linear-gradient(135deg, #070fef 0%, #8b5cf6 50%, #ff6b9d 100%)',
          'hero-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23070fef\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        },
        
        // Backdrop blur
        backdropBlur: {
          xs: '2px',
        },
        
        // Max width
        maxWidth: {
          '8xl': '88rem',
          '9xl': '96rem',
        },
        
        // Screen sizes
        screens: {
          'xs': '475px',
          '3xl': '1600px',
        },
      },
    },
    plugins: [
      // Form styles
      require('@tailwindcss/forms')({
        strategy: 'class',
      }),
      
      // Typography
      require('@tailwindcss/typography'),
      
      // Aspect ratio
      require('@tailwindcss/aspect-ratio'),
      
      // Custom utilities
      function({ addUtilities }) {
        const newUtilities = {
          '.text-gradient': {
            background: 'linear-gradient(135deg, #070fef 0%, #8b5cf6 100%)',
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'background-clip': 'text',
          },
          '.btn-gradient': {
            background: 'linear-gradient(135deg, #070fef 0%, #3b60ff 100%)',
            transition: 'all 0.3s ease',
          },
          '.btn-gradient:hover': {
            background: 'linear-gradient(135deg, #1e2df5 0%, #070fef 100%)',
            transform: 'translateY(-1px)',
            'box-shadow': '0 10px 25px rgba(7, 15, 239, 0.3)',
          },
          '.glass': {
            background: 'rgba(255, 255, 255, 0.1)',
            'backdrop-filter': 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.glass-dark': {
            background: 'rgba(0, 0, 0, 0.1)',
            'backdrop-filter': 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }
        addUtilities(newUtilities);
      }
    ],
  }
/**
 * Beautiful SaaS - Loading Spinner Component
 * Componente de loading com diferentes tamanhos e estilos
 */

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = null,
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-400',
    success: 'text-green-500',
    error: 'text-red-500'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const dotsVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const SpinnerIcon = () => (
    <motion.div
      className={clsx(
        'border-2 border-current border-t-transparent rounded-full',
        sizeClasses[size],
        colorClasses[color]
      )}
      variants={spinnerVariants}
      animate="animate"
    />
  );

  const DotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={clsx(
            'rounded-full bg-current',
            size === 'xs' ? 'w-1 h-1' :
            size === 'sm' ? 'w-1.5 h-1.5' :
            size === 'md' ? 'w-2 h-2' :
            size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
            colorClasses[color]
          )}
          variants={dotsVariants}
          animate="animate"
          style={{
            animationDelay: `${index * 0.2}s`
          }}
        />
      ))}
    </div>
  );

  const PulseSpinner = () => (
    <motion.div
      className={clsx(
        'rounded-full bg-current',
        sizeClasses[size],
        colorClasses[color]
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );

  const LoadingContent = ({ variant = 'spinner' }) => (
    <div className="flex flex-col items-center space-y-3">
      {variant === 'spinner' && <SpinnerIcon />}
      {variant === 'dots' && <DotsSpinner />}
      {variant === 'pulse' && <PulseSpinner />}
      
      {text && (
        <motion.p
          className={clsx(
            'font-medium',
            textSizeClasses[size],
            color === 'white' ? 'text-white' : 'text-gray-600'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <LoadingContent />
      </motion.div>
    );
  }

  if (overlay) {
    return (
      <motion.div
        className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <LoadingContent />
      </motion.div>
    );
  }

  return <LoadingContent />;
};

// Preset loading components for common use cases
export const ButtonSpinner = ({ className = '' }) => (
  <LoadingSpinner 
    size="sm" 
    color="white" 
    className={className}
  />
);

export const PageSpinner = ({ text = 'Carregando...' }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingSpinner 
      size="lg" 
      color="primary" 
      text={text}
    />
  </div>
);

export const InlineSpinner = ({ size = 'sm', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    color="primary" 
    className={className}
  />
);

export const OverlaySpinner = ({ text = 'Processando...' }) => (
  <LoadingSpinner 
    size="lg" 
    color="primary" 
    text={text}
    overlay={true}
  />
);

export const FullPageSpinner = ({ text = 'Carregando aplicação...' }) => (
  <LoadingSpinner 
    size="xl" 
    color="primary" 
    text={text}
    fullScreen={true}
  />
);

// Skeleton loading component
export const SkeletonLoader = ({ 
  className = '',
  variant = 'rectangular',
  animation = true 
}) => {
  const baseClasses = 'bg-gray-200 rounded';
  const animationClasses = animation ? 'animate-pulse' : '';
  
  const variantClasses = {
    rectangular: 'h-4',
    circular: 'rounded-full w-10 h-10',
    text: 'h-4 rounded-md',
    avatar: 'rounded-full w-12 h-12'
  };

  return (
    <div 
      className={clsx(
        baseClasses,
        animationClasses,
        variantClasses[variant],
        className
      )}
    />
  );
};

// Card skeleton for content loading
export const CardSkeleton = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center space-x-3">
      <SkeletonLoader variant="avatar" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader className="h-4 w-3/4" />
        <SkeletonLoader className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLoader className="h-3 w-full" />
      <SkeletonLoader className="h-3 w-5/6" />
      <SkeletonLoader className="h-3 w-4/6" />
    </div>
    <div className="flex justify-between">
      <SkeletonLoader className="h-8 w-20 rounded-lg" />
      <SkeletonLoader className="h-8 w-16 rounded-lg" />
    </div>
  </div>
);

export default LoadingSpinner;
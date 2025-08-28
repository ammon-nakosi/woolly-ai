import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature' | 'script' | 'debug' | 'review' | 'vibe' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    feature: 'bg-blue-100 text-blue-800',
    script: 'bg-green-100 text-green-800',
    debug: 'bg-red-100 text-red-800',
    review: 'bg-purple-100 text-purple-800',
    vibe: 'bg-yellow-100 text-yellow-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
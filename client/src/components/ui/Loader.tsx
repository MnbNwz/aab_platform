import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'accent' | 'white' | 'gray';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    accent: 'border-accent-500',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  return (
    <div 
      className={`
        animate-spin rounded-full border-2 border-transparent
        ${sizeClasses[size]}
        ${colorClasses[color]}
        border-t-current
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;

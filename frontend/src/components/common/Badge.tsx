import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'gold' | 'green' | 'red' | 'slate' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs sm:text-sm',
  };

  const variantStyles = {
    primary: 'bg-bis-100 text-bis-800 border border-bis-200',
    gold: 'bg-amber-50 text-amber-800 border border-amber-200',
    green: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    red: 'bg-rose-50 text-rose-800 border border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'bg-transparent text-bis-700 border border-bis-300',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

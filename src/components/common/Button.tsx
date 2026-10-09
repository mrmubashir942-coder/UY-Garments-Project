import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium transition-all select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md',
    md: 'text-sm px-4 py-2 rounded-lg',
    lg: 'text-base px-5 py-2.5 rounded-lg',
  }[size];

  const variantStyles = {
    primary:
      'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 border border-transparent shadow-xs',
    secondary:
      'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 active:bg-neutral-200 shadow-xs',
    danger:
      'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800 hover:border-neutral-800',
    ghost:
      'bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
};

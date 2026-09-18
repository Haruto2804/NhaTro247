import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-11 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
    icon: 'h-10 w-10 p-0',
  };

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.98]',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.98]',
    dispute: 'bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-[0.98]',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 active:scale-[0.98]',
    ghost: 'hover:bg-slate-100 text-slate-700 active:scale-[0.98]',
    dangerGhost: 'hover:bg-red-50 text-red-600 active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xử lý...
        </>
      ) : children}
    </button>
  );
};

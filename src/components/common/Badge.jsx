import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    ai: 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 text-indigo-800 border border-indigo-300/50 shadow-xs',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.default}`}>
      {children}
    </span>
  );
};

export default Badge;

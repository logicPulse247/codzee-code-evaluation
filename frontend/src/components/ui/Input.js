'use client';

import React from 'react';

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 font-sans">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold font-mono text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`
          w-full
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          focus:border-blue-600 dark:focus:border-blue-500
          rounded-lg px-3 py-2
          text-xs font-mono
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          focus:outline-none transition-colors
          ${error ? 'border-rose-500 dark:border-rose-600 focus:border-rose-600 dark:focus:border-rose-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

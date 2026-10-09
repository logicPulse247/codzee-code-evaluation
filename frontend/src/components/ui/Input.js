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
          className="block text-xs font-bold font-mono text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
          error ? 'border-rose-500 focus:border-rose-600' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-mono text-rose-600 mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] font-mono text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}

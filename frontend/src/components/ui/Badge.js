'use client';

import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = ''
}) {
  const baseStyles = 'inline-flex items-center font-mono font-medium rounded-md tracking-wide';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    must: 'bg-blue-50 text-blue-700 border border-blue-200 font-bold',
    nice: 'bg-slate-100 text-slate-700 border border-slate-200',
    pinned: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
    edited: 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold',
    generated: 'bg-slate-100 text-slate-600 border border-slate-200',
    covered: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
    uncovered: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-xs px-3 py-1.5'
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}>
      {children}
    </span>
  );
}

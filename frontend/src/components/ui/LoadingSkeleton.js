'use client';

import React from 'react';

export function LoadingSkeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 ${className}`}
    />
  );
}

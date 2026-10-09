'use client';

import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-12 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 font-sans text-slate-900 dark:text-slate-100 shadow-xs">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold font-serif text-slate-900 dark:text-slate-100">{title}</h3>
        {description && (
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

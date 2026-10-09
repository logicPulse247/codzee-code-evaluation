'use client';

import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) {
  return (
    <div className="py-12 px-4 text-center bg-white border border-slate-200 rounded-xl space-y-4 font-sans text-slate-900 shadow-xs">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold font-serif text-slate-900">{title}</h3>
        {description && (
          <p className="text-xs font-mono text-slate-500 max-w-sm mx-auto leading-relaxed">
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

'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorAlert({ message, className = '' }) {
  if (!message) return null;

  return (
    <div className={`p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs font-mono text-rose-200 flex items-start gap-3 shadow-sm ${className}`}>
      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <span className="font-bold text-rose-300 block uppercase tracking-wider text-[10px]">
          Execution Error
        </span>
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

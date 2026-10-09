'use client';

import React from 'react';
import { FileCode2 } from 'lucide-react';

export function Textarea({
  label,
  badgeText,
  filename = 'spec_manifest.txt',
  value,
  onChange,
  onClear,
  placeholder,
  rows = 6,
  className = '',
  error,
  ...props
}) {
  const charCount = (value || '').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm font-sans space-y-0">
      {/* Code Window Header */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{label || 'Job description'}</span>
          {badgeText && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-mono uppercase">
              {badgeText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>{filename}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-slate-400 dark:text-slate-500">UTF-8</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 bg-white dark:bg-slate-900">
        <textarea
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-transparent text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none resize-y leading-relaxed ${className}`}
          {...props}
        />

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-500">
          <span>{charCount.toLocaleString()} / 10,000 characters</span>
          {onClear && value && (
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors uppercase tracking-wider font-semibold"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="p-2 text-xs font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-800">
          {error}
        </p>
      )}
    </div>
  );
}

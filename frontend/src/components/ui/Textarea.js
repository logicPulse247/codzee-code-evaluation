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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans space-y-0">
      {/* Code Window Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-mono text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800">{label || 'Job description'}</span>
          {badgeText && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono uppercase">
              {badgeText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>{filename}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400">UTF-8</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 bg-white">
        <textarea
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-transparent text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none resize-y leading-relaxed ${className}`}
          {...props}
        />

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>{charCount.toLocaleString()} / 10,000 characters</span>
          {onClear && value && (
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider font-semibold"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="p-2 text-xs font-mono text-rose-700 bg-rose-50 border-t border-rose-200">{error}</p>
      )}
    </div>
  );
}

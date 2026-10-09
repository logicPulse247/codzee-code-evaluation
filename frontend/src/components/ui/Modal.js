'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn font-sans">
      <div className={`w-full ${maxWidth} bg-white border border-slate-200 rounded-xl shadow-2xl p-6 text-slate-900 space-y-4`}>
        {(title || onClose) && (
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              {title && <h3 className="text-base font-bold font-serif text-slate-900">{title}</h3>}
              {subtitle && <p className="text-xs font-mono text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-1 border-b border-slate-200 font-mono text-xs ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-3.5 py-2.5 flex items-center gap-2 border-b-2 font-medium transition-colors cursor-pointer ${
              isActive
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

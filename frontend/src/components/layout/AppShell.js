'use client';

import React from 'react';
import { SidebarNav } from './SidebarNav';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#0F0F11] text-zinc-100 flex font-sans">
      {/* Sidebar Navigation */}
      <SidebarNav />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBreadcrumbs />
        <main className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}

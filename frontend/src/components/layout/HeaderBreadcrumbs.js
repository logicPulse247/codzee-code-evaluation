'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell } from 'lucide-react';

export function HeaderBreadcrumbs({ currentTitle = 'Create Interview Kit' }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="h-14 border-b border-[#232328] bg-[#0F0F11] px-6 flex items-center justify-between text-xs font-mono">
      {/* Left Breadcrumbs */}
      <div className="flex items-center gap-2 text-zinc-400">
        <Link href="/dashboard" className="hover:text-zinc-200">InterviewKit</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-zinc-200">Kits</Link>
        <span>/</span>
        <span className="text-zinc-100 font-semibold">{currentTitle}</span>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search kits or questions..."
            className="w-full bg-[#161619] border border-[#26262C] rounded-lg pl-8 pr-10 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#FF5500]"
          />
          <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500 bg-[#1F1F24] border border-[#2D2D35] rounded">
            ⌘K
          </kbd>
        </div>

        {/* Sync Status Indicator */}
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] bg-[#161619] px-2.5 py-1 rounded-full border border-[#26262C]">
          <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
          <span>Synced</span>
        </div>

        {/* Notification Bell */}
        <button className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1A1E] rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-zinc-700 text-zinc-100 font-bold flex items-center justify-center text-xs border border-zinc-600">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}

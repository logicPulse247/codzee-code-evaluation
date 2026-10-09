'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Code2,
  Layers,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles
} from 'lucide-react';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/', label: 'Interview Kits', icon: Briefcase },
    { href: '/dashboard', label: 'Practice', icon: Code2 },
    { href: '/dashboard', label: 'Flashcards', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-[#121214] border-r border-[#232328] flex flex-col justify-between h-screen sticky top-0 text-zinc-300 font-sans shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#FF5500] flex items-center justify-center text-white font-mono font-bold text-xs shadow-md shadow-orange-950/40">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-zinc-100 tracking-tight font-serif">
              InterviewKit
            </span>
          </Link>
          <span className="bg-[#FF5500] text-black text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider uppercase">
            PRO
          </span>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest block mb-2">
            PLATFORM
          </span>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#FF5500] text-white font-semibold shadow-md shadow-orange-950/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1A1E]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#232328] space-y-4">
        {/* Target Role Card */}
        <div className="p-3 rounded-lg bg-[#18181C] border border-[#26262C] text-xs space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
            TARGET ROLE
          </span>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 text-xs truncate">
              {user ? `${user.name || 'User'} · Candidate` : 'Stripe · Senior SWE'}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#FF5500] shrink-0" />
          </div>
        </div>

        {/* Links */}
        <div className="space-y-1 text-xs">
          <button className="w-full flex items-center gap-3 px-2 py-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1A1E] rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1A1A1E] rounded-lg transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>Help & Docs</span>
          </button>
        </div>

        {/* User Profile */}
        {user ? (
          <div className="pt-2 border-t border-[#232328] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user.name || 'User'}</p>
                <p className="text-[10px] font-mono text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-[#1A1A1E]"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-[#232328] flex items-center justify-between text-xs">
            <Link href="/login" className="text-zinc-400 hover:text-white">Sign In</Link>
            <Link href="/register" className="text-[#FF5500] font-semibold hover:underline">Get Started</Link>
          </div>
        )}
      </div>
    </aside>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';

type ActiveItem = 'assignments' | 'settings' | 'home' | 'groups' | 'toolkit' | 'library';

interface AppShellProps {
  activeItem: ActiveItem;
  title: string;
  children: React.ReactNode;
}

/**
 * Shared authenticated page shell: desktop sidebar + header, mobile header with a
 * slide-in sidebar drawer, and an auth guard that redirects to /login. Mirrors the
 * layout used by the existing Home/Settings pages so new pages stay consistent.
 */
export default function AppShell({ activeItem, title, children }: AppShellProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#ff7a59]/20 border-t-[#ff7a59] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex text-zinc-900 font-sans selection:bg-[#ff7a59] selection:text-white">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar activeItem={activeItem} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header title={title} showBackButton={true} backUrl="/" />
        </div>

        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between mx-4 mt-4 mb-2 px-4 py-3 bg-white border border-zinc-200/60 rounded-[24px] shadow-sm sticky top-4 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center hover:bg-zinc-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold text-zinc-800">{title}</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Home
          </button>
        </header>

        {/* Extra bottom padding on mobile so content clears the fixed bottom nav */}
        <main className="flex-1 p-4 sm:p-8 pb-28 md:pb-8 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav active={activeItem} />

      {/* Mobile sidebar drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl" onClick={() => setIsMobileSidebarOpen(false)}>
            <div className="h-full overflow-y-auto">
              <Sidebar activeItem={activeItem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

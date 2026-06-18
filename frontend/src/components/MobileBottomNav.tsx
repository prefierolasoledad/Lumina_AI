'use client';

import Link from 'next/link';
import React from 'react';

interface MobileBottomNavProps {
  active: 'home' | 'assignments' | 'library' | 'toolkit' | 'groups' | 'settings';
}

const ITEMS: { key: string; label: string; href: string; icon: React.ReactNode }[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    key: 'groups',
    label: 'Groups',
    href: '/groups',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'library',
    label: 'Library',
    href: '/library',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    key: 'toolkit',
    label: 'AI Toolkit',
    href: '/toolkit',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 3c0 3.5-2.5 6-6 6 3.5 0 6 2.5 6 6 0-3.5 2.5-6 6-6-3.5 0-6-2.5-6-6z" />
        <path d="M18 11c0 2-1.5 3.5-3.5 3.5 2 0 3.5 1.5 3.5 3.5 0-2 1.5-3.5 3.5-3.5-2 0-3.5-1.5-3.5-3.5z" />
      </svg>
    ),
  },
];

/**
 * Shared mobile bottom navigation (dark pill). Hidden on md+; the sidebar takes over there.
 * `active` highlights the current section.
 */
export default function MobileBottomNav({ active }: MobileBottomNavProps) {
  return (
    <nav className="flex md:hidden fixed bottom-4 left-4 right-4 z-40 bg-[#121212] border border-zinc-800/50 rounded-[28px] py-2.5 px-3 shadow-2xl items-center justify-around">
      {ITEMS.map(({ key, label, href, icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1 text-[10px] font-bold transition-colors ${
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={isActive ? 'text-white' : 'text-zinc-650'}>{icon}</div>
            <span className="tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

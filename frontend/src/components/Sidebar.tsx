'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import Logo from '@/components/Logo';

interface SidebarProps {
  activeItem: 'assignments' | 'settings' | 'home' | 'groups' | 'toolkit' | 'library';
}

export default function Sidebar({ activeItem }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [assignmentCount, setAssignmentCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.listAssignments();
        if (res.success && res.data) {
          setAssignmentCount(res.data.length);
          localStorage.setItem('veda_assignments', JSON.stringify(res.data));
        }
      } catch (err) {
        console.error('Failed to fetch assignments count:', err);
      }
    };

    if (user) {
      fetchCount();
    }

    if (typeof window !== 'undefined') {
      const updateCount = () => {
        const stored = localStorage.getItem('veda_assignments');
        if (stored) {
          setAssignmentCount(JSON.parse(stored).length);
        } else {
          setAssignmentCount(0);
        }
      };
      window.addEventListener('veda_assignments_changed', updateCount);
      return () => window.removeEventListener('veda_assignments_changed', updateCount);
    }
  }, [user]);

  if (!user) return null;

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col justify-between p-6 flex-shrink-0 h-screen sticky top-0">
      <div className="space-y-8">
        {/* Lumina AI brand logo */}
        <Logo size="md" href="/" />

        {/* AI Teacher's Toolkit Button — gradient brand pill */}
        <Link href="/toolkit" className="group w-full flex items-center justify-center gap-1.5 py-2.5 px-2.5 bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] text-white font-extrabold rounded-full shadow-lg shadow-[#f43f8e]/25 hover:shadow-[#f43f8e]/40 hover:scale-[1.02] transition-all duration-200 cursor-pointer text-xs whitespace-nowrap">
          <svg className="w-5 h-5 text-white flex-shrink-0 font-bold" viewBox="0 0 24 24" fill="currentColor">
            {/* Large Sparkle */}
            <path d="M10 2c0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8 0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8z" />
            {/* Small Sparkle */}
            <path d="M19 2c0 2.5-2 4.5-4.5 4.5 2.5 0 4.5 2 4.5 4.5 0-2.5 2-4.5 4.5-4.5-2.5 0-4.5-2-4.5-4.5z" />
          </svg>
          <span>AI Teacher's Toolkit</span>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-1">
          <Link
            href="/"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              activeItem === 'home'
                ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          >
            <svg className={`w-5 h-5 ${activeItem === 'home' ? 'text-[#ff7a59]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>

          <Link
            href="/groups"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left ${
              activeItem === 'groups'
                ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          >
            <svg className={`w-5 h-5 ${activeItem === 'groups' ? 'text-[#ff7a59]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>My Groups</span>
          </Link>

          <Link
            href="/assignments"
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              activeItem === 'assignments'
                ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <svg className={`w-5 h-5 ${activeItem === 'assignments' ? 'text-[#ff7a59]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Assignments</span>
            </div>
            {assignmentCount > 0 && (
              <span className="px-2 py-0.5 bg-[#ff7a59] text-white rounded-full text-[10px] font-bold min-w-5 text-center leading-normal">
                {assignmentCount}
              </span>
            )}
          </Link>

          <Link
            href="/toolkit"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left ${
              activeItem === 'toolkit'
                ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          >
            <svg className={`w-5 h-5 ${activeItem === 'toolkit' ? 'text-[#ff7a59]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AI Teacher's Toolkit</span>
          </Link>

          <Link
            href="/library"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left ${
              activeItem === 'library'
                ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          >
            <svg className={`w-5 h-5 ${activeItem === 'library' ? 'text-[#ff7a59]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <span>My Library</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Panel */}
      <div className="space-y-4 pt-6 border-t border-zinc-200">
        <Link
          href="/settings"
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
            activeItem === 'settings'
              ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
              : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
          }`}
        >
          <svg className={`w-5 h-5 ${activeItem === 'settings' ? 'text-[#ff7a59]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </Link>

        {/* School Profile Info Card (Matching Screenshot style with circular green crest) */}
        <div className="flex items-center gap-3.5 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
          <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-zinc-900 truncate">
              {user.schoolName || 'Delhi Public School'}
            </div>
            <div className="text-[10px] text-zinc-400 truncate font-semibold">
              {user.schoolCity || 'Bokaro Steel City'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

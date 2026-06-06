'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  onBackClick?: () => void;
}

export default function Header({ title = 'Assignment', showBackButton = true, backUrl, onBackClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Generate initials for avatar fallback
  const getInitials = () => {
    if (user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 relative z-30">
      <div className="flex items-center gap-3 text-zinc-400">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-zinc-55 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <span className="text-zinc-800 font-semibold">{title}</span>
        </div>
      </div>

      {/* Right Header Navigation Panel */}
      <div className="flex items-center gap-5">
        {/* Notification Bell */}
        <button className="p-2 hover:bg-zinc-55 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors relative cursor-pointer" aria-label="Notifications">
          <svg className="w-5.5 h-5.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-zinc-50 rounded-xl transition-all duration-150 cursor-pointer"
          >
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.fullName || user.username}
                className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs shadow-xs border border-indigo-100">
                {getInitials()}
              </div>
            )}
            <span className="text-sm font-semibold text-zinc-700 truncate max-w-28">
              {user.fullName || user.username}
            </span>
            <svg
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                showUserDropdown ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Toggled User Menu Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-zinc-100">
                <p className="text-[10px] uppercase font-bold text-zinc-450 tracking-wider">Signed in as</p>
                <p className="text-xs text-zinc-405 truncate">{user.email}</p>
                {user.fullName && (
                  <p className="text-xs font-semibold text-zinc-700 truncate mt-0.5">@{user.username}</p>
                )}
              </div>
              
              <Link
                href="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4 text-zinc-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  setShowUserDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

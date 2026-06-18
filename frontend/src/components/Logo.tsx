'use client';

import Link from 'next/link';
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  showWord?: boolean;
  /** Use light wordmark text on dark backgrounds */
  light?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 'w-8 h-8', rounded: 'rounded-lg', text: 'text-lg' },
  md: { box: 'w-9 h-9', rounded: 'rounded-xl', text: 'text-xl' },
  lg: { box: 'w-11 h-11', rounded: 'rounded-2xl', text: 'text-2xl' },
};

/**
 * Lumina AI brand logo: a gradient mark (orange → pink → violet) with a glowing
 * sparkle, plus an optional gradient wordmark. Reused across sidebar / auth pages.
 */
export default function Logo({ size = 'md', href = '/', showWord = true, light = false, className = '' }: LogoProps) {
  const s = SIZES[size];

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`relative ${s.box} ${s.rounded} flex items-center justify-center bg-gradient-to-br from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] shadow-lg shadow-[#f43f8e]/30`}
      >
        {/* glossy highlight */}
        <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/35 to-transparent" />
        {/* sparkle mark (evokes "illumination") */}
        <svg viewBox="0 0 24 24" className="relative w-1/2 h-1/2 text-white" fill="none" stroke="currentColor">
          <path
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.5-6.5l-2 2m-7 7l-2 2m11 0l-2-2m-7-7l-2-2"
          />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {showWord && (
        <span className={`font-extrabold ${s.text} tracking-tight`}>
          <span className="bg-gradient-to-r from-[#ff7a59] via-[#f43f8e] to-[#8b5cf6] bg-clip-text text-transparent">
            Lumina
          </span>
          <span className={light ? 'text-white' : 'text-zinc-900'}> AI</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

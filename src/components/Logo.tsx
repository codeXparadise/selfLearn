'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  variant?: 'badge' | 'full' | 'icon';
  showText?: boolean;
}

export function Logo({ 
  className = '', 
  size = 'md', 
  href = '/', 
  variant = 'badge',
  showText = true 
}: LogoProps) {
  const iconHeights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  if (variant === 'full') {
    const fullContent = (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src="/logo-full.png"
          alt="SelfLearn"
          className={`${iconHeights[size]} w-auto object-contain drop-shadow-xs transition-transform hover:scale-102`}
        />
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-90">
          {fullContent}
        </Link>
      );
    }
    return fullContent;
  }

  const content = (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Official Graduation Cap Logo Outline / Mark */}
      <img
        src="/logo-icon.png"
        alt="SelfLearn Logo"
        className={`${iconHeights[size]} w-auto object-contain drop-shadow-xs transition-transform hover:scale-105 shrink-0`}
      />
      {showText && variant !== 'icon' && (
        <span className={`${textSizes[size]} font-extrabold tracking-tight flex items-center`}>
          <span className="text-neutral-950 dark:text-white">Self</span>
          <span className="text-[#EA4335]">Learn</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

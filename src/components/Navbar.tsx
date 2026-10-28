'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Plus, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  Layers,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/providers/ThemeProvider';

interface NavbarProps {
  onOpenCreateModal?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup' | 'forgot_password') => void;
  onOpenAICurator?: () => void;
  isLanding?: boolean;
}

export function Navbar({ onOpenCreateModal, onOpenAuth, onOpenAICurator, isLanding = false }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If landing page, use distinct public landing mode
  const isLandingMode = isLanding || pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0b0c0e]/90 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo (No middle navigation links) */}
        <div className="flex items-center gap-6">
          <Logo size="md" href={isLandingMode ? "/" : "/dashboard"} />
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* New Course Button (Only on Dashboard, never on Landing page) */}
          {!isLandingMode && onOpenCreateModal && (
            <Button
              onClick={onOpenCreateModal}
              variant="default"
              size="sm"
              className="gap-1.5 hidden sm:inline-flex"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Course</span>
            </Button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Landing Page: Distinct Register & Sign In controls (No merged profile dropdown) */}
          {isLandingMode ? (
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => onOpenAuth ? onOpenAuth('signin') : window.location.assign('/login')}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Sign In
              </Button>
              <Button
                onClick={() => onOpenAuth ? onOpenAuth('signup') : window.location.assign('/signup')}
                variant="primary"
                size="sm"
                className="text-xs font-semibold"
              >
                Register
              </Button>
            </div>
          ) : user ? (
            /* Dashboard: Logged-in Profile Avatar Dropdown */
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors border border-neutral-200 dark:border-neutral-700"
              >
                <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-1.5 text-neutral-600 dark:text-neutral-300" />
                  )}
                </div>
              </button>

              {/* Profile Dropdown */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#121216] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-50 text-xs"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3.5 py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="font-bold text-neutral-900 dark:text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                  </div>
                  
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    <Layers className="w-4 h-4 text-neutral-400" />
                    <span>My Courses</span>
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-400" />
                    <span>Profile & Settings</span>
                  </Link>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => onOpenAuth ? onOpenAuth('signin') : window.location.assign('/login')}
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-xs"
              >
                Sign In
              </Button>
              <Button
                onClick={() => onOpenAuth ? onOpenAuth('signup') : window.location.assign('/signup')}
                variant="default"
                size="sm"
                className="text-xs"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* AI Course Curator Trigger Button (Only on Dashboard, never on Landing page) */}
          {!isLandingMode && onOpenAICurator && (
            <button
              onClick={onOpenAICurator}
              className="p-2 rounded-full bg-gradient-to-tr from-red-500/10 to-amber-500/10 hover:from-red-500/25 hover:to-amber-500/25 border border-red-200 dark:border-red-900/60 text-[#EA4335] transition-all shadow-xs flex items-center justify-center shrink-0 hover:scale-105"
              title="AI Course Curator: Ask AI to find & auto-import courses"
            >
              <Sparkles className="w-4 h-4 text-[#EA4335]" />
            </button>
          )}

          {/* Mobile Actions Drawer Trigger (Only shown on small screens if needed) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0d0e12]/95 backdrop-blur-xl px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          {!isLandingMode && onOpenCreateModal && (
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              variant="primary"
              size="sm"
              className="w-full gap-1.5 justify-center font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Course</span>
            </Button>
          )}

          {(isLandingMode || !user) && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth ? onOpenAuth('signin') : window.location.assign('/login');
                }}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth ? onOpenAuth('signup') : window.location.assign('/signup');
                }}
                variant="primary"
                size="sm"
                className="flex-1 font-semibold"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

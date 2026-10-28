import React, { useState } from 'react';
import { 
  Plus, 
  Sun, 
  Moon, 
  Search, 
  Layers, 
  User, 
  LogOut, 
  Home 
} from 'lucide-react';
import { Logo } from './Logo';
import { OllamaLogo } from './OllamaLogo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onGoHome: () => void;
  onGoToLanding: () => void;
  onGoToProfile: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  totalCourses?: number;
  completedCoursesCount?: number;
  inClassroom?: boolean;
  currentView: 'landing' | 'dashboard' | 'classroom' | 'profile';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  onGoHome,
  onGoToLanding,
  onGoToProfile,
  onOpenAuth,
  searchTerm,
  onSearchChange,
  isDarkMode,
  onToggleDarkMode,
  totalCourses = 0,
  currentView
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0b0c0e]/90 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Navigation Link */}
        <div className="flex items-center gap-5">
          <Logo size="md" onClick={user ? onGoHome : onGoToLanding} />

          {/* Quick Hub Navigation Pills (Google style) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={onGoToLanding}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                currentView === 'landing'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>About</span>
            </button>

            <button
              onClick={onGoHome}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>Course Hub</span>
              {totalCourses > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {totalCourses}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Center: Search (visible on Dashboard) */}
        {currentView === 'dashboard' && (
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-all"
              />
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={isDarkMode ? 'Light' : 'Dark'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* If Logged In: + New Course & User Avatar Dropdown */}
          {user ? (
            <>
              {/* + Create Course Button */}
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white text-xs font-semibold rounded-full shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">New Course</span>
              </button>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-950">
                    <img
                      src={
                        user.photoURL ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.displayName || user.email || 'Learner')}`
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 py-1.5 z-50 text-xs animate-fade-in"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {user.displayName || 'Learner'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={onGoToProfile}
                        className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Profile & Stats</span>
                      </button>

                      <button
                        onClick={onGoHome}
                        className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>My Course Hub</span>
                      </button>

                      <button
                        onClick={onGoToProfile}
                        className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
                      >
                        <OllamaLogo className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>Ollama AI Config</span>
                      </button>
                    </div>

                    <div className="p-1 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        onClick={logout}
                        className="w-full px-3 py-2 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* If Guest / Unauthenticated: Sign In & Get Started */
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-3 py-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white text-xs font-medium transition-colors"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white text-xs font-semibold rounded-full shadow-xs active:scale-95 transition-all"
              >
                Get Started
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};

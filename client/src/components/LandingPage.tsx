import React, { useState } from 'react';
import { 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Shield, 
  Clock 
} from 'lucide-react';
import { Logo } from './Logo';
import { OllamaLogo } from './OllamaLogo';

interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onExploreDemo: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onExploreDemo
}) => {
  const [activeTab, setActiveTab] = useState<'focus' | 'progress' | 'ai'>('focus');

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 flex flex-col selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors">
      
      {/* Hero Section — Google Labs Inspired with interactive floating elements & text shimmer */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center flex flex-col items-center">
        
        {/* Floating chip 1: Zero Ads (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-md text-xs font-medium animate-float absolute left-0 top-36 select-none pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zero Ads & Distractions</span>
        </div>

        {/* Floating chip 2: Gemma 4 AI (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-md text-xs font-medium animate-float-reverse absolute right-0 top-44 select-none pointer-events-none">
          <OllamaLogo className="w-4 h-4" />
          <span>Gemma 4 Timestamp AI</span>
        </div>

        {/* Subtle Google-style chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-8 transition-colors">
          <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
          <span>Self Learn • YouTube Course Hub</span>
        </div>

        {/* Hero Title with Shimmering Highlight */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl text-neutral-950 dark:text-white">
          Learn from YouTube.<br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-gradient-to-r from-red-600 via-[#EA4335] to-amber-500 bg-clip-text text-transparent animate-text-shimmer">
              Without the noise.
            </span>
            <span className="absolute -inset-1 bg-red-500/10 dark:bg-red-500/20 blur-lg rounded-2xl pointer-events-none" />
          </span>
        </h1>

        {/* Short, crisp subtitle */}
        <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl font-normal leading-relaxed">
          Convert any playlist into a focused classroom. Isolated playback, second-level progress tracking, and on-demand Ollama AI.
        </p>

        {/* Action CTAs (Short button text) */}
        <div className="mt-8 flex flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onOpenAuth('signup')}
            className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white font-medium text-sm rounded-full transition-all active:scale-95 shadow-sm flex items-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreDemo}
            className="px-6 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-sm rounded-full border border-neutral-200 dark:border-neutral-800 transition-all active:scale-95 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#EA4335]" />
            <span>Explore</span>
          </button>
        </div>

        {/* Interactive Feature Preview (Clean Google Labs Card) */}
        <div className="mt-16 w-full max-w-4xl bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-2 sm:p-3 shadow-xl shadow-neutral-200/40 dark:shadow-none">
          
          {/* Interactive Navigation Pills */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl max-w-md mx-auto mb-3">
            <button
              onClick={() => setActiveTab('focus')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'focus'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Focus Mode
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'progress'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Dual Progress
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <OllamaLogo className="w-3 h-3 text-[#EA4335]" />
              <span>AI Widget</span>
            </button>
          </div>

          {/* Interactive Card Canvas */}
          <div className="bg-neutral-950 rounded-2xl p-6 sm:p-10 text-left text-white relative overflow-hidden min-h-[260px] flex flex-col justify-between">
            {activeTab === 'focus' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Distraction-Free Video Frame</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight max-w-lg">
                  Isolated video player. No comments, recommended feeds, or sidebar rabbit holes.
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
                  Only the videos in your imported playlist can play. Focus completely on the lecture from start to finish.
                </p>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Real-Time Tracking</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight max-w-lg">
                  Dual progress bars track both the current lesson and the whole course.
                </h3>
                <div className="space-y-2 max-w-md pt-2">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Lesson 4 of 12</span>
                    <span className="text-white font-mono">75%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-[#EA4335] rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <OllamaLogo className="w-4 h-4 text-[#EA4335]" />
                  <span>Gemma 4 • Beam • Nemotron</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight max-w-lg">
                  Click the floating AI widget anytime to ask questions at the exact video timestamp.
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
                  Overlay drawer slides in without interrupting playback. Switch models freely and jump to cited seconds with 1 click.
                </p>
              </div>
            )}

            {/* Bottom mini indicator */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-4 border-t border-neutral-900 mt-6">
              <span>Google Labs Clean Aesthetic</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & Open
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* 3 Minimal Bento Cards — Clean Google Style with hover animations */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="group p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 space-y-3 cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5 text-[#EA4335]" />
            </div>
            <h3 className="text-base font-bold text-neutral-950 dark:text-white group-hover:text-[#EA4335] transition-colors">
              Playlist to Course
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Paste any YouTube playlist link to automatically extract videos, durations, and structured chapters.
            </p>
          </div>

          <div className="group p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 space-y-3 cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-neutral-950 dark:text-white group-hover:text-emerald-500 transition-colors">
              Zero Distractions
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Isolated viewing container. Learn without algorithmic recommendations, shorts, or comment distractions.
            </p>
          </div>

          <div className="group p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 space-y-3 cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-110 transition-transform">
              <OllamaLogo className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950 dark:text-white group-hover:text-[#EA4335] transition-colors">
              Ollama AI Widget
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Powered by Gemma 4:31B, Beam, and Nemotron. Ask natural language questions at any second in the video.
            </p>
          </div>

        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0b0c0e] py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span>— Distraction-Free YouTube Classroom</span>
          </div>
          <div className="text-[11px]">
            Clean Google Design • Free Forever
          </div>
        </div>
      </footer>

    </div>
  );
};

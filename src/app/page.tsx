'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Shield, 
  Clock, 
  Sparkles, 
  Zap, 
  Check, 
  BookOpen,
  Cpu,
  Calculator,
  Lock,
  Compass
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OllamaLogo } from '@/components/OllamaLogo';
import { AuthModal } from '@/components/AuthModal';
import { OllamaOnboardingModal } from '@/components/OllamaOnboardingModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, needsOllamaOnboarding, setNeedsOllamaOnboarding } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  const [activeTab, setActiveTab] = useState<'focus' | 'progress' | 'ai'>('focus');
  
  // Interactive Focus & Time Saved Calculator
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const hoursSavedPerYear = Math.round(hoursPerWeek * 52 * 0.35);

  const handleOpenAuth = (mode: 'signin' | 'signup' | 'forgot_password' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const coreFeatures = [
    {
      title: "Algorithmic Isolation Frame",
      badge: "Focus Engine",
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
      description: "Traditional YouTube uses sidebars and comments engineered to trap attention. Self Learn creates an isolated sandbox where only videos from your chosen curriculum can execute.",
      bullets: ["Zero recommended video sidebars", "Zero comment section rabbit holes", "Locked playlist queue"]
    },
    {
      title: "Dual-Tier Progress Architecture",
      badge: "Real-Time Tracking",
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      description: "Never lose your place. Self Learn tracks your exact second in the current lesson while calculating your total macro percentage across the entire curriculum.",
      bullets: ["Second-by-second playback resume", "Macro course completion statistics", "Individual video checkmarks"]
    },
    {
      title: "Floating Ollama AI Tutor",
      badge: "Contextual AI",
      icon: <OllamaLogo className="w-5 h-5" />,
      description: "Chat with state-of-the-art open models like Gemma 4:31B, Beam, or Nemotron. Queries pass the active video title, instructor, and current timestamp automatically.",
      bullets: ["Timestamped answers with 1-click jump links", "7 supported open-source models", "Translucent floating overlay"]
    },
    {
      title: "Zero-API YouTube Ingestion",
      badge: "Instant Import",
      icon: <Layers className="w-5 h-5 text-[#EA4335]" />,
      description: "Paste any public or unlisted YouTube playlist link. Our engine extracts video durations, titles, chapter metadata, and instructors directly without API keys.",
      bullets: ["Paste any public or unlisted playlist", "Instant chapter & duration parsing", "Zero API keys required"]
    },
    {
      title: "Timestamped Notes Engine",
      badge: "Active Recall",
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
      description: "Take quick notes while watching. Each note automatically attaches to the current second of the video, creating a clickable index of your personal study highlights.",
      bullets: ["One-click timestamp bookmarking", "Click note to seek video", "Cloud synced with your account"]
    },
    {
      title: "Google Labs Minimalist Aesthetic",
      badge: "Design Philosophy",
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
      description: "Clean pill tabs, subtle translucent glass effects, and intuitive interactions replace clutter. Fast 60fps responsiveness across mobile and desktop.",
      bullets: ["Light & Dark theme synchronization", "Clean circle button geometry", "Mobile 2-grid classroom layout"]
    }
  ];

  const comparisonFeatures = [
    { name: "Zero Ads & Video Interruptions", selfLearn: true, youtube: false, coursera: true },
    { name: "No Recommended Feed or Rabbit Holes", selfLearn: true, youtube: false, coursera: true },
    { name: "Curate Any YouTube Playlist on Earth", selfLearn: true, youtube: false, coursera: false },
    { name: "Dual Progress Tracking (Lesson & Course)", selfLearn: true, youtube: false, coursera: true },
    { name: "Ollama Timestamp AI Assistance", selfLearn: true, youtube: false, coursera: false },
    { name: "100% Free Forever ($0 Subscriptions)", selfLearn: true, youtube: false, coursera: false },
    { name: "Second-Level Playback Resumption", selfLearn: true, youtube: false, coursera: true },
    { name: "Zero API Key Requirement for Ingestion", selfLearn: true, youtube: false, coursera: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar
        isLanding={true}
        onOpenAuth={handleOpenAuth}
      />

      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center flex flex-col items-center">
        
        {/* Hero Title with Gradient Accent */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl text-neutral-950 dark:text-white">
          Learn from YouTube.<br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-gradient-to-r from-red-600 via-[#EA4335] to-amber-500 bg-clip-text text-transparent">
              Without the noise.
            </span>
            <span className="absolute -inset-1 bg-red-500/10 dark:bg-red-500/20 blur-lg rounded-2xl pointer-events-none" />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl font-normal leading-relaxed">
          Convert any playlist into a focused classroom. Isolated playback, second-level progress tracking, and on-demand Ollama AI.
        </p>

        {/* Hero Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-[#EA4335] hover:bg-[#d9382b] text-white font-semibold text-sm rounded-full transition-all active:scale-95 shadow-md shadow-red-500/25 flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => handleOpenAuth('signup')}
                className="px-6 py-3 bg-[#EA4335] hover:bg-[#d9382b] text-white font-semibold text-sm rounded-full transition-all active:scale-95 shadow-md shadow-red-500/25 flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenAuth('signin')}
                className="px-6 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-sm rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-orange-500 hover:text-[#EA4335] transition-all active:scale-95 flex items-center gap-2 shadow-xs"
              >
                <span>Sign In</span>
              </button>
            </>
          )}

          {/* Official GitHub Button (Clean, no false star counts) */}
          <a
            href="https://github.com/codeXparadise/selfLearn"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-full bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-800 dark:text-neutral-200 font-semibold text-sm border border-neutral-200 dark:border-neutral-800 hover:border-orange-500 hover:text-[#EA4335] transition-all flex items-center gap-2 shadow-xs active:scale-95 group"
            title="Self Learn on GitHub"
          >
            <svg className="w-4 h-4 fill-current group-hover:fill-[#EA4335] transition-colors" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        {/* Interactive Feature Canvas Switcher */}
        <div className="mt-14 w-full max-w-4xl bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-2 sm:p-3 shadow-xl shadow-neutral-200/40 dark:shadow-none">
          
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

          <div className="bg-neutral-950 rounded-2xl p-6 sm:p-10 text-left text-white relative overflow-hidden min-h-[240px] flex flex-col justify-between">
            {activeTab === 'focus' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Distraction-Free Video Container</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight max-w-lg">
                  Isolated video player. No comments, recommended feeds, or sidebar rabbit holes.
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
                  Only the lessons from your imported playlist can play. Focus on mastering the skill from start to finish.
                </p>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Second-Level Precision Tracking</span>
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
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <OllamaLogo className="w-4 h-4 text-[#EA4335]" />
                  <span>Gemma 4 • Beam • Nemotron</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight max-w-lg">
                  Floating translucent AI widget to ask questions at the exact video timestamp.
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
                  Overlay drawer slides in smoothly without interrupting playback. Jump directly to cited timestamps with 1 click.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-4 border-t border-neutral-900 mt-4">
              <span>Google Labs Minimalist Design</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Free & Open Source
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 2. CORE FEATURES BENTO SECTION                           */}
      {/* ======================================================== */}
      <section id="features" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center space-y-2 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-[#EA4335] text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Built For Deep Work</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
            Engineered For Frictionless Learning
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Everything you need to master complex technical subjects from YouTube without losing hours to algorithmic rabbit holes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreFeatures.map((f, i) => (
            <div
              key={f.title}
              className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/40 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {f.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                {f.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <Check className="w-3 h-3 text-[#EA4335] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. PLATFORM COMPARISON MATRIX SECTION                    */}
      {/* ======================================================== */}
      <section id="comparison" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-[#EA4335] text-xs font-semibold">
            <span>Direct Comparison</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
            How Self Learn Compares
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Standard YouTube is optimized for ad-clicks; paid platforms charge subscriptions. Self Learn gives you pure, structured mastery for free.
          </p>
        </div>

        {/* Interactive Focus & Time Saved Calculator */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-red-50 dark:bg-red-950/30 text-[#EA4335]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                  Attention ROI Calculator
                </h3>
                <p className="text-xs text-neutral-500">
                  Estimated hours saved by stripping ads, sidebar feeds, and video distractions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-500">Weekly Study:</span>
              <span className="text-sm font-mono font-bold text-[#EA4335] bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/50">
                {hoursPerWeek} hrs/week
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="2"
              max="40"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
              className="w-full accent-[#EA4335] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>2 hrs</span>
              <span>10 hrs</span>
              <span>20 hrs</span>
              <span>40 hrs/wk</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <div className="text-2xl font-extrabold text-[#EA4335] font-mono">
                ~{hoursSavedPerYear} hrs
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Saved from Ads & Feeds per Year</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <div className="text-2xl font-extrabold text-emerald-500 font-mono">
                2.4x
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Faster Syllabus Completion</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <div className="text-2xl font-extrabold text-blue-500 font-mono">
                $0 / yr
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Zero Subscription Fees</p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="w-full bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl shadow-neutral-200/30 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <th className="p-4 sm:p-5 font-bold text-neutral-900 dark:text-white">Feature</th>
                  <th className="p-4 sm:p-5 font-bold text-[#EA4335] bg-red-500/5">Self Learn</th>
                  <th className="p-4 sm:p-5 font-semibold text-neutral-500">Standard YouTube</th>
                  <th className="p-4 sm:p-5 font-semibold text-neutral-500">Coursera / Bootcamps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {comparisonFeatures.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40 transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-neutral-800 dark:text-neutral-200">
                      {item.name}
                    </td>
                    <td className="p-4 sm:p-5 bg-red-500/5">
                      <div className="flex items-center gap-1.5 font-bold text-[#EA4335]">
                        <CheckCircle2 className="w-4 h-4 text-[#EA4335]" />
                        <span>Included</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 text-neutral-500">
                      {item.youtube ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <XCircle className="w-4 h-4 text-neutral-400" />
                          <span>No</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-neutral-500">
                      {item.coursera ? (
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <XCircle className="w-4 h-4 text-neutral-400" />
                          <span>Paid Only</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FINAL CALL TO ACTION (CTA) REDIRECT                   */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center w-full">
        <div className="p-8 sm:p-14 rounded-3xl bg-neutral-950 text-white relative overflow-hidden shadow-2xl border border-neutral-800">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-[#EA4335] text-xs font-semibold border border-red-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transform Your Workflow</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready for distraction-free mastery?
            </h2>
            
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
              Import any YouTube playlist into your personal course classroom with dual progress tracking and on-demand Ollama AI. Zero subscriptions, zero noise.
            </p>
            
            <div className="pt-4 flex items-center justify-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 bg-[#EA4335] hover:bg-[#d9382b] text-white font-bold text-sm rounded-full transition-all active:scale-95 shadow-xl shadow-red-500/30 flex items-center gap-2 group"
                >
                  <span>Launch Dashboard Panel</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-8 py-3.5 bg-[#EA4335] hover:bg-[#d9382b] text-white font-bold text-sm rounded-full transition-all active:scale-95 shadow-xl shadow-red-500/30 flex items-center gap-2 group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      <Footer />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <OllamaOnboardingModal
        isOpen={needsOllamaOnboarding}
        onClose={() => setNeedsOllamaOnboarding(false)}
      />

    </div>
  );
}

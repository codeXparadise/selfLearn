'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Clock, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Key, 
  RotateCcw,
  BookOpen,
  Cpu,
  ArrowLeft
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OllamaLogo } from '@/components/OllamaLogo';
import { AuthModal } from '@/components/AuthModal';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { AICourseCuratorWidget } from '@/components/AICourseCuratorWidget';

export default function FeaturesPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [aiCuratorOpen, setAiCuratorOpen] = useState(false);

  const features = [
    {
      title: "Algorithmic Isolation Frame",
      badge: "Focus Engine",
      icon: <Shield className="w-6 h-6 text-emerald-500" />,
      description: "Traditional YouTube uses recommendation sidebars and comments engineered to trap attention. Self Learn creates an isolated sandbox where only videos from your chosen curriculum can execute.",
      benefits: [
        "Zero recommended video sidebars",
        "Zero comment section rabbit holes",
        "Locked playlist queue with autoplay toggles",
        "Complete cognitive focus on lecture content"
      ]
    },
    {
      title: "Dual-Tier Progress Architecture",
      badge: "Real-Time Tracking",
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      description: "Never lose your place. Self Learn tracks your exact second in the current lesson while calculating your total macro percentage across the entire curriculum.",
      benefits: [
        "Second-by-second playback resume",
        "Macro course completion statistics",
        "Individual video completion checkmarks",
        "Visual progress bars across all devices"
      ]
    },
    {
      title: "Floating Ollama AI Tutor",
      badge: "Contextual AI",
      icon: <OllamaLogo className="w-6 h-6" />,
      description: "Chat with state-of-the-art open models like Gemma 4:31B, Beam, Nemotron, or GPT-OSS directly beside the player. Queries pass the active video title, instructor, and current timestamp automatically.",
      benefits: [
        "Timestamped answers with 1-click jump links",
        "7 supported high-performance free models",
        "Real-time usage meter and token tracker",
        "Floating overlay card without interrupting playback"
      ]
    },
    {
      title: "Zero-API YouTube Ingestion",
      badge: "Web Scraper",
      icon: <Layers className="w-6 h-6 text-[#EA4335]" />,
      description: "Import any public or unlisted YouTube playlist instantly. Our backend extracts video durations, titles, chapter metadata, and instructors directly from HTML markup without Google Cloud API credentials.",
      benefits: [
        "Paste any public/unlisted playlist URL",
        "Instant metadata and duration extraction",
        "Automatic chapter & lesson sequencing",
        "Zero configuration or developer credentials required"
      ]
    },
    {
      title: "Timestamped Notes Engine",
      badge: "Active Recall",
      icon: <BookOpen className="w-6 h-6 text-purple-500" />,
      description: "Take quick notes while watching. Each note automatically attaches to the current second of the video, creating a clickable index of your personal study highlights.",
      benefits: [
        "One-click timestamp bookmarking",
        "Click any note to jump directly to that second",
        "Persisted with your profile across sessions",
        "Exportable study summary"
      ]
    },
    {
      title: "Google Labs Minimalist Aesthetic",
      badge: "Design Philosophy",
      icon: <Cpu className="w-6 h-6 text-amber-500" />,
      description: "Inspired by labs.google, our UI adheres to a strict 70% design, 20% animation, 10% text principle. Clean pill tabs, subtle gradients, and intuitive interactions replace clutter.",
      benefits: [
        "Fluid 60fps Lenis smooth momentum scrolling",
        "Dark and Light theme synchronization",
        "Accessible keyboard navigation",
        "Zero visual bloat or dual-tone saturation"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar
        onOpenCreateModal={() => setCreateCourseOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAICurator={() => setAiCuratorOpen(true)}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111216] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-[#EA4335] hover:text-[#EA4335] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all active:scale-95 shadow-2xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Hub</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-xs font-semibold border border-neutral-200 dark:border-neutral-800">
            <Sparkles className="w-3.5 h-3.5 text-[#EA4335]" />
            <span>Platform Capabilities</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
            Designed for Deep Technical Mastery
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Every feature in Self Learn is purposefully engineered to remove friction between you and complex technical material.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-xl transition-all duration-300 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {f.icon}
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
                  {f.badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                  {f.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                {f.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Launch CTA */}
        <div className="mt-16 p-8 rounded-3xl bg-neutral-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">Experience the difference today</h3>
            <p className="text-xs text-neutral-400 mt-1">Start watching with zero setup. 100% free.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-[#EA4335] hover:bg-[#d9382b] text-white font-medium text-xs rounded-full transition-all active:scale-95 shadow-md shadow-red-500/20"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <CreateCourseModal
        isOpen={createCourseOpen}
        onClose={() => setCreateCourseOpen(false)}
      />

      <AICourseCuratorWidget
        isOpen={aiCuratorOpen}
        onClose={() => setAiCuratorOpen(false)}
      />
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  HelpCircle, 
  Calculator,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { AICourseCuratorWidget } from '@/components/AICourseCuratorWidget';

export default function ComparePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [aiCuratorOpen, setAiCuratorOpen] = useState(false);

  // Interactive ROI Calculator State
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  // Average YouTube viewer loses ~22 minutes per hour to ads, sidebar browsing, and related rabbit holes
  const hoursSavedPerYear = Math.round(hoursPerWeek * 52 * 0.35);
  const focusMultiplier = '2.4x';

  const comparisonRows = [
    {
      category: "Focus & Distraction",
      items: [
        { feature: "Sidebar recommendations & rabbit holes", selfLearn: "Completely Removed", youtube: "Heavy (Algorithmic)", coursera: "None" },
        { feature: "Video Ads & Mid-rolls", selfLearn: "100% Ad-Free", youtube: "Frequent (2-4 per video)", coursera: "Ad-free (Subscription)" },
        { feature: "Comment section drama & debates", selfLearn: "Eliminated", youtube: "Present on every video", coursera: "Moderated forum" },
        { feature: "YouTube Shorts distraction tab", selfLearn: "Blocked", youtube: "Prominently featured", coursera: "None" },
      ]
    },
    {
      category: "Learning Features & AI",
      items: [
        { feature: "Ollama Open AI Tutor", selfLearn: "Built-in (Gemma 4, Beam, Nemotron)", youtube: "None", coursera: "Generic AI (Paid tier only)" },
        { feature: "Timestamp-contextual Q&A", selfLearn: "Real-time second pass", youtube: "Manual typing in comments", coursera: "Forum search" },
        { feature: "Interactive timestamp notes", selfLearn: "Click-to-seek bookmarks", youtube: "Unordered comments", coursera: "Basic text notes" },
        { feature: "Dual Progress Bars (Lesson + Course)", selfLearn: "Included", youtube: "Single red bar (Per video)", coursera: "Percentage circle" },
      ]
    },
    {
      category: "Content & Economics",
      items: [
        { feature: "Curriculum Choice", selfLearn: "Any YouTube Playlist on Earth", youtube: "Unstructured search", coursera: "Limited to catalog" },
        { feature: "Cost to Student", selfLearn: "Free Forever ($0)", youtube: "Free with attention cost", coursera: "$39 - $99 / month" },
        { feature: "Account & Progress Persistence", selfLearn: "Included (Firebase Auth)", youtube: "Google History (Unorganized)", coursera: "Included" },
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
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-[#EA4335] text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Platform Benchmark</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
            How Self Learn Compares
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">
            A comprehensive, transparent breakdown of how Self Learn stacks up against default YouTube and paid online learning platforms.
          </p>
        </div>

        {/* Interactive Focus & Time Saved Calculator */}
        <div className="mb-14 p-8 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#EA4335]" />
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Interactive Focus & Time-Saved Calculator
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Weekly Study Hours on YouTube:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-[#EA4335]"
                />
                <span className="text-sm font-bold font-mono min-w-[50px]">{hoursPerWeek} hrs</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold">Est. Distraction Hours Saved / Year</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#EA4335] mt-1 font-mono">
                +{hoursSavedPerYear} Hours
              </p>
              <span className="text-[10px] text-neutral-500 mt-1 block">From eliminated ads, shorts, and sidebar detours</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold">Cognitive Focus Gain</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-1 font-mono">
                {focusMultiplier}
              </p>
              <span className="text-[10px] text-neutral-500 mt-1 block">Faster curriculum completion rate</span>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table Grouped by Category */}
        <div className="space-y-8">
          {comparisonRows.map((cat, idx) => (
            <div key={idx} className="bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  {cat.category}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-400">
                      <th className="p-4 sm:p-5 w-2/5">Capability</th>
                      <th className="p-4 sm:p-5 w-1/5 font-bold text-[#EA4335] bg-red-500/5">Self Learn</th>
                      <th className="p-4 sm:p-5 w-1/5">Standard YouTube</th>
                      <th className="p-4 sm:p-5 w-1/5">Coursera / Udemy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {cat.items.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40">
                        <td className="p-4 sm:p-5 font-medium text-neutral-900 dark:text-neutral-200">
                          {row.feature}
                        </td>
                        <td className="p-4 sm:p-5 bg-red-500/5 font-semibold text-[#EA4335]">
                          {row.selfLearn}
                        </td>
                        <td className="p-4 sm:p-5 text-neutral-500">
                          {row.youtube}
                        </td>
                        <td className="p-4 sm:p-5 text-neutral-600 dark:text-neutral-400">
                          {row.coursera}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center space-y-4">
          <h3 className="text-xl font-bold text-neutral-950 dark:text-white">
            Ready to upgrade how you learn?
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Import any YouTube playlist link in 5 seconds. No credit card, no sign-up wall to preview.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white font-medium text-xs rounded-full transition-all active:scale-95 shadow-sm"
            >
              Start Free on Dashboard
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


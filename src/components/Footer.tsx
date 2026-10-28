'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0b0c0e] py-10 text-xs text-neutral-500 dark:text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          
          <div className="space-y-3">
            <Logo size="md" href="/" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed max-w-xs">
              Distraction-free YouTube learning platform. Turn any playlist into an isolated classroom with dual progress tracking and Ollama AI.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Sections
            </h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Home</Link></li>
              <li><a href="#features" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Features</a></li>
              <li><a href="#comparison" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Platform Comparison</a></li>
              <li><Link href="/dashboard" className="hover:text-neutral-950 dark:hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              AI Models
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li>Gemma 4 (31B)</li>
              <li>Beam (Lightweight)</li>
              <li>Nemotron-3 Nano & Super</li>
              <li>GPT-OSS (120B / 20B)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Technology
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Built with Next.js, shadcn/ui, Framer Motion, GSAP, Lenis, and Firebase Auth. Completely free and open forever.
            </p>
          </div>

        </div>

        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            © {new Date().getFullYear()} Self Learn • No Ads • No Algorithms • Pure Learning
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#comparison" className="hover:underline">Compare</a>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <a
              href="https://github.com/codeXparadise/selfLearn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[#EA4335] dark:hover:text-[#EA4335] hover:ring-1 hover:ring-orange-500/40 transition-all font-semibold"
              title="Self Learn on GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


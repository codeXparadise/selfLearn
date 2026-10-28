'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(`If an account exists for ${email}, a password reset link has been dispatched to your inbox. Please check your spam folder if you do not see it within 2 minutes.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 py-16">
        <div className="w-full max-w-md mb-3 flex items-center justify-start">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121216] text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-[#EA4335] hover:text-[#EA4335] transition-all shadow-2xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#121216] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-xl space-y-5">
          
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-2 text-[#EA4335]">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Reset Your Password</h1>
            <p className="text-xs text-neutral-500">
              Enter the email associated with your account and we'll send you a password reset link.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Reset Link Sent</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="w-full py-2.5 px-4 rounded-full bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Password Reset Link'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OllamaLogo } from './OllamaLogo';
import { FREE_OLLAMA_MODELS } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot_password';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [ollamaApiKey, setOllamaApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemma4:31b');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setOllamaApiKey('');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
      resetForm();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'forgot_password') {
        await sendPasswordReset(email);
        setSuccessMsg(`If an account exists for ${email}, a password reset link has been sent to your inbox.`);
        setLoading(false);
        return;
      }

      if (mode === 'signin') {
        await loginWithEmail(email, password);
        onClose();
        resetForm();
        router.push('/dashboard');
      } else {
        await registerWithEmail({
          email,
          password,
          displayName: displayName.trim() || email.split('@')[0],
          ollamaApiKey,
          ollamaModel: selectedModel,
        });
        setSuccessMsg(`🎉 Account created! Redirecting to your dashboard...`);
        setTimeout(() => {
          onClose();
          resetForm();
          router.push('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Free Account'}
            {mode === 'forgot_password' && 'Reset Password'}
          </DialogTitle>
          {mode === 'forgot_password' && (
            <p className="text-xs text-neutral-500 text-center mt-1">
              Enter your email and we will send you a link to reset your password.
            </p>
          )}
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google One-Click Auth (Only on signin/signup) */}
        {mode !== 'forgot_password' && (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-800 dark:text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
              <span className="text-[10px] uppercase font-bold text-neutral-400">or</span>
              <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
            </div>
          </>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={mode === 'signup'}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
            />
          </div>

          {mode !== 'forgot_password' && (
            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
                />
              </div>

              {/* Forgot password button in signin mode */}
              {mode === 'signin' && (
                <div className="flex justify-end pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('forgot_password');
                    }}
                    className="text-[11px] text-[#EA4335] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <OllamaLogo className="w-3.5 h-3.5" />
                  <span>Ollama AI Setup (Optional)</span>
                </label>
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#EA4335] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-850/75 text-[11px] text-neutral-500 space-y-1">
                <p>💡 <strong>How to get:</strong> Sign up free at <strong className="text-neutral-700 dark:text-neutral-300">ollama.com</strong> → Settings → API Keys → Copy key.</p>
              </div>

              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="password"
                  placeholder="Paste your Ollama API key..."
                  value={ollamaApiKey}
                  onChange={(e) => setOllamaApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none font-mono text-neutral-900 dark:text-white"
                />
              </div>

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 outline-none"
              >
                {FREE_OLLAMA_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.size})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </form>

        {/* Switch Mode / Back Button */}
        <div className="text-center pt-2">
          {mode === 'forgot_password' ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setMode('signin');
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          ) : mode === 'signin' ? (
            <p className="text-xs text-neutral-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode('signup');
                }}
                className="font-semibold text-[#EA4335] hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode('signin');
                }}
                className="font-semibold text-[#EA4335] hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}

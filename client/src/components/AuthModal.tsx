import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Key, 
  CheckCircle2,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authSendPasswordReset, isFirebaseConfigured, saveFirebaseConfig, type FirebaseConfigObject } from '../firebase/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin' 
}) => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ollamaKey, setOllamaKey] = useState('');
  const [showOllamaInput, setShowOllamaInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Firebase configuration setup state
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);
  const [firebaseConfigText, setFirebaseConfigText] = useState('');
  const [savingFirebase, setSavingFirebase] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  // Extract config from JSON or JS object snippet
  const parseFirebaseConfig = (rawText: string): FirebaseConfigObject | null => {
    try {
      // 1. Try pure JSON
      const parsed = JSON.parse(rawText);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch {}

    // 2. Regex extract from JS snippet like `const firebaseConfig = { apiKey: "..." }`
    const apiKeyMatch = rawText.match(/apiKey:\s*["']([^"']+)["']/i);
    const authDomainMatch = rawText.match(/authDomain:\s*["']([^"']+)["']/i);
    const projectIdMatch = rawText.match(/projectId:\s*["']([^"']+)["']/i);
    const storageBucketMatch = rawText.match(/storageBucket:\s*["']([^"']+)["']/i);
    const messagingSenderIdMatch = rawText.match(/messagingSenderId:\s*["']([^"']+)["']/i);
    const appIdMatch = rawText.match(/appId:\s*["']([^"']+)["']/i);

    if (apiKeyMatch && projectIdMatch) {
      return {
        apiKey: apiKeyMatch[1],
        authDomain: authDomainMatch ? authDomainMatch[1] : undefined,
        projectId: projectIdMatch[1],
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : undefined,
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : undefined,
        appId: appIdMatch ? appIdMatch[1] : undefined
      };
    }

    return null;
  };

  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firebaseConfigText.trim()) {
      setError('Please paste your Firebase configuration object.');
      return;
    }

    const config = parseFirebaseConfig(firebaseConfigText);
    if (!config) {
      setError('Could not extract Firebase credentials. Ensure apiKey and projectId are present in the snippet.');
      return;
    }

    setSavingFirebase(true);
    try {
      await saveFirebaseConfig(config);
      setShowFirebaseSetup(false);
      // Automatically attempt Google Sign-In now that Firebase is active
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Firebase with provided credentials.');
    } finally {
      setSavingFirebase(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    if (!isFirebaseConfigured()) {
      setShowFirebaseSetup(true);
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.message === 'FIREBASE_CONFIG_REQUIRED') {
        setShowFirebaseSetup(true);
      } else {
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        await signupWithEmail(email, password, name, ollamaKey);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address above to receive a password reset link.');
      return;
    }
    setError(null);
    try {
      await authSendPasswordReset(email.trim());
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-slate-900 dark:text-white">self</span>
            <span className="font-extrabold text-xl text-[#FF0000]">learn</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5 relative z-10">
          
          {/* Sub-View: Firebase Setup Dialog for Google Sign-In */}
          {showFirebaseSetup ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Connect Firebase for Google OAuth
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                      To run live Google authentication, paste your Firebase web config snippet from Firebase Console (Project Settings &gt; General &gt; Your Apps).
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Firebase Config (JSON or JavaScript)
                  </label>
                  <textarea
                    rows={6}
                    value={firebaseConfigText}
                    onChange={(e) => setFirebaseConfigText(e.target.value)}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "app.firebaseapp.com",\n  "projectId": "my-project",\n  "appId": "1:..."\n}`}
                    className="w-full p-3 font-mono text-[11px] rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:border-red-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingFirebase}
                    className="flex-1 py-2.5 px-4 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingFirebase ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Save & Connect Firebase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowFirebaseSetup(false);
                      setError(null);
                    }}
                    className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="pt-2 text-center border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowFirebaseSetup(false);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-[#FF0000] hover:underline"
                >
                  Or continue with standard Email & Password account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`py-2 rounded-xl transition-all duration-200 ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`py-2 rounded-xl transition-all duration-200 ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reset Sent Notice */}
              {resetSent && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password reset instructions sent.</span>
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {/* Google official SVG logo */}
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

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                <span className="absolute px-3 bg-white dark:bg-[#121216] text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                  or with email
                </span>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:border-red-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:border-red-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (minimum 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:border-red-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Optional Ollama API Key Setup during Signup */}
                {mode === 'signup' && (
                  <div className="pt-1">
                    {!showOllamaInput ? (
                      <button
                        type="button"
                        onClick={() => setShowOllamaInput(true)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-[#FF0000] dark:text-zinc-400 dark:hover:text-[#FF0000] flex items-center gap-1 transition-colors"
                      >
                        <Key className="w-3 h-3" />
                        <span>+ Add Ollama API Key now (Optional)</span>
                      </button>
                    ) : (
                      <div className="relative animate-fade-in">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Ollama Cloud API Key (Optional)"
                          value={ollamaKey}
                          onChange={(e) => setOllamaKey(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:border-red-500 outline-none font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Forgot Password Link for Sign In */}
                {mode === 'signin' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom notice */}
              <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>100% Free Forever • Real Data & Watch Progress Persistence</span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

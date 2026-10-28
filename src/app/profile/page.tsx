'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  Lock, 
  Key, 
  Trash2, 
  LogOut, 
  Check, 
  Play, 
  Clock, 
  Layers, 
  Shield, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Sparkles,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OllamaLogo } from '@/components/OllamaLogo';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { AICourseCuratorWidget } from '@/components/AICourseCuratorWidget';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { deleteUserDataFromFirebase } from '@/lib/firebaseDb';
import { FREE_OLLAMA_MODELS } from '@/types';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aria',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zane',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Milo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateProfileData, logout, refreshUser, resendVerificationEmail } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || AVATAR_PRESETS[0]);
  const [ollamaApiKey, setOllamaApiKey] = useState(user?.ollamaApiKey || '');
  const [selectedModel, setSelectedModel] = useState(user?.ollamaModel || 'gemma4:31b');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [aiCuratorOpen, setAiCuratorOpen] = useState(false);

  const handleResendVerification = async () => {
    setSendingVerification(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setSendingVerification(false);
    }
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || AVATAR_PRESETS[0]);
      setOllamaApiKey(user.ollamaApiKey || '');
      setSelectedModel(user.ollamaModel || 'gemma4:31b');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100">
        <Navbar
        onOpenCreateModal={() => setCreateCourseOpen(true)}
        onOpenAICurator={() => setAiCuratorOpen(true)}
      />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold">Please sign in to view your profile</h2>
          <p className="text-xs text-neutral-500 max-w-xs">
            Manage your learning history, avatar, and Ollama settings.
          </p>
          <Link href="/dashboard" className="px-6 py-2 rounded-full bg-neutral-950 text-white text-xs font-medium">
            Go to Hub
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileSuccess(null);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        photoURL,
        ollamaApiKey: ollamaApiKey.trim(),
        ollamaModel: selectedModel,
      });
      setProfileSuccess('Profile saved successfully.');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setError(null);
    setPasswordSuccess(null);

    try {
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch (fbErr: any) {
          console.warn('Firebase Auth updatePassword warning:', fbErr.message);
        }
      }

      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setPasswordSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (user?.id) {
        await deleteUserDataFromFirebase(user.id);
      }
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (fbErr: any) {
          console.warn('Firebase Auth deleteUser warning:', fbErr.message);
        }
      }

      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await logout();
        router.push('/');
      }
    } catch (err) {
      console.error('Delete account error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar
        onOpenCreateModal={() => setCreateCourseOpen(true)}
        onOpenAICurator={() => setAiCuratorOpen(true)}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        
        {/* Back to Dashboard Button */}
        <div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/dashboard');
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111216] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-[#EA4335] hover:text-[#EA4335] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all active:scale-95 shadow-2xs group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Account & Settings</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-neutral-500">{user.email}</span>
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-200 transition-colors disabled:opacity-50"
                  title="Resend email verification link"
                >
                  <Mail className="w-3 h-3" />
                  <span>{verificationSent ? 'Link Sent!' : 'Unverified • Resend Link'}</span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:border-orange-500 hover:text-[#EA4335] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 active:scale-95 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {/* Section 1: Personal Details & Avatar */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#EA4335]" />
            <h2 className="text-sm font-bold">Profile Identity</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 shrink-0">
              <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1.5 flex-1">
              <span className="text-xs text-neutral-500 font-medium block">Choose Avatar Preset:</span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(p)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                      photoURL === p ? 'border-[#EA4335] scale-110 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full max-w-md px-3.5 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Section 2: Ollama Setup (Technical URLs hidden) */}
          <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <OllamaLogo className="w-4 h-4" />
              <h2 className="text-sm font-bold">Ollama AI Configuration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Default Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 outline-none"
                >
                  {FREE_OLLAMA_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.size})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Select your preferred free model. Default is Gemma 4:31B.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Ollama API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your Ollama key..."
                  value={ollamaApiKey}
                  onChange={(e) => setOllamaApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none font-mono text-neutral-900 dark:text-white"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Automatically authenticates your timestamp questions.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#EA4335] to-orange-500 hover:from-orange-600 hover:to-[#EA4335] text-white text-xs font-semibold transition-all shadow-xs shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/35 hover:scale-102 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Section 3: Change Password (If local account) */}
        {user.authProvider !== 'google' && (
          <form onSubmit={handleUpdatePassword} className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#EA4335]" />
              <h2 className="text-sm font-bold">Change Password</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:border-orange-500 hover:text-[#EA4335] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 shadow-2xs"
              >
                {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}

        {/* Section 4: Danger Zone (Delete Account) */}
        <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Delete Account</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Permanently delete your profile, preferences, and personal course statistics.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-950 dark:text-white">Delete your account?</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  This action is permanent and cannot be undone. All your activity records will be deleted immediately.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Permanently Delete
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />

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


import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  Eye, 
  EyeOff, 
  Camera, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OllamaLogo } from './OllamaLogo';
import { FREE_OLLAMA_MODELS } from '../types';

interface ProfilePageProps {
  onBackToDashboard: () => void;
  onOpenCourse: (courseId: string, videoId?: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Learner'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToDashboard,
  onOpenCourse
}) => {
  const { 
    user, 
    profile, 
    logout, 
    deleteAccount, 
    updateProfileDetails, 
    updatePasswordAction, 
    saveOllamaConfig,
    usageCount,
    maxDailyQueries
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'account' | 'ai' | 'history'>('account');

  // Display Name & Avatar
  const [displayName, setDisplayName] = useState(user?.displayName || profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || profile?.photoURL || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Ollama Config (Only API Key & Model — Base URL is strictly hidden!)
  const [ollamaKey, setOllamaKey] = useState(profile?.ollamaApiKey || localStorage.getItem('self_learn_ai_key') || '');
  const [ollamaModel, setOllamaModel] = useState(profile?.ollamaModel || localStorage.getItem('self_learn_ai_model') || 'gemma4:31b');
  const [showOllamaKey, setShowOllamaKey] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  // Password Update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Delete Account Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save Name & Avatar
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfileDetails(displayName.trim(), photoURL || undefined);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Save Ollama Settings
  const handleSaveOllama = async (e: React.FormEvent) => {
    e.preventDefault();
    saveOllamaConfig(ollamaKey.trim(), ollamaModel, 'https://ollama.com');
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassMessage({ success: false, text: 'Minimum 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ success: false, text: 'Passwords do not match.' });
      return;
    }

    setIsUpdatingPass(true);
    setPassMessage(null);
    try {
      await updatePasswordAction(newPassword);
      setPassMessage({ success: true, text: 'Password updated.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMessage({ success: false, text: err.message || 'Update failed.' });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      onBackToDashboard();
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activityHistory = profile?.activityHistory || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Google Labs Minimal Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        
        {/* Avatar with Change Picture action */}
        <div className="relative group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
            <img
              src={
                photoURL ||
                user?.photoURL ||
                `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user?.displayName || user?.email || 'Learner')}`
              }
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="absolute bottom-0 right-0 p-1.5 bg-neutral-900 text-white rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform"
            title="Change photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <span>Google Account</span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold">Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
            {displayName || user?.displayName || 'Learner'}
          </h1>
          <p className="text-xs sm:text-sm font-mono text-neutral-400">
            {user?.email || 'No email attached'}
          </p>
        </div>

        {/* Quick Numbers */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center min-w-[90px]">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold block">History</span>
            <span className="text-base font-bold text-neutral-900 dark:text-white font-mono">{activityHistory.length}</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center min-w-[90px]">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold block">AI Usage</span>
            <span className="text-base font-bold text-[#EA4335] font-mono">{usageCount}/{maxDailyQueries}</span>
          </div>
        </div>

      </div>

      {/* Avatar Preset Picker Dropdown */}
      {showAvatarPicker && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 space-y-3 animate-fade-in shadow-xs">
          <span className="text-xs font-semibold text-neutral-500">Choose Profile Picture</span>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPhotoURL(preset);
                  setShowAvatarPicker(false);
                }}
                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                  photoURL === preset ? 'border-[#EA4335]' : 'border-transparent'
                }`}
              >
                <img src={preset} alt="preset" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Segment Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium max-w-md">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 py-1.5 rounded-full transition-all ${
            activeTab === 'account'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Account & Security
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <OllamaLogo className="w-3.5 h-3.5 text-[#EA4335]" />
          <span>Ollama AI</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 rounded-full transition-all ${
            activeTab === 'history'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          History
        </button>
      </div>

      {/* TAB 1: Account & Security */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          
          {/* Edit Name */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Personal Information
            </h3>
            <form onSubmit={handleSaveProfile} className="flex gap-2">
              <input
                type="text"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-4 py-2 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50"
              >
                {nameSaved ? 'Saved' : 'Save'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Password
            </h3>

            {passMessage && (
              <div className={`p-2.5 rounded-2xl text-xs flex items-center gap-2 ${
                passMessage.success ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-red-50 dark:bg-red-950/40 text-red-600'
              }`}>
                <span>{passMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-4 py-2 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
                />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-4 py-2 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  {showNewPass ? 'Hide' : 'Show'}
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingPass || !newPassword}
                  className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Clean and compact */}
          <div className="p-6 rounded-3xl bg-red-50/40 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                Delete Account
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Permanently remove your account and course progress.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full shadow-xs active:scale-95 transition-all"
            >
              Delete
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: Ollama AI Configuration (Base URL strictly hidden, 7 models supported) */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shrink-0">
              <OllamaLogo className="w-6 h-6 text-[#EA4335]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                Ollama Cloud AI Tutor
              </h3>
              <p className="text-xs text-neutral-500">
                Configure your API key and default free intelligence model.
              </p>
            </div>
          </div>

          {aiSaved && (
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ollama settings saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSaveOllama} className="space-y-4">
            {/* Model Selection (The 7 supported models) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Select Model (gemma4:31b default)
              </label>
              <select
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white font-mono"
              >
                {FREE_OLLAMA_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.tagline}
                  </option>
                ))}
              </select>
            </div>

            {/* Ollama API Key */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Ollama API Key
              </label>
              <div className="relative">
                <input
                  type={showOllamaKey ? 'text' : 'password'}
                  placeholder="Paste your Ollama Cloud API Key..."
                  value={ollamaKey}
                  onChange={(e) => setOllamaKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none font-mono text-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowOllamaKey(!showOllamaKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showOllamaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white rounded-full text-xs font-semibold transition-all active:scale-95 shadow-xs"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
            Recent Watch History ({activityHistory.length})
          </h3>

          {activityHistory.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-4 text-center">
              No recent video history recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activityHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" className="w-12 h-8 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white line-clamp-1">
                        {item.videoTitle}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        At {formatTime(item.timestamp)} • {item.courseTitle}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenCourse(item.courseId, item.videoId)}
                    className="px-3 py-1.5 rounded-full bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#121216] p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Are you sure? This will permanently delete your account, enrollments, and notes. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

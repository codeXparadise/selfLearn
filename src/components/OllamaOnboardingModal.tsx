'use client';

import React, { useState } from 'react';
import { 
  Key, 
  Sparkles, 
  ExternalLink, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OllamaLogo } from './OllamaLogo';
import { FREE_OLLAMA_MODELS } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OllamaOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OllamaOnboardingModal({ isOpen, onClose }: OllamaOnboardingModalProps) {
  const { user, updateProfileData } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemma4:31b');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    try {
      await updateProfileData({
        ollamaApiKey: apiKey.trim(),
        ollamaModel: selectedModel,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem('ollama_onboarding_skipped', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1.5 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
              <OllamaLogo className="w-full h-full" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Connect Your Ollama AI</DialogTitle>
              <span className="text-[11px] text-[#EA4335] font-semibold">1-Step Setup</span>
            </div>
          </div>
          <DialogDescription className="text-xs text-neutral-500 leading-relaxed pt-1">
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}! Connect your free Ollama API key to ask natural language questions at any video timestamp.
          </DialogDescription>
        </DialogHeader>

        {/* Step-by-step simple help box */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-neutral-800 dark:text-neutral-200">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>How to get your free key:</span>
            </span>
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#EA4335] hover:underline flex items-center gap-1 font-medium"
            >
              <span>ollama.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 pl-1">
            <li>Visit <strong>ollama.com</strong> and create or sign into your free account.</li>
            <li>Click your avatar in the top right → <strong>Settings</strong> → <strong>Keys</strong>.</li>
            <li>Copy your key and paste it below.</li>
          </ol>
        </div>

        {savedSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1 text-emerald-700 dark:text-emerald-300">
            <Check className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="font-bold text-xs">Ollama API Key Connected!</p>
            <p className="text-[11px] opacity-80">You can now use timestamp AI tutoring anytime.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Ollama API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="password"
                  placeholder="Paste your Ollama key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none font-mono text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Preferred Free Model
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
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
              >
                Skip for now
              </button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading || !apiKey.trim()}
                className="gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save & Continue</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


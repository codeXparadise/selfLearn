'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Trash2, 
  Sparkles, 
  Bot, 
  User, 
  Key, 
  Check, 
  ChevronDown, 
  Activity, 
  LogOut, 
  CheckCircle2, 
  Lock, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OllamaLogo } from './OllamaLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FREE_OLLAMA_MODELS, type Course, type Video, type ChatMessage } from '@/types';

interface AIPanelProps {
  course?: Course;
  activeVideo?: Video;
  currentTime: number;
  duration: number;
  onSeekToTimestamp?: (seconds: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export function AIPanel({
  course,
  activeVideo,
  currentTime,
  duration,
  onSeekToTimestamp,
  isOpen,
  onClose,
  onOpenAuth,
}: AIPanelProps) {
  const { user, updateProfileData } = useAuth();
  
  const [apiKey, setApiKey] = useState(user?.ollamaApiKey || '');
  const [selectedModel, setSelectedModel] = useState(user?.ollamaModel || 'gemma4:31b');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [syncScope, setSyncScope] = useState<'timestamp' | 'entire'>('timestamp');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      content: "Hello! I'm your Ollama learning tutor. Ask me anything about what's being taught in this video, or jump directly to relevant timestamps.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const maxDailyQueries = 50;

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.ollamaApiKey) {
      setApiKey(user.ollamaApiKey);
    }
    if (user?.ollamaModel) {
      setSelectedModel(user.ollamaModel);
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close AI widget on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    if (!apiKey || !apiKey.trim()) {
      setShowKeyInput(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `usr_${Date.now()}`,
          sender: 'user',
          content: input.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          videoTimestamp: currentTime,
        },
        {
          id: `key_prompt_${Date.now() + 1}`,
          sender: 'system',
          content: "Please enter your Ollama API key to get started.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setInput('');
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      videoTimestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const videoContext = {
        courseTitle: course?.title || '',
        channelTitle: course?.channelTitle || '',
        videoTitle: activeVideo?.title || '',
        currentTimeSeconds: Math.round(currentTime),
        durationSeconds: Math.round(duration),
        timestampFormatted: formatSec(currentTime),
        durationFormatted: formatSec(duration),
        courseDescription: course?.description || '',
        videoDescription: activeVideo?.description || '',
        syllabus: course?.videos?.map((v) => v.title).slice(0, 15) || [],
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: selectedModel,
          scope: syncScope,
          videoContext,
          messages: messages
            .filter((m) => m.id !== 'init')
            .concat(userMsg)
            .map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response from AI');
      }

      setUsageCount((prev) => prev + 1);

      setMessages((prev) => [
        ...prev,
        {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      const errMsg = err.message || '';
      const isAuthOrKeyError =
        errMsg.includes('04fad422017f4be2bf29e6900cfeef1e') ||
        errMsg.toLowerCase().includes('api key') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('auth') ||
        errMsg.includes('401') ||
        errMsg.includes('403') ||
        errMsg.includes('502');

      const cleanMessage = isAuthOrKeyError
        ? "Please enter your Ollama API key to get started."
        : `⚠️ ${errMsg || 'AI request failed.'}`;

      if (isAuthOrKeyError) {
        setShowKeyInput(true);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'system',
          content: cleanMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    try {
      if (user) {
        await updateProfileData({ ollamaApiKey: apiKey.trim() });
      }
      setShowKeyInput(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `key_saved_${Date.now()}`,
          sender: 'assistant',
          content: "Ollama API key saved! How can I help you with this lesson?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {}
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelDropdown(false);
    if (user) {
      updateProfileData({ ollamaModel: modelId }).catch(() => {});
    }
  };

  // Render timestamp clicks from text
  const renderMessageContent = (content: string) => {
    const timestampRegex = /\[(\d{1,2}):(\d{2})\]/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = timestampRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        parts.push(content.slice(lastIdx, match.index));
      }
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const totalSecs = mins * 60 + secs;

      parts.push(
        <button
          key={`ts_${match.index}`}
          onClick={() => onSeekToTimestamp?.(totalSecs)}
          className="inline-flex items-center gap-1 font-mono font-bold text-[#EA4335] hover:underline px-1 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-[11px]"
          title={`Seek to ${match[1]}:${match[2]}`}
        >
          ⏱️ {match[1]}:{match[2]}
        </button>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < content.length) {
      parts.push(content.slice(lastIdx));
    }

    return parts;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[460px] md:w-[480px] h-[640px] sm:h-[680px] max-h-[calc(100vh-110px)] bg-white/25 dark:bg-black/40 backdrop-blur-md backdrop-saturate-150 rounded-3xl border border-white/40 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.25)] ring-1 ring-white/20 dark:ring-white/10 flex flex-col overflow-hidden"
        >
          {/* Widget Header with Ultra-Clean Translucent Glass, Official Ollama Logo, Model Selector */}
          <div className="px-4 py-3 border-b border-white/25 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 p-1 flex items-center justify-center border border-white/40 dark:border-white/15 shadow-xs backdrop-blur-xs">
                  <OllamaLogo className="w-5 h-5" />
                </div>

                {/* Model Dropdown Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/10 text-xs font-semibold text-neutral-900 dark:text-neutral-100 border border-white/40 dark:border-white/15 backdrop-blur-xs transition-all hover:bg-white/60 dark:hover:bg-white/20"
                    title="Switch model"
                  >
                    <span className="font-mono text-[#EA4335] text-[11px]">{selectedModel}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showModelDropdown && (
                    <div 
                      className="absolute left-0 mt-1.5 w-60 bg-white/85 dark:bg-[#121318]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/15 py-1.5 z-50 text-xs ring-1 ring-black/5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                        Free Ollama Models
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1 space-y-1" data-lenis-prevent>
                        {FREE_OLLAMA_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleModelSelect(m.id)}
                            className={`w-full p-2 rounded-xl text-left flex items-start justify-between gap-2 transition-colors ${
                              selectedModel === m.id
                                ? 'bg-red-50/80 dark:bg-red-950/50 text-[#EA4335]'
                                : 'hover:bg-neutral-100/70 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-1 font-mono">
                                {m.name}
                                {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-[#EA4335]" />}
                              </div>
                              <div className="text-[10px] text-neutral-400">{m.tagline}</div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono">
                              {m.size}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className={`p-1.5 rounded-xl transition-colors backdrop-blur-xs ${
                    !apiKey
                      ? 'text-[#EA4335] bg-red-500/15 animate-pulse'
                      : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
                  }`}
                  title={apiKey ? "Configure API Key" : "Enter API Key"}
                >
                  <Key className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMessages([messages[0]])}
                  className="p-1.5 rounded-xl text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time usage & Scope toggle bar */}
            <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 font-medium pt-0.5">
              <button
                type="button"
                onClick={() => setSyncScope((prev) => (prev === 'timestamp' ? 'entire' : 'timestamp'))}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 border border-white/40 dark:border-white/15 text-neutral-800 dark:text-neutral-200 transition-colors"
                title="Click to toggle between Timestamp Sync and Full Video / General Mode"
              >
                {syncScope === 'timestamp' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[#EA4335] font-semibold">⏱️ Synced at {formatSec(currentTime)}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">🌐 Full Video / General</span>
                  </>
                )}
              </button>

              <span className="font-mono flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#EA4335]" />
                <span>{usageCount} / {maxDailyQueries} queries</span>
              </span>
            </div>
          </div>

          {/* Inline Quick API Key Input if requested or missing */}
          {showKeyInput && user && (
            <div className="p-3 bg-white/40 dark:bg-white/5 border-b border-white/30 dark:border-white/10 space-y-2 text-xs backdrop-blur-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#EA4335]" />
                  <span>Ollama API Key</span>
                </span>
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(false)}
                    className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Please enter your Ollama API key to get started.
              </p>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  placeholder="Paste your Ollama API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-full bg-white/80 dark:bg-neutral-900/80 border border-white/50 dark:border-neutral-700 outline-none font-mono text-neutral-900 dark:text-white focus:border-[#EA4335] backdrop-blur-sm shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim()}
                  className="px-3.5 py-1.5 rounded-full bg-[#EA4335] text-white text-xs font-semibold hover:bg-[#d9382b] disabled:opacity-40 transition-colors shrink-0 shadow-xs"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Auth required banner if not logged in */}
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100/70 dark:bg-red-950/50 flex items-center justify-center text-[#EA4335] backdrop-blur-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Account Required</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
                  Please sign in or create a free account to chat with your Ollama AI tutor at video timestamps.
                </p>
              </div>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('signup') : null}
                className="w-full py-2.5 px-4 rounded-full bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white font-medium text-xs transition-all shadow-sm"
              >
                Create Free Account
              </button>
            </div>
          ) : (
            <>
              {/* Chat message history with smooth native scrolling */}
              <div 
                data-lenis-prevent 
                className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs overscroll-contain select-text"
                style={{ scrollbarWidth: 'thin' }}
              >
                {messages.map((m) => {
                  const isAssistant = m.sender === 'assistant';
                  const isSystem = m.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="p-3 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] leading-relaxed border border-red-500/20 backdrop-blur-xs">
                        {m.content}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-end flex-row-reverse'}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isAssistant 
                          ? 'bg-white/40 dark:bg-white/10 border border-white/40 dark:border-white/10 p-1 backdrop-blur-xs shadow-2xs' 
                          : 'bg-neutral-900/80 text-white dark:bg-white/90 dark:text-neutral-950 text-[10px] font-bold shadow-2xs backdrop-blur-xs'
                      }`}>
                        {isAssistant ? <OllamaLogo className="w-full h-full" /> : 'You'}
                      </div>

                      <div className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                        isAssistant
                          ? 'bg-white/40 dark:bg-white/10 backdrop-blur-xs border border-white/35 dark:border-white/10 text-neutral-900 dark:text-neutral-100 rounded-tl-xs shadow-2xs'
                          : 'bg-[#EA4335]/90 text-white rounded-tr-xs shadow-sm backdrop-blur-xs whitespace-pre-wrap'
                      }`}>
                        {isAssistant ? (
                          <MarkdownRenderer
                            content={m.content}
                            onSeekToTimestamp={onSeekToTimestamp}
                          />
                        ) : (
                          m.content
                        )}
                        {m.videoTimestamp !== undefined && (
                          <button
                            type="button"
                            onClick={() => onSeekToTimestamp && onSeekToTimestamp(m.videoTimestamp!)}
                            className={`block mt-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full ${
                              isAssistant
                                ? 'bg-black/10 dark:bg-white/15 text-neutral-900 dark:text-neutral-100 hover:bg-[#EA4335] hover:text-white'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            } transition-colors`}
                            title="Jump to video time"
                          >
                            ⏱️ Jump to {formatSec(m.videoTimestamp)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs pl-2 py-1 animate-pulse">
                    <OllamaLogo className="w-4 h-4 animate-spin" />
                    <span>Ollama is thinking...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Chips with Translucent Glass */}
              <div className="px-3 pt-2 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 pb-1" data-lenis-prevent>
                <button
                  type="button"
                  onClick={() => {
                    setSyncScope('entire');
                    handleSendPrompt("Summarize the entire video in short with key takeaways");
                  }}
                  className={`px-2.5 py-1 rounded-full backdrop-blur-xs border transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                    syncScope === 'entire'
                      ? 'bg-[#EA4335]/20 border-[#EA4335]/40 text-[#EA4335] font-semibold'
                      : 'bg-white/35 dark:bg-white/5 hover:bg-white/55 dark:hover:bg-white/15 border-white/30 dark:border-white/10 text-neutral-800 dark:text-neutral-200'
                  }`}
                  title="Summarize the full lesson irrespective of current timestamp"
                >
                  📋 Summarize Entire Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSyncScope('timestamp');
                    handleSendPrompt(`Explain what is being taught at ${formatSec(currentTime)}`);
                  }}
                  className={`px-2.5 py-1 rounded-full backdrop-blur-xs border transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                    syncScope === 'timestamp'
                      ? 'bg-[#EA4335]/20 border-[#EA4335]/40 text-[#EA4335] font-semibold'
                      : 'bg-white/35 dark:bg-white/5 hover:bg-white/55 dark:hover:bg-white/15 border-white/30 dark:border-white/10 text-neutral-800 dark:text-neutral-200'
                  }`}
                  title="Explain the specific concept at current playback timestamp"
                >
                  ⚡ Explain at {formatSec(currentTime)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSyncScope('entire');
                    handleSendPrompt("What are the core concepts and code patterns covered in this lesson?");
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/35 dark:bg-white/5 hover:bg-white/55 dark:hover:bg-white/15 backdrop-blur-xs border border-white/30 dark:border-white/10 text-neutral-800 dark:text-neutral-200 transition-all whitespace-nowrap shrink-0 shadow-2xs"
                >
                  💡 Key Concepts
                </button>
              </div>

              {/* Chat input box with Translucent styling */}
              <form onSubmit={handleSend} className="p-3 border-t border-white/25 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xs shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder={syncScope === 'timestamp' ? `Ask about lesson at ${formatSec(currentTime)}...` : 'Ask general question or summarize entire lesson...'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-full bg-white/40 dark:bg-black/30 backdrop-blur-xs border border-white/40 dark:border-white/15 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white placeholder-neutral-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-1.5 p-2 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white disabled:opacity-40 transition-colors shadow-xs"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}


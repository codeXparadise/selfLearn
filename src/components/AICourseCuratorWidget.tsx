'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Send, 
  Play, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
} from 'lucide-react';
import { OllamaLogo } from './OllamaLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAuth } from '@/context/AuthContext';
import { saveUserCourseToFirebase } from '@/lib/firebaseDb';
import type { RecommendedPlaylist } from '@/server/playlistSearch';

interface AICourseCuratorWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseImported?: (course: any) => void;
}

interface CuratorMessage {
  id: string;
  sender: 'assistant' | 'user' | 'system';
  content: string;
  recommendations?: RecommendedPlaylist[];
  importedCourse?: any;
  timestamp: string;
}

export function AICourseCuratorWidget({
  isOpen,
  onClose,
  onCourseImported,
}: AICourseCuratorWidgetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<CuratorMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: "Hello! What subject or skill would you like to master today? (e.g. Python, Data Science, Machine Learning, React, System Design...)",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, importingId]);

  // Close Curator on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || importingId) return;

    const userText = input.trim();
    const userMsg: CuratorMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Check if user is replying to pick a recommendation (e.g. "1", "2", "3", "first", "second")
    const lastMsgWithRecs = [...messages].reverse().find((m) => m.recommendations && m.recommendations.length > 0);
    if (lastMsgWithRecs && lastMsgWithRecs.recommendations) {
      const lower = userText.toLowerCase();
      let pickedRec: RecommendedPlaylist | undefined;
      if (lower.includes('1') || lower.includes('first')) {
        pickedRec = lastMsgWithRecs.recommendations[0];
      } else if (lower.includes('2') || lower.includes('second')) {
        pickedRec = lastMsgWithRecs.recommendations[1];
      } else if (lower.includes('3') || lower.includes('third')) {
        pickedRec = lastMsgWithRecs.recommendations[2];
      }

      if (pickedRec) {
        setLoading(false);
        await handleImportPlaylist(pickedRec);
        return;
      }
    }

    try {
      const res = await fetch('/api/ai/curate-playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: userText,
          apiKey: user?.ollamaApiKey,
          model: user?.ollamaModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to curate playlists');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          content: data.reply,
          recommendations: data.recommendations,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'system',
          content: `⚠️ ${err.message || 'Could not fetch playlists. Please try a different topic keyword.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPlaylist = async (rec: RecommendedPlaylist) => {
    setImportingId(rec.playlistId);

    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers,
        body: JSON.stringify({ playlistUrl: rec.playlistUrl, userId: user?.id }),
      });

      const data = await res.json();

      if (res.status === 409 || data.isDuplicate) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast_dup_${Date.now()}`,
            sender: 'assistant',
            content: `💡 "${rec.title}" is already added to your courses!`,
            importedCourse: data.course,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import playlist');
      }

      const importedCourse = data.course;

      // Sync to Firebase Firestore for this user
      if (user?.id) {
        saveUserCourseToFirebase(user.id, importedCourse);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ast_success_${Date.now()}`,
          sender: 'assistant',
          content: `🎉 Successfully imported "${importedCourse.title}" (${importedCourse.videos?.length || 0} lessons) to your Hub!`,
          importedCourse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (onCourseImported) {
        onCourseImported(importedCourse);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_imp_${Date.now()}`,
          sender: 'system',
          content: `⚠️ Failed to import playlist: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[460px] md:w-[480px] h-[640px] sm:h-[680px] max-h-[calc(100vh-110px)] bg-white/25 dark:bg-black/40 backdrop-blur-md backdrop-saturate-150 rounded-3xl border border-white/40 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.25)] ring-1 ring-white/20 dark:ring-white/10 flex flex-col overflow-hidden select-none"
        >
          {/* Header with Translucent Glass */}
          <div className="px-4 py-3 border-b border-white/25 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 p-1 flex items-center justify-center border border-white/40 dark:border-white/15 shadow-xs backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-[#EA4335]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>AI Course Curator</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-100/70 dark:bg-red-950/60 text-[#EA4335] border border-red-500/20">
                    Smart Discovery
                  </span>
                </h3>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Find & import complete YouTube courses instantly
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              title="Close Curator (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div 
            data-lenis-prevent
            className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs select-text overscroll-contain"
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
                    {isAssistant ? <Sparkles className="w-3.5 h-3.5 text-[#EA4335]" /> : 'You'}
                  </div>

                  <div className="max-w-[88%] space-y-2">
                    <div className={`p-3.5 rounded-2xl leading-relaxed ${
                      isAssistant
                        ? 'bg-white/40 dark:bg-white/10 backdrop-blur-xs border border-white/35 dark:border-white/10 text-neutral-900 dark:text-neutral-100 rounded-tl-xs shadow-2xs'
                        : 'bg-[#EA4335]/90 text-white rounded-tr-xs shadow-sm backdrop-blur-xs whitespace-pre-wrap'
                    }`}>
                      {isAssistant ? (
                        <MarkdownRenderer content={m.content} />
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* Recommendations Cards Grid */}
                    {m.recommendations && m.recommendations.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        {m.recommendations.map((rec) => {
                          const isThisImporting = importingId === rec.playlistId;

                          return (
                            <div
                              key={rec.playlistId}
                              className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs space-y-2 hover:border-[#EA4335]/60 transition-all"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="w-16 h-11 rounded-xl overflow-hidden bg-black shrink-0 relative shadow-2xs">
                                  <img
                                    src={rec.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                                    alt={rec.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/60 text-[#EA4335] font-mono border border-red-500/20">
                                      {rec.badge}
                                    </span>
                                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                                      {rec.totalVideos} lessons
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-xs text-neutral-950 dark:text-white line-clamp-1 mt-0.5" title={rec.title}>
                                    {rec.title}
                                  </h4>
                                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                    Instructor: {rec.channelTitle}
                                  </p>
                                </div>
                              </div>

                              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                                {rec.overview}
                              </p>

                              <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-white/20 dark:border-white/10">
                                <a
                                  href={rec.playlistUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                >
                                  <span>Preview</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>

                                <button
                                  onClick={() => handleImportPlaylist(rec)}
                                  disabled={Boolean(importingId)}
                                  className="px-3.5 py-1.5 rounded-full bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white font-medium text-[11px] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                                >
                                  {isThisImporting ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Importing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Import Course #{rec.rank}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Imported Course Confirmation Box */}
                    {m.importedCourse && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/15 dark:bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-md space-y-2 text-xs text-emerald-800 dark:text-emerald-200">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>{m.importedCourse.title}</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                          All {m.importedCourse.videos?.length || 0} lessons are now curated and synced to your account.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              onClose();
                              router.push(`/classroom/${m.importedCourse.id}`);
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Open in Classroom</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs pl-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-[#EA4335] animate-spin" />
                <span>Finding top-rated YouTube playlists...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Topic Discovery Chips with Translucent Glass */}
          <div className="px-3 pt-2 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 pb-1" data-lenis-prevent>
            {['Python Full Course', 'Data Science', 'Machine Learning', 'Next.js 14', 'System Design'].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setInput(topic)}
                className="px-2.5 py-1 rounded-full bg-white/35 dark:bg-white/5 hover:bg-white/55 dark:hover:bg-white/15 backdrop-blur-xs border border-white/30 dark:border-white/10 text-neutral-800 dark:text-neutral-200 transition-all whitespace-nowrap shrink-0 shadow-2xs"
              >
                🔍 {topic}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/25 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xs shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Type a topic (e.g. Python, Data Science, React)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || Boolean(importingId)}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-full bg-white/40 dark:bg-black/30 backdrop-blur-xs border border-white/40 dark:border-white/15 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white placeholder-neutral-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || Boolean(importingId) || !input.trim()}
                className="absolute right-1.5 p-2 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white disabled:opacity-40 transition-colors shadow-xs"
                title="Ask AI to find course"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

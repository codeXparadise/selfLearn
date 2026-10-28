'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Send, 
  Play, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  ExternalLink,
  Bot,
  User,
  ArrowRight
} from 'lucide-react';
import { OllamaLogo } from './OllamaLogo';
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

  if (!isOpen) return null;

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
    <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[560px] max-h-[calc(100vh-140px)] bg-white dark:bg-[#121216] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA4335] to-amber-500 p-0.5 flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-white dark:bg-[#121216] rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#EA4335]" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>AI Course Curator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/60 text-[#EA4335]">
                Smart Discovery
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400">
              Auto-fetch & import top YouTube curriculums
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
          title="Close Curator"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => {
          const isAssistant = m.sender === 'assistant';
          const isSystem = m.sender === 'system';

          if (isSystem) {
            return (
              <div key={m.id} className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[11px] leading-relaxed">
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
                  ? 'bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700' 
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold'
              }`}>
                {isAssistant ? <Sparkles className="w-3.5 h-3.5 text-[#EA4335]" /> : 'You'}
              </div>

              <div className="max-w-[88%] space-y-2">
                <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  isAssistant
                    ? 'bg-neutral-100 dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                    : 'bg-[#EA4335] text-white rounded-tr-xs'
                }`}>
                  {m.content}
                </div>

                {/* Recommendations Cards Grid */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    {m.recommendations.map((rec) => {
                      const isThisImporting = importingId === rec.playlistId;

                      return (
                        <div
                          key={rec.playlistId}
                          className="p-3 rounded-2xl bg-white dark:bg-[#18191e] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2 hover:border-[#EA4335] transition-all"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-16 h-11 rounded-xl overflow-hidden bg-black shrink-0 relative">
                              <img
                                src={rec.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                                alt={rec.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/60 text-[#EA4335] font-mono">
                                  {rec.badge}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {rec.totalVideos} lessons
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-neutral-950 dark:text-white line-clamp-1 mt-0.5" title={rec.title}>
                                {rec.title}
                              </h4>
                              <p className="text-[10px] text-neutral-400 truncate">
                                Instructor: {rec.channelTitle}
                              </p>
                            </div>
                          </div>

                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                            {rec.overview}
                          </p>

                          <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800">
                            <a
                              href={rec.playlistUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-white flex items-center gap-1"
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
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
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
          <div className="flex items-center gap-2 text-neutral-400 text-xs pl-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#EA4335] animate-spin" />
            <span>Finding top-rated YouTube playlists...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type a topic (e.g. Python, Data Science, React)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || Boolean(importingId)}
            className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || Boolean(importingId) || !input.trim()}
            className="absolute right-1.5 p-2 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white disabled:opacity-40 transition-colors"
            title="Ask AI to find course"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

    </div>
  );
}


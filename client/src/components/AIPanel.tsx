import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Sparkles, 
  Key, 
  Loader2, 
  Clock, 
  Check, 
  Copy, 
  Trash2, 
  Code2, 
  Eye, 
  EyeOff, 
  LogOut, 
  X,
  Lock,
  ChevronDown,
  Activity,
  CheckCircle2
} from 'lucide-react';
import type { Video, Course } from '../types';
import { FREE_OLLAMA_MODELS } from '../types';
import { OllamaLogo } from './OllamaLogo';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  modelUsed?: string;
  createdAt: string;
}

interface AIPanelProps {
  course: Course;
  activeVideo: Video;
  currentTime: number;
  duration: number;
  onSeekToTimestamp: (seconds: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

const OLLAMA_HOST = 'https://ollama.com';

export const AIPanel: React.FC<AIPanelProps> = ({
  course,
  activeVideo,
  currentTime,
  duration,
  onSeekToTimestamp,
  isOpen,
  onClose,
  onOpenAuth
}) => {
  const { user, profile, usageCount, maxDailyQueries, incrementUsage, saveOllamaConfig } = useAuth();

  // Active Model selection
  const [selectedModel, setSelectedModel] = useState<string>(
    () => profile?.ollamaModel || localStorage.getItem('self_learn_ai_model') || 'gemma4:31b'
  );
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Stored API Key
  const [apiKey, setApiKey] = useState<string>(
    () => profile?.ollamaApiKey || localStorage.getItem('self_learn_ai_key') || ''
  );
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!apiKey);
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Sync profile key if it loads asynchronously
  useEffect(() => {
    if (profile?.ollamaApiKey && !apiKey) {
      setApiKey(profile.ollamaApiKey);
      setShowKeyInput(false);
    }
  }, [profile?.ollamaApiKey]);

  // Chat conversation
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI tutor powered by **${selectedModel}**.\n\nSynced with: **"${activeVideo?.title}"**.\n\nAsk me about what is happening at any timestamp (e.g. *"What is explained at 04:30?"* or *"Explain this code"*), and I'll break it down for you!`,
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Parse [mm:ss] timestamp to seconds
  const parseTimestamp = (str: string): number | null => {
    const match = str.match(/\[?(\d{1,2}:\d{2})\]?/);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      return min * 60 + sec;
    }
    return null;
  };

  // Handle Model Change
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelDropdown(false);
    saveOllamaConfig(apiKey, modelId, OLLAMA_HOST);
  };

  // Test & Save API Key
  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKey.trim()) {
      setConnectionError('Please enter your Ollama API Key.');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          hostUrl: OLLAMA_HOST,
          model: selectedModel
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to connect to Ollama. Please verify your API key.');
      }

      saveOllamaConfig(apiKey.trim(), selectedModel, OLLAMA_HOST);
      setShowKeyInput(false);
    } catch (err: any) {
      setConnectionError(err.message || 'Connection failed. Please verify your API key.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect / Clear key
  const handleDisconnect = () => {
    if (confirm('Disconnect AI tutor and remove saved API key?')) {
      saveOllamaConfig('', selectedModel, OLLAMA_HOST);
      setApiKey('');
      setShowKeyInput(true);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Send Query to AI
  const handleSendMessage = async (customPrompt?: string) => {
    if (!user) {
      onOpenAuth('signup');
      return;
    }

    const text = (customPrompt || inputQuery).trim();
    if (!text || isLoading) return;

    if (!apiKey.trim()) {
      setShowKeyInput(true);
      return;
    }

    const currentFormatted = formatTime(currentTime);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: currentTime,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);
    incrementUsage();

    try {
      const videoContext = {
        courseTitle: course.title,
        channelTitle: course.channelTitle,
        courseDescription: course.description,
        videoTitle: activeVideo.title,
        currentTimeSeconds: Math.round(currentTime),
        timestampFormatted: currentFormatted,
        durationSeconds: Math.round(duration || activeVideo.durationSeconds || 0),
        durationFormatted: formatTime(duration || activeVideo.durationSeconds || 0),
        notes: activeVideo.notes || []
      };

      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          hostUrl: OLLAMA_HOST,
          model: selectedModel,
          messages: [...history, { role: 'user', content: text }],
          videoContext
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get answer from AI tutor.');
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || 'I could not generate an answer at this moment.',
        modelUsed: selectedModel,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ **Unable to complete query:** ${err.message}\n\nPlease check your Ollama API key or model availability.`,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert plain text node containing timestamps into clickable buttons
  const renderTextWithTimestamps = (text: string) => {
    const timestampRegex = /\[?(\d{1,2}:\d{2})\]?/g;
    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = timestampRegex.exec(text)) !== null) {
      const rawTimestamp = match[1];
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;

      if (matchStart > lastIndex) {
        parts.push(text.slice(lastIndex, matchStart));
      }

      const secs = parseTimestamp(rawTimestamp);
      parts.push(
        <button
          key={`${matchStart}-${rawTimestamp}`}
          onClick={() => secs !== null && onSeekToTimestamp(secs)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-[#FF0000] font-mono text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors mx-0.5 align-baseline"
          title={`Click to jump to ${rawTimestamp} in video`}
        >
          <Clock className="w-3 h-3" />
          {rawTimestamp}
        </button>
      );

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  if (!isOpen) return null;

  // Real-time usage percent
  const usagePercent = Math.min(100, Math.round((usageCount / maxDailyQueries) * 100));

  return (
    <div 
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[520px] max-h-[calc(100vh-140px)] bg-white dark:bg-[#121216] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-fade-in select-none"
    >
      {/* Widget Header with Official Ollama Logo, Model Selector & Usage Bar */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          
          {/* Left: Ollama Official Logo + Model Selector Dropdown */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 p-1 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
              <OllamaLogo className="w-5 h-5" />
            </div>

            {/* Model Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition-all"
                title="Switch free Ollama model"
              >
                <span className="font-mono text-[#EA4335] text-[11px]">{selectedModel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Free Models Dropdown Menu */}
              {showModelDropdown && (
                <div 
                  className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 py-1.5 z-50 text-xs animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                    Free Ollama Models
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1 space-y-1">
                    {FREE_OLLAMA_MODELS.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleModelSelect(m.id)}
                        className={`w-full p-2 rounded-xl text-left flex items-start justify-between gap-2 transition-colors ${
                          selectedModel === m.id
                            ? 'bg-red-50 dark:bg-red-950/40 text-[#FF0000]'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1 font-mono">
                            {m.name}
                            {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-[#FF0000]" />}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {m.tagline}
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono shrink-0">
                          {m.size}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1">
            {apiKey && (
              <button
                onClick={handleDisconnect}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Disconnect Ollama API Key"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setMessages([messages[0]])}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Collapse Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-Time Usage Bar */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#FF0000]" />
              <span>Real-Time Usage</span>
            </span>
            <span className="font-mono">
              {usageCount} / {maxDailyQueries} queries ({usagePercent}%)
            </span>
          </div>

          {/* Animated gradient usage bar */}
          <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent >= 90
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-red-600 to-[#FF0000]'
              }`}
              style={{ width: `${Math.max(5, usagePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Auth Gated Screen: If User is Not Logged In */}
      {!user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-zinc-950/60">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/60 text-[#FF0000] flex items-center justify-center shadow-lg shadow-red-500/20 mx-auto">
              <OllamaLogo className="w-8 h-8 text-[#FF0000]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
            Unlock Ollama AI Tutor
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed mb-6">
            Sign in to ask questions at any video timestamp, receive instant code breakdowns, and generate custom study quizzes with <strong className="text-slate-800 dark:text-zinc-200">gemma4:31b</strong>.
          </p>

          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full py-3 px-4 bg-[#FF0000] hover:bg-[#CC0000] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-red-500/25 transition-transform"
            >
              Create Free Account to Access
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs rounded-2xl transition-colors"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      ) : showKeyInput ? (
        /* API Key Setup Card (Clutter-free: host/model hidden) */
        <div className="p-5 bg-gradient-to-b from-red-50/50 via-white to-white dark:from-red-950/20 dark:via-zinc-900 dark:to-zinc-900 border-b border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-zinc-800 text-[#FF0000] flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Connect Ollama API
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Enter your Ollama API key to activate natural language timestamp queries with {selectedModel}.
              </p>
            </div>
          </div>

          {connectionError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <span className="shrink-0 font-bold">⚠️</span>
              <span>{connectionError}</span>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Paste your Ollama API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:border-red-500 dark:focus:border-red-500 outline-none text-slate-900 dark:text-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved to your profile
              </span>

              <button
                type="submit"
                disabled={isConnecting || !apiKey.trim()}
                className="px-5 py-2 bg-[#FF0000] hover:bg-[#CC0000] active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-red-500/20"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Start Learning
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Chat Messages Feed with Rich Markdown Formatting */}
      {user && !showKeyInput && (
        <>
          <div 
            ref={chatScrollRef} 
            className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm bg-slate-50/50 dark:bg-[#0c0c0e]/60"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Tag with Ollama Icon */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {msg.role === 'user' ? (
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                      You {msg.timestamp !== undefined && `• at ${formatTime(msg.timestamp)}`}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF0000]">
                      <OllamaLogo className="w-3.5 h-3.5 text-[#FF0000]" />
                      <span>{msg.modelUsed || selectedModel}</span>
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[92%] rounded-3xl p-4 leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm'
                      : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 mb-1">{children}</h3>,
                          h2: ({ children }) => <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 mb-1">{children}</h4>,
                          h3: ({ children }) => <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1.5 mb-1">{children}</h5>,
                          
                          p: ({ children }) => {
                            const content = React.Children.map(children, (child) => {
                              if (typeof child === 'string') {
                                return renderTextWithTimestamps(child);
                              }
                              return child;
                            });
                            return <p className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-zinc-300">{content}</p>;
                          },

                          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-slate-700 dark:text-zinc-300">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-700 dark:text-zinc-300">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,

                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-red-500 pl-3 my-2 text-slate-600 dark:text-zinc-400 italic bg-red-50/40 dark:bg-red-950/20 py-1 rounded-r-xl">
                              {children}
                            </blockquote>
                          ),

                          code({ className, children, ...props }) {
                            const codeString = String(children).replace(/\n$/, '');
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match && !codeString.includes('\n');
                            const codeId = `${msg.id}-${codeString.slice(0, 10)}`;

                            if (isInline) {
                              return (
                                <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 font-mono text-xs font-semibold" {...props}>
                                  {children}
                                </code>
                              );
                            }

                            return (
                              <div className="relative my-3 rounded-2xl bg-[#0f1117] text-slate-100 border border-zinc-800 overflow-hidden shadow-md">
                                <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                                  <span className="font-semibold text-zinc-300">
                                    {match ? match[1] : 'code'}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(codeString, codeId)}
                                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors p-1"
                                    title="Copy code"
                                  >
                                    {copiedCodeId === codeId ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400 font-medium">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed text-slate-200">
                                  <code>{codeString}</code>
                                </pre>
                              </div>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF0000]" />
                <span>{selectedModel} analyzing timestamp {formatTime(currentTime)}...</span>
              </div>
            )}
          </div>

          {/* Quick Context Chips */}
          <div className="px-3.5 py-2 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage(`Explain what is being taught at timestamp ${formatTime(currentTime)} step-by-step.`)}
              className="shrink-0 px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-[#FF0000] text-[11px] font-semibold flex items-center gap-1.5 border border-red-200/80 dark:border-red-900/60 transition-colors shadow-xs"
            >
              <Clock className="w-3 h-3" />
              Explain at {formatTime(currentTime)}
            </button>

            <button
              onClick={() => handleSendMessage(`Can you write a practical code example illustrating the concept shown at ${formatTime(currentTime)}?`)}
              className="shrink-0 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Code2 className="w-3 h-3 text-blue-500" />
              Code Example
            </button>

            <button
              onClick={() => handleSendMessage(`Summarize the core takeaways up to timestamp ${formatTime(currentTime)}.`)}
              className="shrink-0 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Summary
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3.5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Ask ${selectedModel} about ${formatTime(currentTime)}...`}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-2.5 text-xs rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-transparent focus:border-red-500 dark:focus:border-red-500 focus:bg-white dark:focus:bg-zinc-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-all shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => {
                    setInputQuery(prev => prev ? `${prev} (at ${formatTime(currentTime)})` : `Explain what happens at ${formatTime(currentTime)} `);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-[#FF0000] dark:hover:text-[#FF0000] transition-colors"
                  title="Insert current timestamp into question"
                >
                  +{formatTime(currentTime)}
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="p-2.5 bg-[#FF0000] hover:bg-[#CC0000] active:scale-95 text-white rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-500/25"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

    </div>
  );
};

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onSeekToTimestamp?: (seconds: number) => void;
  className?: string;
}

export function MarkdownRenderer({ content, onSeekToTimestamp, className = '' }: MarkdownRendererProps) {
  // Helper to replace [mm:ss] with clickable timestamp seek buttons
  const renderWithTimestamps = (text: React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') {
      if (Array.isArray(text)) {
        return text.map((item, idx) => <React.Fragment key={idx}>{renderWithTimestamps(item)}</React.Fragment>);
      }
      return text;
    }

    const regex = /\[(\d{1,2}):(\d{2})\]/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const totalSecs = mins * 60 + secs;

      parts.push(
        <button
          key={`ts_${match.index}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeekToTimestamp?.(totalSecs);
          }}
          className="inline-flex items-center gap-1 font-mono font-bold text-[#EA4335] hover:text-orange-600 hover:underline px-1.5 py-0.5 rounded-full bg-red-100/70 dark:bg-red-950/60 border border-red-200/60 dark:border-red-900/40 text-[11px] align-baseline transition-colors cursor-pointer"
          title={`Seek video to ${match[1]}:${match[2]}`}
        >
          ⏱️ {match[1]}:{match[2]}
        </button>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`prose-sm max-w-none text-xs leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-xs text-neutral-800 dark:text-neutral-200">
              {renderWithTimestamps(children)}
            </p>
          ),
          h1: ({ children }) => (
            <h3 className="font-bold text-sm text-neutral-950 dark:text-white mt-3 mb-1.5 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-1">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="font-bold text-xs sm:text-sm text-neutral-950 dark:text-white mt-2.5 mb-1">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="font-semibold text-xs text-neutral-950 dark:text-white mt-2 mb-1">
              {children}
            </h5>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-neutral-950 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1 text-xs text-neutral-800 dark:text-neutral-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1 text-xs text-neutral-800 dark:text-neutral-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{renderWithTimestamps(children)}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#EA4335] pl-3 py-1 my-2 bg-red-50/50 dark:bg-red-950/20 text-neutral-700 dark:text-neutral-300 italic rounded-r text-xs">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-[11px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="p-2 font-bold bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2 border-b border-neutral-100 dark:border-neutral-800/60">{children}</td>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800/90 font-mono text-[11px] text-[#EA4335] dark:text-red-400 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={lang} code={String(children).replace(/\n$/, '')} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="my-2 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-100 overflow-hidden shadow-xs">
      <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-200 selection:bg-neutral-800" data-lenis-prevent>
        <code>{code}</code>
      </pre>
    </div>
  );
}


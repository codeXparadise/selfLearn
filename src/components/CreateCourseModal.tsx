'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { saveUserCourseToFirebase } from '@/lib/firebaseDb';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated?: (course: any) => void;
}

export function CreateCourseModal({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCourse, setDuplicateCourse] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setError(null);
    setDuplicateCourse(null);
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null);
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers,
        body: JSON.stringify({ playlistUrl: playlistUrl.trim(), userId: user?.id }),
      });

      const data = await res.json();

      // Handle duplicate playlist
      if (res.status === 409 || data.isDuplicate) {
        setDuplicateCourse(data.course);
        setError(data.error || 'This playlist is already added to your courses.');
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to curate playlist');
      }

      if (user?.id) {
        await saveUserCourseToFirebase(user.id, data.course);
      }

      setPlaylistUrl('');
      onClose();
      if (onCourseCreated) {
        onCourseCreated(data.course);
      } else {
        router.push(`/classroom/${data.course.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error importing course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-[#EA4335]">
              <Layers className="w-4 h-4" />
            </div>
            <DialogTitle>Import YouTube Playlist</DialogTitle>
          </div>
          <DialogDescription>
            Paste any public or unlisted YouTube playlist link to automatically curate all lessons into your distraction-free workspace.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {duplicateCourse && (
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/classroom/${duplicateCourse.id}`);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white text-[11px] font-semibold transition-all shadow-xs"
                >
                  Open Existing Course →
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Playlist URL or ID
            </label>
            <input
              type="text"
              placeholder="https://www.youtube.com/playlist?list=PL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>Zero API Keys Needed</span>
            </div>
            <p>Our server extracts titles, chapters, timestamps, and durations directly from YouTube HTML metadata.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Curating Lessons...' : 'Create Course'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


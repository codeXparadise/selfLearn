import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import type { ParsedPlaylist } from '../types';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (courseId: string) => void;
}

const SAMPLE_PLAYLISTS = [
  {
    name: 'JavaScript Full Course (Beginners to Pro)',
    url: 'https://www.youtube.com/playlist?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW'
  },
  {
    name: 'HTML & CSS Complete Course',
    url: 'https://www.youtube.com/playlist?list=PLQEaRBV9gAFuf-27K64l7-hV7o0fr9zx7'
  }
];

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onCourseCreated
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPlaylist | null>(null);

  if (!isOpen) return null;

  const handleFetchPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setError('Please enter a YouTube playlist URL or ID.');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const res = await fetch('/api/playlist/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: playlistUrl.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch playlist.');
      }

      setParsedData(data.playlist);
      if (!courseName.trim()) {
        setCourseName(data.playlist.title);
      }
      if (!description.trim() && data.playlist.description) {
        setDescription(data.playlist.description.slice(0, 200));
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing YouTube playlist. Please verify the URL.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setError('Please enter a YouTube playlist URL.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        url: playlistUrl.trim(),
        courseName: courseName.trim() || parsedData?.title || 'My YouTube Course',
        description: description.trim() || parsedData?.description || ''
      };

      if (parsedData?.videos && parsedData.videos.length > 0) {
        payload.customVideos = parsedData.videos;
        payload.thumbnail = parsedData.thumbnail;
      }

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create course.');
      }

      // Reset and close
      setPlaylistUrl('');
      setCourseName('');
      setDescription('');
      setParsedData(null);
      onClose();
      onCourseCreated(data.course.id);
    } catch (err: any) {
      setError(err.message || 'Error creating course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySample = (url: string, name: string) => {
    setPlaylistUrl(url);
    setCourseName(name);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
              <svg className="w-5 h-4" viewBox="0 0 68 48" fill="none">
                <path d="M66.52 7.74C65.74 4.8 63.45 2.5 60.52 1.72C55.23 0.3 34 0.3 34 0.3C34 0.3 12.77 0.3 7.48 1.72C4.55 2.5 2.26 4.8 1.48 7.74C0.06 13.05 0 24.15 0 24.15C0 24.15 0.06 35.25 1.48 40.56C2.26 43.5 4.55 45.8 7.48 46.58C12.77 48 34 48 34 48C34 48 55.23 48 60.52 46.58C63.45 45.8 65.74 43.5 66.52 40.56C67.94 35.25 68 24.15 68 24.15C68 24.15 67.94 13.05 66.52 7.74Z" fill="#FF0000"/>
                <path d="M45 24L27 13.5V34.5L45 24Z" fill="white"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Create New Course
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Transform any YouTube playlist into a distraction-free course hub
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Playlist URL Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                YouTube Playlist URL or ID <span className="text-[#FF0000]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:border-red-500 dark:focus:border-red-500 focus:bg-white dark:focus:bg-zinc-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleFetchPlaylist}
                  disabled={isFetching || !playlistUrl.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF0000]" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Preview
                    </>
                  )}
                </button>
              </div>

              {/* Sample Quick Links */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Try sample:
                </span>
                {SAMPLE_PLAYLISTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySample(sample.url, sample.name)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors font-medium"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Name Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                Course Name <span className="text-slate-400 text-xs font-normal">(Optional, will auto-detect from YouTube)</span>
              </label>
              <input
                type="text"
                placeholder={parsedData?.title || 'e.g., Master Modern Web Development'}
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:border-red-500 dark:focus:border-red-500 focus:bg-white dark:focus:bg-zinc-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-all"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                Course Description <span className="text-slate-400 text-xs font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="What will you learn in this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:border-red-500 dark:focus:border-red-500 focus:bg-white dark:focus:bg-zinc-950 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Parsed Playlist Preview Card */}
          {parsedData && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Playlist Detected
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#FF0000]">
                  {parsedData.videos.length} Videos
                </span>
              </div>

              <div className="flex items-start gap-3">
                <img
                  src={parsedData.thumbnail}
                  alt={parsedData.title}
                  className="w-24 h-16 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-zinc-700 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {parsedData.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Channel: <span className="font-medium text-slate-700 dark:text-zinc-300">{parsedData.channelTitle}</span>
                  </p>
                </div>
              </div>

              {/* Scrollable video preview list */}
              <div className="mt-2 border-t border-slate-200/60 dark:border-zinc-700/60 pt-2">
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2">
                  First lessons included:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {parsedData.videos.slice(0, 8).map((vid, i) => (
                    <div
                      key={vid.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-900/60 text-xs border border-slate-100 dark:border-zinc-800"
                    >
                      <span className="truncate text-slate-800 dark:text-zinc-300">
                        <strong className="text-slate-400 dark:text-zinc-500 mr-1.5">#{i + 1}</strong>
                        {vid.title}
                      </span>
                      {vid.duration && (
                        <span className="shrink-0 text-slate-400 dark:text-zinc-500 font-mono text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {vid.duration}
                        </span>
                      )}
                    </div>
                  ))}
                  {parsedData.videos.length > 8 && (
                    <p className="text-center text-xs text-slate-400 dark:text-zinc-500 pt-1">
                      + {parsedData.videos.length - 8} more videos
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={isSubmitting || !playlistUrl.trim()}
            className="px-6 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] active:scale-95 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Course...
              </>
            ) : (
              <>
                Create Course Hub
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};


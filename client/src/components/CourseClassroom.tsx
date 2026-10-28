import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Play, 
  Clock, 
  Search, 
  FileText, 
  Info, 
  Trash2, 
  RotateCcw, 
  Layers, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Course } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { AIPanel } from './AIPanel';
import { OllamaLogo } from './OllamaLogo';
import { useAuth } from '../context/AuthContext';

interface CourseClassroomProps {
  course: Course;
  initialVideoId?: string;
  onBackToDashboard: () => void;
  onCourseUpdated: (course: Course) => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export const CourseClassroom: React.FC<CourseClassroomProps> = ({
  course,
  initialVideoId,
  onBackToDashboard,
  onCourseUpdated,
  onOpenAuth
}) => {
  const { recordActivity } = useAuth();
  
  // Active video selection
  const [activeVideoId, setActiveVideoId] = useState<string>(
    initialVideoId || course.lastWatchedVideoId || course.videos[0]?.id
  );
  
  // Panel visibility states: Left content collapsible, AI is floating overlay
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Video playback timing states for AI sync
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  const [playlistSearch, setPlaylistSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'overview'>('notes');
  const [newNoteText, setNewNoteText] = useState('');
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const activeItemRef = useRef<HTMLDivElement>(null);

  const activeVideo = course.videos.find(v => v.id === activeVideoId) || course.videos[0];
  const activeIndex = course.videos.findIndex(v => v.id === activeVideoId);

  const completedCount = course.videos.filter(v => v.completed).length;
  const totalVideos = course.videos.length;
  const courseProgressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  const isAllCompleted = totalVideos > 0 && completedCount === totalVideos;

  // Trigger celebration when course reaches 100%
  useEffect(() => {
    if (isAllCompleted && !hasCelebrated) {
      setHasCelebrated(true);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isAllCompleted, hasCelebrated]);

  // Auto-scroll left playlist to active video
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeVideoId]);

  // Video progress update handler
  const handleProgress = async (currTime: number, totalDur: number) => {
    setCurrentTime(currTime);
    setDuration(totalDur);

    const progressPct = totalDur > 0 ? Math.round((currTime / totalDur) * 100) : 0;

    // Record activity
    recordActivity({
      courseId: course.id,
      courseTitle: course.title,
      videoId: activeVideo.id,
      videoTitle: activeVideo.title,
      thumbnail: activeVideo.thumbnail,
      timestamp: Math.round(currTime),
      duration: Math.round(totalDur),
      completed: activeVideo.completed || progressPct >= 90
    });

    try {
      await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.id,
          currentTime: currTime,
          duration: totalDur
        })
      });
    } catch (err) {
      console.error('Progress sync error:', err);
    }
  };

  // Video completion handler
  const handleVideoEnded = async () => {
    try {
      const res = await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.id,
          completed: true,
          currentTime: duration,
          duration: duration
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          onCourseUpdated(data.course);
        }
      }

      // Autoplay next lesson if enabled
      if (autoPlayNext && activeIndex < course.videos.length - 1) {
        const nextVid = course.videos[activeIndex + 1];
        setActiveVideoId(nextVid.id);
      }
    } catch (err) {
      console.error('Video complete error:', err);
    }
  };

  // Toggle video completed manually
  const handleToggleComplete = async (vidId: string) => {
    const targetVid = course.videos.find(v => v.id === vidId);
    if (!targetVid) return;

    const newCompleted = !targetVid.completed;
    try {
      const res = await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: vidId,
          completed: newCompleted,
          currentTime: newCompleted ? targetVid.durationSeconds : 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          onCourseUpdated(data.course);
        }
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  // Add timestamped note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      const res = await fetch(`/api/courses/${course.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.id,
          timestamp: Math.floor(currentTime),
          text: newNoteText.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          onCourseUpdated(data.course);
          setNewNoteText('');
        }
      }
    } catch (err) {
      console.error('Add note error:', err);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/courses/${course.id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: activeVideo.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          onCourseUpdated(data.course);
        }
      }
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  // Reset entire course
  const handleResetCourse = async () => {
    if (!confirm('Reset all progress for this course?')) return;
    try {
      const res = await fetch(`/api/courses/${course.id}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          onCourseUpdated(data.course);
          setHasCelebrated(false);
        }
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // Seek handler from Notes or AI
  const handleSeekToTimestamp = (seconds: number) => {
    setSeekTarget(seconds);
    setTimeout(() => setSeekTarget(null), 100);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredVideos = course.videos.filter(v =>
    v.title.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors">
      
      {/* Top Header Bar — Clean Google Labs Style */}
      <div className="h-14 shrink-0 bg-white/95 dark:bg-[#0d0e12]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 transition-colors flex items-center">
        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Back Button, Course Syllabus Sidebar Toggle & Course Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToDashboard}
              className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Course Syllabus Toggle Button on Left */}
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
                isLeftSidebarOpen
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                  : 'bg-white dark:bg-[#111216] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
              title={isLeftSidebarOpen ? 'Hide Course Syllabus' : 'Show Course Syllabus'}
            >
              {isLeftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              <span className="hidden sm:inline">Syllabus</span>
              <span className="font-mono text-[10px] text-neutral-500">
                {completedCount}/{totalVideos}
              </span>
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white truncate" title={course.title}>
                {course.title}
              </h1>
            </div>
          </div>

          {/* Right: Progress bar & Reset */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1 min-w-[130px]">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-500 font-medium">Progress</span>
                <span className="font-bold text-[#EA4335] font-mono">
                  {courseProgressPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isAllCompleted ? 'bg-emerald-500' : 'bg-[#EA4335]'
                  }`}
                  style={{ width: `${courseProgressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleResetCourse}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Reset progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Responsive Workspace: Height-locked so video fits without scrolling */}
      <div className="flex-1 w-full h-[calc(100vh-56px)] flex flex-col md:flex-row overflow-hidden">
        
        {/* ======================================================== */}
        {/* LEFT PANEL: Collapsible Course Content & Lessons         */}
        {/* ======================================================== */}
        {isLeftSidebarOpen && (
          <aside className="w-full md:w-80 lg:w-84 shrink-0 bg-white dark:bg-[#111216] border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full overflow-hidden transition-all duration-200">
            
            {/* Header with Title and Search */}
            <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-neutral-950 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#EA4335]" />
                  <span>Lessons</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {completedCount}/{totalVideos}
                  </span>
                  <button
                    onClick={() => setIsLeftSidebarOpen(false)}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
                    title="Collapse"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter lessons */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter lessons..."
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                />
              </div>
            </div>

            {/* Video List Items */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredVideos.map((vid, idx) => {
                const isActive = vid.id === activeVideoId;
                const vidPct = vid.completed 
                  ? 100 
                  : (vid.durationSeconds > 0 ? Math.round((vid.currentTime / vid.durationSeconds) * 100) : vid.progressPercent || 0);

                return (
                  <div
                    key={vid.id}
                    ref={isActive ? activeItemRef : null}
                    onClick={() => setActiveVideoId(vid.id)}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative w-16 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-950">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-[#EA4335]/30 flex items-center justify-center">
                            <Play className="w-3 h-3 fill-white text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium line-clamp-2 leading-snug ${
                          isActive ? 'text-[#EA4335] font-semibold' : 'text-neutral-800 dark:text-neutral-200'
                        }`}>
                          {idx + 1}. {vid.title}
                        </p>
                        <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                          {vid.duration || ''}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(vid.id);
                        }}
                        className="p-1 rounded-full text-neutral-400 hover:text-emerald-500 transition-colors shrink-0"
                        title={vid.completed ? 'Completed' : 'Mark as done'}
                      >
                        {vid.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                        )}
                      </button>
                    </div>

                    {/* Progress Track */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            vid.completed ? 'bg-emerald-500' : 'bg-[#EA4335]'
                          }`}
                          style={{ width: `${vidPct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400">
                        {vidPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ======================================================== */}
        {/* MAIN WINDOW: Full-Width Isolated Video Player           */}
        {/* ======================================================== */}
        <main className="flex-1 h-full overflow-y-auto p-3 sm:p-5 flex flex-col items-center">
          <div className="w-full max-w-5xl space-y-4">
            
            {/* Video Player Container — Full width, no extra nesting clipping */}
            <div className="w-full">
              <VideoPlayer
                video={activeVideo}
                courseVideos={course.videos}
                onVideoEnd={handleVideoEnded}
                onPreviousVideo={() => activeIndex > 0 && setActiveVideoId(course.videos[activeIndex - 1].id)}
                onNextVideo={() => activeIndex < course.videos.length - 1 && setActiveVideoId(course.videos[activeIndex + 1].id)}
                onProgressUpdate={(_vidId, cTime, dTime) => handleProgress(cTime, dTime)}
                onTimeUpdate={(cTime, dTime) => {
                  setCurrentTime(cTime);
                  setDuration(dTime);
                }}
                seekToSeconds={seekTarget}
                onToggleComplete={handleToggleComplete}
                hasPrevious={activeIndex > 0}
                hasNext={activeIndex < course.videos.length - 1}
                autoPlayNext={autoPlayNext}
                onToggleAutoPlayNext={() => setAutoPlayNext(!autoPlayNext)}
              />
            </div>

          {/* Lesson Controls & Information */}
          <div className="p-5 sm:p-6 bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
            
            {/* Top Row: Navigation Buttons (Short labels) & Done Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => activeIndex > 0 && setActiveVideoId(course.videos[activeIndex - 1].id)}
                  disabled={activeIndex === 0}
                  className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <button
                  onClick={() => activeIndex < course.videos.length - 1 && setActiveVideoId(course.videos[activeIndex + 1].id)}
                  disabled={activeIndex === course.videos.length - 1}
                  className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoPlayNext}
                    onChange={(e) => setAutoPlayNext(e.target.checked)}
                    className="accent-[#EA4335] rounded"
                  />
                  <span>Autoplay Next</span>
                </label>

                <button
                  onClick={() => handleToggleComplete(activeVideo.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeVideo?.completed
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{activeVideo?.completed ? 'Done' : 'Mark Done'}</span>
                </button>
              </div>
            </div>

            {/* Title & Instructor */}
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                <span>Lesson {activeIndex + 1} of {course.videos.length}</span>
                {activeVideo?.duration && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{activeVideo.duration}</span>
                  </>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white leading-tight">
                {activeVideo?.title}
              </h2>
              {course.channelTitle && (
                <p className="text-xs text-neutral-500 mt-1">
                  Instructor: <span className="font-medium text-neutral-700 dark:text-neutral-300">{course.channelTitle}</span>
                </p>
              )}
            </div>

            {/* Clean Tabs: Notes & Overview */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-1.5 text-xs font-medium pb-1.5 transition-colors relative ${
                    activeTab === 'notes'
                      ? 'text-[#EA4335]'
                      : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Notes ({activeVideo?.notes?.length || 0})</span>
                  {activeTab === 'notes' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#EA4335] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-1.5 text-xs font-medium pb-1.5 transition-colors relative ${
                    activeTab === 'overview'
                      ? 'text-[#EA4335]'
                      : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Overview</span>
                  {activeTab === 'overview' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#EA4335] rounded-full" />
                  )}
                </button>
              </div>

              {/* Notes Content */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Add timestamped note at ${formatTime(currentTime)}...`}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 px-4 py-2 text-xs rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-white rounded-full text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      Save
                    </button>
                  </form>

                  {/* Note List */}
                  {(!activeVideo.notes || activeVideo.notes.length === 0) ? (
                    <p className="text-xs text-neutral-400 italic py-2">
                      No notes yet for this lesson. Type above to create one at the current timestamp.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeVideo.notes.map(note => (
                        <div
                          key={note.id}
                          className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <button
                              onClick={() => handleSeekToTimestamp(note.timestamp)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#EA4335] hover:underline"
                            >
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(note.timestamp)}</span>
                            </button>
                            <p className="text-neutral-800 dark:text-neutral-200">
                              {note.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <p>{course.description || 'No description provided for this course.'}</p>
                  <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-neutral-400">
                    <div><strong>Total Lessons:</strong> {course.videos.length}</div>
                    {course.channelTitle && <div><strong>Channel:</strong> {course.channelTitle}</div>}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      </div>

      {/* Floating Ollama AI Widget FAB (Only official logo, no text!) */}
      <button
        onClick={() => setIsAIOpen(!isAIOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white dark:bg-[#18191e] border-2 border-neutral-200 dark:border-neutral-700 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center p-2.5 group"
        title="Ollama AI Tutor"
      >
        <OllamaLogo className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
      </button>

      {/* AIPanel Floating Overlay Drawer */}
      <AIPanel
        course={course}
        activeVideo={activeVideo}
        currentTime={currentTime}
        duration={duration}
        onSeekToTimestamp={handleSeekToTimestamp}
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onOpenAuth={onOpenAuth}
      />

    </div>
  );
};

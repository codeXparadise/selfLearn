'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  PanelLeftClose, 
  PanelLeftOpen, 
  RotateCcw, 
  Layers, 
  Search, 
  Play, 
  CheckCircle, 
  Circle, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AIPanel } from '@/components/AIPanel';
import { OllamaLogo } from '@/components/OllamaLogo';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { 
  saveUserProgressToFirebase,
  getUserCourseFromFirebase,
  saveUserCourseToFirebase,
  resetUserCourseProgressInFirebase
} from '@/lib/firebaseDb';
import type { Course, Video } from '@/types';

export default function ClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  
  // Desktop 2-Grid Layout: Resizable and Collapsible Left Sidebar
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // Mobile 2-Grid Layout: Top Video, Bottom Collapsible List
  const [isMobileListCollapsed, setIsMobileListCollapsed] = useState(false);

  // Video and AI Tutor State
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentTimeRef = React.useRef(0);
  const durationRef = React.useRef(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const toggleAIOpen = () => {
    setIsAIOpen((prev) => {
      const next = !prev;
      if (next) {
        setCurrentTime(currentTimeRef.current);
        setDuration(durationRef.current);
      }
      return next;
    });
  };

  // Handle Drag-to-Resize for Desktop Left Grid
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX - 16, 250), 520);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Fetch course with strict per-user isolation
  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);

        // 1. If user is logged in, check user's private Firestore collection first
        if (user?.id) {
          try {
            const cloudCourse = await getUserCourseFromFirebase(user.id, courseId);
            if (cloudCourse) {
              setCourse(cloudCourse);
              if (cloudCourse.videos?.length > 0) {
                const firstUnfinished = cloudCourse.videos.find((v: Video) => !v.completed);
                setActiveVideoId(firstUnfinished ? firstUnfinished.id : cloudCourse.videos[0].id);
              }
              setLoading(false);
              return;
            }
          } catch (e) {}
        }

        // 2. Fetch from backend with user credentials
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
        const headers: Record<string, string> = {};
        if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

        const res = await fetch(`/api/courses/${courseId}${user?.id ? `?userId=${encodeURIComponent(user.id)}` : ''}`, {
          headers,
        });
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
          // If user is authenticated, save a personal copy to their Firestore
          if (user?.id) {
            saveUserCourseToFirebase(user.id, data.course).catch(() => {});
          }
          if (data.course.videos?.length > 0) {
            const firstUnfinished = data.course.videos.find((v: Video) => !v.completed);
            setActiveVideoId(firstUnfinished ? firstUnfinished.id : data.course.videos[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load course:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, user?.id]);

  if (loading || !course) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f4f4f6] dark:bg-[#090a0d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-[#EA4335] rounded-full animate-spin" />
          <p className="text-xs text-neutral-400">Loading classroom...</p>
        </div>
      </div>
    );
  }

  const activeVideo = course.videos?.find((v) => v.id === activeVideoId) || course.videos?.[0];
  const activeIndex = course.videos?.findIndex((v) => v.id === activeVideoId) ?? 0;
  const totalVideos = course.videos?.length || 0;
  const completedCount = course.videos?.filter((v) => v.completed).length || 0;
  const courseProgressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  // Handle video progress sync & real-time activity recording
  const handleProgress = async (currTime: number, totalDur: number, completed = false) => {
    if (!activeVideo) return;
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      // 1. Immediately update local state for responsive UI
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;
        const updatedVideos = (prevCourse.videos || []).map((v) => {
          if (v.id === activeVideo.id) {
            return {
              ...v,
              currentTime: Math.round(currTime),
              durationSeconds: totalDur > 0 ? Math.round(totalDur) : v.durationSeconds,
              completed: completed || v.completed,
              progressPercent: totalDur > 0 ? Math.min(100, Math.round((currTime / totalDur) * 100)) : v.progressPercent,
            };
          }
          return v;
        });
        const completedVids = updatedVideos.filter((v) => v.completed).length;
        return {
          ...prevCourse,
          videos: updatedVideos,
          completedVideos: completedVids,
          overallProgressPercent: updatedVideos.length > 0 ? Math.round((completedVids / updatedVideos.length) * 100) : 0,
        };
      });

      // 2. Persist to Firestore for this user
      if (user?.id) {
        saveUserProgressToFirebase(user.id, course.id, activeVideo.id, currTime, totalDur, completed);

        if (savedToken) {
          fetch('/api/auth/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${savedToken}`,
            },
            body: JSON.stringify({
              courseId: course.id,
              courseTitle: course.title,
              videoId: activeVideo.id,
              videoTitle: activeVideo.title,
              timestamp: currTime,
            }),
          }).catch(() => {});
        }
      }

      // 3. Persist to backend per-user storage
      await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          videoId: activeVideo.id,
          currentTime: currTime,
          duration: totalDur,
          completed,
          userId: user?.id,
        }),
      });
    } catch (e) {}
  };

  const handleToggleComplete = async (vidId: string) => {
    const target = course.videos.find((v) => v.id === vidId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const nextTime = nextCompleted ? target.durationSeconds : 0;

    // 1. Update local state
    setCourse((prevCourse) => {
      if (!prevCourse) return prevCourse;
      const updatedVideos = (prevCourse.videos || []).map((v) => {
        if (v.id === vidId) {
          return {
            ...v,
            completed: nextCompleted,
            currentTime: nextTime,
            progressPercent: nextCompleted ? 100 : 0,
          };
        }
        return v;
      });
      const completedVids = updatedVideos.filter((v) => v.completed).length;
      return {
        ...prevCourse,
        videos: updatedVideos,
        completedVideos: completedVids,
        overallProgressPercent: updatedVideos.length > 0 ? Math.round((completedVids / updatedVideos.length) * 100) : 0,
      };
    });

    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      if (user?.id) {
        saveUserProgressToFirebase(user.id, course.id, vidId, nextTime, target.durationSeconds, nextCompleted);
      }

      await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          videoId: vidId,
          completed: nextCompleted,
          currentTime: nextTime,
          userId: user?.id,
        }),
      });
    } catch (e) {}
  };

  const handleResetCourse = async () => {
    if (!confirm('Reset all progress for this course?')) return;
    try {
      // 1. Reset local state
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;
        const resetVideos = (prevCourse.videos || []).map((v) => ({
          ...v,
          completed: false,
          currentTime: 0,
          progressPercent: 0,
        }));
        return {
          ...prevCourse,
          videos: resetVideos,
          completedVideos: 0,
          overallProgressPercent: 0,
        };
      });

      // 2. Reset in Firestore
      if (user?.id) {
        await resetUserCourseProgressInFirebase(user.id, course.id);
      }

      // 3. Reset in backend
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
      const headers: Record<string, string> = {};
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      await fetch(`/api/courses/${course.id}/reset${user?.id ? `?userId=${encodeURIComponent(user.id)}` : ''}`, {
        method: 'POST',
        headers,
      });
    } catch (e) {}
  };

  const handleSeekToTimestamp = (seconds: number) => {
    setSeekTarget(seconds);
    setTimeout(() => setSeekTarget(null), 100);
  };

  const filteredVideos = (course.videos || []).filter((v) =>
    v.title.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  // Lesson Card with Individual Progress Bar
  const renderLessonItem = (vid: Video, idx: number) => {
    const isActive = vid.id === activeVideoId;
    const vidPct = vid.completed 
      ? 100 
      : (vid.durationSeconds > 0 ? Math.round((vid.currentTime / vid.durationSeconds) * 100) : vid.progressPercent || 0);

    return (
      <div
        key={vid.id}
        onClick={() => setActiveVideoId(vid.id)}
        className={`p-2.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 ${
          isActive
            ? 'bg-neutral-100 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 shadow-2xs'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="relative w-16 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-950 shadow-2xs">
            <img
              src={vid.thumbnail}
              alt={vid.title}
              className="w-full h-full object-cover"
            />
            {isActive && (
              <div className="absolute inset-0 bg-[#EA4335]/35 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-white text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold line-clamp-2 leading-snug ${
              isActive ? 'text-[#EA4335]' : 'text-neutral-800 dark:text-neutral-200'
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
              <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 hover:text-emerald-500" />
            )}
          </button>
        </div>

        {/* Each progressing bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                vid.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-600 via-[#EA4335] to-orange-500'
              }`}
              style={{ width: `${vidPct}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-medium text-neutral-400">
            {vidPct}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f3f4f6] dark:bg-[#08090c] text-neutral-900 dark:text-neutral-100 p-2 sm:p-3 md:p-3.5 relative flex flex-col md:flex-row gap-2 sm:gap-3">



      {/* ======================================================== */}
      {/* 1. SYLLABUS / CURRICULUM PANEL (Bottom on Mobile, Left on Desktop) */}
      {/* ======================================================== */}
      <aside
        style={typeof window !== 'undefined' && window.innerWidth >= 768 ? { width: isLeftSidebarOpen ? `${sidebarWidth}px` : '0px' } : undefined}
        className={`order-2 md:order-1 rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111216] shadow-sm flex flex-col overflow-hidden transition-all duration-150 select-none ${
          !isLeftSidebarOpen ? 'md:hidden' : 'shrink-0'
        } ${
          isMobileListCollapsed ? 'h-auto max-h-[76px] md:h-full md:max-h-none' : 'flex-1 md:flex-none md:h-full'
        }`}
      >
        {/* Syllabus Header */}
        <div className="p-3 sm:p-3.5 border-b border-neutral-100 dark:border-neutral-800/80 space-y-2 bg-neutral-50/50 dark:bg-neutral-900/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden md:flex p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#EA4335]" />
                <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">Curriculum</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                {completedCount}/{totalVideos}
              </span>
              
              {/* Mobile collapse / expand */}
              <button
                onClick={() => setIsMobileListCollapsed(!isMobileListCollapsed)}
                className="md:hidden flex items-center gap-1 text-[11px] font-semibold text-[#EA4335] hover:text-orange-600 p-1 rounded-full transition-colors"
                title={isMobileListCollapsed ? 'Expand list' : 'Collapse list'}
              >
                <span>{isMobileListCollapsed ? 'Expand' : 'Collapse'}</span>
                {isMobileListCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Desktop collapse */}
              <button
                onClick={() => setIsLeftSidebarOpen(false)}
                className="hidden md:flex p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
                title="Collapse Syllabus"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Total Progressive Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-500 font-medium">Total Course Progress</span>
              <span className="font-bold font-mono text-[#EA4335]">{courseProgressPercent}%</span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-[#EA4335] to-orange-500 transition-all duration-300"
                style={{ width: `${courseProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Filter lessons */}
          <div className={`relative ${isMobileListCollapsed ? 'hidden md:block' : 'block'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search playlist lessons..."
              value={playlistSearch}
              onChange={(e) => setPlaylistSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white placeholder-neutral-400 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Scrollable Lesson Items */}
        <div 
          data-lenis-prevent 
          className={`flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/50 overscroll-contain ${
            isMobileListCollapsed ? 'hidden md:block' : 'block'
          }`}
          style={{ scrollbarWidth: 'thin' }}
        >
          {filteredVideos.map((vid, idx) => renderLessonItem(vid, idx))}
        </div>
      </aside>

      {/* Resizer Handle Splitter between Left Grid and Main Grid (Desktop only) */}
      {isLeftSidebarOpen && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="hidden md:flex items-center justify-center w-2 hover:w-3 cursor-col-resize group shrink-0 transition-all select-none relative z-20 py-4"
          title="Drag to resize syllabus"
        >
          <div className={`w-1 h-12 rounded-full transition-colors ${
            isResizing ? 'bg-[#EA4335]' : 'bg-neutral-300 dark:bg-neutral-700 group-hover:bg-[#EA4335]'
          }`} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN SECTION: HEADER + VIDEO PLAYER + CONTROLS        */}
      {/* ======================================================== */}
      <section className="order-1 md:order-2 flex-1 h-auto md:h-full min-w-0 rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111216] shadow-sm flex flex-col overflow-hidden">
        
        {/* Upper Header */}
        <header className="h-12 sm:h-14 shrink-0 px-3 sm:px-6 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 backdrop-blur-sm flex items-center justify-between gap-3">
          
          {/* Left: Brand logo & Syllabus toggle if closed */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              href="/dashboard"
              className="md:hidden p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {!isLeftSidebarOpen && (
              <button
                onClick={() => setIsLeftSidebarOpen(true)}
                className="hidden md:flex p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-750 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors shadow-2xs"
                title="Open Syllabus"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <Logo size="sm" href="/dashboard" />
          </div>

          {/* Center: Course Title & Video Title */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 sm:px-2">
            <div className="flex items-center gap-1.5 sm:gap-2 max-w-2xl truncate text-center text-xs sm:text-sm">
              <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[130px] sm:max-w-[220px]" title={course.title}>
                {course.title}
              </span>
              <span className="text-neutral-400 font-bold shrink-0 hidden sm:inline">:</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-[150px] sm:max-w-[280px] hidden sm:inline" title={activeVideo?.title}>
                {activeVideo?.title}
              </span>
            </div>
          </div>

          {/* Right: Lesson Prev/Next (Mobile) & Progress + Reset (Desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile quick prev/next */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => activeIndex > 0 && setActiveVideoId(course.videos[activeIndex - 1].id)}
                disabled={activeIndex <= 0}
                className="p-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-2xs"
                title="Previous Lesson"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => activeIndex < course.videos.length - 1 && setActiveVideoId(course.videos[activeIndex + 1].id)}
                disabled={activeIndex >= course.videos.length - 1}
                className="p-1.5 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-2xs"
                title="Next Lesson"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop progress badge */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs">
              <span className="text-neutral-500 font-medium">Progress</span>
              <span className="font-bold text-[#EA4335] font-mono">{courseProgressPercent}%</span>
            </div>

            <button
              onClick={handleResetCourse}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Reset course progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </header>

        {/* Main Video Scrollable Container */}
        <main 
          data-lenis-prevent 
          className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 overscroll-contain"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="w-full max-w-5xl mx-auto space-y-3 sm:space-y-4">
            
            {/* Centered Single Video Player Card */}
            <div className="w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-neutral-200/80 dark:border-neutral-800 bg-black">
              <VideoPlayer
                video={activeVideo}
                courseVideos={course.videos}
                onVideoEnd={() => {}}
                onPreviousVideo={() => activeIndex > 0 && setActiveVideoId(course.videos[activeIndex - 1].id)}
                onNextVideo={() => activeIndex < course.videos.length - 1 && setActiveVideoId(course.videos[activeIndex + 1].id)}
                onProgressUpdate={(_vidId, cTime, dTime, isDone) => handleProgress(cTime, dTime, isDone)}
                onTimeUpdate={(cTime, dTime) => {
                  currentTimeRef.current = cTime;
                  durationRef.current = dTime;
                  if (isAIOpen) {
                    setCurrentTime(cTime);
                    setDuration(dTime);
                  }
                }}
                seekToSeconds={seekTarget}
                onToggleComplete={handleToggleComplete}
                hasPrevious={activeIndex > 0}
                hasNext={activeIndex < course.videos.length - 1}
                autoPlayNext={autoPlayNext}
                onToggleAutoPlayNext={() => setAutoPlayNext(!autoPlayNext)}
              />
            </div>

            {/* Below Video Info & Action Switcher */}
            <div className="p-3 sm:p-5 rounded-2xl md:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <span className="font-semibold text-neutral-600 dark:text-neutral-400">Lesson {activeIndex + 1} of {totalVideos}</span>
                  {activeVideo?.duration && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{activeVideo.duration}</span>
                    </>
                  )}
                  {course.channelTitle && (
                    <>
                      <span>•</span>
                      <span>{course.channelTitle}</span>
                    </>
                  )}
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-neutral-950 dark:text-white leading-tight">
                  {activeVideo?.title}
                </h2>
              </div>

              {/* Previous & Next Lesson Circular Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => activeIndex > 0 && setActiveVideoId(course.videos[activeIndex - 1].id)}
                  disabled={activeIndex <= 0}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    activeIndex > 0
                      ? 'bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-orange-500 hover:text-[#EA4335] active:scale-95 shadow-2xs'
                      : 'opacity-30 cursor-not-allowed border-neutral-200 dark:border-neutral-850 text-neutral-400'
                  }`}
                  title="Previous Lesson [P]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  onClick={() => activeIndex < course.videos.length - 1 && setActiveVideoId(course.videos[activeIndex + 1].id)}
                  disabled={activeIndex >= course.videos.length - 1}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    activeIndex < course.videos.length - 1
                      ? 'bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 border-transparent hover:ring-2 hover:ring-orange-500/50 active:scale-95 shadow-2xs'
                      : 'opacity-30 cursor-not-allowed border-neutral-200 dark:border-neutral-850 text-neutral-400'
                  }`}
                  title="Next Lesson [N]"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </main>

      </section>

      {/* ======================================================== */}
      {/* FLOATING & ANIMATED TRANSLUCENT AI TUTOR FAB             */}
      {/* ======================================================== */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggleAIOpen}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-white/45 dark:bg-black/50 backdrop-blur-md border border-white/50 dark:border-white/15 shadow-xl hover:shadow-[#EA4335]/30 transition-all flex items-center justify-center p-2.5 group ring-1 ring-white/20 dark:ring-white/10"
        title="Ollama AI Tutor"
      >
        <OllamaLogo className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#14151b] rounded-full animate-pulse shadow-xs" />
      </motion.button>

      {/* AIPanel Floating Overlay Drawer */}
      <AIPanel
        course={course}
        activeVideo={activeVideo}
        currentTime={currentTime}
        duration={duration}
        onSeekToTimestamp={handleSeekToTimestamp}
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

    </div>
  );
}

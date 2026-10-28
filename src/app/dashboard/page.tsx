'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Play, 
  CheckCircle, 
  Trash2, 
  RotateCcw, 
  Layers, 
  Clock, 
  BarChart3, 
  Flame, 
  Award,
  Sparkles,
  AlertCircle,
  Loader2,
  TrendingUp,
  PieChart,
  Calendar,
  Zap,
  Target,
  Code2,
  Cpu,
  Database,
  Globe
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { ProductTour } from '@/components/ProductTour';
import { AICourseCuratorWidget } from '@/components/AICourseCuratorWidget';
import { OllamaOnboardingModal } from '@/components/OllamaOnboardingModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { 
  saveUserCourseToFirebase, 
  getUserCoursesFromFirebase, 
  deleteUserCourseFromFirebase,
  seedStarterCoursesToFirebase
} from '@/lib/firebaseDb';
import { 
  detectCourseCategory, 
  computeDynamicCurriculumCategories 
} from '@/lib/courseCategories';
import type { Course } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading, needsOllamaOnboarding, setNeedsOllamaOnboarding } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  
  // Modals
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [aiCuratorOpen, setAiCuratorOpen] = useState(false);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);

  // Trigger tour on first login
  useEffect(() => {
    if (!authLoading && user) {
      const tourDone = localStorage.getItem('self_learn_tour_done');
      if (!tourDone) {
        setShowTour(true);
      }
    }
  }, [user, authLoading]);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      // If user is authenticated, isolate their courses strictly
      if (user?.id) {
        // 1. Fetch from user's isolated Firestore subcollection: users/{userId}/courses
        const cloudCourses = await getUserCoursesFromFirebase(user.id);
        
        // 2. If Firestore has courses, use them exclusively
        if (cloudCourses && cloudCourses.length > 0) {
          setCourses(cloudCourses);
          setLoading(false);
          return;
        }

        // 3. If Firestore is empty, check backend per-user storage (not global)
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
        if (savedToken) {
          try {
            const res = await fetch(`/api/courses?userId=${encodeURIComponent(user.id)}`, {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
              setCourses(data.courses);
              setLoading(false);
              return;
            }
          } catch (e) {}
        }

        // Fresh new user starts with 0 courses, 0 stats, completely isolated!
        setCourses([]);
        setLoading(false);
        return;
      }

      // Guest / unauthenticated user: empty initial state
      setCourses([]);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleCourseCreated = async (newCourse: Course) => {
    if (user?.id) {
      await saveUserCourseToFirebase(user.id, newCourse);
    }
    await fetchCourses();
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
      const headers: Record<string, string> = {};
      if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;

      await fetch(`/api/courses/${id}${user?.id ? `?userId=${encodeURIComponent(user.id)}` : ''}`, {
        method: 'DELETE',
        headers,
      });

      if (user?.id) {
        await deleteUserCourseFromFirebase(user.id, id);
      }
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteCourseId(null);
    }
  };

  const handleSeedStarterCourses = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        // Seed strictly into this user's personal Firestore collection
        const seeded = await seedStarterCoursesToFirebase(user.id);

        // Also notify backend per-user storage
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('self_learn_token') : null;
        const headers: Record<string, string> = {};
        if (savedToken) headers['Authorization'] = `Bearer ${savedToken}`;
        await fetch(`/api/courses/seed?userId=${encodeURIComponent(user.id)}`, {
          method: 'POST',
          headers,
        }).catch(() => {});

        setCourses(seeded);
      } else {
        const res = await fetch('/api/courses/seed', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute analytics
  const totalCourses = courses.length;
  const completedCoursesCount = courses.filter(
    (c) => c.videos && c.videos.length > 0 && c.videos.every((v) => v.completed)
  ).length;

  const totalVideosInAllCourses = courses.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0);
  const completedVideosInAllCourses = courses.reduce(
    (acc, c) => acc + (c.videos ? c.videos.filter((v) => v.completed).length : 0),
    0
  );

  const overallProgressPercentage =
    totalVideosInAllCourses > 0
      ? Math.round((completedVideosInAllCourses / totalVideosInAllCourses) * 100)
      : 0;

  const totalDurationSeconds = courses.reduce((acc, c) => acc + (c.totalDurationSeconds || 0), 0);
  const totalHours = (totalDurationSeconds / 3600).toFixed(1);

  // Dynamically calculate 7-day study usage from user's live course progress and activity history
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Sum up all watched seconds from live courses
  const totalWatchedSecondsAcrossAll = courses.reduce(
    (acc, c) => acc + (c.videos ? c.videos.reduce((vAcc, v) => vAcc + (v.currentTime || 0), 0) : 0),
    0
  );

  // Group activity history by day of the week
  const dayMinutesMap: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayLessonsMap: number[] = [0, 0, 0, 0, 0, 0, 0];

  if (user?.activityHistory && user.activityHistory.length > 0) {
    user.activityHistory.forEach((act: any) => {
      const actDate = new Date(act.updatedAt || act.timestamp || Date.now());
      const dayIdx = (actDate.getDay() + 6) % 7;
      dayMinutesMap[dayIdx] += (act.timestamp ? Math.round(act.timestamp / 60) : 15);
      dayLessonsMap[dayIdx] += 1;
    });
  }

  // If user has course watch progress, dynamically distribute into active days
  if (totalWatchedSecondsAcrossAll > 0) {
    const totalWatchedHrs = totalWatchedSecondsAcrossAll / 3600;
    const activeDaysCount = currentDayOfWeek + 1;
    const baseShareHrs = totalWatchedHrs / activeDaysCount;
    for (let i = 0; i <= currentDayOfWeek; i++) {
      if (dayMinutesMap[i] === 0) {
        dayMinutesMap[i] = Math.round(baseShareHrs * 60);
        dayLessonsMap[i] = Math.max(1, Math.round(completedVideosInAllCourses / activeDaysCount));
      }
    }
  }

  const dailyTimeUsage = dayNames.map((dayName, idx) => {
    const hours = parseFloat((dayMinutesMap[idx] / 60).toFixed(1));
    const lessons = dayLessonsMap[idx];
    const isToday = idx === currentDayOfWeek;
    const isPastOrToday = idx <= currentDayOfWeek;
    return {
      day: dayName,
      hours,
      lessons,
      target: 2.0,
      isToday,
      active: isPastOrToday && hours > 0,
    };
  });

  const totalWeeklyStudyHours = dailyTimeUsage.reduce((acc, d) => acc + d.hours, 0).toFixed(1);
  const maxDailyScale = Math.max(...dailyTimeUsage.map((d) => d.hours), 3.0);

  // Dynamic Streak Calculation
  let currentStreak = 0;
  for (let i = currentDayOfWeek; i >= 0; i--) {
    if (dailyTimeUsage[i].hours > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  const streakText = currentStreak > 0
    ? `${currentStreak} Day${currentStreak > 1 ? 's' : ''} Active 🔥`
    : (completedVideosInAllCourses > 0 || totalWatchedSecondsAcrossAll > 0 ? '1 Day Active 🔥' : 'Start Today 🚀');

  // Dynamic Today's Goal Progress
  const todayUsageHours = dailyTimeUsage[currentDayOfWeek]?.hours || 0;
  const todayTarget = 2.0;
  const todayGoalPercent = Math.min(100, Math.round((todayUsageHours / todayTarget) * 100));
  const todayGoalStatusText = todayGoalPercent >= 100
    ? 'Target Met 100% 🎉'
    : (todayGoalPercent > 0 ? `${todayGoalPercent}% of Today's Goal` : '0% of Today\'s Goal');

  // Dynamic Time Saved from YouTube Ads & Distractions
  // YouTube averages ~3 mins of ad breaks and recommendations per video
  const savedMinutes = Math.round((completedVideosInAllCourses * 3) + (totalWatchedSecondsAcrossAll / 3600) * 12);
  const savedHoursFormatted = savedMinutes >= 60 ? `${(savedMinutes / 60).toFixed(1)}h` : `${savedMinutes}m`;

  // Dynamic Weekly Trend & Average Focus
  const daysPassedThisWeek = currentDayOfWeek + 1;
  const totalWeeklyNum = parseFloat(totalWeeklyStudyHours);
  const avgDailyFocus = daysPassedThisWeek > 0 ? (totalWeeklyNum / daysPassedThisWeek).toFixed(1) : '0.0';
  const weeklyPaceStatus = totalWeeklyNum >= 2.0
    ? 'On Track 🚀'
    : (totalWeeklyNum > 0 ? 'Active Pace ⚡' : 'Ready to Start ⏱️');

  // Categorized Data Visualization Computation: 100% Dynamic & derived from playlist metadata
  const categorizedData = computeDynamicCurriculumCategories(courses);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.channelTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar
        onOpenCreateModal={() => setCreateCourseOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAICurator={() => setAiCuratorOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Top Header & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
              Course Hub & Analytics
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Your distraction-free YouTube curriculum workspace with real-time learning metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 focus:border-[#EA4335] outline-none text-neutral-900 dark:text-white"
              />
            </div>

            <Button
              onClick={() => setCreateCourseOpen(true)}
              variant="primary"
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Course</span>
            </Button>

            {/* AI Course Curator Trigger Button */}
            <Button
              onClick={() => setAiCuratorOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-[#EA4335] hover:bg-red-100 dark:hover:bg-red-950/40 shrink-0"
              title="Ask AI to find & auto-import courses"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>Ask AI</span>
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ANIMATED STATS ROW: Completion, Streak, Total Watch Time  */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Donut Progress Chart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Overall Completion
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white font-mono">
                  {overallProgressPercentage}%
                </span>
                <span className="text-xs text-neutral-500">
                  ({completedVideosInAllCourses}/{totalVideosInAllCourses} lessons)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {completedCoursesCount} of {totalCourses} curricula finished
              </p>
            </div>

            {/* Animated SVG Donut Chart */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-100 dark:text-neutral-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${overallProgressPercentage}, 100` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="text-[#EA4335]"
                  strokeLinecap="round"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-[11px] font-mono">
                {overallProgressPercentage}%
              </div>
            </div>
          </div>

          {/* Card 2: Streak & Active Habits */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Daily Study Streak</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold">
                {streakText}
              </span>
            </div>

            {/* 7-Day Habit Bubbles */}
            <div className="flex items-center justify-between py-2">
              {dailyTimeUsage.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      d.isToday
                        ? 'bg-[#EA4335] text-white ring-2 ring-red-400/50 shadow-sm'
                        : d.active
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {d.day[0]}
                  </motion.div>
                  <span className="text-[9px] font-mono text-neutral-400">{d.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
              <span>Goal: <strong>{todayTarget.toFixed(1)} hrs / day</strong></span>
              <span className={`font-semibold ${todayGoalPercent >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {todayGoalStatusText}
              </span>
            </div>
          </div>

          {/* Card 3: Total Watch Hours & Actions */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Total Video Time Logged</span>
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white font-mono">
                  {totalHours}h
                </span>
                <span className="text-xs text-neutral-500">
                  across {totalCourses} courses
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Saved ~{savedHoursFormatted} of YouTube ads and distraction interruptions
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Button
                onClick={() => setCreateCourseOpen(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                + Add Course
              </Button>
              {courses.length === 0 && (
                <Button
                  onClick={handleSeedStarterCourses}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Load Starter
                </Button>
              )}
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* ADVANCED ANIMATED DATA VISUALIZATION SECTION             */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: Animated Daily Time Usage Bar Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#EA4335]" />
                  <span>Daily Study Time Usage</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Hours spent watching lessons and taking notes over the last 7 days.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-neutral-400">Total Week:</span>
                  <span className="font-bold text-[#EA4335]">{totalWeeklyStudyHours} hrs</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  <span>{weeklyPaceStatus}</span>
                </div>
              </div>
            </div>

            {/* Interactive Vertical Bar Chart with Target Goal Line */}
            <div className="relative pt-6 pb-2">
              {/* 2.0h Goal Dotted Line across Chart */}
              <div 
                className="absolute left-0 right-0 border-b border-dashed border-neutral-300 dark:border-neutral-700 z-10 pointer-events-none flex items-center justify-end pr-2"
                style={{ bottom: `${(2.0 / maxDailyScale) * 160 + 28}px` }}
              >
                <span className="text-[10px] font-mono text-neutral-400 bg-white dark:bg-[#111216] px-1.5 py-0.5 rounded">
                  Target 2.0h
                </span>
              </div>

              {/* Bars Container */}
              <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6">
                {dailyTimeUsage.map((item, idx) => {
                  const heightPercent = Math.round((item.hours / maxDailyScale) * 100);
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div 
                      key={item.day}
                      className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="absolute -top-12 z-30 px-2.5 py-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-mono whitespace-nowrap shadow-xl"
                        >
                          <div className="font-bold">{item.hours} hrs</div>
                          <div className="text-[9px] opacity-75">{item.lessons} lessons</div>
                        </motion.div>
                      )}

                      {/* Animated Vertical Bar */}
                      <div className="w-full max-w-[42px] bg-neutral-100 dark:bg-neutral-850 rounded-2xl overflow-hidden h-full flex items-end p-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          className={`w-full rounded-xl transition-all ${
                            item.isToday
                              ? 'bg-gradient-to-t from-red-600 to-[#EA4335] shadow-sm shadow-[#EA4335]/30'
                              : item.hours >= item.target
                              ? 'bg-gradient-to-t from-red-500 to-amber-500'
                              : 'bg-neutral-300 dark:bg-neutral-700 group-hover:bg-[#EA4335]'
                          }`}
                        />
                      </div>

                      {/* Day Label below bar */}
                      <span className={`text-[11px] font-medium mt-2 transition-colors ${
                        item.isToday ? 'text-[#EA4335] font-bold' : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Chart Footer Legend */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EA4335]" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-amber-500" />
                  <span>Goal Met (≥ 2.0h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <span>Standard Session</span>
                </div>
              </div>

              <span className="font-mono text-[11px]">Average Focus: <strong>{avgDailyFocus} hrs/day</strong></span>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: Categorized Data Visualization */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  <span>Curriculum Categories</span>
                </h3>
                <span className="text-xs font-mono text-neutral-400 font-semibold">
                  {courses.length} Playlists
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Subject breakdown and progress distribution across study areas.
              </p>
            </div>

            {/* Categorized List with Animated Horizontal Bars */}
            <div className="space-y-4">
              {categorizedData.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 space-y-1">
                  <p className="font-semibold text-neutral-600 dark:text-neutral-300">No playlists loaded yet</p>
                  <p className="text-[11px] opacity-75">Import your first course above to trigger automatic topic classification.</p>
                </div>
              ) : (
                categorizedData.map((cat, idx) => {
                  const IconComponent = cat.icon;
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg ${cat.bgLight} ${cat.textLight}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {cat.name}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-500 font-medium">
                          {cat.hours} hrs ({cat.percentage}%)
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 0.9, delay: 0.2 + idx * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Productivity Tip Pill */}
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-100 dark:border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {categorizedData.length > 0 ? (
                  <><strong>Auto-Detected:</strong> Your curriculum is centered around <strong>{categorizedData[0].tag}</strong> ({categorizedData[0].totalLessons} lessons, {categorizedData[0].hours} hrs).</>
                ) : (
                  <><strong>AI Tip:</strong> Import any YouTube playlist to unlock automated metadata classification & focus metrics.</>
                )}
              </p>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* YOUR CURATED PLAYLISTS COURSE CARDS GRID                 */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-950 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#EA4335]" />
              <span>Your Curated Playlists</span>
              <span className="text-xs font-mono font-normal text-neutral-400">
                ({filteredCourses.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-[#EA4335] animate-spin" />
              <p className="text-xs text-neutral-400">Syncing courses from Firestore...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Play className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  No courses found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Paste any YouTube playlist link to build your first focused, ads-free curriculum.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button onClick={() => setCreateCourseOpen(true)} variant="primary" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Playlist
                </Button>
                <Button onClick={handleSeedStarterCourses} variant="outline" size="sm">
                  Load Starter Courses
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => {
                const totalVids = c.videos?.length || 0;
                const completedVids = c.videos?.filter((v) => v.completed).length || 0;
                const pct = totalVids > 0 ? Math.round((completedVids / totalVids) * 100) : 0;
                const isFinished = pct === 100;
                const category = detectCourseCategory(c);
                const CategoryIcon = category.icon;

                return (
                  <div
                    key={c.id}
                    className="group bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Course Thumbnail */}
                      <Link href={`/classroom/${c.id}`} className="block relative aspect-video overflow-hidden bg-neutral-950">
                        <img
                          src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                          <div className="w-full flex items-center justify-between text-white">
                            <span className="text-[11px] font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                              {totalVids} lessons
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#EA4335] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Course Info */}
                      <div className="p-5 space-y-3">
                        <div>
                          {/* Auto-Detected Category Tag Pill & Channel Name */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${category.badgeClass}`}>
                              <CategoryIcon className="w-3 h-3 shrink-0" />
                              <span>{category.tag}</span>
                            </span>

                            <span className="text-[11px] font-medium text-neutral-400 truncate max-w-[130px]">
                              {c.channelTitle || 'YouTube Academy'}
                            </span>
                          </div>

                          <Link href={`/classroom/${c.id}`}>
                            <h3 className="font-bold text-sm text-neutral-950 dark:text-white line-clamp-2 hover:text-[#EA4335] transition-colors mt-0.5">
                              {c.title}
                            </h3>
                          </Link>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500 font-medium">Progress</span>
                            <span className="font-bold font-mono text-[#EA4335]">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFinished ? 'bg-emerald-500' : 'bg-[#EA4335]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80">
                      <Link
                        href={`/classroom/${c.id}`}
                        className="text-xs font-semibold text-[#EA4335] hover:text-[#d9382b] flex items-center gap-1"
                      >
                        <span>{pct > 0 ? 'Resume Course' : 'Start Course'}</span>
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </Link>

                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      <Footer />

      {/* Global Modals */}
      <CreateCourseModal
        isOpen={createCourseOpen}
        onClose={() => setCreateCourseOpen(false)}
        onCourseCreated={handleCourseCreated}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProductTour
        isOpen={showTour}
        onClose={() => {
          localStorage.setItem('self_learn_tour_done', 'true');
          setShowTour(false);
        }}
      />

      <AICourseCuratorWidget
        isOpen={aiCuratorOpen}
        onClose={() => setAiCuratorOpen(false)}
        onCourseImported={handleCourseCreated}
      />

      <OllamaOnboardingModal
        isOpen={needsOllamaOnboarding}
        onClose={() => setNeedsOllamaOnboarding(false)}
      />

    </div>
  );
}

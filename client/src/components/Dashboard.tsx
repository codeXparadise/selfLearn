import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Layers, 
  Trash2 
} from 'lucide-react';
import type { Course } from '../types';
import { CourseCard } from './CourseCard';

interface DashboardProps {
  courses: Course[];
  onOpenCourse: (courseId: string, videoId?: string) => void;
  onOpenCreateModal: () => void;
  onDeleteCourse: (courseId: string) => void;
  onResetProgress: (courseId: string) => void;
  onSeedStarterCourses: () => void;
  searchTerm: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  courses,
  onOpenCourse,
  onOpenCreateModal,
  onDeleteCourse,
  onResetProgress,
  onSeedStarterCourses,
  searchTerm
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [deleteModalCourse, setDeleteModalCourse] = useState<Course | null>(null);

  // Overall statistics
  const totalCourses = courses.length;
  const totalVideos = courses.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0);
  const totalCompletedVideos = courses.reduce(
    (acc, c) => acc + (c.videos ? c.videos.filter(v => v.completed).length : 0), 
    0
  );
  const totalMasteredCourses = courses.filter(
    c => c.videos && c.videos.length > 0 && c.videos.every(v => v.completed)
  ).length;

  const inProgressCount = courses.filter(
    c => c.videos && c.videos.some(v => v.completed || (v.progressPercent && v.progressPercent > 0)) && !c.videos.every(v => v.completed)
  ).length;

  const overallWatchPercent = totalVideos > 0 
    ? Math.round((totalCompletedVideos / totalVideos) * 100) 
    : 0;

  // Total Duration formatted
  const totalDurationSeconds = courses.reduce(
    (acc, c) => acc + (c.totalDurationSeconds || 0), 0
  );
  const totalHours = (totalDurationSeconds / 3600).toFixed(1);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.videos.some(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    const isComplete = course.videos.length > 0 && course.videos.every(v => v.completed);
    const hasStarted = course.videos.some(v => v.completed || (v.progressPercent && v.progressPercent > 0));

    if (filterTab === 'completed') return isComplete;
    if (filterTab === 'in_progress') return hasStarted && !isComplete;
    return true;
  });

  // Calculate SVG Donut Geometry
  const donutRadius = 42;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const completedOffset = donutCircumference - (donutCircumference * overallWatchPercent) / 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Google Labs Header: Clean 3-Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Card 1: Completion Donut Chart (Col 4) */}
        <div className="md:col-span-4 p-5 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 flex items-center gap-5 shadow-xs">
          {/* SVG Donut */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={donutRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-neutral-100 dark:text-neutral-800"
              />
              <circle
                cx="50"
                cy="50"
                r={donutRadius}
                fill="none"
                stroke="#EA4335"
                strokeWidth="10"
                strokeDasharray={donutCircumference}
                strokeDashoffset={completedOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold text-neutral-900 dark:text-white font-mono leading-none">
                {overallWatchPercent}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium mt-0.5">
                Done
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Overall Progress</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {totalCompletedVideos} <span className="text-xs font-normal text-neutral-400">/ {totalVideos} lessons</span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              {totalMasteredCourses} of {totalCourses} courses completed
            </p>
          </div>
        </div>

        {/* Card 2: Weekly Momentum Area / Line Chart (Col 5) */}
        <div className="md:col-span-5 p-5 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EA4335]" />
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Learning Momentum
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              {totalHours}h Curated
            </span>
          </div>

          {/* Clean Google-style Line / Trend Chart */}
          <div className="h-16 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EA4335" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#EA4335" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Background Area fill */}
              <path
                d="M 0,50 Q 50,45 100,30 T 200,20 T 300,5 L 300,60 L 0,60 Z"
                fill="url(#areaGradient)"
              />
              {/* Foreground Spline */}
              <path
                d="M 0,50 Q 50,45 100,30 T 200,20 T 300,5"
                fill="none"
                stroke="#EA4335"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Data points */}
              <circle cx="100" cy="30" r="3" fill="#EA4335" />
              <circle cx="200" cy="20" r="3" fill="#EA4335" />
              <circle cx="300" cy="5" r="3.5" fill="#EA4335" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Today</span>
          </div>
        </div>

        {/* Card 3: Fast Action & Summary (Col 3) */}
        <div className="md:col-span-3 p-5 rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Course Hub
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {totalCourses}
              </span>
              <span className="text-xs text-neutral-400">Total Courses</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {inProgressCount} in progress
            </p>
          </div>

          {/* Action button (short text!) */}
          <button
            onClick={onOpenCreateModal}
            className="w-full mt-3 py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white text-xs font-semibold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>

      </div>

      {/* Courses Section Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            My Courses
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Isolated playlist environments with dual progress tracking.
          </p>
        </div>

        {/* Clean Google Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            All ({courses.length})
          </button>
          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1 rounded-full transition-all ${
              filterTab === 'in_progress'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Active ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1 rounded-full transition-all ${
              filterTab === 'completed'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Done ({totalMasteredCourses})
          </button>
        </div>
      </div>

      {/* Empty State / Grid */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111216] border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {searchTerm ? 'No matching courses found' : 'No courses yet'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
              {searchTerm 
                ? 'Try a different search query or clear the filter.'
                : 'Import any YouTube playlist URL to start learning distraction-free.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-2.5 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-full text-xs font-semibold shadow-xs"
            >
              + New Course
            </button>
            {courses.length === 0 && (
              <button
                onClick={onSeedStarterCourses}
                className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Sample Courses
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onOpenCourse={onOpenCourse}
              onDeleteCourse={() => setDeleteModalCourse(course)}
              onResetProgress={onResetProgress}
            />
          ))}
        </div>
      )}

      {/* Clean Delete Confirmation Dialog */}
      {deleteModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#121216] p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#EA4335] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Delete Course?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                  {deleteModalCourse.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              This will remove the course and its watch progress from your personal hub.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalCourse(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteCourse(deleteModalCourse.id);
                  setDeleteModalCourse(null);
                }}
                className="px-4 py-2 bg-[#EA4335] hover:bg-red-700 text-white rounded-full text-xs font-bold shadow-xs active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

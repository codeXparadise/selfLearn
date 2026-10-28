import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Trash2, 
  RotateCcw, 
  BookOpen
} from 'lucide-react';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onOpenCourse: (courseId: string, videoId?: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onResetProgress: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpenCourse,
  onDeleteCourse,
  onResetProgress
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const completedCount = course.videos.filter(v => v.completed).length;
  const totalVideos = course.videos.length;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
  const isFinished = totalVideos > 0 && completedCount === totalVideos;

  const nextVideo = 
    course.videos.find(v => v.id === course.lastWatchedVideoId) ||
    course.videos.find(v => !v.completed) ||
    course.videos[0];

  const formatTotalDuration = (seconds: number) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="group bg-white dark:bg-[#111216] rounded-3xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      
      {/* Thumbnail Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
        <img
          src={course.thumbnail || course.videos[0]?.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Minimal Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Video Count Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/10">
          <BookOpen className="w-3 h-3 text-[#EA4335]" />
          <span>{totalVideos} Lessons</span>
          {course.totalDurationSeconds > 0 && (
            <>
              <span className="text-white/40">•</span>
              <span className="text-neutral-300 font-normal">{formatTotalDuration(course.totalDurationSeconds)}</span>
            </>
          )}
        </div>

        {/* Course Menu Options (Reset Progress & Delete) */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div 
                className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#18191e] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-20 text-xs font-medium animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onResetProgress(course.id);
                  }}
                  className="w-full px-3 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Reset Progress</span>
                </button>
                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteCourse(course.id);
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Course</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Channel tag */}
        {course.channelTitle && (
          <div className="absolute bottom-2.5 left-3 text-white/90 text-[11px] font-medium truncate max-w-[80%]">
            {course.channelTitle}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 
            onClick={() => onOpenCourse(course.id, nextVideo?.id)}
            className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white line-clamp-2 hover:text-[#EA4335] dark:hover:text-[#EA4335] cursor-pointer transition-colors"
            title={course.title}
          >
            {course.title}
          </h3>

          {course.description && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>

        {/* Altogether Course Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
              {isFinished ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Completed</span>
                </>
              ) : (
                <span>Progress</span>
              )}
            </span>
            <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-white">
              {completedCount}/{totalVideos} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                isFinished ? 'bg-emerald-500' : 'bg-[#EA4335]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Buttons: Action (Short text) & Expand Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onOpenCourse(course.id, nextVideo?.id)}
            className="flex-1 py-2 px-3 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{completedCount === 0 ? 'Start' : isFinished ? 'Review' : 'Continue'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-full border text-xs font-medium transition-colors ${
              isExpanded 
                ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white' 
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
            title={isExpanded ? 'Collapse lessons' : 'View all lessons'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Lessons List */}
        {isExpanded && (
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 px-1">
              <span>All Lessons ({course.videos.length})</span>
              <span>Progress</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {course.videos.map((vid, idx) => {
                const vidPct = vid.completed 
                  ? 100 
                  : (vid.durationSeconds > 0 ? Math.round((vid.currentTime / vid.durationSeconds) * 100) : vid.progressPercent || 0);

                return (
                  <div
                    key={vid.id}
                    onClick={() => onOpenCourse(course.id, vid.id)}
                    className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors border border-neutral-100 dark:border-neutral-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-[11px] font-mono text-neutral-400 mt-0.5 shrink-0">
                          #{idx + 1}
                        </span>
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 line-clamp-1">
                          {vid.title}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {vid.completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-400">
                            {vid.duration || ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            vid.completed ? 'bg-emerald-500' : 'bg-[#EA4335]'
                          }`}
                          style={{ width: `${vidPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {vidPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

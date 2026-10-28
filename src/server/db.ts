import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Course, VideoNote } from '@/types';
import { STARTER_COURSES } from './starterCourses';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const USERS_COURSES_DIR = path.join(DATA_DIR, 'users_courses');
const GLOBAL_DATA_FILE = path.join(DATA_DIR, 'courses.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_COURSES_DIR)) {
  fs.mkdirSync(USERS_COURSES_DIR, { recursive: true });
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getUserFilePath(userId?: string): string {
  if (userId && userId.trim()) {
    return path.join(USERS_COURSES_DIR, `${sanitizeId(userId.trim())}.json`);
  }
  return GLOBAL_DATA_FILE;
}

function calculateCourseStats(course: any): Course {
  const totalVideos = course.videos ? course.videos.length : 0;
  if (totalVideos === 0) {
    return {
      ...course,
      totalVideos: 0,
      completedVideos: 0,
      overallProgressPercent: 0,
      totalDurationSeconds: 0,
    };
  }

  const completedVideos = course.videos.filter((v: any) => v.completed).length;
  const overallProgressPercent = Math.round((completedVideos / totalVideos) * 100);
  const totalDurationSeconds = course.videos.reduce((acc: number, v: any) => acc + (v.durationSeconds || 0), 0);

  return {
    ...course,
    totalVideos,
    completedVideos,
    overallProgressPercent,
    totalDurationSeconds,
  };
}

export function readCoursesData(userId?: string): Course[] {
  try {
    const filePath = getUserFilePath(userId);

    // If reading for a specific user and their file does not exist yet:
    // They are a fresh user with 0 courses! Return empty array.
    if (userId && userId.trim()) {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const courses = JSON.parse(raw);
      return Array.isArray(courses) ? courses.map(calculateCourseStats) : [];
    }

    // Fallback for guest/global template
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const courses = JSON.parse(raw);
    return Array.isArray(courses) ? courses.map(calculateCourseStats) : [];
  } catch (err) {
    console.error('Error reading courses data:', err);
    return [];
  }
}

export function writeCoursesData(courses: Course[], userId?: string): boolean {
  try {
    const filePath = getUserFilePath(userId);
    fs.writeFileSync(filePath, JSON.stringify(courses, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing courses data:', err);
    return false;
  }
}

export function getAllCourses(userId?: string): Course[] {
  return readCoursesData(userId);
}

export function getCourseById(id: string, userId?: string): Course | null {
  // First check specific user's file if userId provided
  if (userId) {
    const userCourses = readCoursesData(userId);
    const found = userCourses.find(c => c.id === id);
    if (found) return found;
  }

  // Fallback check global/all files if not found
  const fallbackCourses = readCoursesData();
  return fallbackCourses.find(c => c.id === id) || null;
}

export function createCourse(data: any, userId?: string): Course {
  const courses = readCoursesData(userId);

  // Prevent duplicate playlist from being added to the same user
  if (data.playlistId) {
    const existing = courses.find(c => c.playlistId === data.playlistId);
    if (existing) {
      return existing;
    }
  }

  const id = `course_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const newCourse: Course = calculateCourseStats({
    id,
    playlistId: data.playlistId || '',
    title: data.title || 'Untitled Course',
    description: data.description || '',
    thumbnail: data.thumbnail || '',
    channelTitle: data.channelTitle || '',
    createdAt: now,
    updatedAt: now,
    videos: (data.videos || []).map((v: any, index: number) => ({
      id: v.id || v.youtubeId || `video_${Date.now()}_${index}`,
      youtubeId: v.youtubeId || v.id || '',
      title: v.title || `Lesson ${index + 1}`,
      duration: v.duration || '00:00',
      durationSeconds: v.durationSeconds || 0,
      thumbnail: v.thumbnail || '',
      completed: Boolean(v.completed),
      currentTime: Number(v.currentTime) || 0,
      progressPercent: Number(v.progressPercent) || 0,
      notes: v.notes || [],
      order: index + 1,
    })),
  });

  courses.unshift(newCourse);
  writeCoursesData(courses, userId);
  return newCourse;
}

export function deleteCourse(id: string, userId?: string): boolean {
  const courses = readCoursesData(userId);
  const filtered = courses.filter(c => c.id !== id);
  if (filtered.length === courses.length) return false;
  return writeCoursesData(filtered, userId);
}

export function updateVideoProgress(
  courseId: string,
  videoId: string,
  { completed, currentTime, duration }: { completed?: boolean; currentTime?: number; duration?: number },
  userId?: string
): Course | null {
  const courses = readCoursesData(userId);
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  const video = course.videos.find(v => v.id === videoId || v.youtubeId === videoId);
  if (!video) return null;

  if (currentTime !== undefined) {
    video.currentTime = Math.max(0, Math.round(currentTime));
  }
  if (duration !== undefined && duration > 0) {
    video.durationSeconds = Math.round(duration);
  }
  if (completed !== undefined) {
    video.completed = Boolean(completed);
    if (completed) {
      video.progressPercent = 100;
    }
  }

  if (video.durationSeconds > 0 && !video.completed) {
    video.progressPercent = Math.min(100, Math.round((video.currentTime / video.durationSeconds) * 100));
    if (video.progressPercent >= 95) {
      video.completed = true;
      video.progressPercent = 100;
    }
  }

  course.updatedAt = new Date().toISOString();
  const updatedCourse = calculateCourseStats(course);
  writeCoursesData(courses, userId);
  return updatedCourse;
}

export function resetCourseProgress(courseId: string, userId?: string): Course | null {
  const courses = readCoursesData(userId);
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  course.videos.forEach(v => {
    v.completed = false;
    v.currentTime = 0;
    v.progressPercent = 0;
  });

  course.updatedAt = new Date().toISOString();
  const updated = calculateCourseStats(course);
  writeCoursesData(courses, userId);
  return updated;
}

export function seedStarterCourses(userId?: string): Course[] {
  const existing = readCoursesData(userId);
  const existingPlaylistIds = new Set(existing.map(c => c.playlistId).filter(Boolean));
  const now = new Date().toISOString();

  const coursesToAdd = STARTER_COURSES.filter(starter => !existingPlaylistIds.has(starter.playlistId));
  if (coursesToAdd.length === 0) {
    return existing;
  }

  const newStarterCourses = coursesToAdd.map((starter, sIdx) => {
    const courseId = `starter_${sIdx + 1}_${Date.now()}`;
    return calculateCourseStats({
      id: courseId,
      playlistId: starter.playlistId,
      title: starter.title,
      description: starter.description,
      thumbnail: starter.thumbnail,
      channelTitle: starter.channelTitle,
      createdAt: now,
      updatedAt: now,
      videos: starter.videos.map((v, i) => ({
        id: v.id,
        youtubeId: (v as any).youtubeId || v.id,
        title: v.title,
        duration: v.duration,
        durationSeconds: v.durationSeconds,
        thumbnail: v.thumbnail,
        completed: false,
        currentTime: 0,
        progressPercent: 0,
        notes: [],
        order: i + 1,
      })),
    });
  });

  const combined = [...newStarterCourses, ...existing];
  writeCoursesData(combined, userId);
  return combined;
}

export function addVideoNote(
  courseId: string,
  videoId: string,
  timestampSeconds: number,
  content: string,
  userId?: string
): VideoNote | null {
  const courses = readCoursesData(userId);
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  const video = course.videos.find(v => v.id === videoId || v.youtubeId === videoId);
  if (!video) return null;

  const note: VideoNote = {
    id: `note_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    timestampSeconds: Math.round(timestampSeconds),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!video.notes) video.notes = [];
  video.notes.push(note);
  video.notes.sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  course.updatedAt = new Date().toISOString();
  writeCoursesData(courses, userId);
  return note;
}

export function deleteVideoNote(
  courseId: string,
  videoId: string,
  noteId: string,
  userId?: string
): boolean {
  const courses = readCoursesData(userId);
  const course = courses.find(c => c.id === courseId);
  if (!course) return false;

  const video = course.videos.find(v => v.id === videoId || v.youtubeId === videoId);
  if (!video || !video.notes) return false;

  const initialLen = video.notes.length;
  video.notes = video.notes.filter(n => n.id !== noteId);
  if (video.notes.length === initialLen) return false;

  course.updatedAt = new Date().toISOString();
  writeCoursesData(courses, userId);
  return true;
}

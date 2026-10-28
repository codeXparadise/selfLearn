import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'courses.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function calculateCourseStats(course) {
  const totalVideos = course.videos ? course.videos.length : 0;
  if (totalVideos === 0) {
    return {
      ...course,
      totalVideos: 0,
      completedVideos: 0,
      overallProgressPercent: 0,
      totalDurationSeconds: 0
    };
  }

  const completedVideos = course.videos.filter(v => v.completed).length;
  const overallProgressPercent = Math.round((completedVideos / totalVideos) * 100);
  const totalDurationSeconds = course.videos.reduce((acc, v) => acc + (v.durationSeconds || 0), 0);

  return {
    ...course,
    totalVideos,
    completedVideos,
    overallProgressPercent,
    totalDurationSeconds
  };
}

export function readCoursesData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const courses = JSON.parse(raw);
    return courses.map(calculateCourseStats);
  } catch (err) {
    console.error('Error reading courses data file:', err);
    return [];
  }
}

export function writeCoursesData(courses) {
  try {
    const raw = JSON.stringify(courses, null, 2);
    // Write atomically
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, raw, 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Error writing courses data file:', err);
    throw err;
  }
}

export function getAllCourses() {
  return readCoursesData();
}

export function getCourseById(id) {
  const courses = readCoursesData();
  return courses.find(c => c.id === id) || null;
}

export function createCourse({ title, playlistUrl, playlistId, channelTitle, description, thumbnail, videos }) {
  const courses = readCoursesData();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const formattedVideos = (videos || []).map((v, index) => ({
    id: v.id,
    title: v.title || `Video ${index + 1}`,
    duration: v.duration || '',
    durationSeconds: v.durationSeconds || 0,
    thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    currentTime: 0,
    completed: false,
    progressPercent: 0,
    lastWatchedAt: null,
    notes: []
  }));

  const newCourse = {
    id,
    title: title || 'Untitled Course',
    playlistUrl: playlistUrl || '',
    playlistId: playlistId || '',
    channelTitle: channelTitle || '',
    description: description || '',
    thumbnail: thumbnail || (formattedVideos[0]?.thumbnail || ''),
    createdAt: now,
    updatedAt: now,
    lastWatchedVideoId: formattedVideos[0]?.id || null,
    videos: formattedVideos
  };

  courses.unshift(newCourse);
  writeCoursesData(courses);
  return calculateCourseStats(newCourse);
}

export function updateCourse(id, updates) {
  const courses = readCoursesData();
  const index = courses.findIndex(c => c.id === id);
  if (index === -1) return null;

  const current = courses[index];
  const updated = {
    ...current,
    ...updates,
    id: current.id, // prevent overwriting ID
    updatedAt: new Date().toISOString()
  };

  courses[index] = updated;
  writeCoursesData(courses);
  return calculateCourseStats(updated);
}

export function deleteCourse(id) {
  const courses = readCoursesData();
  const filtered = courses.filter(c => c.id !== id);
  if (filtered.length === courses.length) return false;
  writeCoursesData(filtered);
  return true;
}

export function updateVideoProgress(courseId, videoId, { currentTime, duration, completed }) {
  const courses = readCoursesData();
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  const video = course.videos.find(v => v.id === videoId);
  if (!video) return null;

  if (typeof currentTime === 'number' && !isNaN(currentTime)) {
    video.currentTime = Math.max(0, Math.round(currentTime));
  }
  if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
    video.durationSeconds = Math.round(duration);
  }

  // Calculate percentage
  if (video.durationSeconds > 0) {
    const rawPct = Math.min(100, Math.round((video.currentTime / video.durationSeconds) * 100));
    video.progressPercent = Math.max(video.progressPercent || 0, rawPct);
  }

  // If completed explicitly set
  if (typeof completed === 'boolean') {
    video.completed = completed;
    if (completed) {
      video.progressPercent = 100;
    }
  } else if (video.progressPercent >= 90) {
    // Auto-mark completed when 90% watched
    video.completed = true;
  }

  video.lastWatchedAt = new Date().toISOString();
  course.lastWatchedVideoId = videoId;
  course.updatedAt = new Date().toISOString();

  writeCoursesData(courses);
  return calculateCourseStats(course);
}

export function addVideoNote(courseId, videoId, { timestamp, text }) {
  const courses = readCoursesData();
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  const video = course.videos.find(v => v.id === videoId);
  if (!video) return null;

  if (!video.notes) video.notes = [];
  const note = {
    id: crypto.randomUUID(),
    timestamp: Math.max(0, Math.round(timestamp || 0)),
    text: (text || '').trim(),
    createdAt: new Date().toISOString()
  };

  video.notes.push(note);
  course.updatedAt = new Date().toISOString();
  writeCoursesData(courses);
  return note;
}

export function deleteVideoNote(courseId, videoId, noteId) {
  const courses = readCoursesData();
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  const video = course.videos.find(v => v.id === videoId);
  if (!video || !video.notes) return null;

  video.notes = video.notes.filter(n => n.id !== noteId);
  course.updatedAt = new Date().toISOString();
  writeCoursesData(courses);
  return true;
}

export function resetCourseProgress(courseId) {
  const courses = readCoursesData();
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  for (const v of course.videos) {
    v.currentTime = 0;
    v.completed = false;
    v.progressPercent = 0;
    v.lastWatchedAt = null;
  }

  course.lastWatchedVideoId = course.videos[0]?.id || null;
  course.updatedAt = new Date().toISOString();
  writeCoursesData(courses);
  return calculateCourseStats(course);
}


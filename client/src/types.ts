export interface Note {
  id: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  currentTime: number;
  completed: boolean;
  progressPercent: number;
  lastWatchedAt: string | null;
  notes?: Note[];
}

export interface Course {
  id: string;
  title: string;
  playlistUrl: string;
  playlistId: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  lastWatchedVideoId: string | null;
  videos: Video[];
  totalVideos: number;
  completedVideos: number;
  overallProgressPercent: number;
  totalDurationSeconds: number;
}

export interface ParsedPlaylist {
  playlistId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  videos: {
    id: string;
    title: string;
    duration: string;
    durationSeconds: number;
    thumbnail: string;
  }[];
}

export interface ActivityItem {
  id: string;
  courseId: string;
  courseTitle: string;
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  timestamp: number;
  duration: number;
  completed: boolean;
  watchedAt: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  ollamaApiKey?: string;
  ollamaModel?: string;
  ollamaHost?: string;
  activityHistory?: ActivityItem[];
}

export interface FreeOllamaModel {
  id: string;
  name: string;
  tagline: string;
  size: string;
}

export const FREE_OLLAMA_MODELS: FreeOllamaModel[] = [
  { id: 'gemma4:31b', name: 'Gemma 4 31B', tagline: 'Google DeepMind flagship (Default)', size: '31B' },
  { id: 'beam', name: 'Beam', tagline: 'Lightweight & versatile', size: 'Base' },
  { id: 'gpt-oss:120b', name: 'GPT-OSS 120B', tagline: 'Deep reasoning & complex logic', size: '120B' },
  { id: 'gpt-oss:20b', name: 'GPT-OSS 20B', tagline: 'Fast & responsive answers', size: '20B' },
  { id: 'nemotron-3-nano:30b', name: 'Nemotron-3 Nano 30B', tagline: 'NVIDIA efficient reasoning', size: '30B' },
  { id: 'nemotron-3-super', name: 'Nemotron-3 Super', tagline: 'High-throughput intelligence', size: 'Super' },
  { id: 'nemotron-3-ultra', name: 'Nemotron-3 Ultra', tagline: 'Maximum accuracy & coding', size: 'Ultra' },
];

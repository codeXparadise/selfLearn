export interface VideoNote {
  id: string;
  timestampSeconds: number;
  content: string;
  createdAt: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  completed: boolean;
  currentTime: number;
  progressPercent: number;
  notes: VideoNote[];
  order: number;
  description?: string;
}

export interface Course {
  id: string;
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  createdAt: string;
  updatedAt: string;
  videos: Video[];
  totalVideos: number;
  completedVideos: number;
  overallProgressPercent: number;
  totalDurationSeconds: number;
}

export interface FreeModelInfo {
  id: string;
  name: string;
  tagline: string;
  size: string;
}

export const FREE_OLLAMA_MODELS: FreeModelInfo[] = [
  { id: 'gemma4:31b', name: 'Gemma 4 (31B)', tagline: 'High-reasoning general assistant (Default)', size: '31B' },
  { id: 'beam', name: 'Beam', tagline: 'Ultra-fast lightweight reasoning', size: 'Fast' },
  { id: 'gpt-oss:120b', name: 'GPT-OSS (120B)', tagline: 'Massive open-source intelligence', size: '120B' },
  { id: 'gpt-oss:20b', name: 'GPT-OSS (20B)', tagline: 'Balanced efficiency and depth', size: '20B' },
  { id: 'nemotron-3-nano:30b', name: 'Nemotron-3 Nano (30B)', tagline: 'NVIDIA instruction-tuned tutor', size: '30B' },
  { id: 'nemotron-3-super', name: 'Nemotron-3 Super', tagline: 'Complex technical analysis', size: 'Super' },
  { id: 'nemotron-3-ultra', name: 'Nemotron-3 Ultra', tagline: 'Maximum contextual capacity', size: 'Ultra' },
];

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  videoTimestamp?: number;
}

export interface UserActivity {
  id: string;
  courseId: string;
  courseTitle: string;
  videoId: string;
  videoTitle: string;
  timestamp: number;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  ollamaApiKey?: string;
  selectedModel?: string;
  createdAt: string;
  activityHistory?: UserActivity[];
}


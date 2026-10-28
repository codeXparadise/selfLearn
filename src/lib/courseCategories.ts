import { 
  Database, 
  Globe, 
  Cpu, 
  Code2, 
  Smartphone, 
  Cloud, 
  Shield, 
  Sparkles, 
  Layers, 
  Terminal,
  FileCode,
  type LucideIcon 
} from 'lucide-react';
import type { Course } from '@/types';

export interface CategoryDefinition {
  id: string;
  name: string;
  tag: string;
  icon: LucideIcon;
  color: string;
  badgeClass: string;
  bgLight: string;
  textLight: string;
  keywords: string[];
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    tag: 'AI & Machine Learning',
    icon: Cpu,
    color: '#8B5CF6',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    bgLight: 'bg-purple-50 dark:bg-purple-950/30',
    textLight: 'text-purple-600 dark:text-purple-400',
    keywords: [
      'machine learning', 'artificial intelligence', 'deep learning', 'neural network',
      'neural', 'llm', 'chatgpt', 'gpt', 'nlp', 'computer vision', 'transformers',
      'pytorch', 'tensorflow', 'keras', 'hugging face', 'huggingface', 'langchain',
      'ollama', 'prompt engineering', 'reinforcement learning', 'genai', 'generative ai',
      'diffusion model', 'rag'
    ],
  },
  {
    id: 'data-science',
    name: 'Data Science & Analytics',
    tag: 'Data Science',
    icon: Database,
    color: '#EA4335',
    badgeClass: 'bg-red-500/10 text-[#EA4335] dark:text-red-400 border-red-500/25',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    textLight: 'text-[#EA4335]',
    keywords: [
      'data science', 'data analytics', 'data analysis', 'pandas', 'numpy',
      'matplotlib', 'seaborn', 'power bi', 'powerbi', 'tableau', 'scikit-learn',
      'scikit', 'big data', 'data engineering', 'etl', 'excel data', 'jupyter',
      'data visualization'
    ],
  },
  {
    id: 'web-fullstack',
    name: 'Web & Full-Stack',
    tag: 'Web & Full-Stack',
    icon: Globe,
    color: '#3B82F6',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    textLight: 'text-blue-600 dark:text-blue-400',
    keywords: [
      'javascript', 'typescript', 'react', 'next.js', 'nextjs', 'vue', 'angular',
      'svelte', 'node', 'nodejs', 'express', 'frontend', 'front-end', 'backend',
      'back-end', 'fullstack', 'full stack', 'full-stack', 'mern', 'html', 'css',
      'tailwind', 'rest api', 'graphql', 'django', 'flask', 'fastapi', 'spring boot',
      'laravel', 'php', 'web dev', 'web development'
    ],
  },
  {
    id: 'core-cs-dsa',
    name: 'Core CS & Algorithms',
    tag: 'Core CS & DSA',
    icon: Code2,
    color: '#10B981',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    textLight: 'text-emerald-600 dark:text-emerald-400',
    keywords: [
      'dsa', 'data structure', 'algorithm', 'leetcode', 'competitive programming',
      'operating system', 'computer network', 'dbms', 'database management',
      'computer architecture', 'discrete math', 'system design', 'recursion',
      'dynamic programming', 'graph theory', 'binary tree'
    ],
  },
  {
    id: 'mobile-dev',
    name: 'Mobile App Development',
    tag: 'Mobile Dev',
    icon: Smartphone,
    color: '#06B6D4',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
    textLight: 'text-cyan-600 dark:text-cyan-400',
    keywords: [
      'flutter', 'dart', 'react native', 'android', 'kotlin', 'ios', 'swift',
      'swiftui', 'mobile app', 'xamarin'
    ],
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    tag: 'Cloud & DevOps',
    icon: Cloud,
    color: '#6366F1',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
    textLight: 'text-indigo-600 dark:text-indigo-400',
    keywords: [
      'devops', 'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'cloud',
      'ci/cd', 'terraform', 'ansible', 'linux', 'bash', 'shell script', 'git',
      'github actions', 'sysadmin', 'server administration'
    ],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & Ethical Hacking',
    tag: 'Cybersecurity',
    icon: Shield,
    color: '#EC4899',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    textLight: 'text-pink-600 dark:text-pink-400',
    keywords: [
      'cybersecurity', 'ethical hacking', 'penetration testing', 'pen testing',
      'kali linux', 'cryptography', 'infosec', 'malware', 'bug bounty',
      'network security', 'wireshark', 'vulnerability'
    ],
  },
  {
    id: 'python-dev',
    name: 'Python Programming',
    tag: 'Python',
    icon: Terminal,
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    textLight: 'text-amber-600 dark:text-amber-400',
    keywords: [
      'python', 'python3', 'pythons', 'oop python', 'python beginner', 'python crash'
    ],
  },
  {
    id: 'systems-programming',
    name: 'Systems & Languages',
    tag: 'Systems & Low-Level',
    icon: FileCode,
    color: '#14B8A6',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
    bgLight: 'bg-teal-50 dark:bg-teal-950/30',
    textLight: 'text-teal-600 dark:text-teal-400',
    keywords: [
      'c++', 'cpp', 'rust', 'golang', 'go lang', 'c programming', 'java programming',
      'assembly', 'low level', 'embedded', 'cuda'
    ],
  },
  {
    id: 'design-ui-ux',
    name: 'Design & UI/UX',
    tag: 'Design & UI/UX',
    icon: Sparkles,
    color: '#A855F7',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/25',
    bgLight: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
    textLight: 'text-fuchsia-600 dark:text-fuchsia-400',
    keywords: [
      'ui/ux', 'ui design', 'ux design', 'figma', 'photoshop', 'illustrator',
      'blender', '3d modeling', 'graphic design', 'animation', 'typography'
    ],
  },
];

const DEFAULT_CATEGORY: CategoryDefinition = {
  id: 'general-tech',
  name: 'General Tech & Tutorial',
  tag: 'Tutorial Track',
  icon: Layers,
  color: '#F97316',
  badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
  bgLight: 'bg-orange-50 dark:bg-orange-950/30',
  textLight: 'text-orange-600 dark:text-orange-400',
  keywords: [],
};

/**
 * Automatically classifies a playlist into a category by analyzing its title,
 * description, channel title, and lesson titles.
 */
export function detectCourseCategory(course: Course): CategoryDefinition {
  if (!course) return DEFAULT_CATEGORY;

  // Build a rich aggregate search string from course metadata
  const titleText = (course.title || '').toLowerCase();
  const descText = (course.description || '').toLowerCase();
  const channelText = (course.channelTitle || '').toLowerCase();
  
  // Also scan first 8 lesson titles if available
  const lessonTitles = course.videos
    ? course.videos.slice(0, 8).map((v) => (v.title || '').toLowerCase()).join(' ')
    : '';

  const corpus = `${titleText} ${titleText} ${channelText} ${descText.slice(0, 500)} ${lessonTitles}`;

  // Evaluate matches with scoring (title matches score higher)
  let bestCategory: CategoryDefinition = DEFAULT_CATEGORY;
  let highestScore = 0;

  for (const cat of CATEGORY_DEFINITIONS) {
    let score = 0;

    for (const kw of cat.keywords) {
      // Exact word boundary or substring match
      if (titleText.includes(kw)) {
        score += 5; // Title match gives massive boost
      } else if (lessonTitles.includes(kw)) {
        score += 3;
      } else if (channelText.includes(kw)) {
        score += 2;
      } else if (corpus.includes(kw)) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  // If score is 0, check if we can craft a tag from channelTitle
  if (highestScore === 0 && course.channelTitle) {
    const cleanChannel = course.channelTitle.replace(/academy|channel|official|tutorial/gi, '').trim();
    if (cleanChannel.length > 2 && cleanChannel.length < 20) {
      return {
        ...DEFAULT_CATEGORY,
        tag: cleanChannel,
        name: `${cleanChannel} Track`,
      };
    }
  }

  return bestCategory;
}

export interface DynamicCategoryBreakdown {
  id: string;
  name: string;
  tag: string;
  icon: LucideIcon;
  color: string;
  bgLight: string;
  textLight: string;
  coursesCount: number;
  totalLessons: number;
  completedLessons: number;
  hours: string;
  percentage: number;
}

/**
 * Computes dynamic curriculum categories breakdown strictly derived from the user's courses.
 * No hardcoded dummy categories: only categories that actually exist in the user's courses are returned.
 */
export function computeDynamicCurriculumCategories(courses: Course[]): DynamicCategoryBreakdown[] {
  if (!courses || courses.length === 0) return [];

  const totalVideosInAllCourses = courses.reduce(
    (acc, c) => acc + (c.videos ? c.videos.length : 0), 
    0
  );

  // Group courses by detected category ID
  const map = new Map<string, { cat: CategoryDefinition; courses: Course[] }>();

  for (const course of courses) {
    const detected = detectCourseCategory(course);
    const existing = map.get(detected.id);
    if (existing) {
      existing.courses.push(course);
    } else {
      map.set(detected.id, { cat: detected, courses: [course] });
    }
  }

  const result: DynamicCategoryBreakdown[] = [];

  map.forEach(({ cat, courses: catCourses }) => {
    const catTotalLessons = catCourses.reduce((acc, c) => acc + (c.videos?.length || 0), 0);
    const catCompletedLessons = catCourses.reduce(
      (acc, c) => acc + (c.videos?.filter((v) => v.completed).length || 0),
      0
    );
    const catHours = (
      catCourses.reduce((acc, c) => acc + (c.totalDurationSeconds || 0), 0) / 3600
    ).toFixed(1);

    const percentage = totalVideosInAllCourses > 0
      ? Math.round((catTotalLessons / totalVideosInAllCourses) * 100)
      : Math.round(100 / map.size);

    result.push({
      id: cat.id,
      name: cat.name,
      tag: cat.tag,
      icon: cat.icon,
      color: cat.color,
      bgLight: cat.bgLight,
      textLight: cat.textLight,
      coursesCount: catCourses.length,
      totalLessons: catTotalLessons,
      completedLessons: catCompletedLessons,
      hours: catHours,
      percentage: Math.max(percentage, 5),
    });
  });

  // Sort by highest lessons count / percentage descending
  return result.sort((a, b) => b.totalLessons - a.totalLessons);
}


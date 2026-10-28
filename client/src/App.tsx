import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CourseClassroom } from './components/CourseClassroom';
import { ProfilePage } from './components/ProfilePage';
import { CreateCourseModal } from './components/CreateCourseModal';
import { AuthModal } from './components/AuthModal';
import { ProductTour } from './components/ProductTour';
import { Logo } from './components/Logo';
import type { Course } from './types';

type ViewMode = 'landing' | 'dashboard' | 'classroom' | 'profile';

function AppContent() {
  const { user, loading: authLoading } = useAuth();

  // Navigation view state
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    // If returning user or stored preference, start on dashboard; else landing
    const hasVisited = localStorage.getItem('self_learn_has_visited');
    return hasVisited ? 'dashboard' : 'landing';
  });

  // Course state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [initialVideoId, setInitialVideoId] = useState<string | undefined>(undefined);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showTour, setShowTour] = useState(false);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('self_learn_theme') === 'dark' || 
           (!('self_learn_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('self_learn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('self_learn_theme', 'light');
    }
  }, [isDarkMode]);

  // When user authenticates, transition from landing to dashboard
  useEffect(() => {
    if (!authLoading && user && currentView === 'landing') {
      setCurrentView('dashboard');
      localStorage.setItem('self_learn_has_visited', 'true');
    }
  }, [user, authLoading, currentView]);

  // Product tour trigger on first login
  useEffect(() => {
    if (!authLoading && user) {
      const tourDone = localStorage.getItem('self_learn_tour_done');
      if (!tourDone) {
        setShowTour(true);
      }
    }
  }, [user, authLoading]);

  // Fetch all courses from backend API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Handlers
  const handleOpenCourse = (courseId: string, videoId?: string) => {
    setActiveCourseId(courseId);
    setInitialVideoId(videoId);
    setCurrentView('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveCourseId(null);
    setInitialVideoId(undefined);
    setCurrentView('dashboard');
    fetchCourses(); // refresh course stats
  };

  const handleGoToLanding = () => {
    setActiveCourseId(null);
    setInitialVideoId(undefined);
    setCurrentView('landing');
  };

  const handleGoToProfile = () => {
    if (!user) {
      setAuthModalMode('signin');
      setAuthModalOpen(true);
      return;
    }
    setActiveCourseId(null);
    setInitialVideoId(undefined);
    setCurrentView('profile');
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        if (activeCourseId === courseId) {
          handleBackToDashboard();
        }
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const handleResetProgress = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          handleCourseUpdated(data.course);
        }
      }
    } catch (err) {
      console.error('Failed to reset course progress:', err);
    }
  };

  const handleSeedStarterCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses/seed-starter', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Failed to seed starter courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseCreated = (courseId: string) => {
    fetchCourses().then(() => {
      handleOpenCourse(courseId);
    });
  };

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const completedCoursesCount = courses.filter(
    c => c.videos && c.videos.length > 0 && c.videos.every(v => v.completed)
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0c0c0e] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Global Navbar (Hidden in classroom to maximize vertical space for video player) */}
      {currentView !== 'classroom' && (
        <Navbar
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onGoHome={handleBackToDashboard}
          onGoToLanding={handleGoToLanding}
          onGoToProfile={handleGoToProfile}
          onOpenAuth={handleOpenAuth}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          totalCourses={courses.length}
          completedCoursesCount={completedCoursesCount}
          inClassroom={false}
          currentView={currentView}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'landing' ? (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onExploreDemo={handleBackToDashboard}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        ) : currentView === 'profile' ? (
          <ProfilePage
            onBackToDashboard={handleBackToDashboard}
            onOpenCourse={handleOpenCourse}
          />
        ) : currentView === 'classroom' && activeCourse ? (
          <CourseClassroom
            course={activeCourse}
            initialVideoId={initialVideoId}
            onBackToDashboard={handleBackToDashboard}
            onCourseUpdated={handleCourseUpdated}
            onOpenAuth={handleOpenAuth}
          />
        ) : (
          /* Dashboard view (default for logged in or exploring) */
          loading && courses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-zinc-800 border-t-[#FF0000] rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Loading your courses...</p>
              </div>
            </div>
          ) : (
            <Dashboard
              courses={courses}
              onOpenCourse={handleOpenCourse}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onDeleteCourse={handleDeleteCourse}
              onResetProgress={handleResetProgress}
              onSeedStarterCourses={handleSeedStarterCourses}
              searchTerm={searchTerm}
            />
          )
        )}
      </main>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />

      {/* Auth Modal (Sign In / Sign Up / Google Auth) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Product Tour on First Login */}
      <ProductTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      {/* Global Footer (shown on Dashboard and Profile views) */}
      {(currentView === 'dashboard' || currentView === 'profile') && (
        <footer className="border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span>— Custom Distraction-Free YouTube Learning Platform</span>
            </div>
            <div>
              Locked playback mode • Real-time progress bars • Course Hub
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

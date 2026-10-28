import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Play, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { OllamaLogo } from './OllamaLogo';

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  hint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Self Learn",
    badge: "Campus Tour",
    description: "Your distraction-free YouTube university. Turn any playlist into a focused course with dual progress bars and built-in Ollama AI.",
    icon: <Sparkles className="w-7 h-7 text-[#EA4335]" />,
    hint: "No recommended algorithms, no sidebar rabbit holes."
  },
  {
    title: "Import Any YouTube Playlist",
    badge: "Course Creation",
    description: "Click '+ New Course' at any time. Simply paste a playlist URL to instantly curate all lessons, chapters, and durations into your Hub.",
    icon: <Layers className="w-7 h-7 text-blue-500" />,
    hint: "Works with coding tutorials, lectures, podcasts, and masterclasses."
  },
  {
    title: "Full-Width Focused Classroom",
    badge: "Video Player",
    description: "Experience the video in full width without vertical scrolling. Expand or collapse the lesson drawer with 1 click.",
    icon: <Play className="w-7 h-7 text-emerald-500" />,
    hint: "Second-level video progress is automatically saved to your profile."
  },
  {
    title: "Floating Ollama AI Widget",
    badge: "Smart Tutor",
    description: "Click the circular Ollama logo button in the bottom-right corner to open your AI tutor. Ask questions at the exact video timestamp.",
    icon: <OllamaLogo className="w-7 h-7" />,
    hint: "Choose between Gemma 4:31B, Beam, Nemotron, or GPT-OSS."
  },
  {
    title: "Profile & History Tracking",
    badge: "Personalization",
    description: "Select your custom avatar, review your recent watch history with 1-click resume, and centrally manage your Ollama API key.",
    icon: <User className="w-7 h-7 text-purple-500" />,
    hint: "100% free and open learning forever."
  }
];

export const ProductTour: React.FC<ProductTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const progressPercent = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('self_learn_tour_done', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('self_learn_tour_done', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Progress Track */}
        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-850">
          <div 
            className="h-full bg-[#EA4335] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <span className="text-xs text-neutral-400 font-medium">•</span>
            <span className="text-xs font-semibold text-[#EA4335]">
              {step.badge}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            title="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-3 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs">
            {step.icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-neutral-950 dark:text-white tracking-tight">
              {step.title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs text-neutral-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{step.hint}</span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>{isLast ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductTour;

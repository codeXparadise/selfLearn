'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  CheckCircle, 
  Sparkles, 
  Gauge,
  Volume2,
  Volume1,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Keyboard,
  X,
  RotateCcw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import type { Video } from '@/types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  video: Video;
  courseVideos: Video[];
  onVideoEnd?: () => void;
  onPreviousVideo?: () => void;
  onNextVideo?: () => void;
  onProgressUpdate: (videoId: string, currentTime: number, duration: number, completed?: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  seekToSeconds?: number | null;
  onToggleComplete: (videoId: string) => void;
  hasPrevious: boolean;
  hasNext: boolean;
  autoPlayNext: boolean;
  onToggleAutoPlayNext: () => void;
}

export function VideoPlayer({
  video,
  courseVideos,
  onVideoEnd,
  onPreviousVideo,
  onNextVideo,
  onProgressUpdate,
  onTimeUpdate,
  seekToSeconds,
  onToggleComplete,
  hasPrevious,
  hasNext,
  autoPlayNext,
  onToggleAutoPlayNext,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const timeTrackerRef = useRef<any>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const hudTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(video.currentTime || 0);
  const [duration, setDuration] = useState(video.durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const [hudToast, setHudToast] = useState<{ text: string; key: number } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const countdownIntervalRef = useRef<any>(null);

  const targetVideoId = video.youtubeId || video.id;

  // Find previous and next video details for hover tooltips
  const currentIndex = courseVideos.findIndex((v) => v.id === video.id);
  const previousVideo = currentIndex > 0 ? courseVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex >= 0 && currentIndex < courseVideos.length - 1 ? courseVideos[currentIndex + 1] : null;

  // Security check: Verify current video belongs strictly to this playlist
  const isValidCourseVideo = courseVideos.some((v) => v.id === video.id);

  // Trigger floating HUD notification
  const showHud = useCallback((text: string) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHudToast({ text, key: Date.now() });
    hudTimeoutRef.current = setTimeout(() => {
      setHudToast(null);
    }, 1100);
  }, []);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const syncProgress = useCallback(
    (force = false) => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      const cur = playerRef.current.getCurrentTime();
      const dur = playerRef.current.getDuration() || duration;

      setCurrentTime(cur);
      setDuration(dur);
      if (onTimeUpdate) onTimeUpdate(cur, dur);

      if (force || Math.abs(cur - lastSavedTimeRef.current) >= 5) {
        lastSavedTimeRef.current = cur;
        const isDone = dur > 0 && cur / dur >= 0.95;
        onProgressUpdate(video.id, cur, dur, isDone);
      }
    },
    [video.id, duration, onProgressUpdate, onTimeUpdate]
  );

  const cancelAutoPlayCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setNextCountdown(null);
  };

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    if (timeTrackerRef.current) clearInterval(timeTrackerRef.current);

    const dur = playerRef.current?.getDuration() || duration;
    onProgressUpdate(video.id, dur, dur, true);

    if (onVideoEnd) onVideoEnd();

    if (autoPlayNext && hasNext) {
      setNextCountdown(5);
      let count = 5;
      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        setNextCountdown(count);
        if (count <= 0) {
          cancelAutoPlayCountdown();
          if (onNextVideo) onNextVideo();
        }
      }, 1000);
    }
  }, [video.id, duration, onProgressUpdate, onVideoEnd, autoPlayNext, hasNext, onNextVideo]);

  // Init YouTube player instance
  useEffect(() => {
    let checkInterval: any = null;
    let isMounted = true;

    const targetVideoId = video.youtubeId || video.id;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || !isMounted || !iframeRef.current) return;
      if (playerRef.current) return;

      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (e: any) => {
              if (!isMounted) return;
              try {
                const dur = e.target.getDuration();
                if (dur) setDuration(dur);
                const currentVol = e.target.getVolume();
                if (typeof currentVol === 'number') setVolume(currentVol);
                const muted = e.target.isMuted();
                if (typeof muted === 'boolean') setIsMuted(muted);
              } catch {}
            },
            onStateChange: (e: any) => {
              if (!isMounted) return;
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setPlayerError(null);
                cancelAutoPlayCountdown();
                if (timeTrackerRef.current) clearInterval(timeTrackerRef.current);
                timeTrackerRef.current = setInterval(() => syncProgress(false), 1000);
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                if (timeTrackerRef.current) clearInterval(timeTrackerRef.current);
                syncProgress(true);
              } else if (e.data === window.YT.PlayerState.ENDED) {
                handleVideoEnded();
              }
            },
            onError: (e: any) => {
              if (!isMounted) return;
              console.warn('YouTube Player error code:', e.data);
              if (e.data === 101 || e.data === 150) {
                setPlayerError('The video creator has restricted playback in external embeds.');
              } else if (e.data === 100 || e.data === 2) {
                setPlayerError('Video not found or invalid YouTube ID.');
              }
            },
          },
        });
      } catch (err) {
        console.warn('Failed to bind YT.Player to iframe:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (timeTrackerRef.current) clearInterval(timeTrackerRef.current);
      cancelAutoPlayCountdown();
      playerRef.current = null;
    };
  }, [video.id, video.youtubeId]);

  // Handle external seek (from Notes or AI)
  useEffect(() => {
    if (seekToSeconds !== undefined && seekToSeconds !== null && playerRef.current) {
      playerRef.current.seekTo(seekToSeconds, true);
      setCurrentTime(seekToSeconds);
      syncProgress(true);
      if (!isPlaying) {
        playerRef.current.playVideo();
      }
      showHud(`Seek: ${formatTime(seekToSeconds)}`);
    }
  }, [seekToSeconds, isPlaying, showHud, syncProgress]);

  // Relative Seek (Forward / Backward 10s)
  const seekRelative = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    const cur = playerRef.current.getCurrentTime() || currentTime;
    const target = Math.max(0, Math.min(cur + seconds, duration || cur + 30));
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
    syncProgress(true);
    if (seconds > 0) {
      showHud(`⏩ +${seconds}s (${formatTime(target)})`);
    } else {
      showHud(`⏪ ${seconds}s (${formatTime(target)})`);
    }
  }, [currentTime, duration, showHud, syncProgress]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    try {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        if (isPlaying) {
          playerRef.current.pauseVideo();
          showHud('⏸ Paused');
        } else {
          playerRef.current.playVideo();
          showHud('▶ Playing');
        }
      } else if (iframeRef.current?.contentWindow) {
        const cmd = isPlaying ? 'pauseVideo' : 'playVideo';
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd }), '*');
        setIsPlaying(!isPlaying);
        showHud(isPlaying ? '⏸ Paused' : '▶ Playing');
      }
    } catch (err) {
      console.error('togglePlay error:', err);
    }
  }, [isPlaying, showHud]);

  // Volume Adjustment
  const handleVolumeChange = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVol)));
    setVolume(clamped);
    if (playerRef.current) {
      playerRef.current.setVolume(clamped);
      if (clamped > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
    showHud(`🔊 Volume: ${clamped}%`);
  }, [isMuted, showHud]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      showHud(`🔊 Unmuted (${volume}%)`);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
      showHud('🔇 Muted');
    }
  }, [isMuted, volume, showHud]);

  const adjustVolume = useCallback((delta: number) => {
    const target = Math.max(0, Math.min(100, (isMuted ? 0 : volume) + delta));
    handleVolumeChange(target);
  }, [isMuted, volume, handleVolumeChange]);

  // Playback Rate
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
    }
    showHud(`Speed: ${rate}x`);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      showHud('⛶ Fullscreen');
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      showHud('Standard View');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Seek Percentage (0 - 9)
  const seekToPercent = useCallback((pct: number) => {
    if (!playerRef.current || duration <= 0) return;
    const target = (pct / 100) * duration;
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
    syncProgress(true);
    showHud(`Jump to ${pct}% (${formatTime(target)})`);
  }, [duration, showHud, syncProgress]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: Do not trigger hotkeys when typing in inputs, textareas, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        // Skip 10 seconds back
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          seekRelative(-10);
          break;

        // Skip 10 seconds forward
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          seekRelative(10);
          break;

        // Volume Up
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(10);
          break;

        // Volume Down
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-10);
          break;

        // Play / Pause
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;

        // Mute / Unmute
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;

        // Next Video in Playlist
        case 'n':
        case 'N':
          if (hasNext && onNextVideo) {
            e.preventDefault();
            showHud('⏭ Next Video');
            onNextVideo();
          }
          break;

        // Previous Video in Playlist
        case 'p':
        case 'P':
          if (hasPrevious && onPreviousVideo) {
            e.preventDefault();
            showHud('⏮ Previous Video');
            onPreviousVideo();
          }
          break;

        // Fullscreen
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;

        // Jump to percentage (0 - 9)
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          e.preventDefault();
          const pct = parseInt(e.key, 10) * 10;
          seekToPercent(pct);
          break;
        }

        // Toggle Keyboard Shortcuts Cheat Sheet
        case '?':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    seekRelative,
    adjustVolume,
    togglePlay,
    toggleMute,
    hasNext,
    hasPrevious,
    onNextVideo,
    onPreviousVideo,
    seekToPercent,
    showHud,
  ]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (playerRef.current) {
      playerRef.current.seekTo(target, true);
      syncProgress(true);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Stable embed URL strictly per video ID: NEVER changes during playback of the same video
  const embedUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const initialStart = video.currentTime && video.currentTime > 3 ? Math.floor(video.currentTime) : 0;
    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
    const startParam = initialStart > 0 ? `&start=${initialStart}` : '';
    return `https://www.youtube.com/embed/${targetVideoId}?enablejsapi=1&autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3${startParam}${originParam}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetVideoId]);

  if (!isValidCourseVideo) {
    return (
      <div className="aspect-video w-full bg-neutral-900 rounded-3xl flex items-center justify-center text-white p-6 text-center">
        <div>
          <p className="text-red-400 font-semibold mb-2">Unauthorized Video Access</p>
          <p className="text-neutral-400 text-xs">
            Self Learn only permits playback of videos belonging directly to this course playlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col w-full bg-black overflow-hidden relative select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'w-full rounded-2xl sm:rounded-3xl shadow-2xl'
      }`}
    >
      
      {/* Video Container & Screen Area */}
      <div 
        className={`relative w-full bg-black group overflow-hidden ${
          isFullscreen ? 'flex-1 h-full' : 'aspect-video'
        }`}
      >
        
        {/* Native YouTube IFrame - Directly Clickable & Embeddable */}
        <iframe
          ref={iframeRef}
          id="youtube-course-player"
          key={targetVideoId}
          src={embedUrl}
          className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          loading="eager"
          title={video.title}
        />

        {/* Video Embedding Error Banner */}
        {playerError && (
          <div className="absolute inset-0 z-30 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <AlertCircle className="w-12 h-12 text-[#EA4335] mb-3" />
            <h3 className="font-bold text-base mb-1">Embedding Restricted by YouTube Creator</h3>
            <p className="text-neutral-400 text-xs max-w-md mb-4 leading-relaxed">
              {playerError} You can open this lesson directly on YouTube and still track notes and progress here.
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId || video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <span>Watch Lesson on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Floating Tactile HUD Toast (Arrow keys & Shortcut feedback) */}
        {hudToast && (
          <div
            key={hudToast.key}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700/80 text-white font-mono text-xs sm:text-sm font-semibold tracking-wide shadow-xl animate-in fade-in zoom-in-95 pointer-events-none flex items-center gap-2"
          >
            <span>{hudToast.text}</span>
          </div>
        )}

        {/* Left Floating Previous Video Button on Hover */}
        {hasPrevious && onPreviousVideo && (
          <button
            onClick={onPreviousVideo}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-[#EA4335] text-white flex items-center justify-center backdrop-blur-xs border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 hover:scale-110 shadow-lg"
            title={`Previous: ${previousVideo?.title || 'Lesson'}`}
          >
            <ChevronLeft className="w-6 h-6 -ml-0.5" />
          </button>
        )}

        {/* Right Floating Next Video Button on Hover */}
        {hasNext && onNextVideo && (
          <button
            onClick={onNextVideo}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-[#EA4335] text-white flex items-center justify-center backdrop-blur-xs border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 hover:scale-110 shadow-lg"
            title={`Next: ${nextVideo?.title || 'Lesson'}`}
          >
            <ChevronRight className="w-6 h-6 -mr-0.5" />
          </button>
        )}

        {/* Auto-Play Next Countdown Banner */}
        {nextCountdown !== null && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-white animate-in fade-in">
            <Sparkles className="w-10 h-10 text-[#EA4335] mb-3 animate-bounce" />
            <h3 className="text-lg font-bold mb-1">Up Next in Course</h3>
            <p className="text-neutral-300 text-xs max-w-md text-center line-clamp-1 mb-4 px-4">
              {nextVideo?.title || 'Next Lesson'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  cancelAutoPlayCountdown();
                  onNextVideo?.();
                }}
                className="px-5 py-2 bg-[#EA4335] hover:bg-[#d9382b] text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Play Now ({nextCountdown}s)
              </button>
              <button
                onClick={cancelAutoPlayCountdown}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-full text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Custom Progress Bar & Controls Bar */}
      <div className="relative w-full bg-neutral-950 px-4 pt-3 pb-2.5 border-t border-neutral-850">
        
        {/* Scrubbing Bar */}
        <div className="relative w-full flex items-center group cursor-pointer mb-2.5">
          <div className="absolute h-1.5 group-hover:h-2.5 w-full bg-neutral-800 rounded-full transition-all duration-150 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-[#EA4335] to-amber-500 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute w-full h-3 opacity-0 cursor-pointer z-10"
            title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
          />
        </div>

        {/* Video Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-neutral-300 text-xs">
          
          {/* Left Controls: Prev, Play/Pause, Next, 10s Skips, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Previous Video in Playlist */}
            <button
              onClick={onPreviousVideo}
              disabled={!hasPrevious}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${
                hasPrevious
                  ? 'hover:bg-neutral-800 hover:text-white text-neutral-300 active:scale-95'
                  : 'opacity-25 cursor-not-allowed text-neutral-600'
              }`}
              title={previousVideo ? `Previous: ${previousVideo.title} [P]` : 'No previous video'}
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="p-2 bg-neutral-800 hover:bg-[#EA4335] hover:text-white rounded-full transition-all text-white active:scale-95 shadow-sm"
              title={isPlaying ? 'Pause [Space / K]' : 'Play [Space / K]'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Next Video in Playlist */}
            <button
              onClick={onNextVideo}
              disabled={!hasNext}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${
                hasNext
                  ? 'hover:bg-neutral-800 hover:text-white text-neutral-300 active:scale-95'
                  : 'opacity-25 cursor-not-allowed text-neutral-600'
              }`}
              title={nextVideo ? `Next: ${nextVideo.title} [N]` : 'No next video'}
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Skip 10s Backward */}
            <button
              onClick={() => seekRelative(-10)}
              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 rounded-full text-[11px] font-mono text-neutral-300 hover:text-white transition-colors active:scale-95"
              title="Skip 10 seconds back [← / J]"
            >
              -10s
            </button>

            {/* Skip 10s Forward */}
            <button
              onClick={() => seekRelative(10)}
              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 rounded-full text-[11px] font-mono text-neutral-300 hover:text-white transition-colors active:scale-95"
              title="Skip 10 seconds forward [→ / L]"
            >
              +10s
            </button>

            {/* Volume Control Group */}
            <div className="flex items-center gap-1.5 pl-1 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute [M]' : 'Mute [M]'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4 text-neutral-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-neutral-300" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-18 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#EA4335] opacity-70 group-hover/vol:opacity-100 transition-opacity"
                title={`Volume: ${isMuted ? 0 : volume}% [↑ / ↓]`}
              />
            </div>

            {/* Time Stamp Display */}
            <span className="font-mono text-xs text-neutral-400 ml-1 hidden sm:inline">
              {formatTime(currentTime)} <span className="text-neutral-600">/</span> {formatTime(duration)}
              <span className="ml-1.5 font-semibold text-neutral-500 text-[10px]">
                ({Math.round(progressPercent)}%)
              </span>
            </span>
          </div>

          {/* Right Controls: Speed, Auto-Next, Mark Complete, Shortcuts, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-full border border-neutral-800">
              <Gauge className="w-3 h-3 text-neutral-400" />
              {[1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                    playbackRate === rate
                      ? 'bg-[#EA4335] text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Auto Play Next Toggle */}
            <button
              onClick={onToggleAutoPlayNext}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                autoPlayNext 
                  ? 'bg-red-950/40 border-red-800/80 text-red-300' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-300'
              }`}
              title="Automatically play the next course video when finished"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoPlayNext ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'}`} />
              <span className="hidden sm:inline">Auto-next</span>
            </button>

            {/* Mark as Completed Button */}
            <button
              onClick={() => onToggleComplete(video.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-xs ${
                video.completed
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
              }`}
              title="Toggle Complete status"
            >
              <CheckCircle className={`w-3.5 h-3.5 ${video.completed ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span>{video.completed ? 'Done' : 'Mark Done'}</span>
            </button>

            {/* Keyboard Shortcuts Cheat Sheet Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
              title="Keyboard Shortcuts [?]"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
              title="Fullscreen [F]"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-neutral-950 border border-neutral-800 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-[#EA4335]">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Keyboard Shortcuts</h3>
                  <p className="text-[11px] text-neutral-400">Master video navigation with quick keys</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">Space / K</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Skip 10s Back</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">← / J</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Skip 10s Forward</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">→ / L</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Volume Up</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">↑ (+10%)</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Volume Down</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">↓ (-10%)</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Next Lesson</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">N</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Previous Lesson</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">P</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Mute / Unmute</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">M</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Fullscreen</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">F</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-300">Jump 0% - 90%</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 font-mono text-[11px] text-neutral-200">0 - 9</kbd>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 rounded-full bg-[#EA4335] hover:bg-[#d9382b] text-white font-medium text-xs transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

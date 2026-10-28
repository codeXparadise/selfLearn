import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  CheckCircle, 
  Sparkles,
  Gauge
} from 'lucide-react';
import type { Video } from '../types';

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

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
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
  onToggleAutoPlayNext
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timeTrackerRef = useRef<any>(null);
  const lastSavedTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(video.currentTime || 0);
  const [duration, setDuration] = useState(video.durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Security check: Verify that current video belongs strictly to this course's playlist
  const isValidCourseVideo = courseVideos.some(v => v.id === video.id);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
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

  // Sync progress updates to parent
  const syncProgress = useCallback((force = false) => {
    if (!playerRef.current) return;
    try {
      const cur = playerRef.current.getCurrentTime() || 0;
      const dur = playerRef.current.getDuration() || duration;
      setCurrentTime(cur);
      if (dur > 0) setDuration(dur);
      onTimeUpdate?.(cur, dur);

      // Save if force or moved more than 2 seconds since last sync
      if (force || Math.abs(cur - lastSavedTimeRef.current) >= 2) {
        lastSavedTimeRef.current = cur;
        const isDone = dur > 0 && cur / dur >= 0.90;
        onProgressUpdate(video.id, cur, dur, isDone ? true : undefined);
      }
    } catch {
      // player might not be fully initialized
    }
  }, [video.id, duration, onProgressUpdate, onTimeUpdate]);

  // Handle external seek requests (e.g. from AI Tutor or Notes)
  useEffect(() => {
    if (typeof seekToSeconds === 'number' && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seekToSeconds, true);
      setCurrentTime(seekToSeconds);
      syncProgress(true);
    }
  }, [seekToSeconds]);

  // Start polling current time while playing
  const startTimeTracking = useCallback(() => {
    stopTimeTracking();
    timeTrackerRef.current = setInterval(() => {
      syncProgress();
    }, 1000);
  }, [syncProgress]);

  const stopTimeTracking = useCallback(() => {
    if (timeTrackerRef.current) {
      clearInterval(timeTrackerRef.current);
      timeTrackerRef.current = null;
    }
  }, []);

  // Handle video countdown for auto play next
  const triggerAutoPlayCountdown = useCallback(() => {
    if (!hasNext || !autoPlayNext) {
      onVideoEnd?.();
      return;
    }
    setNextCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setNextCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setNextCountdown(null);
          onNextVideo?.();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [hasNext, autoPlayNext, onNextVideo, onVideoEnd]);

  const cancelAutoPlayCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setNextCountdown(null);
  };

  // Initialize or re-cue player when video changes
  useEffect(() => {
    if (!isValidCourseVideo) return;

    cancelAutoPlayCountdown();
    setCurrentTime(video.currentTime || 0);
    lastSavedTimeRef.current = video.currentTime || 0;

    const createOrUpdatePlayer = () => {
      if (!window.YT || !window.YT.Player) {
        window.onYouTubeIframeAPIReady = createOrUpdatePlayer;
        return;
      }

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        // Player already exists, load current course video at saved timestamp
        playerRef.current.loadVideoById({
          videoId: video.id,
          startSeconds: video.currentTime || 0
        });
        setIsPlaying(true);
      } else {
        // Create new player
        const playerId = 'youtube-course-player';
        playerRef.current = new window.YT.Player(playerId, {
          height: '100%',
          width: '100%',
          videoId: video.id,
          playerVars: {
            autoplay: 1,
            start: Math.floor(video.currentTime || 0),
            controls: 1,
            modestbranding: 1,
            rel: 0, // Never show related videos from outside
            playsinline: 1,
            iv_load_policy: 3, // Disable annotations
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);
              if (video.currentTime && video.currentTime > 0) {
                event.target.seekTo(video.currentTime, true);
              }
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startTimeTracking();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                stopTimeTracking();
                syncProgress(true);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                stopTimeTracking();
                // Mark video completed
                onProgressUpdate(video.id, duration || currentTime, duration || currentTime, true);
                triggerAutoPlayCountdown();
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      createOrUpdatePlayer();
    } else {
      window.onYouTubeIframeAPIReady = createOrUpdatePlayer;
    }

    return () => {
      stopTimeTracking();
      cancelAutoPlayCountdown();
    };
  }, [video.id, isValidCourseVideo]);

  // Handle Seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(targetTime, true);
      syncProgress(true);
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Rate change
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  // Jump forward / backward
  const seekRelative = (seconds: number) => {
    if (!playerRef.current) return;
    const cur = playerRef.current.getCurrentTime() || currentTime;
    const target = Math.max(0, Math.min(cur + seconds, duration || cur + 30));
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
    syncProgress(true);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  if (!isValidCourseVideo) {
    return (
      <div className="aspect-video w-full bg-zinc-900 rounded-2xl flex items-center justify-center text-white p-6 text-center">
        <div>
          <p className="text-red-400 font-semibold mb-2">Unauthorized Video Access</p>
          <p className="text-zinc-400 text-sm">
            Self Learn only permits playback of videos belonging directly to this course playlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80">
      {/* Video Container */}
      <div ref={containerRef} className="relative aspect-video w-full bg-black group select-none">
        <div id="youtube-course-player" className="w-full h-full" />

        {/* Auto-Play Next Video Countdown Banner */}
        {nextCountdown !== null && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white animate-fade-in">
            <Sparkles className="w-12 h-12 text-[#FF0000] mb-3 animate-bounce" />
            <h3 className="text-xl font-bold mb-1">Up Next in Course</h3>
            <p className="text-zinc-300 text-sm max-w-md text-center line-clamp-1 mb-4 px-4">
              {courseVideos[courseVideos.findIndex(v => v.id === video.id) + 1]?.title}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  cancelAutoPlayCountdown();
                  onNextVideo?.();
                }}
                className="px-5 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Now ({nextCountdown}s)
              </button>
              <button
                onClick={cancelAutoPlayCountdown}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Primary Video Custom Progress Bar */}
      <div className="relative w-full bg-zinc-950 px-4 pt-3 pb-2 border-t border-zinc-800/60">
        <div className="relative w-full flex items-center group cursor-pointer mb-2">
          {/* Track background */}
          <div className="absolute h-1.5 group-hover:h-2.5 w-full bg-zinc-800 rounded-full transition-all duration-150 overflow-hidden">
            {/* Watched Progress Fill */}
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-[#FF0000] rounded-full transition-all duration-150"
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
            className="absolute w-full h-2.5 opacity-0 cursor-pointer z-10"
            title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
          />
        </div>

        {/* Video Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-zinc-300 text-xs sm:text-sm pt-1">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onPreviousVideo}
              disabled={!hasPrevious}
              className={`p-1.5 rounded-lg transition-colors ${
                hasPrevious ? 'hover:bg-zinc-800 hover:text-white text-zinc-400' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Previous Video (P)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 bg-zinc-800 hover:bg-[#FF0000] hover:text-white rounded-xl transition-colors text-white"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={onNextVideo}
              disabled={!hasNext}
              className={`p-1.5 rounded-lg transition-colors ${
                hasNext ? 'hover:bg-zinc-800 hover:text-white text-zinc-400' : 'opacity-30 cursor-not-allowed'
              }`}
              title="Next Video (N)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekRelative(-5)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-md text-xs text-zinc-400 hover:text-white transition-colors"
              title="Back 5s"
            >
              -5s
            </button>

            <button
              onClick={() => seekRelative(5)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-md text-xs text-zinc-400 hover:text-white transition-colors"
              title="Forward 5s"
            >
              +5s
            </button>

            {/* Time Stamp display */}
            <span className="font-mono text-xs text-zinc-400 ml-1">
              {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(duration)}
              <span className="ml-2 font-semibold text-zinc-500">
                ({Math.round(progressPercent)}%)
              </span>
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              {[1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                    playbackRate === rate
                      ? 'bg-[#FF0000] text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Auto Play Next Toggle */}
            <button
              onClick={onToggleAutoPlayNext}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                autoPlayNext 
                  ? 'bg-red-950/40 border-red-800/80 text-red-300' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
              title="Automatically play the next course video when finished"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoPlayNext ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
              Auto-next
            </button>

            {/* Mark as Completed Button */}
            <button
              onClick={() => onToggleComplete(video.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                video.completed
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
              title="Toggle Complete status for this video"
            >
              <CheckCircle className={`w-3.5 h-3.5 ${video.completed ? 'text-emerald-400' : 'text-zinc-400'}`} />
              {video.completed ? 'Completed' : 'Mark Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


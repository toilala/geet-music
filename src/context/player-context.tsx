import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';
import { Vibration } from 'react-native';

import { tracks, type RepeatMode, type Track } from '@/data/music';
import type { PlaybackSnapshot, PlaybackStatus } from '@/services/playback';
import { recordSignal } from '@/services/recommendations';
import { getRelatedTracks } from '@/services/youtube';

type PlayerController = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
};

type PlayerContextValue = {
  activeTrack: Track;
  queue: Track[];
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackStatus: PlaybackStatus;
  playbackSource: PlaybackSnapshot['source'];
  setStatus: (status: PlaybackStatus) => void;
  recordTrackSignal: (signal: 'play' | 'complete' | 'skip' | 'like' | 'expose') => void;
  selectTrack: (track: Track, newQueue?: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  setPlayback: (currentTime: number, duration: number) => void;
  seekTo: (seconds: number) => void;
  shuffleEnabled: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  toggleRepeat: () => void;
  togglePlayback: () => void;
  registerController: (controller: PlayerController | null) => void;
  // Advanced YouTube Music features
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  startRadio: (track: Track) => Promise<void>;
  sleepTimerRemaining: number | null; // in seconds
  setSleepTimer: (minutes: number | null) => void;
  isVideoMode: boolean;
  toggleVideoMode: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: PropsWithChildren) {
  const [activeTrack, setActiveTrack] = useState<Track>(tracks[0]);
  const [queue, setQueue] = useState<Track[]>(tracks);
  const [originalQueue, setOriginalQueue] = useState<Track[]>(tracks);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [playbackSource] = useState<PlaybackSnapshot['source']>('youtube-iframe');
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const controllerRef = useRef<PlayerController | null>(null);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerRemaining === null) return;

    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          controllerRef.current?.pause();
          setPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerRemaining, setPlaying]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    try {
      Vibration.vibrate(10);
    } catch {
      // fallback
    }
    if (minutes === null || minutes <= 0) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(Math.round(minutes * 60));
    }
  }, []);

  const selectTrack = useCallback((track: Track, newQueue?: Track[]) => {
    setActiveTrack(track);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackStatus('loading');
    setPlaying(true);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      setOriginalQueue(newQueue);
    } else {
      setQueue((curr) => (curr.some((t) => t.id === track.id) ? curr : [track, ...curr]));
      setOriginalQueue((curr) => (curr.some((t) => t.id === track.id) ? curr : [track, ...curr]));
    }
  }, []);

  const playNext = useCallback(() => {
    if (repeatMode === 'one') {
      controllerRef.current?.seekTo(0);
      setCurrentTime(0);
      setPlaying(true);
      return;
    }

    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;
      const currentIndex = currentQueue.findIndex((item) => item.id === activeTrack.id);

      if (currentIndex === currentQueue.length - 1 && repeatMode === 'off') {
        // Queue finished
        setPlaying(false);
        return currentQueue;
      }

      const nextIndex = (currentIndex + 1) % currentQueue.length;
      const nextTrack = currentQueue[nextIndex];
      if (nextTrack) {
        setActiveTrack(nextTrack);
        setCurrentTime(0);
        setDuration(0);
        setPlaying(true);
      }
      return currentQueue;
    });
  }, [activeTrack.id, repeatMode]);

  const playPrevious = useCallback(() => {
    // If playing for more than 4 seconds, restart current track
    if (currentTime > 4) {
      controllerRef.current?.seekTo(0);
      setCurrentTime(0);
      return;
    }

    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;
      const currentIndex = currentQueue.findIndex((item) => item.id === activeTrack.id);
      const prevIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
      const prevTrack = currentQueue[prevIndex];
      if (prevTrack) {
        setActiveTrack(prevTrack);
        setCurrentTime(0);
        setDuration(0);
        setPlaying(true);
      }
      return currentQueue;
    });
  }, [activeTrack.id, currentTime]);

  const registerController = useCallback((controller: PlayerController | null) => {
    controllerRef.current = controller;
  }, []);

  const togglePlayback = useCallback(() => {
    try {
      Vibration.vibrate(8);
    } catch {
      // fallback
    }
    controllerRef.current?.toggle();
  }, []);

  const setPlayback = useCallback((nextTime: number, nextDuration: number) => {
    setCurrentTime(nextTime);
    setDuration(nextDuration);
  }, []);

  const setStatus = useCallback((status: PlaybackStatus) => setPlaybackStatus(status), []);

  const recordTrackSignal = useCallback(
    (signal: 'play' | 'complete' | 'skip' | 'like' | 'expose') => {
      void recordSignal(activeTrack, signal);
    },
    [activeTrack]
  );

  const seekTo = useCallback((seconds: number) => {
    controllerRef.current?.seekTo(seconds);
  }, []);

  const toggleShuffle = useCallback(() => {
    try {
      Vibration.vibrate(10);
    } catch {
      // fallback
    }
    setShuffleEnabled((prev) => {
      const nextState = !prev;
      if (nextState) {
        // Shuffle queue keeping active track first
        setQueue((curr) => {
          const others = curr.filter((t) => t.id !== activeTrack.id);
          for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
          }
          return [activeTrack, ...others];
        });
      } else {
        // Restore original queue order
        setQueue(originalQueue);
      }
      return nextState;
    });
  }, [activeTrack, originalQueue]);

  const toggleRepeat = useCallback(() => {
    try {
      Vibration.vibrate(10);
    } catch {
      // fallback
    }
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleVideoMode = useCallback(() => {
    setIsVideoMode((prev) => !prev);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    try {
      Vibration.vibrate(8);
    } catch {
      // fallback
    }
    setQueue((curr) => [...curr, track]);
    setOriginalQueue((curr) => [...curr, track]);
  }, []);

  const playNextInQueue = useCallback(
    (track: Track) => {
      try {
        Vibration.vibrate(8);
      } catch {
        // fallback
      }
      setQueue((curr) => {
        const index = curr.findIndex((t) => t.id === activeTrack.id);
        const copy = [...curr];
        copy.splice(index + 1, 0, track);
        return copy;
      });
      setOriginalQueue((curr) => {
        const index = curr.findIndex((t) => t.id === activeTrack.id);
        const copy = [...curr];
        copy.splice(index + 1, 0, track);
        return copy;
      });
    },
    [activeTrack.id]
  );

  const removeFromQueue = useCallback((index: number) => {
    setQueue((curr) => curr.filter((_, i) => i !== index));
    setOriginalQueue((curr) => curr.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([activeTrack]);
    setOriginalQueue([activeTrack]);
  }, [activeTrack]);

  const startRadio = useCallback(
    async (track: Track) => {
      try {
        Vibration.vibrate(15);
        setActiveTrack(track);
        setCurrentTime(0);
        setDuration(0);
        setPlaying(true);
        const related = await getRelatedTracks(track);
        const newStation = [track, ...related];
        setQueue(newStation);
        setOriginalQueue(newStation);
      } catch (e) {
        console.warn('Radio generator error:', e);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      activeTrack,
      queue,
      playing,
      currentTime,
      duration,
      playbackStatus,
      playbackSource,
      setStatus,
      recordTrackSignal,
      selectTrack,
      playNext,
      playPrevious,
      setPlaying,
      setPlayback,
      seekTo,
      shuffleEnabled,
      toggleShuffle,
      repeatMode,
      toggleRepeat,
      togglePlayback,
      registerController,
      addToQueue,
      playNextInQueue,
      removeFromQueue,
      clearQueue,
      startRadio,
      sleepTimerRemaining,
      setSleepTimer,
      isVideoMode,
      toggleVideoMode,
    }),
    [
      activeTrack,
      queue,
      playing,
      currentTime,
      duration,
      playbackStatus,
      playbackSource,
      setStatus,
      recordTrackSignal,
      selectTrack,
      playNext,
      playPrevious,
      setPlaying,
      setPlayback,
      seekTo,
      shuffleEnabled,
      toggleShuffle,
      repeatMode,
      toggleRepeat,
      togglePlayback,
      registerController,
      addToQueue,
      playNextInQueue,
      removeFromQueue,
      clearQueue,
      startRadio,
      sleepTimerRemaining,
      setSleepTimer,
      isVideoMode,
      toggleVideoMode,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}

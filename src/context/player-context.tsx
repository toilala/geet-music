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
import { recordSignal, type ListeningSignalType } from '@/services/recommendations';
import { getRelatedTracks } from '@/services/youtube';
import { generateEchoBrainQueue } from '@/services/brain';
import type { ThemeMode } from '@/constants/theme';
import {
  DEFAULT_PLAYER_PREFERENCES,
  readPlayerPreferences,
  updatePlayerPreferences,
} from '@/services/player-preferences';
import { readPersistedPlayerState, writePersistedPlayerState } from '@/services/player-state';
import { recommendationEngine, type EngineResult } from '@/engines/generate';
import { MusicFlowRepository, MusicFlowSession } from '@/engines/music-flow';

type PlayerController = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  setVolume?: (volume: number) => void;
};

type PlayerContextValue = {
  activeTrack: Track;
  queue: Track[];
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackStatus: PlaybackStatus;
  playbackSource: PlaybackSnapshot['source'];
  volume: number;
  setVolume: (vol: number) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setStatus: (status: PlaybackStatus) => void;
  recordTrackSignal: (signal: ListeningSignalType) => void;
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

  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  startRadio: (track: Track) => Promise<void>;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
  isVideoMode: boolean;
  toggleVideoMode: () => void;
  hidePlayerThumbnail: boolean;
  setHidePlayerThumbnail: (hidden: boolean) => void;
  isDockCollapsed: boolean;
  setIsDockCollapsed: (collapsed: boolean) => void;
  generateTasteMix: (count?: number) => Promise<EngineResult>;
  musicFlowSession: MusicFlowSession;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: PropsWithChildren) {
  const musicFlowSession = useMemo(() => new MusicFlowSession(new MusicFlowRepository()), []);
  const [activeTrack, setActiveTrack] = useState<Track>(tracks[0]);
  const [queue, setQueue] = useState<Track[]>(tracks);
  const [originalQueue, setOriginalQueue] = useState<Track[]>(tracks);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_PLAYER_PREFERENCES.volume);
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_PLAYER_PREFERENCES.themeMode);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [playbackSource] = useState<PlaybackSnapshot['source']>('youtube-iframe');
  const [shuffleEnabled, setShuffleEnabled] = useState(DEFAULT_PLAYER_PREFERENCES.shuffleEnabled);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(DEFAULT_PLAYER_PREFERENCES.repeatMode);
  const [isVideoMode, setIsVideoMode] = useState(DEFAULT_PLAYER_PREFERENCES.isVideoMode);
  const [hidePlayerThumbnail, setHidePlayerThumbnail] = useState(DEFAULT_PLAYER_PREFERENCES.hidePlayerThumbnail);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [playerStateLoaded, setPlayerStateLoaded] = useState(false);

  const controllerRef = useRef<PlayerController | null>(null);
  const playerStateWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    void readPlayerPreferences().then((preferences) => {
      if (!mounted) return;
      setVolumeState(preferences.volume);
      setThemeMode(preferences.themeMode);
      setShuffleEnabled(preferences.shuffleEnabled);
      setRepeatMode(preferences.repeatMode);
      setIsVideoMode(preferences.isVideoMode);
      setHidePlayerThumbnail(preferences.hidePlayerThumbnail);
      setPreferencesLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void readPersistedPlayerState().then((state) => {
      if (!mounted) return;
      if (state) {
        setActiveTrack(state.activeTrack);
        setQueue(state.queue.length > 0 ? state.queue : [state.activeTrack]);
        setOriginalQueue(state.originalQueue.length > 0 ? state.originalQueue : state.queue);
        setCurrentTime(state.currentTime);
        setDuration(state.duration);
        setShuffleEnabled(state.shuffleEnabled);
        setRepeatMode(state.repeatMode);
      }
      setPlayerStateLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!playerStateLoaded) return;
    if (playerStateWriteTimer.current) clearTimeout(playerStateWriteTimer.current);
    playerStateWriteTimer.current = setTimeout(() => {
      void writePersistedPlayerState({
        activeTrack,
        queue,
        originalQueue,
        currentTime,
        duration,
        playing,
        shuffleEnabled,
        repeatMode,
      });
    }, 750);
    return () => {
      if (playerStateWriteTimer.current) clearTimeout(playerStateWriteTimer.current);
    };
  }, [
    activeTrack,
    queue,
    originalQueue,
    currentTime,
    duration,
    playing,
    shuffleEnabled,
    repeatMode,
    playerStateLoaded,
  ]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void updatePlayerPreferences({
      volume,
      themeMode,
      shuffleEnabled,
      repeatMode,
      isVideoMode,
      hidePlayerThumbnail,
    });
  }, [volume, themeMode, shuffleEnabled, repeatMode, isVideoMode, hidePlayerThumbnail, preferencesLoaded]);

  // Auto-discover and populate queue with fresh recommendations based on listening
  const discoveredArtists = useRef(new Set<string>());
  const brainEnabled = useRef(true);
  useEffect(() => {
    if (!activeTrack?.artist) return;
    const currentIndex = queue.findIndex((track) => track.id === activeTrack.id || track.videoId === activeTrack.videoId);
    const remaining = currentIndex < 0 ? 0 : queue.length - currentIndex - 1;
    const shouldDiscover = remaining <= 2;
    if (discoveredArtists.current.has(activeTrack.artist) && !shouldDiscover) return;
    discoveredArtists.current.add(activeTrack.artist);

    let mounted = true;
    if (brainEnabled.current) {
      void generateEchoBrainQueue(activeTrack, queue, {
        minQueueSize: 5,
        maxInjected: 8,
        forceDiscovery: remaining <= 2,
      }).then((result) => {
        if (mounted && result.tracks.length > queue.length) {
          setQueue(result.tracks);
          setOriginalQueue((current) => {
            const existing = new Set(current.map((track) => track.id));
            return [...current, ...result.tracks.filter((track) => !existing.has(track.id))];
          });
        }
      }).catch((error) => {
        console.warn('Echo Brain queue injection failed:', error);
      });
    }

    return () => {
      mounted = false;
    };
  }, [activeTrack, queue]);

  // Sleep timer countdown
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
  }, [sleepTimerRemaining]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    try {
      Vibration.vibrate(10);
    } catch {}
    if (minutes === null || minutes <= 0) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(Math.round(minutes * 60));
    }
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((curr) => (curr === 'liquid-glass' ? 'material-expressive' : 'liquid-glass'));
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setVolumeState(clamped);
    controllerRef.current?.setVolume?.(clamped);
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
    try {
      Vibration.vibrate(8);
    } catch {}

    if (repeatMode === 'one') {
      controllerRef.current?.seekTo(0);
      setCurrentTime(0);
      setPlaying(true);
      return;
    }

    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;

      if (shuffleEnabled && currentQueue.length > 1) {
        const others = currentQueue.filter((item) => item.id !== activeTrack.id);
        const randomTrack = others[Math.floor(Math.random() * others.length)];
        if (randomTrack) {
          setActiveTrack(randomTrack);
          setCurrentTime(0);
          setDuration(0);
          setPlaying(true);
          return currentQueue;
        }
      }

      const currentIndex = currentQueue.findIndex(
        (item) => item.id === activeTrack.id || item.videoId === activeTrack.videoId
      );

      const isLastTrack = currentIndex >= currentQueue.length - 1;
      if (isLastTrack && repeatMode === 'off') {
        setPlaying(false);
        setPlaybackStatus('ready');
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
  }, [activeTrack.id, activeTrack.videoId, repeatMode, shuffleEnabled]);

  const playPrevious = useCallback(() => {
    try {
      Vibration.vibrate(8);
    } catch {}

    if (currentTime > 3) {
      controllerRef.current?.seekTo(0);
      setCurrentTime(0);
      return;
    }

    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;

      if (shuffleEnabled && currentQueue.length > 1) {
        const others = currentQueue.filter((item) => item.id !== activeTrack.id);
        const randomTrack = others[Math.floor(Math.random() * others.length)];
        if (randomTrack) {
          setActiveTrack(randomTrack);
          setCurrentTime(0);
          setDuration(0);
          setPlaying(true);
          return currentQueue;
        }
      }

      const currentIndex = currentQueue.findIndex(
        (item) => item.id === activeTrack.id || item.videoId === activeTrack.videoId
      );
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
  }, [activeTrack.id, activeTrack.videoId, currentTime, shuffleEnabled]);

  const registerController = useCallback((controller: PlayerController | null) => {
    controllerRef.current = controller;
  }, []);

  const togglePlayback = useCallback(() => {
    try {
      Vibration.vibrate(10);
    } catch {}
    setPlaying((prev) => !prev);
  }, []);

  const setPlayback = useCallback((nextTime: number, nextDuration: number) => {
    setCurrentTime(nextTime);
    if (nextDuration > 0) {
      setDuration(nextDuration);
    }
  }, []);

  const setStatus = useCallback((status: PlaybackStatus) => setPlaybackStatus(status), []);

  const recordTrackSignal = useCallback(
    (signal: ListeningSignalType) => {
      void recordSignal(activeTrack, signal);
    },
    [activeTrack]
  );

  const seekTo = useCallback((seconds: number) => {
    controllerRef.current?.seekTo(seconds);
  }, []);

  const toggleShuffle = useCallback(() => {
    try {
      Vibration.vibrate(12);
    } catch {}
    setShuffleEnabled((prev) => {
      const next = !prev;
      if (next) {
        setQueue((curr) => {
          const others = curr.filter((t) => t.id !== activeTrack.id);
          for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
          }
          return [activeTrack, ...others];
        });
      } else {
        setQueue(originalQueue);
      }
      return next;
    });
  }, [activeTrack, originalQueue]);

  const toggleRepeat = useCallback(() => {
    try {
      Vibration.vibrate(10);
    } catch {}
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
    } catch {}
    setQueue((curr) => [...curr, track]);
    setOriginalQueue((curr) => [...curr, track]);
  }, []);

  const playNextInQueue = useCallback(
    (track: Track) => {
      try {
        Vibration.vibrate(8);
      } catch {}
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

  const startRadio = useCallback(async (track: Track) => {
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
  }, []);

  const generateTasteMix = useCallback((count = 25) => recommendationEngine.generate(count), []);

  const value = useMemo(
    () => ({
      activeTrack,
      queue,
      playing,
      currentTime,
      duration,
      playbackStatus,
      playbackSource,
      volume,
      setVolume,
      themeMode,
      setThemeMode,
      toggleThemeMode,
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
      hidePlayerThumbnail,
      setHidePlayerThumbnail,
      isDockCollapsed,
      setIsDockCollapsed,
      generateTasteMix,
      musicFlowSession,
    }),
    [
      activeTrack,
      queue,
      playing,
      currentTime,
      duration,
      playbackStatus,
      playbackSource,
      volume,
      setVolume,
      themeMode,
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
      hidePlayerThumbnail,
      setHidePlayerThumbnail,
      toggleThemeMode,
      isDockCollapsed,
      generateTasteMix,
      musicFlowSession,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}

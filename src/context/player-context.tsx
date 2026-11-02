import { createContext, useCallback, useContext, useMemo, useRef, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from 'react';

import { tracks, type Track } from '@/data/music';

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
  selectTrack: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  setPlayback: (currentTime: number, duration: number) => void;
  seekTo: (seconds: number) => void;
  shuffleEnabled: boolean;
  toggleShuffle: () => void;
  togglePlayback: () => void;
  registerController: (controller: PlayerController | null) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: PropsWithChildren) {
  const [activeTrack, setActiveTrack] = useState<Track>({
    id: 'midnight-drive',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    videoId: 'hTWKbfoikeg',
    artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=85',
    duration: '5:01',
  });
  const [queue, setQueue] = useState<Track[]>(tracks);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const controllerRef = useRef<PlayerController | null>(null);

  const selectTrack = useCallback((track: Track) => {
    setActiveTrack(track);
    setCurrentTime(0);
    setDuration(0);
    setQueue((currentQueue) => currentQueue.some((item) => item.id === track.id) ? currentQueue : [...currentQueue, track]);
  }, []);
  const playNext = useCallback(() => {
    setQueue((currentQueue) => {
      const currentIndex = currentQueue.findIndex((item) => item.id === activeTrack.id);
      const candidates = shuffleEnabled && currentQueue.length > 1
        ? currentQueue.filter((item) => item.id !== activeTrack.id)
        : currentQueue;
      const nextIndex = shuffleEnabled && currentQueue.length > 1
        ? Math.floor(Math.random() * candidates.length)
        : (currentIndex + 1) % currentQueue.length;
      const nextTrack = candidates[nextIndex];
      if (nextTrack) {
        setActiveTrack(nextTrack);
        setCurrentTime(0);
        setDuration(0);
        setPlaying(true);
      }
      return currentQueue;
    });
  }, [activeTrack.id, shuffleEnabled]);
  const playPrevious = useCallback(() => {
    setQueue((currentQueue) => {
      const currentIndex = currentQueue.findIndex((item) => item.id === activeTrack.id);
      const previousTrack = currentQueue[(currentIndex - 1 + currentQueue.length) % currentQueue.length];
      if (previousTrack) {
        setActiveTrack(previousTrack);
        setCurrentTime(0);
        setDuration(0);
        setPlaying(true);
      }
      return currentQueue;
    });
  }, [activeTrack.id]);
  const registerController = useCallback((controller: PlayerController | null) => {
    controllerRef.current = controller;
  }, []);
  const togglePlayback = useCallback(() => controllerRef.current?.toggle(), []);
  const setPlayback = useCallback((nextTime: number, nextDuration: number) => {
    setCurrentTime(nextTime);
    setDuration(nextDuration);
  }, []);
  const seekTo = useCallback((seconds: number) => controllerRef.current?.seekTo(seconds), []);
  const toggleShuffle = useCallback(() => setShuffleEnabled((value) => !value), []);

  const value = useMemo(() => ({
    activeTrack,
    queue,
    playing,
    currentTime,
    duration,
    selectTrack,
    playNext,
    playPrevious,
    setPlaying,
    setPlayback,
    seekTo,
    shuffleEnabled,
    toggleShuffle,
    togglePlayback,
    registerController,
  }), [activeTrack, queue, playing, currentTime, duration, shuffleEnabled, selectTrack, playNext, playPrevious, togglePlayback, registerController, setPlayback, seekTo, toggleShuffle]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}

import { createContext, useCallback, useContext, useMemo, useRef, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from 'react';

import { tracks, type Track } from '@/data/music';

type PlayerController = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

type PlayerContextValue = {
  activeTrack: Track;
  queue: Track[];
  playing: boolean;
  selectTrack: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaying: Dispatch<SetStateAction<boolean>>;
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
  const controllerRef = useRef<PlayerController | null>(null);

  const selectTrack = useCallback((track: Track) => {
    setActiveTrack(track);
    setQueue((currentQueue) => currentQueue.some((item) => item.id === track.id) ? currentQueue : [...currentQueue, track]);
  }, []);
  const playNext = useCallback(() => {
    setQueue((currentQueue) => {
      const currentIndex = currentQueue.findIndex((item) => item.id === activeTrack.id);
      const nextTrack = currentQueue[(currentIndex + 1) % currentQueue.length];
      if (nextTrack) {
        setActiveTrack(nextTrack);
        setPlaying(true);
      }
      return currentQueue;
    });
  }, [activeTrack.id]);
  const playPrevious = useCallback(() => {
    setQueue((currentQueue) => {
      const currentIndex = currentQueue.findIndex((item) => item.id === activeTrack.id);
      const previousTrack = currentQueue[(currentIndex - 1 + currentQueue.length) % currentQueue.length];
      if (previousTrack) {
        setActiveTrack(previousTrack);
        setPlaying(true);
      }
      return currentQueue;
    });
  }, [activeTrack.id]);
  const registerController = useCallback((controller: PlayerController | null) => {
    controllerRef.current = controller;
  }, []);
  const togglePlayback = useCallback(() => controllerRef.current?.toggle(), []);

  const value = useMemo(() => ({
    activeTrack,
    queue,
    playing,
    selectTrack,
    playNext,
    playPrevious,
    setPlaying,
    togglePlayback,
    registerController,
  }), [activeTrack, queue, playing, selectTrack, playNext, playPrevious, togglePlayback, registerController]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}

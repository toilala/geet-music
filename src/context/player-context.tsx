import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import type { Track } from '@/data/music';

type PlayerController = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

type PlayerContextValue = {
  activeTrack: Track;
  playing: boolean;
  selectTrack: (track: Track) => void;
  setPlaying: (playing: boolean) => void;
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
  const [playing, setPlaying] = useState(false);
  const controllerRef = useRef<PlayerController | null>(null);

  const selectTrack = useCallback((track: Track) => setActiveTrack(track), []);
  const registerController = useCallback((controller: PlayerController | null) => {
    controllerRef.current = controller;
  }, []);
  const togglePlayback = useCallback(() => controllerRef.current?.toggle(), []);

  const value = useMemo(() => ({
    activeTrack,
    playing,
    selectTrack,
    setPlaying,
    togglePlayback,
    registerController,
  }), [activeTrack, playing, selectTrack, togglePlayback, registerController]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider');
  return context;
}

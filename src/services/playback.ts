import type { Track } from '@/types/music';

export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'error';

export type PlaybackSnapshot = {
  track: Track;
  status: PlaybackStatus;
  positionSeconds: number;
  durationSeconds: number;
  bufferedSeconds: number;
  source: 'youtube-iframe' | 'native-stream';
  error?: string;
};

export type PlaybackAdapter = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  load: (track: Track) => void;
};

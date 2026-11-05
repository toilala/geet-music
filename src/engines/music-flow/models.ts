import type { Track } from '@/types/music';

export type MusicFlowSource = 'now-playing' | 'history' | 'liked' | 'quick-picks' | 'catalog' | 'offline';

export type MusicFlowItem = {
  song: Track;
  source: MusicFlowSource;
};

export type TakeoverBlock = 'casting' | 'listen-together-guest';
export type MusicFlowFeedError = 'offline' | 'empty' | 'failed';
export type MusicFlowPlaybackStatus =
  | { kind: 'idle' }
  | { kind: 'switching' }
  | { kind: 'synced' }
  | { kind: 'blocked'; reason: TakeoverBlock }
  | { kind: 'external-override' };

export type MusicFlowFeedState = {
  items: MusicFlowItem[];
  selectedIndex: number;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: MusicFlowFeedError | null;
  hasMore: boolean;
  isOffline: boolean;
};

export const emptyMusicFlowState = (): MusicFlowFeedState => ({
  items: [],
  selectedIndex: 0,
  isInitialLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  isOffline: false,
});

export function musicFlowSongId(item: MusicFlowItem): string {
  return item.song.id;
}

export function musicFlowArtistKey(item: MusicFlowItem): string | null {
  const artist = item.song.artist.split(',')[0]?.trim();
  return artist ? artist.toLowerCase() : null;
}

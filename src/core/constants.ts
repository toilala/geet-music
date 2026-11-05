export const CORE_STORAGE_VERSION = 1;
export const RECENT_EXCLUSION_LIMIT = 30;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_MUSIC_FLOW_SIZE = 300;
export const CORE_TASTE_PROFILE_TTL_MILLIS = 60 * 60 * 1000;
export const PLAYBACK_POSITION_TOLERANCE_MS = 3_000;
export const DEFAULT_CROSSFADE_DURATION_MS = 4_000;

export const MEDIA_SESSION_ACTIONS = {
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  NEXT: 'next',
  PREVIOUS: 'previous',
  STOP: 'stop',
} as const;

export type HistorySource = 'user' | 'queue' | 'recognition' | 'import' | 'radio';
export type LibraryFilter = 'all' | 'songs' | 'albums' | 'artists' | 'playlists';

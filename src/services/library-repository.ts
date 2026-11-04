import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Playlist, Track } from '@/data/music';

const STORAGE_VERSION = 3;
const KEYS: Record<keyof LibrarySnapshot, string> = {
  likedTracks: '@geet/library/liked',
  playlists: '@geet/library/playlists',
  history: '@geet/library/history',
  searchHistory: '@geet/library/search-history',
} as const;

export type LibrarySnapshot = {
  likedTracks: Track[];
  playlists: Playlist[];
  history: Track[];
  searchHistory: string[];
};

type Versioned<T> = { version: number; value: T };

function decode<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Versioned<T> | T;
    if (typeof parsed === 'object' && parsed !== null && 'value' in parsed) {
      return (parsed as Versioned<T>).value;
    }
    return parsed as T;
  } catch (error) {
    console.warn('Unable to decode library data:', error);
    return fallback;
  }
}

export async function readLibrarySnapshot(): Promise<LibrarySnapshot> {
  const [liked, playlists, history, searchHistory] = await Promise.all(
    Object.values(KEYS).map((key) => AsyncStorage.getItem(key))
  );
  return {
    likedTracks: decode(liked, []),
    playlists: decode(playlists, []),
    history: decode(history, []),
    searchHistory: decode(searchHistory, []),
  };
}

export async function writeLibraryValue<K extends keyof LibrarySnapshot>(
  key: K,
  value: LibrarySnapshot[K]
): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[key], JSON.stringify({ version: STORAGE_VERSION, value }));
  } catch (error) {
    console.warn(`Unable to persist library ${key}:`, error);
  }
}

export async function clearLibrarySnapshot(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

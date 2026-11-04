import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeMode } from '@/constants/theme';
import type { RepeatMode } from '@/data/music';

const STORAGE_KEY = '@geet/player-preferences-v1';

export type PlayerPreferences = {
  volume: number;
  themeMode: ThemeMode;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  isVideoMode: boolean;
  dataSaverEnabled: boolean;
  hidePlayerThumbnail: boolean;
  crossfadeEnabled: boolean;
  lyricAnimation: 'smooth' | 'minimal';
};

export const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = {
  volume: 85,
  themeMode: 'material-expressive',
  shuffleEnabled: false,
  repeatMode: 'off',
  isVideoMode: false,
  dataSaverEnabled: false,
  hidePlayerThumbnail: false,
  crossfadeEnabled: false,
  lyricAnimation: 'smooth',
};

export async function readPlayerPreferences(): Promise<PlayerPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYER_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<PlayerPreferences>;
    return {
      ...DEFAULT_PLAYER_PREFERENCES,
      ...parsed,
      volume: Math.max(0, Math.min(100, Number(parsed.volume ?? DEFAULT_PLAYER_PREFERENCES.volume))),
    };
  } catch (error) {
    console.warn('Unable to read player preferences:', error);
    return DEFAULT_PLAYER_PREFERENCES;
  }
}

export async function writePlayerPreferences(preferences: PlayerPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Unable to save player preferences:', error);
  }
}

export async function updatePlayerPreferences(patch: Partial<PlayerPreferences>): Promise<void> {
  const current = await readPlayerPreferences();
  await writePlayerPreferences({ ...current, ...patch });
}

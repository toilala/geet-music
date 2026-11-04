import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RepeatMode, Track } from '@/types/music';

const STORAGE_KEY = '@geet/player-state-v1';

export type PersistedPlayerState = {
  activeTrack: Track;
  queue: Track[];
  originalQueue: Track[];
  currentTime: number;
  duration: number;
  playing: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
};

export async function readPersistedPlayerState(): Promise<PersistedPlayerState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedPlayerState;
    if (!state.activeTrack?.id || !Array.isArray(state.queue)) return null;
    return {
      ...state,
      queue: state.queue.filter((track) => Boolean(track?.id)),
      originalQueue: Array.isArray(state.originalQueue) ? state.originalQueue.filter((track) => Boolean(track?.id)) : state.queue,
      currentTime: Math.max(0, Number(state.currentTime) || 0),
      duration: Math.max(0, Number(state.duration) || 0),
      playing: false,
    };
  } catch (error) {
    console.warn('Unable to restore player state:', error);
    return null;
  }
}

export async function writePersistedPlayerState(state: PersistedPlayerState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, playing: false }));
  } catch (error) {
    console.warn('Unable to persist player state:', error);
  }
}

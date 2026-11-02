import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Track } from '@/data/music';

const STORAGE_KEY = '@geet/music-signals-v1';
const MAX_HISTORY = 100;
export type ListeningSignal = {
  trackId: string;
  plays: number;
  completed: number;
  skips: number;
  liked: boolean;
  lastPlayedAt: number;
  lastExposedAt: number;
};

type SignalStore = Record<string, ListeningSignal>;

export async function readSignals(): Promise<SignalStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SignalStore;
  } catch (error) {
    console.warn('Geet Music could not read local listening history.', error);
    return {};
  }
}

export async function recordSignal(track: Track, signal: 'play' | 'complete' | 'skip' | 'like' | 'expose') {
  const signals = await readSignals();
  const current = signals[track.id] ?? {
    trackId: track.id,
    plays: 0,
    completed: 0,
    skips: 0,
    liked: false,
    lastPlayedAt: 0,
    lastExposedAt: 0,
  };
  const now = Date.now();
  if (signal === 'play') {
    current.plays += 1;
    current.lastPlayedAt = now;
  } else if (signal === 'complete') {
    current.completed += 1;
  } else if (signal === 'skip') {
    current.skips += 1;
  } else if (signal === 'like') {
    current.liked = !current.liked;
  } else {
    current.lastExposedAt = now;
  }
  signals[track.id] = current;
  const recent = Object.values(signals)
    .sort((left, right) => Math.max(right.lastPlayedAt, right.lastExposedAt) - Math.max(left.lastPlayedAt, left.lastExposedAt))
    .slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(recent.map((item) => [item.trackId, item]))));
  return current;
}

export async function getRecommendations(candidates: Track[], currentTrackId?: string) {
  const signals = await readSignals();
  const now = Date.now();
  const seenArtists = new Set<string>();
  const ranked = candidates
    .filter((track) => track.id !== currentTrackId)
    .map((track) => {
      const signal = signals[track.id];
      const artistKey = normalize(track.artist);
      const familiarArtist = seenArtists.has(artistKey);
      const hoursSinceExposure = signal?.lastExposedAt ? (now - signal.lastExposedAt) / 3600000 : 999;
      const hoursSincePlay = signal?.lastPlayedAt ? (now - signal.lastPlayedAt) / 3600000 : 999;
      const novelty = Math.min(hoursSinceExposure / 24, 4);
      const freshness = Math.min(hoursSincePlay / 48, 3);
      const affinity = (signal?.plays ?? 0) + (signal?.completed ?? 0) * 2 + (signal?.liked ? 5 : 0);
      const penalty = (signal?.skips ?? 0) * 3 + (familiarArtist ? 2 : 0) + (hoursSinceExposure < 8 ? 8 : 0);
      const exploration = signal ? 0 : Math.random() * 4;
      return { track, score: affinity + novelty + freshness + exploration - penalty, artistKey };
    })
    .sort((left, right) => right.score - left.score);

  const selected: Track[] = [];
  for (const item of ranked) {
    if (selected.length >= 12) break;
    if (selected.filter((track) => normalize(track.artist) === item.artistKey).length >= 2) continue;
    selected.push(item.track);
    seenArtists.add(item.artistKey);
  }
  await Promise.all(selected.map((track) => recordSignal(track, 'expose')));
  return selected;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

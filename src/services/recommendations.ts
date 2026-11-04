import AsyncStorage from '@react-native-async-storage/async-storage';

import { tracks, type Track } from '@/data/music';
import { searchYouTube } from '@/services/youtube';

const STORAGE_KEY = '@geet/music-signals-v2';

export type ListeningSignal = {
  trackId: string;
  title: string;
  artist: string;
  artwork: string;
  videoId: string;
  duration: string;
  plays: number;
  completed: number;
  skips: number;
  liked: boolean;
  lastPlayedAt: number;
};

export type SignalStore = Record<string, ListeningSignal>;

export async function readSignals(): Promise<SignalStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SignalStore;
  } catch {
    return {};
  }
}

export type ListeningSignalType = 'play' | 'complete' | 'skip' | 'like' | 'expose';

export async function recordSignal(track: Track, signal: ListeningSignalType) {
  try {
    const signals = await readSignals();
    const current: ListeningSignal = signals[track.id] ?? {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      videoId: track.videoId,
      duration: track.duration,
      plays: 0,
      completed: 0,
      skips: 0,
      liked: false,
      lastPlayedAt: 0,
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
    }

    signals[track.id] = current;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
    return current;
  } catch {
    return null;
  }
}

// Get user's Top 50 most listened songs (Screenshot 1: "My top 50")
export async function getTop50Tracks(): Promise<Track[]> {
  const signals = await readSignals();
  const sorted = Object.values(signals)
    .sort((a, b) => b.plays * 2 + b.completed * 3 - a.skips - (a.plays * 2 + a.completed * 3 - b.skips))
    .slice(0, 50);

  if (sorted.length === 0) return tracks.slice(0, 8);

  return sorted.map((s) => ({
    id: s.trackId,
    videoId: s.videoId,
    title: s.title,
    artist: s.artist,
    artwork: s.artwork,
    duration: s.duration,
    durationSeconds: 240,
  }));
}

// Get user's Bottom 50 least listened / fresh discovery songs (Screenshot 1: "My bottom 50")
export async function getBottom50Tracks(): Promise<Track[]> {
  const signals = await readSignals();
  const list = Object.values(signals);
  if (list.length < 5) return tracks.slice().reverse();

  return list
    .sort((a, b) => a.plays - b.plays)
    .slice(0, 50)
    .map((s) => ({
      id: s.trackId,
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      artwork: s.artwork,
      duration: s.duration,
      durationSeconds: 240,
    }));
}

// Dynamic Spotify/Echo Music-style recommendations based on real listening signals
export async function getDynamicRecommendations(currentTrack?: Track): Promise<Track[]> {
  const signals = await readSignals();
  const preferred = Object.values(signals)
    .sort((a, b) => {
      const scoreA = (a.liked ? 8 : 0) + a.plays * 2 + a.completed * 3 - a.skips * 2;
      const scoreB = (b.liked ? 8 : 0) + b.plays * 2 + b.completed * 3 - b.skips * 2;
      return scoreB - scoreA;
    })
    .slice(0, 4);
  const anchors = currentTrack ? [currentTrack, ...preferred.filter((item) => item.trackId !== currentTrack.id)] : preferred;
  const queries = anchors.slice(0, 3).map((item) => `${item.artist} similar music full songs`);
  queries.push('new Nepali English music official audio');

  const batches = await Promise.all(queries.map((query) => searchYouTube(query).catch(() => [])));
  const seen = new Set<string>();
  const result: Track[] = [];
  for (const batch of batches) {
    for (const track of batch) {
      if (seen.has(track.id) || track.id === currentTrack?.id) continue;
      seen.add(track.id);
      result.push(track);
    }
  }

  return result.length > 0 ? result.slice(0, 24) : tracks.filter((track) => track.id !== currentTrack?.id);
}

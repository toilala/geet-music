import AsyncStorage from '@react-native-async-storage/async-storage';

import { tracks, type Track } from '@/data/music';
import { searchYouTube } from '@/services/youtube';

const STORAGE_KEY = '@geet/music-signals-v2';
const TASTE_PROFILE_KEY = '@geet/taste-profile-v2';

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

type SignalStore = Record<string, ListeningSignal>;

export async function readSignals(): Promise<SignalStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SignalStore;
  } catch {
    return {};
  }
}

export async function recordSignal(track: Track, signal: 'play' | 'complete' | 'skip' | 'like') {
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
  const recentPlayed = Object.values(signals)
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, 5);

  const targetArtist = currentTrack?.artist ?? recentPlayed[0]?.artist ?? 'Top trending music';
  const targetTitle = currentTrack?.title ?? recentPlayed[0]?.title ?? 'Popular songs';

  try {
    const query = `${targetArtist} ${targetTitle} radio mix`;
    const fetched = await searchYouTube(query);
    if (fetched.length > 0) return fetched;
  } catch {}

  return tracks;
}

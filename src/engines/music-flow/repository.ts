import { readEchoCorePreferences } from '@/core/preferences';
import { echoCoreStore } from '@/core/repositories';
import { trackKeyOf } from '@/core/types';
import { getBottom50Tracks, getTop50Tracks } from '@/services/recommendations';
import { getRelatedTracks, searchYouTube } from '@/services/youtube';
import type { MusicFlowCandidateFilter } from '@/engines/music-flow/ranking';
import type { MusicFlowItem, MusicFlowSource } from '@/engines/music-flow/models';
import type { Track } from '@/types/music';

export type MusicFlowSignals = { filter: MusicFlowCandidateFilter; likedArtists: Set<string> };

export interface MusicFlowCursor {
  readonly hasMore: boolean;
  next(): Promise<MusicFlowItem[]>;
}

export interface MusicFlowFeedSource {
  signals(): Promise<MusicFlowSignals>;
  open(nowPlaying?: Track): MusicFlowCursor;
  offlineCandidates(): Promise<MusicFlowItem[]>;
}

export class MusicFlowOfflineError extends Error {
  constructor(cause?: unknown) {
    super('Music Flow could not reach the catalog');
    this.name = 'MusicFlowOfflineError';
    this.cause = cause;
  }
}

export class MusicFlowRepository implements MusicFlowFeedSource {
  async signals(): Promise<MusicFlowSignals> {
    const preferences = await readEchoCorePreferences();
    const library = await import('@/services/library-repository').then((module) => module.readLibrarySnapshot());
    const exclusions = new Set((await echoCoreStore.recommendationExclusions.getAll()).map((item) => item.trackKey));
    const historyIds = preferences.musicFlowHideRecent ? new Set(library.history.slice(0, 30).map((track) => track.id)) : new Set<string>();
    return {
      filter: { excludedTrackKeys: exclusions, recentSongIds: historyIds },
      likedArtists: new Set(library.likedTracks.flatMap((track) => track.artist.split(',').map((artist) => artist.trim().toLowerCase()))),
    };
  }

  open(nowPlaying?: Track): MusicFlowCursor {
    return new RadioCursor(nowPlaying);
  }

  async offlineCandidates(): Promise<MusicFlowItem[]> {
    const [liked, history, fresh] = await Promise.all([getTop50Tracks(), getBottom50Tracks(), import('@/services/library-repository').then((module) => module.readLibrarySnapshot()).then((snapshot) => snapshot.history)]);
    return [...liked, ...history, ...fresh].filter((track, index, all) => all.findIndex((item) => item.id === track.id) === index).map((track) => ({ song: track, source: 'offline' as const }));
  }
}

type Seed = { song: Track; source: MusicFlowSource };

class RadioCursor implements MusicFlowCursor {
  private seeds: Seed[] | null = null;
  private index = 0;
  private exhausted = false;

  constructor(private readonly nowPlaying?: Track) {}

  get hasMore(): boolean {
    return !this.exhausted;
  }

  async next(): Promise<MusicFlowItem[]> {
    const seeds = this.seeds ?? (this.seeds = await this.loadSeeds());
    const batch: MusicFlowItem[] = [];
    let networkFailure: unknown = null;
    for (let count = 0; count < 2 && this.index < seeds.length; count += 1) {
      const seed = seeds[this.index++];
      try {
        const related = await getRelatedTracks(seed.song);
        batch.push(...related.map((song) => ({ song, source: seed.source })));
      } catch (error) {
        networkFailure = error;
      }
    }
    if (!batch.length && networkFailure) throw new MusicFlowOfflineError(networkFailure);
    if (this.index >= seeds.length) this.exhausted = true;
    return batch;
  }

  private async loadSeeds(): Promise<Seed[]> {
    const snapshot = await import('@/services/library-repository').then((module) => module.readLibrarySnapshot());
    const recent: Seed[] = snapshot.history.slice(0, 6).map((song) => ({ song, source: 'history' }));
    const liked: Seed[] = snapshot.likedTracks.slice(0, 6).map((song) => ({ song, source: 'liked' }));
    const quickPicks: Seed[] = (await getTop50Tracks()).slice(0, 6).map((song) => ({ song, source: 'quick-picks' }));
    const personal = [
      ...(this.nowPlaying ? [{ song: this.nowPlaying, source: 'now-playing' as const }] : []),
      ...interleave([recent, liked, quickPicks]),
    ];
    if (personal.length) return dedupeSeeds(personal);
    const catalog = await searchYouTube('new music official audio').catch(() => []);
    return dedupeSeeds(catalog.slice(0, 6).map((song) => ({ song, source: 'catalog' as const })));
  }
}

function dedupeSeeds(seeds: Seed[]): Seed[] {
  const seen = new Set<string>();
  return seeds.filter((seed) => {
    const key = trackKeyOf(seed.song.title, seed.song.artist);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function interleave<T>(sources: T[][]): T[] {
  const result: T[] = [];
  const max = Math.max(0, ...sources.map((source) => source.length));
  for (let index = 0; index < max; index += 1) sources.forEach((source) => source[index] && result.push(source[index]));
  return result;
}

export function applyMusicFlowContentFilters(tracks: Track[], options: { hideExplicit: boolean; hideVideoSongs: boolean }): Track[] {
  return tracks.filter((track) => {
    const title = track.title.toLowerCase();
    if (options.hideExplicit && /\b(explicit|uncensored)\b/.test(title)) return false;
    if (options.hideVideoSongs && /\b(official music video|mv|video)\b/.test(title)) return false;
    return Boolean(track.videoId);
  });
}

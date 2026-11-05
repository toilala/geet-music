import { tracks, type Track } from '@/data/music';
import { readLibrarySnapshot, writeLibraryValue } from '@/services/library-repository';
import { getRelatedTracks } from '@/services/youtube';
import { echoCoreStore } from '@/core/repositories';
import { trackKeyOf } from '@/core/types';
import { generationStatus } from '@/engines/generate/generation-status';
import { songPlayStatsRepository } from '@/engines/generate/song-play-stats-repository';

export const MAX_SUGGESTIONS = 25;
export const PLAY_WEIGHT = 2;
export const SKIP_PENALTY = 3;
export const LIKED_BONUS = 5;
export const RECENCY_BONUS = 1.5;
export const TIME_OF_DAY_BONUS = 1.3;

export type EnginePlaylistResult = { playlistId: string; tracks: Track[]; title: string };
export type EngineFailure = { message: string };
export type EngineResult = { ok: true; value: EnginePlaylistResult } | { ok: false; error: EngineFailure };

export function currentTimeOfDay(hour = new Date().getHours()): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 21) return 'evening';
  return 'night';
}

export function scoreStats(
  stats: { trackKey: string; totalPlayTimeMs: number; skipCount: number; lastPlayedAtMillis: number },
  likedKeys: Set<string>,
  timeOfDay: string,
): number {
  const liked = likedKeys.has(stats.trackKey);
  const recent = Date.now() - stats.lastPlayedAtMillis < 7 * 86_400_000;
  const playMinutes = Math.max(0, stats.totalPlayTimeMs) / 60_000;
  let score = Math.log1p(playMinutes) * PLAY_WEIGHT - stats.skipCount * SKIP_PENALTY;
  if (liked) score += LIKED_BONUS;
  if (recent) score += RECENCY_BONUS;
  const hourBonus = timeOfDay === 'morning' ? (recent ? TIME_OF_DAY_BONUS : 1) : timeOfDay === 'night' ? (liked ? TIME_OF_DAY_BONUS : 1) : 1;
  return Math.max(0, score * hourBonus);
}

export function applyCandidateFilter(stats: { skipCount: number; totalPlayTimeMs: number }): boolean {
  return stats.skipCount < 2 || stats.totalPlayTimeMs > 45_000;
}

export class LocalTasteEngine {
  async generate(count = MAX_SUGGESTIONS): Promise<EngineResult> {
    generationStatus.start('Reading your listening history');
    try {
      const exclusions = new Set((await echoCoreStore.recommendationExclusions.getAll()).map((item) => item.trackKey));
      const timeOfDay = currentTimeOfDay();
      const now = Date.now();
      const recentStats = (await songPlayStatsRepository.mostPlayedSince(now - 30 * 86_400_000, 100)).length
        ? await songPlayStatsRepository.mostPlayedSince(now - 30 * 86_400_000, 100)
        : await songPlayStatsRepository.recentlyPlayed(20);
      const library = await readLibrarySnapshot();
      const likedKeys = new Set(library.likedTracks.map((track) => trackKeyOf(track.title, track.artist)));
      const seeds = recentStats
        .filter((stats) => !exclusions.has(stats.trackKey) && applyCandidateFilter(stats))
        .sort((a, b) => scoreStats(b, likedKeys, timeOfDay) - scoreStats(a, likedKeys, timeOfDay));

      if (!seeds.length) {
        generationStatus.fail('No listening history available yet');
        return { ok: false, error: { message: 'No listening history available yet' } };
      }

      generationStatus.update('Expanding your favorite tracks');
      const candidates: Track[] = [];
      for (const seed of seeds.slice(0, 5)) {
        if (!seed.videoId) continue;
        const seedTrack: Track = {
          id: seed.videoId,
          videoId: seed.videoId,
          title: seed.title,
          artist: seed.artist,
          artwork: seed.artworkUrl ?? '',
          duration: '0:00',
        };
        candidates.push(...(await getRelatedTracks(seedTrack).catch(() => [])));
        if (candidates.length >= count) break;
      }

      const seen = new Set(exclusions);
      const result = [...candidates, ...seeds.filter((seed) => seed.videoId).map((seed) => ({
        id: seed.videoId!,
        videoId: seed.videoId!,
        title: seed.title,
        artist: seed.artist,
        artwork: seed.artworkUrl ?? '',
        duration: '0:00',
      }))].filter((track) => {
        const key = trackKeyOf(track.title, track.artist);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, count);

      const finalTracks = result.length ? result : tracks.filter((track) => !exclusions.has(trackKeyOf(track.title, track.artist))).slice(0, count);
      if (!finalTracks.length) {
        generationStatus.fail('Could not generate a taste mix');
        return { ok: false, error: { message: 'Could not generate a taste mix' } };
      }

      const playlistId = 'local_taste_daily_mix';
      await writeLibraryValue('playlists', [
        {
          id: playlistId,
          title: 'My Taste Mix',
          description: 'Built from your listening history',
          createdAt: Date.now(),
          artwork: finalTracks[0]?.artwork,
          tracks: finalTracks,
          isCustom: false,
        },
        ...library.playlists.filter((playlist) => playlist.id !== playlistId),
      ]);
      generationStatus.succeed(playlistId);
      return { ok: true, value: { playlistId, tracks: finalTracks, title: 'My Taste Mix' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Taste mix generation failed';
      generationStatus.fail(message);
      return { ok: false, error: { message } };
    }
  }
}

export const localTasteEngine = new LocalTasteEngine();

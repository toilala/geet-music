import { readLibrarySnapshot, writeLibraryValue } from '@/services/library-repository';
import { searchYouTube, getRelatedTracks } from '@/services/youtube';
import { getSimilarArtists, getSimilarTracks } from '@/services/lastfm';
import { echoCoreStore } from '@/core/repositories';
import { trackKeyOf } from '@/core/types';
import { generationStatus } from '@/engines/generate/generation-status';
import { genresRepository } from '@/engines/generate/genres-repository';
import { LocalTasteEngine, applyCandidateFilter, currentTimeOfDay, scoreStats, type EngineResult } from '@/engines/generate/local-taste-engine';
import { songPlayStatsRepository } from '@/engines/generate/song-play-stats-repository';
import { tasteProfileProvider } from '@/engines/generate/taste-profile-provider';
import type { Track } from '@/types/music';

export const SIMILAR_TRACK_BONUS = 2;
export const SIMILAR_ARTIST_BONUS = 1;
export const TAG_MATCH_BONUS = 1.5;
export const GENRE_MATCH_BONUS = 1;

export function scoreCandidateWithExternals(
  baseScore: number,
  options: { isSimilarTrack?: boolean; isSimilarArtist?: boolean; matchesTopGenre?: boolean; matchesGenrePreference?: boolean } = {},
): number {
  return baseScore
    + (options.isSimilarTrack ? SIMILAR_TRACK_BONUS : 0)
    + (options.isSimilarArtist ? SIMILAR_ARTIST_BONUS : 0)
    + (options.matchesTopGenre ? TAG_MATCH_BONUS : 0)
    + (options.matchesGenrePreference ? GENRE_MATCH_BONUS : 0);
}

export class RecommendationEngine extends LocalTasteEngine {
  override async generate(count = 25): Promise<EngineResult> {
    generationStatus.start('Building your recommendation profile');
    try {
      const library = await readLibrarySnapshot();
      const exclusions = new Set((await echoCoreStore.recommendationExclusions.getAll()).map((item) => item.trackKey));
      const timeOfDay = currentTimeOfDay();
      const recent = await songPlayStatsRepository.mostPlayedSince(Date.now() - 30 * 86_400_000, 100);
      const stats = recent.length ? recent : await songPlayStatsRepository.recentlyPlayed(20);
      const likedKeys = new Set(library.likedTracks.map((track) => trackKeyOf(track.title, track.artist)));
      const seeds = stats
        .filter((item) => !exclusions.has(item.trackKey) && applyCandidateFilter(item))
        .sort((a, b) => scoreStats(b, likedKeys, timeOfDay) - scoreStats(a, likedKeys, timeOfDay));
      if (!seeds.length) return super.generate(count);

      generationStatus.update('Reading taste and genre signals');
      const profile = await tasteProfileProvider.get().catch(() => null);
      const topGenres = new Set([...(profile?.topGenres ?? []), ...(await genresRepository.topGenres(15)).map((item) => item.genre)]);
      const similarTrackKeys = new Set<string>();
      const similarArtists = new Set<string>();
      const candidates: Track[] = [];

      await Promise.all(seeds.slice(0, 3).map(async (seed) => {
        const [similarTracks, artists] = await Promise.all([
          getSimilarTracks(seed.artist, seed.title),
          getSimilarArtists(seed.artist),
        ]);
        similarTracks.forEach((track) => similarTrackKeys.add(trackKeyOf(track.name, track.artist)));
        artists.forEach((artist) => similarArtists.add(artist.name.toLowerCase()));
        const resolved = await Promise.all(similarTracks.slice(0, 5).map((track) => searchYouTube(`${track.artist} ${track.name} official audio`).catch(() => [])));
        resolved.forEach((batch) => candidates.push(...batch));
        if (seed.videoId) {
          const seedTrack: Track = { id: seed.videoId, videoId: seed.videoId, title: seed.title, artist: seed.artist, artwork: seed.artworkUrl ?? '', duration: '0:00' };
          candidates.push(...(await getRelatedTracks(seedTrack).catch(() => [])));
        }
      }));

      const seen = new Set(exclusions);
      const uniqueCandidates = candidates.filter((track) => {
        const key = trackKeyOf(track.title, track.artist);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, Math.max(30, count * 3));
      const candidateStats = new Map((await songPlayStatsRepository.findByKeys(uniqueCandidates.map((track) => trackKeyOf(track.title, track.artist)))).map((item) => [item.trackKey, item]));

      const scored = await Promise.all(uniqueCandidates.map(async (track) => {
        const key = trackKeyOf(track.title, track.artist);
        const leadArtist = track.artist.split(',')[0]?.trim().toLowerCase() ?? '';
        const genres = await genresRepository.genresForTrack(`track|${leadArtist}`);
        const genreMatch = genres.some((genre) => topGenres.has(genre.toLowerCase()));
        const matchesPreference = genreMatch || [...topGenres].some((genre) => new RegExp(`\\b${escapeRegExp(genre)}\\b`, 'i').test(`${track.title} ${track.artist}`));
        const localStats = candidateStats.get(key);
        const baseScore = localStats ? scoreStats(localStats, likedKeys, timeOfDay) : 5;
        return {
          track,
          score: scoreCandidateWithExternals(baseScore, {
            isSimilarTrack: similarTrackKeys.has(key),
            isSimilarArtist: similarArtists.has(leadArtist),
            matchesTopGenre: genreMatch,
            matchesGenrePreference: matchesPreference,
          }),
        };
      }));

      const finalTracks = scored.sort((a, b) => b.score - a.score).map((item) => item.track).slice(0, count);
      if (!finalTracks.length) return super.generate(count);
      const playlistId = `local_taste_${Date.now()}`;
      const title = `Taste Mix (${timeOfDay[0].toUpperCase()}${timeOfDay.slice(1)})`;
      await writeLibraryValue('playlists', [{ id: playlistId, title, description: 'Ranked from your taste, history, and related artists', createdAt: Date.now(), artwork: finalTracks[0]?.artwork, tracks: finalTracks, isCustom: false }, ...library.playlists]);
      generationStatus.succeed(playlistId);
      return { ok: true, value: { playlistId, tracks: finalTracks, title } };
    } catch {
      return super.generate(count);
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
}

export const recommendationEngine = new RecommendationEngine();

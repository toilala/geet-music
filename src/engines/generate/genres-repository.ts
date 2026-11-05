import { getTopTags } from '@/services/lastfm';
import { songPlayStatsRepository } from '@/engines/generate/song-play-stats-repository';
import { tasteProfileProvider } from '@/engines/generate/taste-profile-provider';

export type GenreWeight = { genre: string; weight: number };

type CachedGenres = { genres: string[]; timestamp: number };

export const GENRE_CACHE_TTL_MILLIS = 60 * 60 * 1000;

export class GenresRepository {
  private cache = new Map<string, CachedGenres>();

  async topGenres(limit = 10): Promise<GenreWeight[]> {
    const scores = new Map<string, number>();
    const profile = await tasteProfileProvider.get().catch(() => null);
    profile?.topGenres.forEach((genre, index) => {
      scores.set(genre, (scores.get(genre) ?? 0) + (profile.topGenres.length - index) * 1000);
    });

    const topTracks = await songPlayStatsRepository.mostPlayedSince(0, 15).catch(() => []);
    await Promise.all(topTracks.map(async (stats) => {
      const genres = await this.genresForTrack(stats.trackKey);
      const weight = Math.max(10, stats.totalPlayTimeMs);
      genres.forEach((genre) => scores.set(genre, (scores.get(genre) ?? 0) + weight));
    }));

    return [...scores.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([genre, weight]) => ({ genre, weight }));
  }

  async genresForTrack(trackKey: string): Promise<string[]> {
    const cached = this.cache.get(trackKey);
    if (cached && Date.now() - cached.timestamp < GENRE_CACHE_TTL_MILLIS) return cached.genres;
    const artist = trackKey.split('|')[1]?.trim();
    if (!artist) return [];
    const genres = (await getTopTags(artist)).map((tag) => tag.name.toLowerCase()).filter(Boolean);
    this.cache.set(trackKey, { genres, timestamp: Date.now() });
    return genres;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const genresRepository = new GenresRepository();

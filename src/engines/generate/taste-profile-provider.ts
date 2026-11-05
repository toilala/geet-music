import { echoCoreStore } from '@/core/repositories';
import { trackKeyOf, type TasteProfile } from '@/core/types';
import { readEchoCorePreferences } from '@/core/preferences';
import {
  getUserTopArtists,
  getUserTopTags,
  getUserTopTracks,
} from '@/services/lastfm';
import { songPlayStatsRepository } from '@/engines/generate/song-play-stats-repository';

export type { TasteProfile };

export const TASTE_PROFILE_TTL_MILLIS = 60 * 60 * 1000;

export class TasteProfileProvider {
  private cache: TasteProfile | null = null;
  private request: Promise<TasteProfile | null> | null = null;

  async get(forceRefresh = false): Promise<TasteProfile | null> {
    if (!forceRefresh && this.cache && Date.now() - this.cache.fetchedAtMillis < TASTE_PROFILE_TTL_MILLIS) {
      return this.cache;
    }
    if (this.request) return this.request;
    this.request = this.load(forceRefresh).finally(() => {
      this.request = null;
    });
    return this.request;
  }

  async clear(): Promise<void> {
    this.cache = null;
    await echoCoreStore.tasteProfiles.clear();
  }

  private async load(forceRefresh: boolean): Promise<TasteProfile | null> {
    const now = Date.now();
    if (!forceRefresh) {
      const stored = await echoCoreStore.tasteProfiles.get();
      if (stored && now - stored.updatedAtMillis < TASTE_PROFILE_TTL_MILLIS) {
        const profile = this.fromEntity(stored.topArtistsJson, stored.topTracksJson, stored.topGenresJson, stored.updatedAtMillis);
        this.cache = profile;
        return profile;
      }
    }

    const preferences = await readEchoCorePreferences();
    const username = preferences.lastFmUsername.trim();
    if (username) {
      const [artists, tracks, genres] = await Promise.all([
        getUserTopArtists(username, 30),
        getUserTopTracks(username, 50),
        getUserTopTags(username, 15),
      ]);
      if (artists.length || tracks.length || genres.length) {
        const profile: TasteProfile = {
          topArtistNames: artists.map((artist) => artist.name.toLowerCase()),
          topTrackKeys: tracks.map((track) => trackKeyOf(track.name, track.artist)),
          topGenres: genres.map((genre) => genre.name.toLowerCase()),
          fetchedAtMillis: now,
        };
        this.cache = profile;
        await echoCoreStore.tasteProfiles.upsert({
          id: 1,
          topArtistsJson: JSON.stringify(profile.topArtistNames),
          topTracksJson: JSON.stringify(profile.topTrackKeys),
          topGenresJson: JSON.stringify(profile.topGenres),
          confidence: 1,
          updatedAtMillis: now,
        });
        return profile;
      }
    }

    const stale = await echoCoreStore.tasteProfiles.get();
    if (stale) {
      const profile = this.fromEntity(stale.topArtistsJson, stale.topTracksJson, stale.topGenresJson, stale.updatedAtMillis);
      this.cache = profile;
      return profile;
    }

    const localStats = await songPlayStatsRepository.mostPlayedSince(now - 30 * 86_400_000, 50);
    if (localStats.length) {
      const profile: TasteProfile = {
        topArtistNames: [...new Set(localStats.map((item) => item.artist.toLowerCase()))],
        topTrackKeys: localStats.map((item) => item.trackKey),
        topGenres: [],
        fetchedAtMillis: now,
      };
      this.cache = profile;
      return profile;
    }
    return null;
  }

  private fromEntity(artistsJson: string, tracksJson: string, genresJson: string, fetchedAtMillis: number): TasteProfile {
    const parse = (value: string): string[] => {
      try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
      } catch {
        return [];
      }
    };
    return {
      topArtistNames: parse(artistsJson).map((item) => item.toLowerCase()),
      topTrackKeys: parse(tracksJson),
      topGenres: parse(genresJson).map((item) => item.toLowerCase()),
      fetchedAtMillis,
    };
  }
}

export const tasteProfileProvider = new TasteProfileProvider();

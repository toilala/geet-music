import {
  readJson,
  removeStorage,
  withStorageLock,
  writeJson,
} from '@/core/storage';
import type {
  RecommendationExclusionEntity,
  SongPlayStatsEntity,
  TasteProfileEntity,
} from '@/core/types';

const STATS_KEY = '@geet/echo-core/song-play-stats-v1';
const EXCLUSIONS_KEY = '@geet/echo-core/recommendation-exclusions-v1';
const TASTE_PROFILE_KEY = '@geet/echo-core/taste-profile-v1';

export class SongPlayStatsStore {
  async find(trackKey: string): Promise<SongPlayStatsEntity | null> {
    const all = await readJson<Record<string, SongPlayStatsEntity>>(STATS_KEY, {});
    return all[trackKey] ?? null;
  }

  async findByKeys(trackKeys: string[]): Promise<SongPlayStatsEntity[]> {
    const all = await readJson<Record<string, SongPlayStatsEntity>>(STATS_KEY, {});
    return trackKeys.flatMap((key) => (all[key] ? [all[key]] : []));
  }

  async upsert(entity: SongPlayStatsEntity): Promise<void> {
    await withStorageLock(STATS_KEY, async () => {
      const all = await readJson<Record<string, SongPlayStatsEntity>>(STATS_KEY, {});
      all[entity.trackKey] = entity;
      await writeJson(STATS_KEY, all);
    });
  }

  async mostPlayedSince(sinceMillis: number, limit: number): Promise<SongPlayStatsEntity[]> {
    const all = await this.all();
    return all
      .filter((item) => item.lastPlayedAtMillis >= sinceMillis)
      .sort((a, b) => b.totalPlayTimeMs - a.totalPlayTimeMs)
      .slice(0, limit);
  }

  async recentlyPlayed(limit: number): Promise<SongPlayStatsEntity[]> {
    const all = await this.all();
    return all.sort((a, b) => b.lastPlayedAtMillis - a.lastPlayedAtMillis).slice(0, limit);
  }

  async topPlayed(limit: number): Promise<SongPlayStatsEntity[]> {
    const all = await this.all();
    return all.sort((a, b) => b.totalPlayTimeMs - a.totalPlayTimeMs).slice(0, limit);
  }

  async all(): Promise<SongPlayStatsEntity[]> {
    const values = await readJson<Record<string, SongPlayStatsEntity>>(STATS_KEY, {});
    return Object.values(values);
  }

  async clearAll(): Promise<void> {
    await removeStorage(STATS_KEY);
  }
}

export class RecommendationExclusionStore {
  async upsert(entity: RecommendationExclusionEntity): Promise<void> {
    await withStorageLock(EXCLUSIONS_KEY, async () => {
      const all = await this.all();
      const next = all.filter((item) => item.trackKey !== entity.trackKey);
      next.unshift(entity);
      await writeJson(EXCLUSIONS_KEY, next);
    });
  }

  async upsertAll(entities: RecommendationExclusionEntity[]): Promise<void> {
    for (const entity of entities) await this.upsert(entity);
  }

  async all(): Promise<RecommendationExclusionEntity[]> {
    return readJson<RecommendationExclusionEntity[]>(EXCLUSIONS_KEY, []);
  }

  async getAll(): Promise<RecommendationExclusionEntity[]> {
    return this.all();
  }

  async count(): Promise<number> {
    return (await this.all()).length;
  }

  async isExcluded(trackKey: string): Promise<boolean> {
    return (await this.all()).some((item) => item.trackKey === trackKey);
  }

  async delete(trackKey: string): Promise<void> {
    const next = (await this.all()).filter((item) => item.trackKey !== trackKey);
    await writeJson(EXCLUSIONS_KEY, next);
  }

  async clear(): Promise<void> {
    await removeStorage(EXCLUSIONS_KEY);
  }
}

export class TasteProfileStore {
  async get(): Promise<TasteProfileEntity | null> {
    return readJson<TasteProfileEntity | null>(TASTE_PROFILE_KEY, null);
  }

  async upsert(profile: TasteProfileEntity): Promise<void> {
    await writeJson(TASTE_PROFILE_KEY, profile);
  }

  async clear(): Promise<void> {
    await removeStorage(TASTE_PROFILE_KEY);
  }
}

export class EchoCoreStore {
  readonly songPlayStats = new SongPlayStatsStore();
  readonly recommendationExclusions = new RecommendationExclusionStore();
  readonly tasteProfiles = new TasteProfileStore();
}

export const echoCoreStore = new EchoCoreStore();

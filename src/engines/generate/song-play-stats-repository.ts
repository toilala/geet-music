import { echoCoreStore } from '@/core/repositories';
import { trackKeyOf, type SongPlayStatsEntity } from '@/core/types';

export { trackKeyOf };
export type { SongPlayStatsEntity };

/** Port of Echo's serialized SongPlayStatsRepository. */
export class SongPlayStatsRepository {
  private writeChain = Promise.resolve();

  async recordListenedMs(
    title: string,
    artist: string,
    videoId: string | undefined,
    artworkUrl: string | undefined,
    listenedMs: number,
    completed: boolean,
  ): Promise<void> {
    if (!title.trim()) return;
    const key = trackKeyOf(title, artist);
    await this.enqueue(async () => {
      const existing = await echoCoreStore.songPlayStats.find(key);
      const now = Date.now();
      await echoCoreStore.songPlayStats.upsert({
        trackKey: key,
        title: title.trim(),
        artist: artist.trim(),
        videoId: videoId ?? existing?.videoId,
        artworkUrl: artworkUrl ?? existing?.artworkUrl,
        totalPlayTimeMs: (existing?.totalPlayTimeMs ?? 0) + Math.max(0, listenedMs),
        playCount: (existing?.playCount ?? 0) + (completed ? 1 : 0),
        skipCount: existing?.skipCount ?? 0,
        lastPlayedAtMillis: now,
      });
    });
  }

  async recordSkip(
    title: string,
    artist: string,
    videoId: string | undefined,
    artworkUrl: string | undefined,
    listenedMs: number,
  ): Promise<void> {
    if (!title.trim()) return;
    const key = trackKeyOf(title, artist);
    await this.enqueue(async () => {
      const existing = await echoCoreStore.songPlayStats.find(key);
      await echoCoreStore.songPlayStats.upsert({
        trackKey: key,
        title: title.trim(),
        artist: artist.trim(),
        videoId: videoId ?? existing?.videoId,
        artworkUrl: artworkUrl ?? existing?.artworkUrl,
        totalPlayTimeMs: (existing?.totalPlayTimeMs ?? 0) + Math.max(0, listenedMs),
        playCount: existing?.playCount ?? 0,
        skipCount: (existing?.skipCount ?? 0) + 1,
        lastPlayedAtMillis: Date.now(),
      });
    });
  }

  async find(trackKey: string): Promise<SongPlayStatsEntity | null> {
    return echoCoreStore.songPlayStats.find(trackKey);
  }

  async mostPlayedSince(sinceMillis: number, limit = 100): Promise<SongPlayStatsEntity[]> {
    return echoCoreStore.songPlayStats.mostPlayedSince(sinceMillis, limit);
  }

  async recentlyPlayed(limit = 20): Promise<SongPlayStatsEntity[]> {
    return echoCoreStore.songPlayStats.recentlyPlayed(limit);
  }

  async findByKeys(keys: string[]): Promise<SongPlayStatsEntity[]> {
    return echoCoreStore.songPlayStats.findByKeys(keys);
  }

  private enqueue(work: () => Promise<void>): Promise<void> {
    const next = this.writeChain.then(work, work);
    this.writeChain = next.catch(() => undefined);
    return next;
  }
}

export const songPlayStatsRepository = new SongPlayStatsRepository();

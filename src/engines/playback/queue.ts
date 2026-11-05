import type { Track } from '@/types/music';

export type QueueStatus = { title?: string; items: Track[]; mediaItemIndex: number; positionSeconds: number };

export interface PlaybackQueue {
  readonly preloadItem?: Track;
  getInitialStatus(): Promise<QueueStatus>;
  hasNextPage(): boolean;
  nextPage(): Promise<Track[]>;
}

export function filterExplicit(items: Track[], enabled = true, keepId?: string): Track[] {
  return enabled ? items.filter((track) => track.id === keepId || !/\b(explicit|uncensored)\b/i.test(track.title)) : items;
}

export function filterVideoSongs(items: Track[], disableVideos = false, keepId?: string): Track[] {
  return disableVideos ? items.filter((track) => track.id === keepId || !/\b(official music video|music video|mv)\b/i.test(track.title)) : items;
}

export class ListPlaybackQueue implements PlaybackQueue {
  private index = 0;
  constructor(private readonly items: Track[], private readonly title?: string) {}
  getInitialStatus(): Promise<QueueStatus> { return Promise.resolve({ title: this.title, items: this.items, mediaItemIndex: this.index, positionSeconds: 0 }); }
  hasNextPage(): boolean { return false; }
  nextPage(): Promise<Track[]> { return Promise.resolve([]); }
}

export class PaginatedPlaybackQueue implements PlaybackQueue {
  private exhausted = false;
  private readonly loaded: Track[];
  constructor(initial: Track[], private readonly load: () => Promise<Track[]>, private readonly title?: string, startIndex = 0) {
    this.loaded = [...initial];
    this.index = Math.max(0, Math.min(startIndex, Math.max(0, initial.length - 1)));
  }
  private index: number;
  getInitialStatus(): Promise<QueueStatus> { return Promise.resolve({ title: this.title, items: this.loaded, mediaItemIndex: this.index, positionSeconds: 0 }); }
  hasNextPage(): boolean { return !this.exhausted; }
  async nextPage(): Promise<Track[]> {
    if (this.exhausted) return [];
    const page = await this.load();
    if (!page.length) this.exhausted = true;
    this.loaded.push(...page);
    return page;
  }
}

export class SeenTrackFilter {
  private seen = new Set<string>();
  reset(): void { this.seen.clear(); }
  filter(items: Track[]): Track[] { return items.filter((item) => !this.seen.has(item.id) && this.seen.add(item.id)); }
}

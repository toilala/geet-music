import type { MusicFlowFeedError, MusicFlowFeedState, MusicFlowItem } from '@/engines/music-flow/models';
import { emptyMusicFlowState } from '@/engines/music-flow/models';
import { filterMusicFlowCandidates, rankMusicFlowCandidates, type MusicFlowCandidateFilter, type MusicFlowRankingConfig } from '@/engines/music-flow/ranking';
import { MusicFlowOfflineError, type MusicFlowFeedSource, type MusicFlowSignals, type MusicFlowCursor } from '@/engines/music-flow/repository';

export class MusicFlowSession {
  private currentState: MusicFlowFeedState = emptyMusicFlowState();
  private cursor: MusicFlowCursor | null = null;
  private signals: MusicFlowSignals = { filter: {}, likedArtists: new Set() };
  private seenSongIds = new Set<string>();
  private seenTrackKeys = new Set<string>();
  private hiddenSongIds = new Set<string>();
  private lessLikeArtists = new Set<string>();
  private listeners = new Set<(state: MusicFlowFeedState) => void>();
  private lock = Promise.resolve();
  private generationValue = 0;

  rankingConfig: MusicFlowRankingConfig;
  queueHandle: unknown = null;
  queueSnapshot: unknown = null;

  constructor(private readonly source: MusicFlowFeedSource, rankingConfig?: Partial<MusicFlowRankingConfig>) {
    this.rankingConfig = {
      artistSpacing: 2,
      likedArtistBoost: 1,
      lessLikeThisPenalty: 2.5,
      positionDecay: 0.02,
      sourceWeights: { history: 0.6, liked: 0.8, 'quick-picks': 0.5, catalog: 0.2, offline: 0.4 },
      ...rankingConfig,
    };
  }

  get state(): MusicFlowFeedState {
    return this.currentState;
  }

  get generation(): number {
    return this.generationValue;
  }

  get isStarted(): boolean {
    return this.currentState.items.length > 0;
  }

  subscribe(listener: (state: MusicFlowFeedState) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  async start(nowPlaying?: MusicFlowItem): Promise<void> {
    if (!this.isStarted) await this.reset(nowPlaying);
  }

  async reset(nowPlaying?: MusicFlowItem): Promise<void> {
    await this.withLock(async () => {
      this.seenSongIds.clear();
      this.seenTrackKeys.clear();
      this.hiddenSongIds.clear();
      this.lessLikeArtists.clear();
      this.queueHandle = null;
      this.queueSnapshot = null;
      this.generationValue += 1;
      const seedItems = nowPlaying ? [nowPlaying] : [];
      seedItems.forEach((item) => this.markSeen(item));
      this.update({ ...emptyMusicFlowState(), items: seedItems, isInitialLoading: true });
      this.signals = await this.source.signals().catch(() => ({ filter: {}, likedArtists: new Set<string>() }));
      this.cursor = this.source.open(nowPlaying?.song);
      let error: MusicFlowFeedError | null = null;
      for (let attempt = 0; this.currentState.items.length < 12 && this.cursor.hasMore && attempt < 3; attempt += 1) {
        const result = await this.fetchAndAppend();
        if (result) {
          error = result;
          break;
        }
      }
      if (error === 'offline' && this.currentState.items.length <= seedItems.length) await this.appendOffline();
      this.update({ ...this.currentState, isInitialLoading: false, hasMore: Boolean(this.cursor?.hasMore && !this.currentState.isOffline), error: this.currentState.items.length ? null : error ?? 'empty' });
    });
  }

  async loadMore(): Promise<MusicFlowItem[]> {
    return this.withLock(async () => {
      if (!this.currentState.hasMore || this.currentState.isInitialLoading || this.currentState.isLoadingMore || this.currentState.items.length >= 300) return [];
      this.update({ ...this.currentState, isLoadingMore: true });
      const before = this.currentState.items.length;
      let failure: MusicFlowFeedError | null = null;
      for (let attempt = 0; this.currentState.items.length === before && this.cursor?.hasMore && attempt < 3; attempt += 1) failure = await this.fetchAndAppend();
      const appended = this.currentState.items.slice(before);
      this.update({ ...this.currentState, isLoadingMore: false, hasMore: Boolean(this.cursor?.hasMore && this.currentState.items.length < 300), error: appended.length ? null : failure });
      return appended;
    });
  }

  select(index: number): void {
    if (!this.currentState.items.length) return;
    this.update({ ...this.currentState, selectedIndex: Math.max(0, Math.min(index, this.currentState.items.length - 1)) });
  }

  indexOf(songId?: string): number {
    return songId ? this.currentState.items.findIndex((item) => item.song.id === songId) : -1;
  }

  hide(songId: string): void { this.hiddenSongIds.add(songId); }
  lessLikeThis(item: MusicFlowItem): void {
    const artist = item.song.artist.split(',')[0]?.trim().toLowerCase();
    if (artist) this.lessLikeArtists.add(artist);
  }
  isHidden(songId: string): boolean { return this.hiddenSongIds.has(songId); }

  private async fetchAndAppend(): Promise<MusicFlowFeedError | null> {
    if (!this.cursor) return 'failed';
    try {
      this.append(await this.cursor.next());
      return null;
    } catch (error) {
      if (error instanceof MusicFlowOfflineError) return 'offline';
      return 'failed';
    }
  }

  private append(raw: MusicFlowItem[]): void {
    const filter: MusicFlowCandidateFilter = {
      ...this.signals.filter,
      seenSongIds: this.seenSongIds,
      seenTrackKeys: this.seenTrackKeys,
      hiddenSongIds: new Set([...(this.signals.filter.hiddenSongIds ?? []), ...this.hiddenSongIds]),
    };
    const ranked = rankMusicFlowCandidates(
      filterMusicFlowCandidates(raw, filter),
      this.currentState.items.slice(-this.rankingConfig.artistSpacing).map((item) => item.song.artist.split(',')[0]?.trim().toLowerCase() ?? null),
      this.signals.likedArtists,
      this.lessLikeArtists,
      this.rankingConfig,
    ).slice(0, 300 - this.currentState.items.length);
    ranked.forEach((item) => this.markSeen(item));
    if (ranked.length) this.update({ ...this.currentState, items: [...this.currentState.items, ...ranked], error: null });
  }

  private async appendOffline(): Promise<void> {
    const offline = await this.source.offlineCandidates().catch(() => []);
    const before = this.currentState.items.length;
    this.append(offline);
    if (this.currentState.items.length > before) this.update({ ...this.currentState, isOffline: true });
  }

  private markSeen(item: MusicFlowItem): void {
    this.seenSongIds.add(item.song.id);
    this.seenTrackKeys.add(`${item.song.title.trim()}|${item.song.artist.trim()}`.toLowerCase());
  }

  private update(next: MusicFlowFeedState): void {
    this.currentState = next;
    this.listeners.forEach((listener) => listener(next));
  }

  private async withLock<T>(work: () => Promise<T>): Promise<T> {
    const previous = this.lock;
    let release!: () => void;
    this.lock = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try { return await work(); } finally { release(); }
  }
}

import type { MusicFlowItem } from '@/engines/music-flow/models';
import type { MusicFlowSession } from '@/engines/music-flow/session';

export type MusicFlowQueueStatus = { title?: string; items: MusicFlowItem[]; startIndex: number };

/** Queue adapter for the current iframe player or a future native player. */
export class MusicFlowQueue {
  private readonly generation: number;
  constructor(private readonly title: string | undefined, private readonly items: MusicFlowItem[], private readonly startIndex: number, private readonly session: MusicFlowSession) {
    this.generation = session.generation;
  }
  getInitialStatus(): MusicFlowQueueStatus {
    return { title: this.title, items: this.items, startIndex: Math.max(0, Math.min(this.startIndex, Math.max(0, this.items.length - 1))) };
  }
  hasNextPage(): boolean { return this.session.generation === this.generation && this.session.state.hasMore; }
  async nextPage(): Promise<MusicFlowItem[]> { return this.session.generation === this.generation ? this.session.loadMore() : []; }
}

import type { MusicFlowItem, MusicFlowPlaybackStatus, TakeoverBlock } from '@/engines/music-flow/models';
import type { MusicFlowSession } from '@/engines/music-flow/session';

export interface MusicFlowPlayer {
  currentMediaId(): string | null;
  queueMediaIds(): string[];
  ownsQueue(handle: unknown): boolean;
  isAnyFlowQueueActive(): boolean;
  takeoverBlock(): TakeoverBlock | null;
  seekTo(queueIndex: number, playWhenReady: boolean): void;
  startQueue(items: MusicFlowItem[], startIndex: number, playWhenReady: boolean): unknown;
  append(handle: unknown, items: MusicFlowItem[]): void;
  setPauseAtEnd(handle: unknown, pause: boolean): void;
  snapshot(): unknown;
  restore(snapshot: unknown, playWhenReady: boolean): void;
  isPlaying(): boolean;
}

export class MusicFlowCoordinator {
  private latestRequest = 0;
  constructor(private readonly session: MusicFlowSession, private readonly player: MusicFlowPlayer) {}

  nextRequestId(): number { this.latestRequest += 1; return this.latestRequest; }
  ownsPlayback(): boolean { return this.session.queueHandle !== null && this.player.ownsQueue(this.session.queueHandle); }

  select(requestId: number, songId: string, playWhenReady: boolean, autoNext: boolean): MusicFlowPlaybackStatus {
    if (requestId < this.latestRequest) return { kind: 'switching' };
    if (this.player.currentMediaId() === songId) return { kind: 'synced' };
    if (this.session.queueHandle && this.player.ownsQueue(this.session.queueHandle)) {
      const index = this.player.queueMediaIds().indexOf(songId);
      if (index >= 0) { this.player.seekTo(index, playWhenReady); return { kind: 'switching' }; }
    }
    const blocked = this.player.takeoverBlock();
    if (blocked) return { kind: 'blocked', reason: blocked };
    const index = this.session.state.items.findIndex((item) => item.song.id === songId);
    if (index < 0) return { kind: 'idle' };
    if (!this.player.isAnyFlowQueueActive()) this.session.queueSnapshot = this.player.snapshot();
    const handle = this.player.startQueue(this.session.state.items, index, playWhenReady);
    this.session.queueHandle = handle;
    this.player.setPauseAtEnd(handle, !autoNext);
    return { kind: 'switching' };
  }

  applyAutoNext(autoNext: boolean): void {
    if (this.session.queueHandle && this.player.ownsQueue(this.session.queueHandle)) this.player.setPauseAtEnd(this.session.queueHandle, !autoNext);
  }
  appendIfOwned(items: MusicFlowItem[]): void {
    if (items.length && this.session.queueHandle && this.player.ownsQueue(this.session.queueHandle)) this.player.append(this.session.queueHandle, items);
  }
  canRestorePreviousQueue(): boolean { return Boolean(this.session.queueSnapshot && this.ownsPlayback()); }
  restorePreviousQueue(): boolean {
    if (!this.session.queueSnapshot || !this.ownsPlayback()) { this.session.queueSnapshot = null; return false; }
    this.player.restore(this.session.queueSnapshot, this.player.isPlaying());
    this.session.queueSnapshot = null;
    this.session.queueHandle = null;
    return true;
  }
  invalidateIfSuperseded(): void {
    if (this.session.queueHandle && !this.player.ownsQueue(this.session.queueHandle)) { this.session.queueHandle = null; this.session.queueSnapshot = null; }
  }
}

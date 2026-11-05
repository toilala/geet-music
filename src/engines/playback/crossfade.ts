import type { Track } from '@/types/music';

export type EqualPowerGains = { outgoingGain: number; incomingGain: number };

export function calculateEqualPowerGains(progress: number): EqualPowerGains {
  const safe = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const angle = safe * Math.PI / 2;
  return { outgoingGain: Math.cos(angle), incomingGain: Math.sin(angle) };
}

/** Dynamically expands the pre-arm window after slow network preparation. */
export class AdaptivePreArmManager {
  readonly baseLeadTimeMs: number;
  readonly maxLeadTimeMs: number;
  readonly slowPrepThresholdMs: number;
  private recentPreparationTimes: number[] = [];
  private currentLeadTime: number;

  constructor(baseLeadTimeMs = 20_000, maxLeadTimeMs = 35_000, slowPrepThresholdMs = 8_000) {
    if (baseLeadTimeMs <= 0 || slowPrepThresholdMs <= 0 || maxLeadTimeMs < baseLeadTimeMs) throw new Error('Invalid crossfade timing configuration');
    this.baseLeadTimeMs = baseLeadTimeMs;
    this.maxLeadTimeMs = maxLeadTimeMs;
    this.slowPrepThresholdMs = slowPrepThresholdMs;
    this.currentLeadTime = baseLeadTimeMs;
  }

  get currentLeadTimeMs(): number { return this.currentLeadTime; }

  recordPreparationDuration(durationMs: number): void {
    this.recentPreparationTimes.push(Math.max(0, durationMs));
    if (this.recentPreparationTimes.length > 5) this.recentPreparationTimes.shift();
    if (durationMs > this.slowPrepThresholdMs) {
      const expansion = (durationMs - this.slowPrepThresholdMs) * 1.5;
      this.currentLeadTime = Math.min(this.maxLeadTimeMs, Math.max(this.currentLeadTime, this.baseLeadTimeMs + expansion));
    } else if (this.recentPreparationTimes.reduce((sum, value) => sum + value, 0) / this.recentPreparationTimes.length < this.slowPrepThresholdMs) {
      this.currentLeadTime = Math.max(this.baseLeadTimeMs, this.currentLeadTime - 2_000);
    }
  }

  reset(): void { this.currentLeadTime = this.baseLeadTimeMs; this.recentPreparationTimes = []; }
}

export type CrossfadeState =
  | { kind: 'idle' }
  | { kind: 'preparing'; targetTrackId: string; startedAt: number }
  | { kind: 'armed'; targetTrackId: string }
  | { kind: 'fading'; progress: number };

export type CrossfadePlayer = {
  load: (track: Track) => Promise<void>;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
};

/** Player-agnostic scheduler mirroring Echo's standby-player state machine. */
export class StandbyCrossfadeScheduler {
  readonly preArmManager = new AdaptivePreArmManager();
  state: CrossfadeState = { kind: 'idle' };
  isCrossfading = false;
  private nextTrack: Track | null = null;
  private crossfadeDurationMs = 0;
  private standby: CrossfadePlayer | null = null;
  private primary: CrossfadePlayer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  onCrossfadeSwapped?: (outgoing: CrossfadePlayer, incoming: CrossfadePlayer) => void;

  onQueueOrTrackChanged(nextTrack: Track | null, crossfadeDurationMs: number): void {
    if (this.nextTrack?.id !== nextTrack?.id) this.cancelCrossfade();
    this.nextTrack = nextTrack;
    this.crossfadeDurationMs = Math.max(0, crossfadeDurationMs);
  }

  async onPlaybackPositionTick(primary: CrossfadePlayer, currentPositionMs: number, durationMs: number, playerFactory: () => CrossfadePlayer): Promise<void> {
    if (!this.nextTrack || this.crossfadeDurationMs <= 0 || durationMs <= this.crossfadeDurationMs) return;
    const remaining = durationMs - currentPositionMs;
    if (this.state.kind === 'idle' && remaining <= this.preArmManager.currentLeadTimeMs && remaining > this.crossfadeDurationMs) {
      const startedAt = Date.now();
      this.state = { kind: 'preparing', targetTrackId: this.nextTrack.id, startedAt };
      const standby = playerFactory();
      standby.setVolume(0);
      this.standby = standby;
      try {
        await standby.load(this.nextTrack);
        this.preArmManager.recordPreparationDuration(Date.now() - startedAt);
        if (this.state.kind === 'preparing') this.state = { kind: 'armed', targetTrackId: this.nextTrack.id };
      } catch {
        this.cancelCrossfade();
      }
    }
    if (this.state.kind === 'armed' && remaining <= this.crossfadeDurationMs) await this.startCrossfade(primary);
  }

  async triggerCrossfadeNow(primary: CrossfadePlayer): Promise<void> {
    if (this.state.kind === 'armed') await this.startCrossfade(primary);
  }

  cancelCrossfade(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.standby?.pause();
    this.standby?.setVolume(1);
    this.primary?.setVolume(1);
    this.standby = null;
    this.primary = null;
    this.isCrossfading = false;
    this.state = { kind: 'idle' };
  }

  release(): void { this.cancelCrossfade(); this.nextTrack = null; }

  private async startCrossfade(primary: CrossfadePlayer): Promise<void> {
    const standby = this.standby;
    if (!standby || this.isCrossfading) return;
    this.primary = primary;
    this.isCrossfading = true;
    standby.play();
    const steps = Math.max(10, Math.floor(this.crossfadeDurationMs / 20));
    for (let index = 0; index <= steps; index += 1) {
      if (!this.isCrossfading) return;
      const progress = index / steps;
      this.state = { kind: 'fading', progress };
      const gains = calculateEqualPowerGains(progress);
      primary.setVolume(gains.outgoingGain);
      standby.setVolume(gains.incomingGain);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    primary.setVolume(1);
    standby.setVolume(1);
    this.isCrossfading = false;
    this.state = { kind: 'idle' };
    this.standby = null;
    this.primary = null;
    this.onCrossfadeSwapped?.(primary, standby);
  }
}

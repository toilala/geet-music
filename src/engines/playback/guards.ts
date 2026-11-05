export type CutoffDecision =
  | { kind: 'allow-end' }
  | { kind: 'recover-premature-cutoff'; resumePositionMs: number; retryAttempt: number };

export class PlaybackCutoffGuard {
  private retryCount = 0;
  private currentMediaId: string | null = null;
  constructor(private readonly thresholdMs = 3_000, private readonly maxRetriesPerTrack = 2) {}

  onTrackChanged(mediaId: string | null): void { this.currentMediaId = mediaId; this.retryCount = 0; }
  getRetryCount(): number { return this.retryCount; }

  verifyTrackCompletion(currentPositionMs: number, canonicalDurationMs: number, playerDurationMs = -1): CutoffDecision {
    const safePosition = Math.max(0, currentPositionMs);
    if (playerDurationMs > 0 && playerDurationMs - safePosition <= this.thresholdMs) return { kind: 'allow-end' };
    if (canonicalDurationMs <= 0) return { kind: 'allow-end' };
    if (canonicalDurationMs - safePosition > this.thresholdMs && this.retryCount < this.maxRetriesPerTrack) {
      this.retryCount += 1;
      return { kind: 'recover-premature-cutoff', resumePositionMs: safePosition, retryAttempt: this.retryCount };
    }
    return { kind: 'allow-end' };
  }
}

export function computeEffectiveDuration(canonicalDurationSeconds: number | undefined, playerDurationMs: number): number {
  return canonicalDurationSeconds && canonicalDurationSeconds > 0 ? canonicalDurationSeconds * 1000 : playerDurationMs > 0 ? playerDurationMs : 0;
}

export function seekButtonTarget(positionMs: number, durationMs: number, offsetMs: number): number {
  const position = Math.max(0, positionMs);
  const target = Math.max(0, position + offsetMs);
  return durationMs >= 0 ? Math.min(target, durationMs) : target;
}

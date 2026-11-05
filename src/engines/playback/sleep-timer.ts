export type SleepTimerPlayer = { getVolume: () => number; setVolume: (volume: number) => void; pause: () => void };

/** Fade-to-pause timer, including Echo's pause-at-end mode. */
export class SleepTimer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pauseAtSongEnd = false;
  private triggerAt = -1;
  constructor(private readonly player: SleepTimerPlayer) {}

  get triggerTime(): number { return this.triggerAt; }
  get pauseWhenSongEnd(): boolean { return this.pauseAtSongEnd; }
  get isActive(): boolean { return this.triggerAt !== -1 || this.pauseAtSongEnd; }

  start(minutes: number): void {
    this.clear();
    if (minutes === -1) {
      this.pauseAtSongEnd = true;
      return;
    }
    this.triggerAt = Date.now() + Math.max(0, minutes) * 60_000;
    this.timer = setTimeout(() => {
      void this.fadeOutAndPause();
      this.triggerAt = -1;
    }, Math.max(0, minutes) * 60_000);
  }

  async notifySongTransition(): Promise<void> {
    if (!this.pauseAtSongEnd) return;
    this.pauseAtSongEnd = false;
    await this.fadeOutAndPause();
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pauseAtSongEnd = false;
    this.triggerAt = -1;
  }

  private async fadeOutAndPause(): Promise<void> {
    const initial = this.player.getVolume();
    for (let step = 30; step >= 1; step -= 1) {
      this.player.setVolume(initial * (step / 30));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.player.pause();
    this.player.setVolume(initial);
  }
}

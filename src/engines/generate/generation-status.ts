export type GenerationState =
  | { kind: 'idle' }
  | { kind: 'running'; message: string }
  | { kind: 'done'; playlistId: string }
  | { kind: 'failed'; error: string };

export type GenerationListener = (state: GenerationState) => void;

/** React-independent equivalent of Echo's StateFlow-backed GenerationStatus. */
export class GenerationStatus {
  private currentState: GenerationState = { kind: 'idle' };
  private listeners = new Set<GenerationListener>();

  get state(): GenerationState {
    return this.currentState;
  }

  subscribe(listener: GenerationListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  start(message: string): void {
    this.set({ kind: 'running', message });
  }

  update(message: string): void {
    if (this.currentState.kind === 'running') this.set({ kind: 'running', message });
  }

  succeed(playlistId: string): void {
    this.set({ kind: 'done', playlistId });
  }

  fail(error: string): void {
    this.set({ kind: 'failed', error });
  }

  cancel(): void {
    this.set({ kind: 'idle' });
  }

  private set(state: GenerationState): void {
    this.currentState = state;
    this.listeners.forEach((listener) => listener(state));
  }
}

export const generationStatus = new GenerationStatus();

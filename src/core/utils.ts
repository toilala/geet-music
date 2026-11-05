export function distinctBy<T, K>(items: T[], keyOf: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function interleaveValues<T>(sources: T[][]): T[] {
  const output: T[] = [];
  const max = Math.max(0, ...sources.map((source) => source.length));
  for (let index = 0; index < max; index += 1) sources.forEach((source) => { const item = source[index]; if (item !== undefined) output.push(item); });
  return output;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function isFresh(timestamp: number, maxAgeMs: number): boolean {
  return timestamp > 0 && Date.now() - timestamp >= 0 && Date.now() - timestamp <= maxAgeMs;
}

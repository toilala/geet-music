import type { Track } from '@/types/music';
import { getRelatedTracks } from '@/services/youtube';
import { getDynamicRecommendations, readSignals, type ListeningSignal } from '@/services/recommendations';
import { rankMusicFlowCandidates } from '@/engines/music-flow/ranking';

export type EchoBrainOptions = {
  minQueueSize?: number;
  maxInjected?: number;
  excludedIds?: Iterable<string>;
  forceDiscovery?: boolean;
};

export type EchoBrainResult = {
  tracks: Track[];
  reason: 'momentum' | 'discovery' | 'fallback';
};

function signalScore(signal: ListeningSignal): number {
  const recencyDays = signal.lastPlayedAt
    ? Math.max(0, (Date.now() - signal.lastPlayedAt) / 86_400_000)
    : 365;
  const recency = Math.max(0, 3 - recencyDays / 10);
  return (signal.liked ? 8 : 0) + signal.plays * 2 + signal.completed * 3 - signal.skips * 2 + recency;
}

function trackKey(track: Track): string {
  return `${track.videoId}:${track.title.toLocaleLowerCase()}`;
}

export function rankMomentumSignals(signals: Record<string, ListeningSignal>): ListeningSignal[] {
  return Object.values(signals).sort((a, b) => signalScore(b) - signalScore(a));
}

export function mergeQueueTracks(
  currentQueue: Track[],
  candidates: Track[],
  options: EchoBrainOptions = {},
): Track[] {
  const maxInjected = options.maxInjected ?? 8;
  const excluded = new Set(options.excludedIds ?? []);
  const seen = new Set(currentQueue.map(trackKey));
  const additions: Track[] = [];

  for (const candidate of candidates) {
    if (additions.length >= maxInjected || excluded.has(candidate.id) || excluded.has(candidate.videoId)) continue;
    const key = trackKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    additions.push(candidate);
  }

  return [...currentQueue, ...additions];
}

export async function generateEchoBrainQueue(
  currentTrack: Track,
  currentQueue: Track[],
  options: EchoBrainOptions = {},
): Promise<EchoBrainResult> {
  const minQueueSize = options.minQueueSize ?? 4;
  if (!options.forceDiscovery && currentQueue.length >= minQueueSize) {
    return { tracks: currentQueue, reason: 'momentum' };
  }

  const signals = await readSignals();
  const momentum = rankMomentumSignals(signals);
  const recommendations = await getDynamicRecommendations(currentTrack);
  const related = await getRelatedTracks(currentTrack);
  const preferredIds = new Set(momentum.slice(0, 5).map((signal) => signal.trackId));
  const candidates = rankMusicFlowCandidates([
    ...recommendations.filter((track) => preferredIds.has(track.id)),
    ...related,
    ...recommendations,
  ].map((song) => ({ song, source: 'catalog' as const }))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.song.id === item.song.id) === index)
    .slice(0, 32), [], new Set(momentum.slice(0, 5).map((signal) => signal.artist.toLowerCase())))
    .map((item) => item.song);
  const queue = mergeQueueTracks(currentQueue, candidates, options);

  return {
    tracks: queue,
    reason: queue.length > currentQueue.length ? 'discovery' : 'fallback',
  };
}

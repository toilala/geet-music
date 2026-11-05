import { readLibrarySnapshot, writeLibraryValue } from '@/services/library-repository';
import { searchYouTube } from '@/services/youtube';
import { logAiEvent } from '@/engines/ai/ai-logger';
import { parseAiJson, requestOpenRouter } from '@/engines/ai/openrouter';
import type { Playlist, Track } from '@/types/music';

export async function generateAiRecommendations(onLog: (message: string) => void | Promise<void> = () => undefined): Promise<Playlist | null> {
  const library = await readLibrarySnapshot();
  const seeds = [...library.history, ...library.likedTracks].filter((track, index, all) => all.findIndex((item) => item.id === track.id) === index).slice(0, 30);
  if (!seeds.length) { await onLog('Not enough listening history found.'); return null; }
  await onLog('Connecting to AI provider...');
  const prompt = `Based on these songs, recommend 20 similar but different songs. Return only a JSON array of {"title": string, "artist": string}.\n${seeds.map((track) => `${track.title} by ${track.artist}`).join('\n')}`;
  const output = await requestOpenRouter('You are a music recommendation engine. Return raw JSON only.', prompt).catch(() => '[]');
  const requests = parseAiJson<{ title?: string; artist?: string }[]>(output, []).filter((song) => song.title && song.artist).slice(0, 20);
  const resolved: Track[] = [];
  for (const song of requests) {
    const result = await searchYouTube(`${song.title} ${song.artist} official audio`).catch(() => []);
    if (result[0]) resolved.push(result[0]);
  }
  if (!resolved.length) return null;
  const playlist: Playlist = { id: `ai-recommendations-${Date.now()}`, title: 'From your taste by Echo Music', description: 'AI recommendations based on your listening history', createdAt: Date.now(), artwork: resolved[0]?.artwork, tracks: resolved, isCustom: false };
  await writeLibraryValue('playlists', [playlist, ...library.playlists.filter((item) => item.title !== playlist.title)]);
  await logAiEvent('Playlist Generation', `Generated ${resolved.length} AI recommendations`);
  await onLog('Done!');
  return playlist;
}

export class AiRecommendationScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  start(intervalMs: number, onLog?: (message: string) => void | Promise<void>): void {
    this.stop();
    this.timer = setInterval(() => { void generateAiRecommendations(onLog); }, intervalMs);
  }
  stop(): void { if (this.timer) clearInterval(this.timer); this.timer = null; }
  async runNow(onLog?: (message: string) => void | Promise<void>): Promise<Playlist | null> { return generateAiRecommendations(onLog); }
}

export const aiRecommendationScheduler = new AiRecommendationScheduler();

import { readLibrarySnapshot, writeLibraryValue } from '@/services/library-repository';
import { searchYouTube } from '@/services/youtube';
import { logAiEvent } from '@/engines/ai/ai-logger';
import { requestOpenRouter, parseAiJson, type AiSongRequest } from '@/engines/ai/openrouter';
import { weatherSnapshot, type WeatherInfo } from '@/engines/ai/weather';
import type { Playlist, Track } from '@/types/music';

export type AiProgress = (message: string) => void | Promise<void>;
export type GeneratedPlaylist = { playlist: Playlist; weatherSnapshot?: string };

export async function generateAiPlaylist(prompt: string, numberOfSongs = 15, weather?: WeatherInfo, onLog: AiProgress = () => undefined): Promise<GeneratedPlaylist | null> {
  await onLog('Connecting to AI provider...');
  const weatherDirective = weather ? `Current weather: ${weather.condition} (${weather.weatherEmoji}), ${weather.temperature}°C, humidity ${weather.humidity}%, ${weather.isDay ? 'daytime' : 'nighttime'}. Match the music energy to these conditions.` : '';
  const system = `You are a precise music curator. Return only JSON: {"name": string, "songs": [{"title": string, "artist": string}]}. Return exactly ${numberOfSongs} songs. Verify artist and title. ${weatherDirective}`;
  const output = await requestOpenRouter(system, `Mood: ${prompt || 'choose a fitting mood'}\n${weatherDirective}\nDesired playlist length: ${numberOfSongs}`).catch(async (error) => { await onLog(error instanceof Error ? error.message : 'AI request failed'); return ''; });
  const parsed = parseAiJson<{ name?: string; songs?: AiSongRequest[] }>(output, {});
  const requests = (parsed.songs ?? []).filter((song) => song.title?.trim()).slice(0, numberOfSongs);
  await onLog(`Found ${requests.length} songs. Searching YouTube...`);
  const resolved: Track[] = [];
  for (const [index, song] of requests.entries()) {
    await onLog(`Searching [${index + 1}/${requests.length}]: ${song.title} - ${song.artist}`);
    const result = await searchYouTube(`${song.title} ${song.artist} official audio`).catch(() => []);
    if (result[0]) resolved.push(result[0]);
  }
  if (!resolved.length) { await onLog('Failed to find any suggested songs.'); return null; }
  const library = await readLibrarySnapshot();
  const playlist: Playlist = { id: `ai-playlist-${Date.now()}`, title: parsed.name?.trim() || 'AI Playlist', description: prompt, createdAt: Date.now(), artwork: resolved[0]?.artwork, tracks: resolved, isCustom: false };
  await writeLibraryValue('playlists', [playlist, ...library.playlists]);
  await logAiEvent('Prompt Playlist', `Generated playlist: ${playlist.title}`);
  await onLog('Done!');
  return { playlist, weatherSnapshot: weather ? weatherSnapshot(weather) : undefined };
}

export type PlaylistModification = { remove_ids?: string[]; additions?: AiSongRequest[] };

export async function modifyAiPlaylist(playlistId: string, currentSongs: Track[], prompt: string, onLog: AiProgress = () => undefined): Promise<Playlist | null> {
  const currentJson = JSON.stringify(currentSongs.map((track) => ({ id: track.id, title: track.title, artist: track.artist })));
  const system = `Modify this playlist using the user instruction. Return only JSON with remove_ids (existing ids) and additions ({title,artist}). Current playlist: ${currentJson}`;
  const output = await requestOpenRouter(system, prompt).catch(() => '');
  const parsed = parseAiJson<PlaylistModification>(output, {});
  const remove = new Set(parsed.remove_ids ?? []);
  const remaining = currentSongs.filter((track) => !remove.has(track.id));
  const additions: Track[] = [];
  for (const song of parsed.additions ?? []) {
    const result = await searchYouTube(`${song.title} ${song.artist} official audio`).catch(() => []);
    if (result[0] && !remaining.some((track) => track.id === result[0].id)) additions.push(result[0]);
  }
  const library = await readLibrarySnapshot();
  const existing = library.playlists.find((playlist) => playlist.id === playlistId);
  if (!existing) return null;
  const updated = { ...existing, tracks: [...remaining, ...additions], artwork: remaining[0]?.artwork ?? additions[0]?.artwork ?? existing.artwork };
  await writeLibraryValue('playlists', library.playlists.map((playlist) => playlist.id === playlistId ? updated : playlist));
  await onLog('Done! Playlist modified.');
  return updated;
}

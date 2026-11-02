import { parseLyric, type LyricLine } from 'lyric-kit';

type LyricsResponse = {
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

export async function getLyrics(title: string, artist: string): Promise<LyricLine[]> {
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error('Lyrics are temporarily unavailable.');
  const data = (await response.json()) as LyricsResponse;
  const content = data.syncedLyrics ?? data.plainLyrics;
  if (!content) return [];
  return parseLyric(content).lines;
}

export function lyricText(line: LyricLine) {
  return line.words.map((word) => word.word).join('').trim();
}

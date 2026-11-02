import { parseLyric, type LyricLine } from 'lyric-kit';

type LyricsResponse = {
  duration?: number;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

export type LyricsPayload = {
  lines: LyricLine[];
  synced: boolean;
  wordTimed: boolean;
  source: string;
};

export async function getLyrics(title: string, artist: string, duration?: number): Promise<LyricsPayload> {
  const normalizedTitle = cleanTitle(title);
  const params = new URLSearchParams({ track_name: normalizedTitle, artist_name: artist });
  if (duration && duration > 0) params.set('duration', String(Math.round(duration)));
  try {
    const response = await fetchWithTimeout(`https://lrclib.net/api/get?${params.toString()}`);
    if (response.ok) return parseResponse((await response.json()) as LyricsResponse, 'LRCLIB');
    if (response.status !== 404) throw new Error('LRCLIB unavailable');

    const searchParams = new URLSearchParams({ q: `${normalizedTitle} ${artist}` });
    const searchResponse = await fetchWithTimeout(`https://lrclib.net/api/search?${searchParams.toString()}`);
    if (searchResponse.ok) {
      const matches = (await searchResponse.json()) as LyricsResponse[];
      const match = matches.find((item) => item.syncedLyrics || item.plainLyrics);
      if (match) return parseResponse(match, 'LRCLIB search');
    }
  } catch {
    // Continue to the plain-lyrics provider.
  }

  try {
    const plainResponse = await fetchWithTimeout(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(normalizedTitle)}`);
    if (!plainResponse.ok) return emptyPayload();
    const plainData = (await plainResponse.json()) as { lyrics?: string };
    return plainData.lyrics ? parseContent(plainData.lyrics, 'lyrics.ovh', false) : emptyPayload();
  } catch {
    return emptyPayload();
  }
}

export function lyricText(line: LyricLine) {
  return line.words.map((word) => word.word).join('').trim();
}

function parseResponse(data: LyricsResponse, source: string): LyricsPayload {
  const synced = Boolean(data.syncedLyrics);
  return parseContent(data.syncedLyrics ?? data.plainLyrics ?? '', source, synced);
}

function parseContent(content: string, source: string, synced: boolean): LyricsPayload {
  const lines = content ? parseLyric(content).lines : [];
  const wordTimed = lines.some((line) => line.words.some((word) => word.endTime > word.startTime));
  return { lines, synced, wordTimed, source };
}

function emptyPayload(): LyricsPayload {
  return { lines: [], synced: false, wordTimed: false, source: '' };
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*\((?:official|lyrics?|audio|video|music video)[^)]*\)/gi, '')
    .replace(/\s*\[(?:official|lyrics?|audio|video|music video)[^\]]*\]/gi, '')
    .replace(/\s*-\s*(?:official|lyrics?|audio|video).*$/i, '')
    .trim();
}

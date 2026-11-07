import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseLyric, type LyricLine, type LyricWord } from 'lyric-kit';

export type WordTimestamp = {
  word: string;
  startTime: number; // in milliseconds
  endTime: number;   // in milliseconds
};

export type LyricsLine = {
  startTime: number;
  endTime: number;
  words: WordTimestamp[];
  translatedLyric?: string;
  romanLyric?: string;
  isBG?: boolean;
  isDuet?: boolean;
  agent?: string;        // e.g. "v1", "v2" for duets
  isBackground?: boolean;// for backing vocals
};

export type LyricsPayload = {
  lines: LyricsLine[];
  synced: boolean;
  wordTimed: boolean;
  source: string;
  providerName?: string;
  rawLrc?: string;
};

export type LyricsProviderName =
  | 'YouLyPlus'
  | 'Paxsenix'
  | 'Unison'
  | 'BetterLyrics'
  | 'SimpMusic'
  | 'LrcLib'
  | 'Kugou'
  | 'YouTubeSubtitle'
  | 'YouTubeMusic';

export type LyricsProvider = 'auto' | LyricsProviderName | 'lrclib' | 'lyrics-ovh';

export const DEFAULT_PROVIDER_ORDER: LyricsProviderName[] = [
  'YouLyPlus',
  'Paxsenix',
  'Unison',
  'BetterLyrics',
  'SimpMusic',
  'LrcLib',
  'Kugou',
  'YouTubeSubtitle',
  'YouTubeMusic',
];

const LYRICS_PROVIDER_KEY = '@geet/lyrics-provider-v2';
const LYRICS_ORDER_KEY = '@geet/lyrics-order-v2';
const LYRICS_CACHE_KEY = '@geet/lyrics-cache-v2';
const MEMORY_CACHE = new Map<string, LyricsPayload>();

export async function getLyricsProvider(): Promise<LyricsProvider> {
  try {
    const val = await AsyncStorage.getItem(LYRICS_PROVIDER_KEY);
    return (val as LyricsProvider) || 'auto';
  } catch {
    return 'auto';
  }
}

export async function setLyricsProvider(provider: LyricsProvider): Promise<void> {
  await AsyncStorage.setItem(LYRICS_PROVIDER_KEY, provider);
}

export async function getProviderOrder(): Promise<LyricsProviderName[]> {
  try {
    const val = await AsyncStorage.getItem(LYRICS_ORDER_KEY);
    if (val) {
      const parsed = JSON.parse(val) as LyricsProviderName[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_PROVIDER_ORDER;
}

export async function setProviderOrder(order: LyricsProviderName[]): Promise<void> {
  await AsyncStorage.setItem(LYRICS_ORDER_KEY, JSON.stringify(order));
}

// ==========================================
// Metadata Cleaner (Faithful to Echo)
// ==========================================
export function cleanTitleAndArtist(title: string, artist?: string): { cleanTitle: string; cleanArtist: string } {
  let t = title || '';
  let a = artist || '';

  // Remove common YouTube tags & release types
  t = t
    .replace(/\s*[\(\[](?:official\s+(?:music\s+)?video|official\s+audio|official\s+lyric\s+video|lyrics?\s+video|audio|visualizer|4k|hd|hq|live|remaster(?:ed)?|extended|explicit)[\)\]]/gi, '')
    .replace(/\s*[\(\[](?:feat\.|featuring|ft\.)\s+[^\)\]]+[\)\]]/gi, '')
    .replace(/\s*-\s*(?:official\s+(?:music\s+)?video|official\s+audio|music\s+video|lyrics?).*$/i, '')
    .replace(/\|\s*.*$/i, '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();

  // Strip feature tags from artist
  a = a
    .replace(/\s*(?:feat\.|featuring|ft\.)\s+.*$/i, '')
    .replace(/\s*-\s*Topic$/i, '')
    .trim();

  return { cleanTitle: t || title, cleanArtist: a || artist || '' };
}

// ==========================================
// Lyrics Parsing & Utils (Echo LyricsUtils.kt)
// ==========================================
const RICH_SYNC_LINE_REGEX = /^\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)$/;
const RICH_SYNC_WORD_REGEX = /<(\d{1,2}):(\d{2})\.(\d{2,3})>\s*([^<]+)/g;
const AGENT_REGEX = /\{agent:([^}]+)\}/;
const BACKGROUND_REGEX = /^\{bg\}/;
const STANDARD_LINE_REGEX = /((\[\d\d:\d\d\.\d{2,3}\] ?)+)(.+)/;
const TIME_REGEX = /\[(\d\d):(\d\d)\.(\d{2,3})\]/g;

export function hasSyncedLyrics(lrc: string): boolean {
  if (!lrc || typeof lrc !== 'string') return false;
  return /\[\d{1,2}:\d{2}\.\d{2,3}\]/.test(lrc);
}

export function lyricText(line: LyricLine | LyricsLine): string {
  if (!line || !line.words) return '';
  return line.words.map((w) => w.word).join('').trim();
}

export function parseLyrics(rawLyrics: string, source: string, providerName: string): LyricsPayload {
  if (!rawLyrics || !rawLyrics.trim()) {
    return { lines: [], synced: false, wordTimed: false, source, providerName, rawLrc: '' };
  }

  const unescaped = rawLyrics
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

  const rawLines = unescaped.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('[offset:'));

  const isRichSync = rawLines.some((l) => RICH_SYNC_LINE_REGEX.test(l) && /<\d{1,2}:\d{2}\.\d{2,3}>/.test(l));
  const hasStandardTimestamps = rawLines.some((l) => /\[\d{1,2}:\d{2}\.\d{2,3}\]/.test(l));

  if (!hasStandardTimestamps && !isRichSync) {
    // Unsynced plain text lyrics
    const lines: LyricsLine[] = rawLines.map((text, idx) => ({
      startTime: idx * 3000,
      endTime: (idx + 1) * 3000,
      words: [{ word: text, startTime: idx * 3000, endTime: (idx + 1) * 3000 }],
    }));
    return { lines, synced: false, wordTimed: false, source, providerName, rawLrc: rawLyrics };
  }

  // Parse rich sync (word timings) or standard lines
  const parsedLines: LyricsLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const match = line.match(RICH_SYNC_LINE_REGEX);

    if (match) {
      const minutes = parseInt(match[1], 10) || 0;
      const seconds = parseInt(match[2], 10) || 0;
      const fractionStr = match[3];
      const fraction = parseInt(fractionStr, 10) || 0;
      const millisPart = fractionStr.length === 3 ? fraction : fraction * 10;
      const lineTimeMs = minutes * 60000 + seconds * 1000 + millisPart;

      let content = match[4].trim();

      const agentMatch = content.match(AGENT_REGEX);
      const agent = agentMatch ? agentMatch[1] : undefined;
      if (agentMatch) content = content.replace(AGENT_REGEX, '').trim();

      const isBg = BACKGROUND_REGEX.test(content);
      if (isBg) content = content.replace(BACKGROUND_REGEX, '').trim();

      // Check for inline syllables: <mm:ss.xxx>word
      const words: LyricWord[] = [];
      const wordMatches = [...content.matchAll(RICH_SYNC_WORD_REGEX)];

      if (wordMatches.length > 0) {
        for (let w = 0; w < wordMatches.length; w++) {
          const wm = wordMatches[w];
          const wMin = parseInt(wm[1], 10) || 0;
          const wSec = parseInt(wm[2], 10) || 0;
          const wFracStr = wm[3];
          const wFrac = parseInt(wFracStr, 10) || 0;
          const wMillis = wFracStr.length === 3 ? wFrac : wFrac * 10;
          const wStart = wMin * 60000 + wSec * 1000 + wMillis;
          const wordStr = wm[4];

          let wEnd = wStart + 400;
          if (w < wordMatches.length - 1) {
            const nextWm = wordMatches[w + 1];
            const nextMin = parseInt(nextWm[1], 10) || 0;
            const nextSec = parseInt(nextWm[2], 10) || 0;
            const nextFracStr = nextWm[3];
            const nextFrac = parseInt(nextFracStr, 10) || 0;
            const nextMillis = nextFracStr.length === 3 ? nextFrac : nextFrac * 10;
            wEnd = nextMin * 60000 + nextSec * 1000 + nextMillis;
          }
          words.push({ word: wordStr, startTime: wStart, endTime: wEnd });
        }
      }

      const plainText = content.replace(/<\d{1,2}:\d{2}\.\d{2,3}>\s*/g, '').trim();
      if (plainText) {
        if (words.length === 0) {
          words.push({ word: plainText, startTime: lineTimeMs, endTime: lineTimeMs + 3000 });
        }
        parsedLines.push({
          startTime: lineTimeMs,
          endTime: lineTimeMs + 3000,
          words,
          agent,
          isBackground: isBg,
        });
      }
      continue;
    }

    // Standard LRC line parsing
    const standardMatch = line.match(STANDARD_LINE_REGEX);
    if (standardMatch) {
      const timesStr = standardMatch[1];
      let lineContent = standardMatch[3].trim();

      const agentMatch = lineContent.match(AGENT_REGEX);
      const agent = agentMatch ? agentMatch[1] : undefined;
      if (agentMatch) lineContent = lineContent.replace(AGENT_REGEX, '').trim();

      const isBg = BACKGROUND_REGEX.test(lineContent);
      if (isBg) lineContent = lineContent.replace(BACKGROUND_REGEX, '').trim();

      // Check next line for word timestamps block: <word:start:end|...>
      let words: LyricWord[] = [];
      if (i + 1 < rawLines.length && rawLines[i + 1].startsWith('<') && rawLines[i + 1].endsWith('>')) {
        const rawWordsBlock = rawLines[i + 1].slice(1, -1);
        words = rawWordsBlock.split('|').map((part) => {
          const [text, s, e] = part.split(':');
          return {
            word: text || '',
            startTime: Math.round((parseFloat(s) || 0) * 1000),
            endTime: Math.round((parseFloat(e) || 0) * 1000),
          };
        }).filter((w) => w.word.length > 0);
      }

      const timeMatches = [...timesStr.matchAll(TIME_REGEX)];
      for (const tm of timeMatches) {
        const m = parseInt(tm[1], 10) || 0;
        const s = parseInt(tm[2], 10) || 0;
        const fracStr = tm[3];
        const f = parseInt(fracStr, 10) || 0;
        const ms = fracStr.length === 3 ? f : f * 10;
        const lineTime = m * 60000 + s * 1000 + ms;

        const effectiveWords = words.length > 0 ? words : [{ word: lineContent, startTime: lineTime, endTime: lineTime + 3000 }];
        parsedLines.push({
          startTime: lineTime,
          endTime: lineTime + 3000,
          words: effectiveWords,
          agent,
          isBackground: isBg,
        });
      }
    }
  }

  // Sort chronologically and fill end times
  parsedLines.sort((a, b) => a.startTime - b.startTime);
  for (let idx = 0; idx < parsedLines.length - 1; idx++) {
    parsedLines[idx].endTime = parsedLines[idx + 1].startTime;
  }

  const wordTimed = parsedLines.some((l) => l.words.some((w) => w.endTime > w.startTime && l.words.length > 1));

  return {
    lines: parsedLines,
    synced: parsedLines.length > 0,
    wordTimed,
    source,
    providerName,
    rawLrc: rawLyrics,
  };
}

// ==========================================
// Provider 1: YouLyPlus (Echo Multi-Mirror)
// ==========================================
const YOULY_SERVERS = [
  'https://lyricsplus.prjktla.my.id',
  'https://lyricsplus.atomix.one',
  'https://lyricsplus.binimum.org',
  'https://lyricsplus.prjktla.workers.dev',
  'https://lyricsplus-seven.vercel.app',
  'https://lyrics-plus-backend.vercel.app',
];
let lastWorkingYouLyServer: string | null = null;

async function fetchFromYouLyServer(
  server: string,
  title: string,
  artist: string,
  duration?: number,
  album?: string,
  id?: string,
  signal?: AbortSignal
): Promise<string | null> {
  const url = new URL(`${server.endsWith('/') ? server : server + '/'}v2/lyrics/get`);
  url.searchParams.set('title', title);
  url.searchParams.set('artist', artist);
  if (duration && duration > 0) url.searchParams.set('duration', String(Math.round(duration)));
  if (album) url.searchParams.set('album', album);
  if (id) url.searchParams.set('id', id);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    syncedLyrics?: string;
    lyrics?: Array<{ time?: number; text?: string; syllabus?: Array<{ time?: number; text?: string; isBackground?: boolean }> }>;
    plainLyrics?: string;
  };

  if (data.syncedLyrics && data.syncedLyrics.trim()) {
    return data.syncedLyrics;
  }

  if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
    // Convert syllabus / items to rich LRC string
    return data.lyrics
      .map((item) => {
        const t = item.time || 0;
        const min = Math.floor(t / 60000);
        const sec = Math.floor((t % 60000) / 1000);
        const ms = t % 1000;
        const lineTs = `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}]`;
        const isBg = item.syllabus?.some((s) => s.isBackground);
        const bgMarker = isBg ? '{bg}' : '';

        if (item.syllabus && item.syllabus.length > 0) {
          const words = item.syllabus
            .map((syl) => {
              const st = syl.time || 0;
              const sMin = Math.floor(st / 60000);
              const sSec = Math.floor((st % 60000) / 1000);
              const sMs = st % 1000;
              return `<${String(sMin).padStart(2, '0')}:${String(sSec).padStart(2, '0')}.${String(sMs).padStart(3, '0')}>${syl.text || ''}`;
            })
            .join(' ');
          return `${lineTs}${bgMarker}${words}`;
        }
        return `${lineTs}${bgMarker}${item.text || ''}`;
      })
      .join('\n');
  }

  if (data.plainLyrics && data.plainLyrics.trim()) {
    return data.plainLyrics;
  }

  return null;
}

export async function getYouLyPlusLyrics(
  title: string,
  artist: string,
  duration?: number,
  album?: string,
  id?: string
): Promise<string | null> {
  const servers = lastWorkingYouLyServer
    ? [lastWorkingYouLyServer, ...YOULY_SERVERS.filter((s) => s !== lastWorkingYouLyServer)]
    : YOULY_SERVERS;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const promises = servers.map(async (server) => {
      try {
        const lrc = await fetchFromYouLyServer(server, title, artist, duration, album, id, controller.signal);
        if (lrc && lrc.trim()) {
          lastWorkingYouLyServer = server;
          return lrc;
        }
      } catch {
        // ignore individual server fail
      }
      return null;
    });

    const firstSuccess = await new Promise<string | null>((resolve) => {
      let pending = promises.length;
      let hasWon = false;
      promises.forEach((p) => {
        p.then((res) => {
          if (res && !hasWon) {
            hasWon = true;
            resolve(res);
          } else {
            pending--;
            if (pending === 0 && !hasWon) resolve(null);
          }
        });
      });
    });

    return firstSuccess;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 2: PaxSenix (Apple Music Lyrics)
// ==========================================
export async function getPaxSenixLyrics(
  title: string,
  artist: string,
  duration?: number
): Promise<string | null> {
  const { cleanTitle, cleanArtist } = cleanTitleAndArtist(title, artist);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const query = `${cleanTitle} ${cleanArtist}`.trim();
    const searchUrl = `https://lyrics.paxsenix.org/apple-music/search?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'echomusic/1.0' },
    });
    if (!searchRes.ok) return null;
    const candidates = (await searchRes.json()) as Array<{
      id: string;
      displayName?: string;
      duration?: number;
    }>;
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    // Score candidate matching Echo's scoring logic
    const durMs = (duration || 0) * 1000;
    const targetTitle = cleanTitle.toLowerCase();
    const scored = candidates.map((cand) => {
      let score = 0;
      if (durMs > 0 && cand.duration) {
        const diff = Math.abs(cand.duration - durMs);
        if (diff <= 2000) score += 100;
        else if (diff <= 5000) score += 50;
        else if (diff <= 10000) score += 10;
        else score -= 50;
      }
      const cTitle = (cand.displayName || '').toLowerCase();
      if (cTitle === targetTitle) score += 80;
      else if (cTitle.includes(targetTitle) || targetTitle.includes(cTitle)) score += 40;
      return { cand, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]?.cand;
    if (!best) return null;

    const lyricsRes = await fetch(`https://lyrics.paxsenix.org/apple-music/lyrics?id=${encodeURIComponent(best.id)}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'echomusic/1.0' },
    });
    if (!lyricsRes.ok) return null;
    const data = (await lyricsRes.json()) as {
      content?: Array<{
        timestamp: number;
        background?: boolean;
        oppositeTurn?: boolean;
        text: Array<{ text: string; timestamp: number; endtime: number }>;
      }>;
      ttml?: string;
    };

    if (Array.isArray(data.content) && data.content.length > 0) {
      return data.content
        .map((line) => {
          const t = line.timestamp || 0;
          const min = Math.floor(t / 60000);
          const sec = Math.floor((t % 60000) / 1000);
          const cs = Math.floor((t % 1000) / 10);
          const lineTs = `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}]`;
          const agent = line.background ? '{bg}' : line.oppositeTurn ? '{agent:v2}' : '{agent:v1}';
          const lineText = line.text.map((w) => w.text).join(' ');
          const wordsData = line.text.map((w) => `${w.text}:${w.timestamp / 1000}:${w.endtime / 1000}`).join('|');
          return `${lineTs}${agent}${lineText}\n<${wordsData}>`;
        })
        .join('\n');
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 3: Unison (Echo Unison)
// ==========================================
export async function getUnisonLyrics(
  title: string,
  artist: string,
  duration?: number,
  album?: string,
  videoId?: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    // 1. Try by videoId if present
    if (videoId) {
      const vUrl = `https://unison.boidu.dev/lyrics?v=${encodeURIComponent(videoId)}`;
      const vRes = await fetch(vUrl, { signal: controller.signal });
      if (vRes.ok) {
        const vData = (await vRes.json()) as { success?: boolean; data?: { lyrics?: string } };
        if (vData.success && vData.data?.lyrics && vData.data.lyrics.trim()) {
          return vData.data.lyrics;
        }
      }
    }

    // 2. Fallback to metadata
    const { cleanTitle, cleanArtist } = cleanTitleAndArtist(title, artist);
    const mUrl = new URL('https://unison.boidu.dev/lyrics');
    mUrl.searchParams.set('song', cleanTitle);
    mUrl.searchParams.set('artist', cleanArtist);
    if (album) mUrl.searchParams.set('album', album);
    if (duration && duration > 0) mUrl.searchParams.set('duration', String(Math.round(duration)));

    const mRes = await fetch(mUrl.toString(), { signal: controller.signal });
    if (mRes.ok) {
      const mData = (await mRes.json()) as { success?: boolean; data?: { lyrics?: string } };
      if (mData.success && mData.data?.lyrics && mData.data.lyrics.trim()) {
        return mData.data.lyrics;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 4: BetterLyrics (TTML Parser)
// ==========================================
export async function getBetterLyrics(
  title: string,
  artist: string,
  duration?: number,
  album?: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = new URL('https://lyrics-api.boidu.dev/getLyrics');
    url.searchParams.set('s', title);
    url.searchParams.set('a', artist);
    if (duration && duration > 0) url.searchParams.set('d', String(Math.round(duration)));
    if (album) url.searchParams.set('al', album);

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { ttml?: string };
    if (!data.ttml || !data.ttml.trim()) return null;

    // Convert TTML into LRC matching Echo's TTMLParser.kt
    const lines: string[] = [];
    const pRegex = /<p\s+[^>]*begin="([^"]+)"(?:\s+[^>]*agent="([^"]+)")?[^>]*>(.*?)<\/p>/gs;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(data.ttml)) !== null) {
      const beginStr = pMatch[1];
      const agent = pMatch[2] ? `{agent:${pMatch[2]}}` : '';
      const pBody = pMatch[3];

      // Parse begin time (format: 00:01:23.450 or 00:01.450 or 12.34s)
      const lineTimeSec = parseTtmlTime(beginStr);
      const min = Math.floor(lineTimeSec / 60);
      const sec = Math.floor(lineTimeSec % 60);
      const cs = Math.floor((lineTimeSec % 1) * 100);
      const lineTs = `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}]`;

      // Extract spans for words/syllables
      const spanRegex = /<span\s+[^>]*begin="([^"]+)"\s+end="([^"]+)"(?:\s+[^>]*role="([^"]+)")?[^>]*>([^<]*)<\/span>/g;
      let sMatch: RegExpExecArray | null;
      const words: string[] = [];
      let fullText = '';

      while ((sMatch = spanRegex.exec(pBody)) !== null) {
        const sBegin = parseTtmlTime(sMatch[1]);
        const sEnd = parseTtmlTime(sMatch[2]);
        const sRole = sMatch[3];
        const sText = sMatch[4];
        if (sText) {
          fullText += sText;
          words.push(`${sText}:${sBegin}:${sEnd}`);
        }
      }

      if (!fullText) {
        // Fallback: strip tags
        fullText = pBody.replace(/<[^>]+>/g, '').trim();
      }

      if (fullText) {
        lines.push(`${lineTs}${agent}${fullText}`);
        if (words.length > 0) {
          lines.push(`<${words.join('|')}>`);
        }
      }
    }

    return lines.length > 0 ? lines.join('\n') : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseTtmlTime(str: string): number {
  if (!str) return 0;
  if (str.endsWith('s')) return parseFloat(str.slice(0, -1)) || 0;
  const parts = str.split(':');
  if (parts.length === 3) {
    return (parseFloat(parts[0]) || 0) * 3600 + (parseFloat(parts[1]) || 0) * 60 + (parseFloat(parts[2]) || 0);
  }
  if (parts.length === 2) {
    return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
  }
  return parseFloat(str) || 0;
}

// ==========================================
// Provider 5: SimpMusic (Echo SimpMusicLyrics)
// ==========================================
export async function getSimpMusicLyrics(videoId: string, duration?: number): Promise<string | null> {
  if (!videoId) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  const endpoints = [
    `https://api-lyrics.simpmusic.org/v1/${videoId}`,
    `https://vivi-yt-music-server.onrender.com/v1/${videoId}`,
  ];

  try {
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          signal: controller.signal,
          headers: { Accept: 'application/json', 'User-Agent': 'SimpMusicLyrics/1.0' },
        });
        if (!res.ok) continue;
        const apiResponse = (await res.json()) as {
          success?: boolean;
          data?: Array<{
            duration?: number;
            richSyncLyrics?: string;
            syncedLyrics?: string;
            plainLyrics?: string;
          }>;
        };

        if (apiResponse.success && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
          const tracks = apiResponse.data;
          // Filter tracks within 10s duration tolerance
          const valid = duration && duration > 0
            ? tracks.filter((t) => Math.abs((t.duration || 0) - duration) <= 10)
            : tracks;

          const chosenList = valid.length > 0 ? valid : tracks;
          const best = duration && duration > 0
            ? chosenList.sort((a, b) => Math.abs((a.duration || 0) - duration) - Math.abs((b.duration || 0) - duration))[0]
            : chosenList[0];

          const lrc = best?.richSyncLyrics || best?.syncedLyrics || best?.plainLyrics;
          if (lrc && lrc.trim()) return lrc;
        }
      } catch {
        // try next endpoint
      }
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 6: LrcLib (Echo LrcLib)
// ==========================================
export async function getLrcLibLyrics(
  title: string,
  artist: string,
  duration?: number,
  album?: string
): Promise<string | null> {
  const { cleanTitle, cleanArtist } = cleanTitleAndArtist(title, artist);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    // 1. Direct GET
    const getUrl = new URL('https://lrclib.net/api/get');
    getUrl.searchParams.set('track_name', cleanTitle);
    getUrl.searchParams.set('artist_name', cleanArtist);
    if (duration && duration > 0) getUrl.searchParams.set('duration', String(Math.round(duration)));
    if (album) getUrl.searchParams.set('album_name', album);

    const getRes = await fetch(getUrl.toString(), { signal: controller.signal });
    if (getRes.ok) {
      const data = (await getRes.json()) as { syncedLyrics?: string; plainLyrics?: string };
      if (data.syncedLyrics && data.syncedLyrics.trim()) return data.syncedLyrics;
      if (data.plainLyrics && data.plainLyrics.trim()) return data.plainLyrics;
    }

    // 2. Search fallback
    const searchUrl = new URL('https://lrclib.net/api/search');
    searchUrl.searchParams.set('track_name', cleanTitle);
    searchUrl.searchParams.set('artist_name', cleanArtist);

    const searchRes = await fetch(searchUrl.toString(), { signal: controller.signal });
    if (searchRes.ok) {
      const items = (await searchRes.json()) as Array<{
        syncedLyrics?: string;
        plainLyrics?: string;
        duration?: number;
      }>;
      if (Array.isArray(items) && items.length > 0) {
        const sorted = items
          .filter((i) => i.syncedLyrics || i.plainLyrics)
          .sort((a, b) => {
            const aSync = a.syncedLyrics ? 2 : 1;
            const bSync = b.syncedLyrics ? 2 : 1;
            const aDurDiff = duration && a.duration ? Math.abs(a.duration - duration) : 0;
            const bDurDiff = duration && b.duration ? Math.abs(b.duration - duration) : 0;
            return bSync - aSync || aDurDiff - bDurDiff;
          });
        const hit = sorted[0];
        if (hit?.syncedLyrics) return hit.syncedLyrics;
        if (hit?.plainLyrics) return hit.plainLyrics;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 7: KuGou (Echo KuGou)
// ==========================================
export async function getKuGouLyrics(
  title: string,
  artist: string,
  duration?: number
): Promise<string | null> {
  const { cleanTitle, cleanArtist } = cleanTitleAndArtist(title, artist);
  const keyword = `${cleanTitle} ${cleanArtist}`.trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const searchUrl = `http://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=${encodeURIComponent(keyword)}&duration=${duration ? Math.round(duration * 1000) : 0}`;
    const searchRes = await fetch(searchUrl, { signal: controller.signal });
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as {
      candidates?: Array<{ id: string; accesskey: string; duration?: number }>;
    };

    const candidate = searchData.candidates?.[0];
    if (!candidate || !candidate.id || !candidate.accesskey) return null;

    const downloadUrl = `http://lyrics.kugou.com/download?ver=1&client=pc&id=${candidate.id}&accesskey=${candidate.accesskey}&fmt=lrc&charset=utf8`;
    const downloadRes = await fetch(downloadUrl, { signal: controller.signal });
    if (!downloadRes.ok) return null;
    const downloadData = (await downloadRes.json()) as { content?: string };
    if (!downloadData.content) return null;

    // Decode Base64
    const decoded = atob(downloadData.content);
    return decoded || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 8: YouTubeSubtitle (Echo YouTube.transcript)
// ==========================================
export async function getYouTubeSubtitleLyrics(videoId: string): Promise<string | null> {
  if (!videoId) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    // Generate YouTube protobuf param: \n + \x0b + videoId (11 chars) in Base64
    const rawProto = `\n\x0b${videoId}`;
    const base64Params = btoa(rawProto);

    const res = await fetch('https://music.youtube.com/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: { clientName: 'WEB', clientVersion: '2.20260301.01.00', hl: 'en', gl: 'US' },
        },
        params: base64Params,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const cueGroups =
      json.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups;

    if (Array.isArray(cueGroups) && cueGroups.length > 0) {
      const lines = cueGroups.map((group: any) => {
        const cue = group?.transcriptCueGroupRenderer?.cues?.[0]?.transcriptCueRenderer;
        const timeMs = parseInt(cue?.startOffsetMs, 10) || 0;
        const text = cue?.cue?.simpleText || '';
        const min = Math.floor(timeMs / 60000);
        const sec = Math.floor((timeMs % 60000) / 1000);
        const cs = Math.floor((timeMs % 1000) / 10);
        return `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}] ${text}`;
      });
      return lines.join('\n');
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Provider 9: YouTubeMusic (Echo YouTube.lyrics)
// ==========================================
export async function getYouTubeMusicLyrics(videoId: string): Promise<string | null> {
  if (!videoId) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    // 1. Next endpoint to get lyrics browseId
    const nextRes = await fetch('https://music.youtube.com/youtubei/v1/next?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20260301.01.00', hl: 'en', gl: 'US' } },
        videoId,
      }),
      signal: controller.signal,
    });
    if (!nextRes.ok) return null;
    const nextData = (await nextRes.json()) as any;
    const tabs = nextData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
    const lyricsTab = tabs?.find((t: any) => t?.tabRenderer?.title === 'Lyrics' || t?.tabRenderer?.endpoint?.browseEndpoint);
    const browseEndpoint = lyricsTab?.tabRenderer?.endpoint?.browseEndpoint;
    if (!browseEndpoint?.browseId) return null;

    // 2. Browse lyrics tab
    const browseRes = await fetch('https://music.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20260301.01.00', hl: 'en', gl: 'US' } },
        browseId: browseEndpoint.browseId,
        params: browseEndpoint.params,
      }),
      signal: controller.signal,
    });
    if (!browseRes.ok) return null;
    const browseData = (await browseRes.json()) as any;
    const shelf = browseData?.contents?.sectionListRenderer?.contents?.find((c: any) => c?.musicDescriptionShelfRenderer);
    const runs = shelf?.musicDescriptionShelfRenderer?.description?.runs;
    if (Array.isArray(runs) && runs.length > 0) {
      return runs.map((r: any) => r.text || '').join('');
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Central Fetch Dispatcher by Provider
// ==========================================
async function fetchLyricsFromProvider(
  providerName: LyricsProviderName,
  title: string,
  artist: string,
  duration?: number,
  album?: string,
  videoId?: string
): Promise<string | null> {
  switch (providerName) {
    case 'YouLyPlus':
      return getYouLyPlusLyrics(title, artist, duration, album, videoId);
    case 'Paxsenix':
      return getPaxSenixLyrics(title, artist, duration);
    case 'Unison':
      return getUnisonLyrics(title, artist, duration, album, videoId);
    case 'BetterLyrics':
      return getBetterLyrics(title, artist, duration, album);
    case 'SimpMusic':
      return videoId ? getSimpMusicLyrics(videoId, duration) : null;
    case 'LrcLib':
      return getLrcLibLyrics(title, artist, duration, album);
    case 'Kugou':
      return getKuGouLyrics(title, artist, duration);
    case 'YouTubeSubtitle':
      return videoId ? getYouTubeSubtitleLyrics(videoId) : null;
    case 'YouTubeMusic':
      return videoId ? getYouTubeMusicLyrics(videoId) : null;
    default:
      return null;
  }
}

// ==========================================
// Central Lyrics Entry Point (Echo LyricsHelper.kt)
// ==========================================
export async function getLyrics(
  title: string,
  artist: string,
  duration?: number,
  album?: string,
  videoId?: string
): Promise<LyricsPayload> {
  const cacheKey = `${title}_${artist}_${videoId || ''}`.toLowerCase().replace(/\s+/g, '_');

  // Check in-memory cache
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // Check persistent cache
  try {
    const rawStored = await AsyncStorage.getItem(`${LYRICS_CACHE_KEY}_${cacheKey}`);
    if (rawStored) {
      const parsed = JSON.parse(rawStored) as LyricsPayload;
      if (parsed && Array.isArray(parsed.lines)) {
        MEMORY_CACHE.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  const selectedProvider = await getLyricsProvider();
  let orderedProviders: LyricsProviderName[] = [];

  if (selectedProvider !== 'auto' && selectedProvider !== 'lyrics-ovh' && selectedProvider !== 'lrclib') {
    orderedProviders = [selectedProvider as LyricsProviderName];
  } else if (selectedProvider === 'lrclib') {
    orderedProviders = ['LrcLib'];
  } else {
    orderedProviders = await getProviderOrder();
  }

  // Race providers matching Echo's LyricsHelper.fetchFirstSyncedLyrics
  const results = await Promise.allSettled(
    orderedProviders.map(async (provider) => {
      const raw = await fetchLyricsFromProvider(provider, title, artist, duration, album, videoId);
      if (raw && raw.trim()) {
        const isSynced = hasSyncedLyrics(raw);
        return { provider, raw, isSynced };
      }
      return null;
    })
  );

  let bestResult: { provider: LyricsProviderName; raw: string; isSynced: boolean } | null = null;
  let firstUnsynced: { provider: LyricsProviderName; raw: string; isSynced: boolean } | null = null;

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      if (r.value.isSynced) {
        bestResult = r.value;
        break; // Found first synced lyrics matching Echo order!
      } else if (!firstUnsynced) {
        firstUnsynced = r.value;
      }
    }
  }

  const winning = bestResult || firstUnsynced;

  if (winning) {
    const payload = parseLyrics(winning.raw, `Lyrics from ${winning.provider}`, winning.provider);
    MEMORY_CACHE.set(cacheKey, payload);
    try {
      void AsyncStorage.setItem(`${LYRICS_CACHE_KEY}_${cacheKey}`, JSON.stringify(payload));
    } catch {
      // ignore
    }
    return payload;
  }

  // Fallback empty
  return {
    lines: [],
    synced: false,
    wordTimed: false,
    source: 'Lyrics not found',
    providerName: 'None',
    rawLrc: '',
  };
}

// Fetch all available lyrics across providers (Echo getAllLyrics)
export async function getAllLyrics(
  title: string,
  artist: string,
  duration?: number,
  album?: string,
  videoId?: string
): Promise<LyricsPayload[]> {
  const providers = await getProviderOrder();
  const payloads: LyricsPayload[] = [];

  await Promise.all(
    providers.map(async (provider) => {
      try {
        const raw = await fetchLyricsFromProvider(provider, title, artist, duration, album, videoId);
        if (raw && raw.trim()) {
          payloads.push(parseLyrics(raw, `Lyrics from ${provider}`, provider));
        }
      } catch {
        // ignore
      }
    })
  );

  return payloads;
}

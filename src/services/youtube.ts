import { tracks, type Track } from '@/data/music';
import { filterMusicSuggestion, isMusicLikeContent, isNonMusicContent } from '@/core/content-filter';
import { innerTube } from '@/core/innertube';

type SearchResponse = {
  items?: {
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
    };
  }[];
  error?: { message?: string };
};

type VideoDetailsResponse = {
  items?: {
    id?: string;
    contentDetails?: { duration?: string };
  }[];
};

type VideoSnippet = {
  title?: string;
  channelTitle?: string;
  thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
};

type PopularResponse = {
  items?: {
    id?: string;
    snippet?: VideoSnippet;
  }[];
  error?: { message?: string };
};

type InnertubeSearchResponse = {
  contents?: unknown;
};

type InnertubeVideo = {
  videoId?: string;
  title?: { runs?: { text?: string }[] };
  ownerText?: { runs?: { text?: string }[] };
  thumbnail?: { thumbnails?: { url?: string }[] };
  lengthText?: { simpleText?: string };
};

const cache = new Map<string, { expires: number; tracks: Track[] }>();
const CACHE_TTL = 15 * 60 * 1000;

function getApiKey(): string | null {
  return process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? null;
}

export async function searchYouTube(query: string): Promise<Track[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return tracks;

  const cacheKey = `search:${trimmed}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.tracks;

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: `${trimmed}`,
        type: 'video',
        videoCategoryId: '10',
        maxResults: '25',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        key: apiKey,
      });

      const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      if (response.ok) {
        const data = (await response.json()) as SearchResponse;
        const candidates = (data.items ?? []).flatMap((item) => {
          const videoId = item.id?.videoId;
          if (!videoId) return [];
          return [toTrack(videoId, item.snippet)];
        });
        const result = rankMusicTracks(await filterFullLengthTracks(candidates));

        if (result.length > 0) {
          cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, tracks: result });
          return result;
        }
      }
    } catch {}
  }

  const innertubeResult = await searchYouTubeInnertube(trimmed);
  if (innertubeResult.length > 0) {
    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, tracks: innertubeResult });
    return innertubeResult;
  }

  // Legacy fallback for instances that still expose the Piped API.
  try {
    const pipedUrl = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(trimmed)}&filter=videos`;
    const pipedResponse = await fetchWithTimeout(pipedUrl, 4000);
    if (pipedResponse.ok) {
      const pipedData = (await pipedResponse.json()) as {
        items?: { url?: string; title?: string; uploaderName?: string; thumbnail?: string; duration?: number }[];
      };
      if (pipedData.items && pipedData.items.length > 0) {
        const pipedTracks: Track[] = pipedData.items
          .filter((item) => (item.duration ?? 0) >= 90 && isMusicLikeTitle(item.title ?? '', item.uploaderName ?? ''))
          .map((item) => {
          const videoId = extractVideoId(item.url);
          const durSec = item.duration ?? 220;
          const mins = Math.floor(durSec / 60);
          const secs = durSec % 60;
          return {
            id: videoId,
            videoId,
            title: decodeHtmlEntities(item.title ?? 'Unknown Track'),
            artist: item.uploaderName ?? 'Artist',
            artwork: item.thumbnail ?? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=85',
            duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
            durationSeconds: durSec,
          };
          })
          .filter((track) => track.videoId.length > 0);
        cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, tracks: pipedTracks });
        return pipedTracks;
      }

    }
  } catch {}

  const localMatches = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(trimmed) ||
      t.artist.toLowerCase().includes(trimmed) ||
      (t.album && t.album.toLowerCase().includes(trimmed))
  ).filter((track) => isMusicLikeContent(track.title, track.artist));

  return localMatches;
}

async function searchYouTubeInnertube(query: string): Promise<Track[]> {
  try {
    const response = await fetchWithTimeout(
      'https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      9000,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20260301.01.00',
              hl: 'en',
              gl: 'US',
            },
          },
          query,
        }),
      }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as InnertubeSearchResponse;
    return rankMusicTracks(collectVideoRenderers(data.contents).flatMap((video) => {
      if (!video?.videoId) return [];
      const title = video.title?.runs?.map((run) => run.text ?? '').join('') ?? 'Untitled track';
      const artist = video.ownerText?.runs?.map((run) => run.text ?? '').join('') ?? 'Geet Artist';
      const duration = video.lengthText?.simpleText ?? '4:15';
      const durationSeconds = parseDisplayDuration(duration);
      if (durationSeconds < 90 || !isMusicLikeTitle(title, artist)) return [];
      return [{
        id: video.videoId,
        videoId: video.videoId,
        title: cleanTrackTitle(title, artist).title,
        artist: artist.replace(' - Topic', ''),
        artwork:
          video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url ??
          `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
        duration,
        durationSeconds,
      }];
    }));
  } catch (error) {
    console.warn('YouTube search failed:', error);
    return [];
  }

  function collectVideoRenderers(value: unknown, result: InnertubeVideo[] = []): InnertubeVideo[] {
    if (!value || typeof value !== 'object') return result;
    if ('videoRenderer' in value && value.videoRenderer && typeof value.videoRenderer === 'object') {
      result.push(value.videoRenderer as InnertubeVideo);
    }
    for (const child of Object.values(value)) collectVideoRenderers(child, result);
    return result;
  }
}

async function filterFullLengthTracks(candidates: Track[]): Promise<Track[]> {
  const filtered = candidates.filter((track) => isMusicLikeTitle(track.title, track.artist) && !isShortFormTitle(track.title));
  const apiKey = getApiKey();
  if (!apiKey || filtered.length === 0) return filtered;

  try {
    const params = new URLSearchParams({
      part: 'contentDetails',
      id: filtered.map((track) => track.videoId).join(','),
      key: apiKey,
    });
    const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
    if (!response.ok) return filtered;
    const data = (await response.json()) as VideoDetailsResponse;
    const durations = new Map(
      (data.items ?? [])
        .filter((item): item is { id: string; contentDetails?: { duration?: string } } => Boolean(item.id))
        .map((item) => [item.id, parseIsoDuration(item.contentDetails?.duration)])
    );
    return rankMusicTracks(filtered
      .map((track) => ({ ...track, durationSeconds: durations.get(track.videoId) ?? track.durationSeconds }))
      .filter((track) => (track.durationSeconds ?? 0) >= 90));
  } catch {
    return filtered;
  }
}

function parseIsoDuration(value?: string): number {
  if (!value) return 0;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function isShortFormTitle(title: string): boolean {
  return /(^|\s)#?shorts?\b|(^|\s)short\s*video\b/i.test(title);
}

function isMusicLikeTitle(title: string, artist = ''): boolean {
  return isMusicLikeContent(title, artist);
}

function musicScore(track: Track): number {
  const text = `${track.title} ${track.artist}`;
  let score = 0;
  if (/\b(official audio|official music video|music video|lyrics?|visualizer|audio only|album)\b/i.test(text)) score += 5;
  if (/\b(song|music|cover|acoustic|remix|karaoke)\b/i.test(text)) score += 2;
  if (isNonMusicContent(track.title, track.artist)) score -= 40;
  return score;
}

function rankMusicTracks(items: Track[]): Track[] {
  return items
    .filter((track) => isMusicLikeTitle(track.title, track.artist) && (track.durationSeconds ?? 0) >= 90)
    .sort((a, b) => musicScore(b) - musicScore(a));
}

function extractVideoId(value?: string): string {
  if (!value) return '';
  const match = value.match(/(?:[?&]v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (match) return match[1];
  return /^[A-Za-z0-9_-]{11}$/.test(value.trim()) ? value.trim() : '';
}

export async function getPopularYouTube(): Promise<Track[]> {
  const cached = cache.get('popular-nepali');
  if (cached && cached.expires > Date.now()) return cached.tracks;

  // Search trending regional songs
  try {
    const regionalTrending = await searchYouTube('nepali songs latest trending hits 2024');
    if (regionalTrending.length > 0) {
      cache.set('popular-nepali', { expires: Date.now() + CACHE_TTL, tracks: regionalTrending });
      return regionalTrending;
    }
  } catch {}

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        chart: 'mostPopular',
        videoCategoryId: '10',
        regionCode: 'NP',
        maxResults: '20',
        key: apiKey,
      });
      const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
      if (response.ok) {
        const data = (await response.json()) as PopularResponse;
        const result = rankMusicTracks((data.items ?? []).flatMap((item) => (item.id ? [toTrack(item.id, item.snippet)] : [])));
        if (result.length > 0) {
          cache.set('popular-nepali', { expires: Date.now() + CACHE_TTL, tracks: result });
          return result;
        }
      }
    } catch {}
  }

  return tracks;
}

export async function getMusicByMood(moodQuery: string): Promise<Track[]> {
  return searchYouTube(moodQuery);
}

export async function resolveAudioStream(videoId: string): Promise<string | null> {
  if (!videoId) return null;
  try {
    const response = await fetchWithTimeout(`https://pipedapi.kavin.rocks/streams/${encodeURIComponent(videoId)}`, 8000);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      audioStreams?: { url?: string; bitrate?: number; codec?: string; mimeType?: string }[];
    };
    const candidates = (data.audioStreams ?? [])
      .filter((stream) => Boolean(stream.url))
      .filter((stream) => !stream.mimeType || stream.mimeType.startsWith('audio/'))
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
    return candidates[0]?.url ?? null;
  } catch (error) {
    console.warn('Audio stream resolution failed:', error);
    return null;
  }
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(trimmed)}`;
    const response = await fetchWithTimeout(url, 3000);
    if (response.ok) {
      const data = (await response.json()) as [string, string[]];
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1].filter(filterMusicSuggestion).slice(0, 8);
      }
    }
  } catch {}

  return tracks
    .filter(
      (t) =>
        t.title.toLowerCase().startsWith(trimmed.toLowerCase()) ||
        t.artist.toLowerCase().startsWith(trimmed.toLowerCase())
    )
    .map((t) => `${t.title} - ${t.artist}`)
    .slice(0, 5);
}

// Continuous Song Discovery Engine (matching Echo YouTubeQueue / RDAMVM Radio)
export async function getRelatedTracks(currentTrack: Track): Promise<Track[]> {
  try {
    if (currentTrack.videoId) {
      const page = await innerTube.next({
        videoId: currentTrack.videoId,
        playlistId: `RDAMVM${currentTrack.videoId}`,
      });
      const valid = page.items.filter(
        (item) =>
          item.id !== currentTrack.id &&
          item.videoId !== currentTrack.videoId &&
          isMusicLikeTitle(item.title, item.artist)
      );
      if (valid.length >= 3) {
        return valid;
      }
    }
  } catch {
    // fallback to search queries
  }

  const queries = [
    `${currentTrack.artist} official songs music`,
    `${currentTrack.artist} official audio`,
    `${currentTrack.title} similar songs music`,
  ];

  for (const query of queries) {
    try {
      const list = await searchYouTube(query);
      const filtered = list.filter(
        (item) =>
          item.id !== currentTrack.id &&
          item.videoId !== currentTrack.videoId &&
          isMusicLikeTitle(item.title, item.artist)
      );
      if (filtered.length >= 4) {
        return filtered;
      }
    } catch {}
  }

  return tracks.filter((t) => t.id !== currentTrack.id);
}

async function fetchWithTimeout(url: string, timeoutMs = 7000, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function parseDisplayDuration(value: string): number {
  const parts = value.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function toTrack(videoId: string, snippet?: VideoSnippet): Track {
  const rawTitle = snippet?.title ?? 'Untitled track';
  const rawArtist = snippet?.channelTitle?.replace(' - Topic', '') ?? '';
  const clean = cleanTrackTitle(rawTitle, rawArtist);
  const artwork =
    snippet?.thumbnails?.high?.url ??
    snippet?.thumbnails?.medium?.url ??
    snippet?.thumbnails?.default?.url ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    id: videoId,
    videoId,
    title: clean.title,
    artist: rawArtist || clean.artist || 'Geet Artist',
    artwork,
    duration: '4:15',
    durationSeconds: 255,
  };
}

export function cleanTrackTitle(title: string, knownArtist = ''): { title: string; artist?: string } {
  let cleaned = decodeHtmlEntities(title);
  cleaned = cleaned
    .replace(/\s*\((?:official|official video|official audio|lyrics?|music video|4k|hd)[^)]*\)/gi, '')
    .replace(/\s*\[(?:official|official video|official audio|lyrics?|music video|4k|hd)[^\]]*\]/gi, '')
    .replace(/\s*\|\s*(?:official|music video|lyrics?).*$/i, '')
    .trim();

  const splitHyphen = cleaned.split(/\s+-\s+/);
  const potentialArtist = splitHyphen[0]?.trim() ?? '';
  const artistMatches =
    potentialArtist.length > 0 &&
    knownArtist.length > 0 &&
    (knownArtist.toLocaleLowerCase().includes(potentialArtist.toLocaleLowerCase()) ||
      potentialArtist.toLocaleLowerCase().includes(knownArtist.toLocaleLowerCase()));
  if (splitHyphen.length === 2 && artistMatches) {
    return {
      artist: potentialArtist,
      title: splitHyphen[1].trim(),
    };
  }

  return { title: cleaned };
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

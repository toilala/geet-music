import { tracks, type Track } from '@/data/music';

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

const cache = new Map<string, { expires: number; tracks: Track[] }>();
const CACHE_TTL = 10 * 60 * 1000;

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
        q: `${trimmed} music`,
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
        const result = (data.items ?? []).flatMap((item) => {
          const videoId = item.id?.videoId;
          if (!videoId) return [];
          return [toTrack(videoId, item.snippet)];
        });

        if (result.length > 0) {
          cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, tracks: result });
          return result;
        }
      }
    } catch (err) {
      console.warn('[Geet YouTube] Official API search error, falling back to piped/curated:', err);
    }
  }

  // Fallback 1: Try public piped / invidious instance
  try {
    const pipedUrl = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(trimmed + ' music')}&filter=videos`;
    const pipedResponse = await fetchWithTimeout(pipedUrl, 4000);
    if (pipedResponse.ok) {
      const pipedData = (await pipedResponse.json()) as { items?: { url?: string; title?: string; uploaderName?: string; thumbnail?: string; duration?: number }[] };
      if (pipedData.items && pipedData.items.length > 0) {
        const pipedTracks: Track[] = pipedData.items.map((item) => {
          const videoId = (item.url ?? '').replace('/watch?v=', '') || String(Math.random());
          const durSec = item.duration ?? 180;
          const mins = Math.floor(durSec / 60);
          const secs = durSec % 60;
          return {
            id: videoId,
            videoId,
            title: decodeHtmlEntities(item.title ?? 'Unknown Track'),
            artist: item.uploaderName ?? 'YouTube Artist',
            artwork: item.thumbnail ?? 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=85',
            duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
            durationSeconds: durSec,
          };
        });
        cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, tracks: pipedTracks });
        return pipedTracks;
      }
    }
  } catch {
    // Continue to local match
  }

  // Fallback 2: Local curated tracks fuzzy match
  const localMatches = tracks.filter((t) =>
    t.title.toLowerCase().includes(trimmed) ||
    t.artist.toLowerCase().includes(trimmed) ||
    (t.album && t.album.toLowerCase().includes(trimmed))
  );

  return localMatches.length > 0 ? localMatches : tracks;
}

export async function getPopularYouTube(): Promise<Track[]> {
  const cached = cache.get('popular');
  if (cached && cached.expires > Date.now()) return cached.tracks;

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        chart: 'mostPopular',
        videoCategoryId: '10',
        regionCode: 'US',
        maxResults: '15',
        key: apiKey,
      });
      const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
      if (response.ok) {
        const data = (await response.json()) as PopularResponse;
        const result = (data.items ?? []).flatMap((item) => item.id ? [toTrack(item.id, item.snippet)] : []);
        if (result.length > 0) {
          cache.set('popular', { expires: Date.now() + CACHE_TTL, tracks: result });
          return result;
        }
      }
    } catch (err) {
      console.warn('[Geet YouTube] Popular API error, returning curated tracks:', err);
    }
  }

  return tracks;
}

export async function getMusicByMood(moodQuery: string): Promise<Track[]> {
  return searchYouTube(moodQuery);
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
        return data[1].slice(0, 8);
      }
    }
  } catch {
    // Silently fallback
  }

  // Fallback suggestions from local tracks
  return tracks
    .filter((t) => t.title.toLowerCase().startsWith(trimmed.toLowerCase()) || t.artist.toLowerCase().startsWith(trimmed.toLowerCase()))
    .map((t) => `${t.title} - ${t.artist}`)
    .slice(0, 5);
}

export async function getRelatedTracks(currentTrack: Track): Promise<Track[]> {
  const query = `${currentTrack.artist} similar music`;
  try {
    const list = await searchYouTube(query);
    const filtered = list.filter((item) => item.id !== currentTrack.id);
    return filtered.length > 0 ? filtered : tracks.filter((t) => t.id !== currentTrack.id);
  } catch {
    return tracks.filter((t) => t.id !== currentTrack.id);
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function toTrack(videoId: string, snippet?: VideoSnippet): Track {
  const rawTitle = snippet?.title ?? 'Untitled track';
  const clean = cleanTrackTitle(rawTitle);
  const artwork = snippet?.thumbnails?.high?.url ??
    snippet?.thumbnails?.medium?.url ??
    snippet?.thumbnails?.default?.url ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    id: videoId,
    videoId,
    title: clean.title,
    artist: snippet?.channelTitle?.replace(' - Topic', '') ?? clean.artist ?? 'YouTube Music',
    artwork,
    duration: '3:30',
    durationSeconds: 210,
  };
}

export function cleanTrackTitle(title: string): { title: string; artist?: string } {
  let cleaned = decodeHtmlEntities(title);
  cleaned = cleaned
    .replace(/\s*\((?:official|official video|official audio|lyrics?|music video|4k|hd)[^)]*\)/gi, '')
    .replace(/\s*\[(?:official|official video|official audio|lyrics?|music video|4k|hd)[^\]]*\]/gi, '')
    .replace(/\s*\|\s*(?:official|music video|lyrics?).*$/i, '')
    .trim();

  // If format is "Artist - Title"
  const splitHyphen = cleaned.split(/\s+-\s+/);
  if (splitHyphen.length === 2) {
    return {
      artist: splitHyphen[0].trim(),
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

import type { Track } from '@/data/music';

type SearchResponse = {
  items?: {
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
  }[];
  error?: { message?: string };
};

type VideoSnippet = {
  title?: string;
  channelTitle?: string;
  thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
};

type PopularResponse = {
  items?: {
    id?: string;
    snippet?: VideoSnippet;
  }[];
  error?: { message?: string };
};

function getApiKey() {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('Add EXPO_PUBLIC_YOUTUBE_API_KEY to your .env file first.');
  }
  return apiKey;
}

export async function searchYouTube(query: string): Promise<Track[]> {
  const apiKey = getApiKey();

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${query} music`,
    type: 'video',
    maxResults: '15',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    key: apiKey,
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  const data = (await response.json()) as SearchResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'YouTube search failed.');
  }

  return (data.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    if (!videoId) return [];
    return [toTrack(videoId, item.snippet)];
  });
}

export async function getPopularYouTube(): Promise<Track[]> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    part: 'snippet',
    chart: 'mostPopular',
    videoCategoryId: '10',
    regionCode: 'US',
    maxResults: '10',
    key: apiKey,
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
  const data = (await response.json()) as PopularResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Could not load popular music.');
  }

  return (data.items ?? []).flatMap((item) => item.id ? [toTrack(item.id, item.snippet)] : []);
}

function toTrack(videoId: string, snippet?: VideoSnippet): Track {
  return {
    id: videoId,
    videoId,
    title: decodeHtmlEntities(snippet?.title ?? 'Untitled video'),
    artist: snippet?.channelTitle ?? 'YouTube',
    artwork: snippet?.thumbnails?.high?.url ?? snippet?.thumbnails?.medium?.url ?? '',
    duration: '—',
  };
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

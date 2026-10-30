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

export async function searchYouTube(query: string): Promise<Track[]> {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('Add EXPO_PUBLIC_YOUTUBE_API_KEY to your .env file first.');
  }

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
    return [{
      id: videoId,
      videoId,
      title: decodeHtmlEntities(item.snippet?.title ?? 'Untitled video'),
      artist: item.snippet?.channelTitle ?? 'YouTube',
      artwork: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? '',
      duration: '—',
    }];
  });
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

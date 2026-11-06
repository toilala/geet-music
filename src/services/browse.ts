import type { Track } from '@/types/music';
import { getPopularYouTube, searchYouTube } from '@/services/youtube';

export type BrowseSection = {
  id: string;
  title: string;
  items: Track[];
  continuation?: string;
};

export type BrowsePage = {
  sections: BrowseSection[];
  continuation?: string;
};

const MOODS = [
  { id: 'mood-focus', title: 'Focus', query: 'focus music official audio' },
  { id: 'mood-chill', title: 'Chill', query: 'chill music official audio' },
  { id: 'mood-energy', title: 'Energy', query: 'energetic music official audio' },
  { id: 'mood-sleep', title: 'Sleep', query: 'sleep music official audio' },
];

const GENRES = [
  { id: 'genre-pop', title: 'Pop', query: 'pop music official audio' },
  { id: 'genre-hip-hop', title: 'Hip-Hop', query: 'hip hop music official audio' },
  { id: 'genre-rock', title: 'Rock', query: 'rock music official audio' },
  { id: 'genre-nepali', title: 'Nepali', query: 'nepali music official audio' },
];

async function section(id: string, title: string, query: string): Promise<BrowseSection> {
  return { id, title, items: await searchYouTube(query) };
}

export async function getExplorePage(): Promise<BrowsePage> {
  const [charts, newMusic] = await Promise.all([
    getPopularYouTube(),
    searchYouTube('new music official audio'),
  ]);
  return {
    sections: [
      { id: 'charts', title: 'Charts', items: charts },
      { id: 'new-releases', title: 'New releases', items: newMusic },
    ],
  };
}

export async function getChartsPage(): Promise<BrowsePage> {
  const [global, regional] = await Promise.all([
    getPopularYouTube(),
    searchYouTube('top songs Nepal trending'),
  ]);
  return {
    sections: [
      { id: 'global', title: 'Top songs', items: global },
      { id: 'regional', title: 'Regional charts', items: regional },
    ],
  };
}

export async function getMoodAndGenreSections(): Promise<BrowseSection[]> {
  return Promise.all([
    ...MOODS.map((item) => section(item.id, item.title, item.query)),
    ...GENRES.map((item) => section(item.id, item.title, item.query)),
  ]);
}


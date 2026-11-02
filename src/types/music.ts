export type Track = {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  artwork: string;
  duration: string;
  durationSeconds?: number;
  album?: string;
  year?: string;
  views?: string;
};

export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  artwork: string;
  accent: string;
  category?: string;
  tracks?: Track[];
};

export type Playlist = {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  artwork?: string;
  tracks: Track[];
  isCustom?: boolean;
};

export type MoodCategory = {
  id: string;
  label: string;
  query: string;
  icon: { ios: string; android: string; web: string };
  gradient: [string, string];
};

export type RepeatMode = 'off' | 'all' | 'one';

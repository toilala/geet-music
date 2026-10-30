export type Track = {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  artwork: string;
  duration: string;
};

export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  artwork: string;
  accent: string;
};

export const tracks: Track[] = [
  { id: 'midnight-drive', title: 'Smells Like Teen Spirit', artist: 'Nirvana', videoId: 'hTWKbfoikeg', artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=85', duration: '5:01' },
  { id: 'afterglow', title: 'Bohemian Rhapsody', artist: 'Queen', videoId: 'fJ9rUzIMcZQ', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=85', duration: '5:55' },
  { id: 'soft-static', title: 'Hello', artist: 'Adele', videoId: 'YQHsXMglC9A', artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=85', duration: '4:55' },
  { id: 'golden-hour', title: 'Despacito', artist: 'Luis Fonsi', videoId: 'kJQP7kiw5Fk', artwork: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=85', duration: '4:42' },
];

export const collections: Collection[] = [
  { id: 'daily-mix', title: 'Daily Mix 01', subtitle: 'Warm electronic textures', artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&q=85', accent: '#E2B7FF' },
  { id: 'slow-mornings', title: 'Slow mornings', subtitle: 'Gentle songs to begin again', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85', accent: '#FFC79B' },
  { id: 'deep-focus', title: 'Deep focus', subtitle: 'Instrumentals without distraction', artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=85', accent: '#A9D5FF' },
];

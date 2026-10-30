export type Track = {
  id: string;
  title: string;
  artist: string;
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
  { id: 'midnight-drive', title: 'Midnight Drive', artist: 'Geet Radio · Focus', artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=85', duration: '3:42' },
  { id: 'afterglow', title: 'Afterglow', artist: 'The Paper Kites', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=85', duration: '4:12' },
  { id: 'soft-static', title: 'Soft Static', artist: 'Tycho', artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=85', duration: '5:08' },
  { id: 'golden-hour', title: 'Golden Hour', artist: 'Kacey Musgraves', artwork: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=85', duration: '3:48' },
];

export const collections: Collection[] = [
  { id: 'daily-mix', title: 'Daily Mix 01', subtitle: 'Warm electronic textures', artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&q=85', accent: '#E2B7FF' },
  { id: 'slow-mornings', title: 'Slow mornings', subtitle: 'Gentle songs to begin again', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85', accent: '#FFC79B' },
  { id: 'deep-focus', title: 'Deep focus', subtitle: 'Instrumentals without distraction', artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=85', accent: '#A9D5FF' },
];

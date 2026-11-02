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
  { id: 'sunflower', title: 'Sunflower', artist: 'Post Malone, Swae Lee', videoId: 'ApXoWvfEYVU', artwork: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=85', duration: '2:38' },
  { id: 'levitating', title: 'Levitating', artist: 'Dua Lipa', videoId: 'TUVcZfQe-Kw', artwork: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=85', duration: '3:23' },
  { id: 'blinding-lights', title: 'Blinding Lights', artist: 'The Weeknd', videoId: '4NRXx6U8ABQ', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=85', duration: '4:21' },
  { id: 'as-it-was', title: 'As It Was', artist: 'Harry Styles', videoId: 'H5v3kku4y6Q', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=85', duration: '2:47' },
  { id: 'bad-habit', title: 'Bad Habit', artist: 'Steve Lacy', videoId: 'VF-FGf_ZZiI', artwork: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=85', duration: '3:51' },
  { id: 'ocean-eyes', title: 'Ocean Eyes', artist: 'Billie Eilish', videoId: 'viimfQi_pUw', artwork: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=600&q=85', duration: '3:21' },
  { id: 'electric-feel', title: 'Electric Feel', artist: 'MGMT', videoId: 'MmZexg8sxyk', artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=85', duration: '3:49' },
];

export const collections: Collection[] = [
  { id: 'daily-mix', title: 'Quick picks', subtitle: 'A little bit of everything', artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&q=85', accent: '#A5F2E6' },
  { id: 'slow-mornings', title: 'Slow mornings', subtitle: 'Gentle songs to begin again', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85', accent: '#FFC79B' },
  { id: 'deep-focus', title: 'Deep focus', subtitle: 'Instrumentals without distraction', artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=85', accent: '#A9D5FF' },
];

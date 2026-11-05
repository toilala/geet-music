import type { Track } from '@/types/music';

/** Portable equivalents of Echo's shared core models. */
export type CoreArtist = {
  id?: string;
  name: string;
};

export type CoreAlbum = {
  id?: string;
  title: string;
  artwork?: string;
};

export type CoreSong = {
  id: string;
  title: string;
  artists: CoreArtist[];
  album?: CoreAlbum;
  artwork?: string;
  durationSeconds?: number;
  videoId?: string;
  explicit?: boolean;
  isVideo?: boolean;
};

export type SongPlayStatsEntity = {
  trackKey: string;
  title: string;
  artist: string;
  videoId?: string;
  artworkUrl?: string;
  totalPlayTimeMs: number;
  playCount: number;
  skipCount: number;
  lastPlayedAtMillis: number;
};

export type RecommendationExclusionEntity = {
  trackKey: string;
  excludedAtMillis: number;
  trackName: string;
  artistName: string;
};

export type TasteProfileEntity = {
  id: number;
  topArtistsJson: string;
  topTracksJson: string;
  topGenresJson: string;
  confidence: number;
  updatedAtMillis: number;
};

export type TasteProfile = {
  topArtistNames: string[];
  topTrackKeys: string[];
  topGenres: string[];
  fetchedAtMillis: number;
};

export type PersistQueue = {
  title?: string;
  items: Track[];
  currentIndex: number;
  updatedAtMillis: number;
};

export type PersistPlayerState = {
  track?: Track;
  queue: Track[];
  positionSeconds: number;
  durationSeconds: number;
  playing: boolean;
  updatedAtMillis: number;
};

export type SimilarRecommendation = {
  title: string;
  artist: string;
  score?: number;
  source?: string;
};

export function trackKeyOf(title: string, artist: string): string {
  return `${title.trim()}|${artist.trim()}`.toLocaleLowerCase();
}

export function trackKey(track: Pick<Track, 'title' | 'artist'>): string {
  return trackKeyOf(track.title, track.artist);
}

export function toCoreSong(track: Track): CoreSong {
  return {
    id: track.id,
    title: track.title,
    artists: track.artist
      .split(',')
      .map((name) => ({ name: name.trim() }))
      .filter((artist) => artist.name.length > 0),
    album: track.album ? { title: track.album, artwork: track.artwork } : undefined,
    artwork: track.artwork,
    durationSeconds: track.durationSeconds,
    videoId: track.videoId,
  };
}

export function fromCoreSong(song: CoreSong): Track {
  const durationSeconds = song.durationSeconds ?? 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return {
    id: song.id,
    videoId: song.videoId ?? song.id,
    title: song.title,
    artist: song.artists.map((artist) => artist.name).join(', ') || 'Unknown artist',
    artwork: song.artwork ?? song.album?.artwork ?? `https://i.ytimg.com/vi/${song.videoId ?? song.id}/hqdefault.jpg`,
    duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
    durationSeconds: durationSeconds || undefined,
    album: song.album?.title,
  };
}

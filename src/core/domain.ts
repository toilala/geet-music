import type { Playlist } from '@/types/music';
import type { CoreAlbum, CoreArtist, CoreSong, RecommendationExclusionEntity, SongPlayStatsEntity, TasteProfileEntity } from '@/core/types';

/** Domain/entity names mirrored from Echo's :core module, represented as serializable TS data. */
export type Album = CoreAlbum;
export type Artist = CoreArtist;
export type Song = CoreSong;
export type AlbumEntity = CoreAlbum & { id: string };
export type AlbumWithSongs = AlbumEntity & { songs: Song[] };
export type ArtistEntity = CoreArtist & { id: string };
export type BeatInfoEntity = { songId: string; bpm?: number; energy?: number; updatedAt: number };
export type Event = { id: string; type: string; createdAt: number; songId?: string };
export type EventWithSong = Event & { song?: Song };
export type FormatEntity = { songId: string; mimeType: string; bitrate?: number; sampleRate?: number };
export type LocalItem = { id: string; path: string; title?: string; artist?: string; durationSeconds?: number };
export type LyricsEntity = { songId: string; source: string; content: string; synced: boolean; updatedAt: number };
export type MetadataExtensions = { songId: string; key: string; value: string };
export type PlayCountEntity = { songId: string; count: number; updatedAt: number };
export type PlaylistEntity = Playlist & { browseId?: string; isLocal?: boolean; isEditable?: boolean };
export type PlaylistSong = { playlistId: string; songId: string; position: number; song: Song };
export type PlaylistSongMap = { playlistId: string; songId: string; position: number };
export type RecognitionHistory = { id: string; title: string; artist: string; videoId?: string; artwork?: string; createdAt: number };
export type RelatedSongMap = { sourceSongId: string; relatedSongId: string; score?: number; updatedAt: number };
export type SearchHistory = { query: string; searchedAt: number };
export type SetVideoIdEntity = { songId: string; videoId: string };
export type SongEntity = CoreSong & { createdAt?: number };
export type SongAlbumMap = { songId: string; albumId: string };
export type SongArtistMap = { songId: string; artistId: string; position: number };
export type SongWithStats = { song: Song; stats: SongPlayStatsEntity };
export type SortedSongAlbumMap = SongAlbumMap & { position: number };
export type SortedSongArtistMap = SongArtistMap;
export type SpeedDialItem = { id: string; title: string; query?: string; position: number };
export type TasteProfileEntityModel = TasteProfileEntity;
export type RecommendationExclusion = RecommendationExclusionEntity;
export type SponsorBlockSegment = { category: string; start: number; end: number; uuid?: string };


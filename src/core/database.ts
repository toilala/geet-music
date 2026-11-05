import { readLibrarySnapshot } from '@/services/library-repository';
import { echoCoreStore } from '@/core/repositories';
import { trackKeyOf, toCoreSong, type CoreSong, type SongPlayStatsEntity } from '@/core/types';
import type { Playlist, Track } from '@/types/music';

/** AsyncStorage-backed replacement for Echo's Room MusicDatabase/DatabaseDao surface. */
export class EchoDatabase {
  async likedSongs(): Promise<CoreSong[]> {
    const library = await readLibrarySnapshot();
    return library.likedTracks.map(toCoreSong);
  }

  async playlists(): Promise<Playlist[]> {
    return (await readLibrarySnapshot()).playlists;
  }

  async searchPlaylists(query: string): Promise<Playlist[]> {
    const normalized = query.toLowerCase();
    return (await this.playlists()).filter((playlist) => playlist.title.toLowerCase().includes(normalized));
  }

  async recentSongs(limit = 30): Promise<Track[]> {
    return (await readLibrarySnapshot()).history.slice(0, limit);
  }

  async quickPicks(limit = 50): Promise<Track[]> {
    const stats = await echoCoreStore.songPlayStats.topPlayed(limit);
    return stats.flatMap((item) => item.videoId ? [this.statsToTrack(item)] : []);
  }

  async songPlayStats(limit = 100): Promise<SongPlayStatsEntity[]> {
    return echoCoreStore.songPlayStats.topPlayed(limit);
  }

  async exclusions(): Promise<string[]> {
    return (await echoCoreStore.recommendationExclusions.getAll()).map((item) => item.trackKey);
  }

  async hiddenFromQuickPicksSongIds(): Promise<Set<string>> { return new Set(); }

  async clearPlaylist(playlistId: string): Promise<void> {
    const library = await readLibrarySnapshot();
    const { writeLibraryValue } = await import('@/services/library-repository');
    await writeLibraryValue('playlists', library.playlists.filter((playlist) => playlist.id !== playlistId));
  }

  private statsToTrack(stats: SongPlayStatsEntity): Track {
    return { id: stats.videoId!, videoId: stats.videoId!, title: stats.title, artist: stats.artist, artwork: stats.artworkUrl ?? '', duration: '0:00' };
  }
}

export const echoDatabase = new EchoDatabase();

export function trackFromCoreSong(song: CoreSong): Track {
  const artist = song.artists.map((item) => item.name).join(', ');
  return { id: song.id, videoId: song.videoId ?? song.id, title: song.title, artist, artwork: song.artwork ?? '', duration: `${Math.floor((song.durationSeconds ?? 0) / 60)}:${String((song.durationSeconds ?? 0) % 60).padStart(2, '0')}` };
}

export function trackKeyForSong(song: CoreSong): string { return trackKeyOf(song.title, song.artists.map((artist) => artist.name).join(', ')); }

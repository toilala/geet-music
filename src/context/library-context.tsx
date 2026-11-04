import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Vibration } from 'react-native';

import type { Playlist, Track } from '@/data/music';
import { readLibrarySnapshot, writeLibraryValue } from '@/services/library-repository';

type LibraryContextValue = {
  likedTracks: Track[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  playlists: Playlist[];
  createPlaylist: (title: string, description?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, track: Track) => boolean;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  history: Track[];
  addToHistory: (track: Track) => void;
  clearHistory: () => void;
  searchHistory: string[];
  addSearchTerm: (term: string) => void;
  removeSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'Nirvana',
    'The Weeknd',
    'Lofi study beats',
    'Adele',
  ]);


  useEffect(() => {
    let mounted = true;
    void readLibrarySnapshot().then(({ likedTracks, playlists, history, searchHistory }) => {
      if (!mounted) return;
      setLikedTracks(likedTracks);
      setPlaylists(playlists);
      setHistory(history);
      if (searchHistory.length > 0) setSearchHistory(searchHistory);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isLiked = useCallback(
    (trackId: string) => likedTracks.some((item) => item.id === trackId),
    [likedTracks]
  );

  const toggleLike = useCallback((track: Track) => {
    try {
      Vibration.vibrate(12);
    } catch {

    }
    setLikedTracks((current) => {
      const exists = current.some((item) => item.id === track.id);
      const updated = exists ? current.filter((item) => item.id !== track.id) : [track, ...current];
      void writeLibraryValue('likedTracks', updated);
      return updated;
    });
  }, []);

  const createPlaylist = useCallback((title: string, description?: string) => {
    try {
      Vibration.vibrate(10);
    } catch {

    }
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      title: title.trim() || 'My Playlist',
      description: description?.trim() || '',
      createdAt: Date.now(),
      tracks: [],
      isCustom: true,
    };
    setPlaylists((current) => {
      const updated = [newPlaylist, ...current];
      void writeLibraryValue('playlists', updated);
      return updated;
    });
    return newPlaylist;
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    let added = false;
    try {
      Vibration.vibrate(10);
    } catch {

    }
    setPlaylists((current) => {
      const updated = current.map((pl) => {
        if (pl.id === playlistId) {
          if (!pl.tracks.some((t) => t.id === track.id)) {
            added = true;
            return {
              ...pl,
              artwork: pl.artwork || track.artwork,
              tracks: [track, ...pl.tracks],
            };
          }
        }
        return pl;
      });
      void writeLibraryValue('playlists', updated);
      return updated;
    });
    return added;
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((current) => {
      const updated = current.map((pl) => {
        if (pl.id === playlistId) {
          const newTracks = pl.tracks.filter((t) => t.id !== trackId);
          return {
            ...pl,
            artwork: newTracks[0]?.artwork,
            tracks: newTracks,
          };
        }
        return pl;
      });
      void writeLibraryValue('playlists', updated);
      return updated;
    });
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    try {
      Vibration.vibrate(15);
    } catch {

    }
    setPlaylists((current) => {
      const updated = current.filter((pl) => pl.id !== playlistId);
      void writeLibraryValue('playlists', updated);
      return updated;
    });
  }, []);

  const addToHistory = useCallback((track: Track) => {
    setHistory((current) => {
      const filtered = current.filter((item) => item.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50);
      void writeLibraryValue('history', updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    void writeLibraryValue('history', []);
  }, []);

  const addSearchTerm = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((current) => {
      const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 15);
      void writeLibraryValue('searchHistory', updated);
      return updated;
    });
  }, []);

  const removeSearchTerm = useCallback((term: string) => {
    setSearchHistory((current) => {
      const updated = current.filter((item) => item !== term);
      void writeLibraryValue('searchHistory', updated);
      return updated;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    void writeLibraryValue('searchHistory', []);
  }, []);

  const value = useMemo(
    () => ({
      likedTracks,
      isLiked,
      toggleLike,
      playlists,
      createPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      deletePlaylist,
      history,
      addToHistory,
      clearHistory,
      searchHistory,
      addSearchTerm,
      removeSearchTerm,
      clearSearchHistory,
    }),
    [
      likedTracks,
      isLiked,
      toggleLike,
      playlists,
      createPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      deletePlaylist,
      history,
      addToHistory,
      clearHistory,
      searchHistory,
      addSearchTerm,
      removeSearchTerm,
      clearSearchHistory,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}

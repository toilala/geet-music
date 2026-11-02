import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Vibration } from 'react-native';

import type { Playlist, Track } from '@/data/music';

const LIKED_KEY = '@geet/liked-tracks-v2';
const PLAYLISTS_KEY = '@geet/playlists-v2';
const HISTORY_KEY = '@geet/history-v2';
const SEARCH_HISTORY_KEY = '@geet/search-history-v2';

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

  // Load from AsyncStorage
  useEffect(() => {
    let mounted = true;
    void Promise.all([
      AsyncStorage.getItem(LIKED_KEY),
      AsyncStorage.getItem(PLAYLISTS_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(SEARCH_HISTORY_KEY),
    ]).then(([likedRaw, playlistsRaw, historyRaw, searchRaw]) => {
      if (!mounted) return;
      if (likedRaw) {
        try {
          setLikedTracks(JSON.parse(likedRaw));
        } catch {
          // ignore corrupted data
        }
      }
      if (playlistsRaw) {
        try {
          setPlaylists(JSON.parse(playlistsRaw));
        } catch {
          // ignore
        }
      }
      if (historyRaw) {
        try {
          setHistory(JSON.parse(historyRaw));
        } catch {
          // ignore
        }
      }
      if (searchRaw) {
        try {
          setSearchHistory(JSON.parse(searchRaw));
        } catch {
          // ignore
        }
      }
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
      // Haptics fallback
    }
    setLikedTracks((current) => {
      const exists = current.some((item) => item.id === track.id);
      const updated = exists ? current.filter((item) => item.id !== track.id) : [track, ...current];
      void AsyncStorage.setItem(LIKED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const createPlaylist = useCallback((title: string, description?: string) => {
    try {
      Vibration.vibrate(10);
    } catch {
      // fallback
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
      void AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      return updated;
    });
    return newPlaylist;
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    let added = false;
    try {
      Vibration.vibrate(10);
    } catch {
      // fallback
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
      void AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
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
      void AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    try {
      Vibration.vibrate(15);
    } catch {
      // fallback
    }
    setPlaylists((current) => {
      const updated = current.filter((pl) => pl.id !== playlistId);
      void AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToHistory = useCallback((track: Track) => {
    setHistory((current) => {
      const filtered = current.filter((item) => item.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50);
      void AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    void AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  const addSearchTerm = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((current) => {
      const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 15);
      void AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeSearchTerm = useCallback((term: string) => {
    setSearchHistory((current) => {
      const updated = current.filter((item) => item !== term);
      void AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    void AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
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

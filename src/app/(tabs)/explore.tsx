import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistSheet } from '@/components/music/add-to-playlist-sheet';
import { MiniPlayer } from '@/components/music/mini-player';
import { SongRow } from '@/components/music/song-row';
import { TrackOptionsSheet } from '@/components/music/track-options-sheet';
import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import { tracks, type Track } from '@/data/music';
import { getPopularYouTube, getSearchSuggestions, searchYouTube } from '@/services/youtube';

const colors = Colors.dark;

const EXPLORE_GENRES = [
  { id: 'pop', title: 'Pop Hits', query: 'top pop hits music', color: '#1A4D46', icon: 'sparkles' },
  { id: 'hiphop', title: 'Hip-Hop & Rap', query: 'hip hop rap hits', color: '#4E2C17', icon: 'flame.fill' },
  { id: 'rock', title: 'Rock & Alt', query: 'rock alternative hits', color: '#273842', icon: 'guitars.fill' },
  { id: 'lofi', title: 'Lofi & Chill', query: 'lofi chill study beats', color: '#233F3A', icon: 'leaf.fill' },
  { id: 'edm', title: 'EDM & Dance', query: 'electronic dance music', color: '#43224E', icon: 'bolt.fill' },
  { id: 'rnb', title: 'R&B / Soul', query: 'r&b soul smooth music', color: '#562334', icon: 'heart.fill' },
  { id: 'indie', title: 'Indie Vibes', query: 'indie bedroom pop', color: '#1E3C4E', icon: 'music.note' },
  { id: 'workout', title: 'Workout Energy', query: 'workout bass motivation music', color: '#5A1B1B', icon: 'bolt.heart.fill' },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { activeTrack, currentTime, duration, playing, selectTrack, setPlaying, togglePlayback, playNext } =
    usePlayer();
  const { addToHistory, searchHistory, addSearchTerm, removeSearchTerm } = useLibrary();

  const [query, setQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);

  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    let mounted = true;
    void getPopularYouTube().then((popular) => {
      if (mounted && popular.length > 0) {
        setResults(popular);
      } else if (mounted) {
        setResults(tracks);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim() || query.trim() === activeSearch) {
        setSuggestions([]);
      } else {
        void getSearchSuggestions(query).then(setSuggestions);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, activeSearch]);

  const executeSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    Keyboard.dismiss();
    setQuery(term);
    setActiveSearch(term);
    setSuggestions([]);
    addSearchTerm(term);
    setLoading(true);
    setError('');

    try {
      const data = await searchYouTube(term);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Showing offline picks.');
      setResults(tracks);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setActiveSearch('');
    setSuggestions([]);
    setError('');
    void getPopularYouTube().then((popular) => setResults(popular.length > 0 ? popular : tracks));
  };

  const handlePlayTrack = (track: Track) => {
    addToHistory(track);
    selectTrack(track, results);
    setPlaying(true);
    router.push({
      pathname: '/player/[id]',
      params: {
        id: track.id,
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
      },
    });
  };

  const openOptions = (track: Track) => {
    setOptionsTrack(track);
    optionsSheetRef.current?.present();
  };

  const openAddToPlaylist = (track: Track) => {
    setPlaylistTrack(track);
    playlistSheetRef.current?.present();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Beautiful Material Expressive / Liquid Glass Search Bar */}
        <View style={styles.searchBar}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={colors.primary}
            size={20}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => executeSearch(query)}
            placeholder="Tracks, artists, albums..."
            placeholderTextColor="#7C8D89"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={clearSearch} hitSlop={12} style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor="#9EAAA6"
                size={18}
              />
            </Pressable>
          ) : (
            <Pressable onPress={() => executeSearch('top trending songs')} hitSlop={12} style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                tintColor={colors.primary}
                size={18}
              />
            </Pressable>
          )}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => executeSearch(suggestion)}
                style={({ pressed }) => [styles.suggestionItem, pressed && styles.pressed]}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  tintColor={colors.textSecondary}
                  size={16}
                />
                <Text numberOfLines={1} style={styles.suggestionText}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Recent Searches */}
        {searchHistory.length > 0 && !activeSearch && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyChips}>
              {searchHistory.map((term) => (
                <View key={term} style={styles.historyChip}>
                  <Pressable onPress={() => executeSearch(term)} style={styles.chipPress}>
                    <SymbolView
                      name={{ ios: 'clock', android: 'history', web: 'history' }}
                      tintColor={colors.textSecondary}
                      size={13}
                    />
                    <Text style={styles.chipText}>{term}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeSearchTerm(term)} hitSlop={8} style={styles.chipRemove}>
                    <SymbolView
                      name={{ ios: 'xmark', android: 'close', web: 'close' }}
                      tintColor={colors.textSecondary}
                      size={12}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Browse Categories Grid */}
        {!activeSearch && (
          <View style={styles.genresSection}>
            <Text style={styles.sectionTitle}>Browse All</Text>
            <View style={styles.genresGrid}>
              {EXPLORE_GENRES.map((genre) => (
                <Pressable
                  key={genre.id}
                  onPress={() => executeSearch(genre.query)}
                  style={({ pressed }) => [
                    styles.genreCard,
                    { backgroundColor: genre.color },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.genreTitle}>{genre.title}</Text>
                  <View style={styles.genreIconWrap}>
                    <SymbolView
                      name={{ ios: genre.icon as any, android: 'music_note', web: 'music_note' }}
                      tintColor="rgba(255, 255, 255, 0.85)"
                      size={20}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {activeSearch ? `Results for "${activeSearch}"` : 'Top Picks'}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loaderText}>Searching...</Text>
          </View>
        ) : (
          <View style={styles.resultsCardContainer}>
            {results.map((track) => (
              <SongRow
                key={track.id}
                track={track}
                active={track.id === activeTrack.id && playing}
                onPress={() => handlePlayTrack(track)}
                onOptionsPress={openOptions}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Mini Player */}
      <View style={[styles.playerDock, { bottom: insets.bottom + 72 }]}>
        <MiniPlayer
          track={activeTrack}
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          onToggle={togglePlayback}
          onNext={playNext}
          onOpen={() =>
            router.push({
              pathname: '/player/[id]',
              params: {
                id: activeTrack.id,
                videoId: activeTrack.videoId,
                title: activeTrack.title,
                artist: activeTrack.artist,
                artwork: activeTrack.artwork,
                duration: activeTrack.duration,
              },
            })
          }
        />
      </View>

      <TrackOptionsSheet
        ref={optionsSheetRef}
        track={optionsTrack}
        onOpenPlaylistModal={openAddToPlaylist}
      />

      <AddToPlaylistSheet ref={playlistSheetRef} track={playlistTrack} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D1110',
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  iconBtn: {
    padding: 6,
  },
  suggestionsBox: {
    backgroundColor: '#161B19',
    borderRadius: 20,
    padding: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  suggestionText: {
    color: '#E8F0EC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  historySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  historyChips: {
    gap: 8,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    color: '#DEE5E2',
    fontSize: 13,
    fontWeight: '600',
  },
  chipRemove: {
    padding: 4,
    marginLeft: 4,
  },
  genresSection: {
    marginBottom: 24,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreCard: {
    width: '48%',
    height: 72,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  genreIconWrap: {
    alignSelf: 'flex-end',
  },
  resultsHeader: {
    marginBottom: 12,
    marginTop: 6,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: '#30181A',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  errorText: {
    color: '#FFB4AB',
    fontSize: 13,
  },
  resultsCardContainer: {
    backgroundColor: '#151A18',
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  playerDock: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 900,
  },
  pressed: {
    opacity: 0.8,
  },
});

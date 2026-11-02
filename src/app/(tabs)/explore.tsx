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
  { id: 'pop', title: 'Pop Hits', query: 'top pop hits music 2026', color: '#176B63', icon: 'sparkles' },
  { id: 'hiphop', title: 'Hip-Hop & Rap', query: 'hip hop rap bangers', color: '#8F3900', icon: 'flame.fill' },
  { id: 'rock', title: 'Rock & Alt', query: 'rock alternative classics hits', color: '#3A5260', icon: 'guitars.fill' },
  { id: 'lofi', title: 'Lofi & Chill', query: 'lofi chill study beats', color: '#3E5C56', icon: 'leaf.fill' },
  { id: 'edm', title: 'EDM & Dance', query: 'dance electronic festival bangers', color: '#682D78', icon: 'bolt.fill' },
  { id: 'rnb', title: 'R&B / Soul', query: 'r&b soul smooth music', color: '#7E384D', icon: 'heart.fill' },
  { id: 'indie', title: 'Indie Vibes', query: 'indie bedroom pop aesthetic', color: '#2C5572', icon: 'music.note' },
  { id: 'desi', title: 'Bollywood & Desi', query: 'bollywood top romantic hits', color: '#9E3C1B', icon: 'music.quarternote.3' },
  { id: 'workout', title: 'Workout Power', query: 'gym workout bass motivation music', color: '#9E2424', icon: 'bolt.heart.fill' },
  { id: 'focus', title: 'Deep Focus', query: 'focus ambient instrumental study', color: '#274457', icon: 'brain.head.profile' },
  { id: 'acoustic', title: 'Acoustic Morning', query: 'acoustic guitar chill peaceful', color: '#6E5536', icon: 'sun.max.fill' },
  { id: 'retro', title: '80s & Synthwave', query: 'synthwave retro 80s outrun', color: '#562569', icon: 'moon.stars.fill' },
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

  // Load trending starter results
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

  // Fetch live suggestions on typing
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SEARCH & EXPLORE</Text>
          <Text style={styles.title}>Find what you love</Text>
        </View>

        {/* Material 3 Search Bar */}
        <View style={styles.searchBar}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={colors.textSecondary}
            size={20}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => executeSearch(query)}
            placeholder="Songs, artists, podcasts"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={10} style={styles.clearBtn}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor={colors.textSecondary}
                size={18}
              />
            </Pressable>
          )}
          <Pressable
            disabled={!query.trim()}
            onPress={() => executeSearch(query)}
            style={({ pressed }) => [styles.submitBtn, !query.trim() && styles.disabled, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
              tintColor={colors.onPrimary}
              size={16}
            />
          </Pressable>
        </View>

        {/* Live Suggestions Dropdown */}
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

        {/* Recent Search History Chips */}
        {searchHistory.length > 0 && !activeSearch && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyChips}>
              {searchHistory.map((term) => (
                <View key={term} style={styles.historyChip}>
                  <Pressable onPress={() => executeSearch(term)} style={styles.chipPress}>
                    <SymbolView
                      name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
                      tintColor={colors.textSecondary}
                      size={14}
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

        {/* Explore Genres & Moods Grid (when not actively searching) */}
        {!activeSearch && (
          <View style={styles.genresSection}>
            <Text style={styles.sectionTitle}>Browse categories</Text>
            <Text style={styles.sectionSubtitle}>Explore genres and popular moods</Text>
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
                      size={22}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>
              {activeSearch ? `Results for "${activeSearch}"` : 'Trending on YouTube Music'}
            </Text>
            <Text style={styles.resultsSubtitle}>
              {loading ? 'Searching songs...' : `${results.length} songs available`}
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Results or Loading */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loaderText}>Finding music for you...</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
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

      {/* Floating MiniPlayer */}
      <View style={[styles.playerDock, { bottom: insets.bottom + 65 }]}>
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

      {/* Track Options Sheet */}
      <TrackOptionsSheet
        ref={optionsSheetRef}
        track={optionsTrack}
        onOpenPlaylistModal={openAddToPlaylist}
      />

      {/* Add To Playlist Sheet */}
      <AddToPlaylistSheet ref={playlistSheetRef} track={playlistTrack} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  clearBtn: {
    padding: 6,
  },
  submitBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  suggestionsBox: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 20,
    padding: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  historySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  historyChips: {
    gap: 8,
    paddingVertical: 10,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  chipPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    color: colors.text,
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
    marginTop: 10,
  },
  genreCard: {
    width: '48%',
    height: 84,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
  },
  genreTitle: {
    color: '#FFF',
    fontSize: 15,
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
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  resultsSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
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
  resultsList: {
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
    left: 12,
    right: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
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
import type { Track } from '@/data/music';
import { searchYouTube } from '@/services/youtube';

const colors = Colors.dark;

// Real Apple Music Top 100 entries matching Echo Music Screenshots 2 & 3
const APPLE_MUSIC_TOP_100: Track[] = [
  {
    id: 'choosin-texas',
    title: "Choosin' Texas",
    artist: 'Ella Langley · 833k plays',
    videoId: 'c_K7U9k-688',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=85',
    duration: '3:15',
    durationSeconds: 195,
  },
  {
    id: 'housewife',
    title: 'Housewife',
    artist: 'Tate McRae · 625k plays',
    videoId: '0mHkQcZpE_U',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=85',
    duration: '2:58',
    durationSeconds: 178,
  },
  {
    id: 'bby-wow',
    title: 'BbY WOW',
    artist: 'KAROL G, Judeline & rusowsky · 500k plays',
    videoId: 'k1Z5Zp5M3wE',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=85',
    duration: '3:32',
    durationSeconds: 212,
  },
  {
    id: 'janice-stfu',
    title: 'Janice STFU',
    artist: 'Drake · 416k plays',
    videoId: 'd9s8A5R1pQo',
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&q=85',
    duration: '3:45',
    durationSeconds: 225,
  },
  {
    id: 'solar-eclipse',
    title: 'Solar Eclipse',
    artist: 'Drake & Don Toliver · 357k plays',
    videoId: 'zXo_R3XwR_8',
    artwork: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=85',
    duration: '4:10',
    durationSeconds: 250,
  },
];

// Trending Artists matching Echo Music Screenshot 3
const TRENDING_ARTISTS = [
  { id: '1', name: 'Drake', plays: '1.7M plays', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&q=80' },
  { id: '2', name: 'Morgan Wallen', plays: '1.5M plays', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80' },
  { id: '3', name: 'Lil Baby', plays: '1.4M plays', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80' },
];

// Trending Albums matching Echo Music Screenshot 3
const TRENDING_ALBUMS = [
  { id: '1', title: 'BETTER OVER TI...', artist: 'BigXthaPlug', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80' },
  { id: '2', title: 'HABIBTI (FOMO)', artist: 'Drake', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80' },
  { id: '3', title: 'you seem pretty s...', artist: 'Olivia Rodrigo', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80' },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeTrack,
    currentTime,
    duration,
    playing,
    selectTrack,
    setPlaying,
    togglePlayback,
    playNext,
    isDockCollapsed,
    setIsDockCollapsed,
  } = usePlayer();
  const { addToHistory } = useLibrary();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);

  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);

  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      void searchYouTube(trimmed).then((res) => {
        setResults(res);
        setLoading(false);
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePlayTrack = (track: Track, queueList?: Track[]) => {
    addToHistory(track);
    selectTrack(track, queueList || APPLE_MUSIC_TOP_100);
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
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 140 },
        ]}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (y > 60 && !isDockCollapsed) {
            setIsDockCollapsed(true);
          } else if (y <= 20 && isDockCollapsed) {
            setIsDockCollapsed(false);
          }
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Search Bar matching Echo Music Screenshot 2 */}
        <View style={styles.searchBar}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor="#8FA09B"
            size={20}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search library..."
            placeholderTextColor="#7C8D89"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={12} style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor="#9EAAA6"
                size={18}
              />
            </Pressable>
          ) : (
            <Pressable style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }}
                tintColor="#FFFFFF"
                size={20}
              />
            </Pressable>
          )}
        </View>

        {query.trim().length > 0 ? (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {loading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loaderText}>Searching music...</Text>
              </View>
            ) : (
              <View style={styles.cardContainer}>
                {results.map((track) => (
                  <SongRow
                    key={track.id}
                    track={track}
                    active={track.id === activeTrack.id && playing}
                    onPress={() => handlePlayTrack(track, results)}
                    onOptionsPress={openOptions}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Apple Music Top 100 Section matching Echo Music Screenshot 2 */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Apple Music Top 100</Text>
              <Text style={styles.chartSubtitle}>System Default</Text>

              {/* Grouped rounded chart container */}
              <View style={styles.chartCardContainer}>
                {APPLE_MUSIC_TOP_100.map((item, index) => (
                  <SongRow
                    key={item.id}
                    track={item}
                    rank={index + 1}
                    active={item.id === activeTrack.id && playing}
                    onPress={() => handlePlayTrack(item, APPLE_MUSIC_TOP_100)}
                    onOptionsPress={openOptions}
                  />
                ))}
              </View>

              {/* Pagination Capsule: < 1 of 6 > matching Screenshot 2 */}
              <View style={styles.paginationRow}>
                <Pressable
                  onPress={() => setPageIndex((p) => Math.max(1, p - 1))}
                  style={styles.pageBtn}>
                  <SymbolView
                    name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
                </Pressable>
                <Text style={styles.pageText}>{pageIndex} of 6</Text>
                <Pressable
                  onPress={() => setPageIndex((p) => Math.min(6, p + 1))}
                  style={styles.pageBtn}>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
                </Pressable>
              </View>
            </View>

            {/* Trending Artists Section matching Screenshot 2 & 3 */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Trending Artists</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {TRENDING_ARTISTS.map((artist) => (
                  <Pressable
                    key={artist.id}
                    onPress={() => setQuery(artist.name)}
                    style={styles.artistCard}>
                    <View style={styles.artistImageContainer}>
                      <Image source={artist.image} style={styles.artistImage} />
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankBadgeText}>{artist.id}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.artistName}>
                      {artist.name}
                    </Text>
                    <Text style={styles.artistPlays}>{artist.plays}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Trending Albums Section matching Screenshot 3 */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Trending Albums</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {TRENDING_ALBUMS.map((album) => (
                  <Pressable
                    key={album.id}
                    onPress={() => setQuery(album.title)}
                    style={styles.albumCard}>
                    <View style={styles.albumImageContainer}>
                      <Image source={album.image} style={styles.albumImage} />
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankBadgeText}>{album.id}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.albumTitle}>
                      {album.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.albumArtist}>
                      {album.artist}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Trending Music Videos Section matching Screenshot 3 */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Trending Music Videos</Text>
                <Text style={styles.moreLink}>More</Text>
              </View>

              <Pressable
                onPress={() => handlePlayTrack(APPLE_MUSIC_TOP_100[3])}
                style={styles.videoCard}>
                <Image
                  source="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=85"
                  style={styles.videoImage}
                />
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoTitle}>Slap The City</Text>
                  <Text style={styles.videoArtist}>Drake & Qendresa</Text>
                </View>
              </Pressable>
            </View>

            {/* Footer Attribution matching Screenshot 3 */}
            <View style={styles.footerAttr}>
              <Text style={styles.footerAttrText}>Data from Apple Music</Text>
              <Text style={styles.footerBrandText}>echo-music</Text>
            </View>
          </>
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
    backgroundColor: '#0D0B0A',
  },
  content: {
    paddingHorizontal: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1918',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
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
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  chartSubtitle: {
    color: '#9E938F',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  chartCardContainer: {
    backgroundColor: '#1E1918',
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#1E1918',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 16,
    marginTop: 14,
  },
  pageBtn: {
    padding: 4,
  },
  pageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionWrap: {
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  moreLink: {
    color: '#9E938F',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalRow: {
    gap: 14,
  },
  artistCard: {
    width: 124,
    alignItems: 'center',
    gap: 4,
  },
  artistImageContainer: {
    width: 124,
    height: 124,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1918',
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#0D0B0A',
    fontSize: 11,
    fontWeight: '900',
  },
  artistName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  artistPlays: {
    color: '#9E938F',
    fontSize: 12,
  },
  albumCard: {
    width: 130,
    gap: 4,
  },
  albumImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1918',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 4,
  },
  albumArtist: {
    color: '#9E938F',
    fontSize: 12,
  },
  videoCard: {
    width: '100%',
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1918',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: 2,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  videoArtist: {
    color: '#A39893',
    fontSize: 13,
  },
  footerAttr: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 2,
  },
  footerAttrText: {
    color: '#6E6460',
    fontSize: 12,
    fontWeight: '600',
  },
  footerBrandText: {
    color: '#6E6460',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsSection: {
    marginTop: 10,
    gap: 12,
  },
  cardContainer: {
    backgroundColor: '#1E1918',
    borderRadius: 24,
    padding: 6,
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
});

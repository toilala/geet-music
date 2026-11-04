import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistSheet } from '@/components/music/add-to-playlist-sheet';
import { AlbumCard } from '@/components/music/album-card';
import { ExpressiveHeader } from '@/components/music/expressive-header';
import { HeroCarousel } from '@/components/music/hero-carousel';
import { MiniPlayer } from '@/components/music/mini-player';
import { MoodPills } from '@/components/music/mood-pills';
import { SongRow } from '@/components/music/song-row';
import { TrackOptionsSheet } from '@/components/music/track-options-sheet';
import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import { collections, moodCategories, tracks, type MoodCategory, type Track } from '@/data/music';
import { getMusicByMood, getPopularYouTube } from '@/services/youtube';

const colors = Colors.dark;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { activeTrack, currentTime, duration, playing, selectTrack, setPlaying, togglePlayback, playNext } =
    usePlayer();
  const { addToHistory, history } = useLibrary();

  const [selectedMood, setSelectedMood] = useState<MoodCategory>(moodCategories[0]);
  const [homeTracks, setHomeTracks] = useState<Track[]>(tracks);
  const [moodTracks, setMoodTracks] = useState<Track[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);

  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    let mounted = true;
    void getPopularYouTube()
      .then((popular) => {
        if (mounted && popular.length > 0) {
          const merged = [...popular, ...tracks].filter(
            (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
          );
          setHomeTracks(merged);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedMood.id === 'all') return;
    let mounted = true;
    void getMusicByMood(selectedMood.query)
      .then((res) => {
        if (mounted) {
          setMoodTracks(res);
        }
      })
      .catch(() => {
        if (mounted) setMoodTracks(tracks);
      })
      .finally(() => {
        if (mounted) setLoadingMood(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedMood]);

  const handleSelectMood = (mood: MoodCategory) => {
    setSelectedMood(mood);
    if (mood.id !== 'all') {
      setLoadingMood(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const pop = await getPopularYouTube();
      if (pop.length > 0) {
        setHomeTracks(pop);
      }
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlayTrack = (track: Track, queueList?: Track[]) => {
    addToHistory(track);
    selectTrack(track, queueList || homeTracks);
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

  const listenAgainTracks = history.length > 0 ? history.slice(0, 6) : homeTracks.slice(0, 6);
  const newReleases = homeTracks.slice(6, 14);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {/* Expressive Header without logo icon, creative typography */}
        <ExpressiveHeader />

        {/* Mood Filter Pills matching Echo Music */}
        <MoodPills selectedMoodId={selectedMood.id} onSelectMood={handleSelectMood} />

        {selectedMood.id !== 'all' ? (
          <View style={styles.moodSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{selectedMood.label} Mix</Text>
                <Text style={styles.sectionSubtitle}>Handpicked tracks for your mood</Text>
              </View>
            </View>

            {loadingMood ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loaderText}>Finding {selectedMood.label} tracks...</Text>
              </View>
            ) : (
              <View style={styles.cardContainer}>
                {moodTracks.map((track) => (
                  <SongRow
                    key={track.id}
                    track={track}
                    active={track.id === activeTrack.id && playing}
                    onPress={() => handlePlayTrack(track, moodTracks)}
                    onOptionsPress={openOptions}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Hero Carousel with Lyrics & Featured Artwork matching Echo Music */}
            <HeroCarousel tracks={homeTracks} onPlayTrack={(t) => handlePlayTrack(t, homeTracks)} />

            {/* "N K / LISTEN AGAIN" Section matching Echo Music Screenshots 1 & 2 */}
            <View style={styles.sectionWrap}>
              <View style={styles.listenAgainHeader}>
                <View style={styles.userSectionTitleGroup}>
                  <Image
                    source="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&q=80"
                    style={styles.listenAgainAvatar}
                  />
                  <View>
                    <Text style={styles.userHandle}>N K</Text>
                    <Text style={styles.listenAgainTitle}>LISTEN AGAIN</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handlePlayTrack(listenAgainTracks[0], listenAgainTracks)}
                  style={({ pressed }) => [styles.playAllBtn, pressed && styles.pressed]}>
                  <Text style={styles.playAllText}>Play all</Text>
                </Pressable>
              </View>

              {/* Grouped rounded container for song rows */}
              <View style={styles.cardContainer}>
                {listenAgainTracks.map((track) => (
                  <SongRow
                    key={track.id}
                    track={track}
                    active={track.id === activeTrack.id && playing}
                    onPress={() => handlePlayTrack(track, listenAgainTracks)}
                    onOptionsPress={openOptions}
                  />
                ))}
              </View>
            </View>

            {/* "NEW RELEASES" Section matching Echo Music Screenshot 2 */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Text style={styles.newReleasesTitle}>NEW RELEASES</Text>
                <SymbolView
                  name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                  tintColor={colors.textSecondary}
                  size={18}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {newReleases.map((track) => (
                  <AlbumCard
                    key={track.id}
                    collection={{
                      id: track.id,
                      title: track.title,
                      subtitle: track.artist,
                      artwork: track.artwork,
                      accent: colors.primary,
                      category: 'New Release',
                    }}
                    onPress={() => handlePlayTrack(track, newReleases)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Mixed for You */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mixed for you</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {collections.map((collection, idx) => (
                  <AlbumCard
                    key={collection.id}
                    collection={collection}
                    onPress={() => handlePlayTrack(homeTracks[idx % homeTracks.length])}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Mini Player positioned above floating bottom tabs */}
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
  content: {},
  sectionWrap: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  listenAgainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userSectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listenAgainAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userHandle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  listenAgainTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  playAllBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardContainer: {
    backgroundColor: '#151A18',
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newReleasesTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  horizontalRow: {
    gap: 14,
    paddingBottom: 10,
  },
  moodSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
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

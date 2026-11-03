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
import { MiniPlayer } from '@/components/music/mini-player';
import { MoodPills } from '@/components/music/mood-pills';
import { QuickPicksGrid } from '@/components/music/quick-picks-grid';
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

  const featuredTrack = homeTracks[0] ?? tracks[0];
  const quickPicks = history.length > 0 ? history.slice(0, 8) : homeTracks.slice(0, 8);
  const trendingTracks = homeTracks.slice(0, 10);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>

        <ExpressiveHeader />


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
              <View style={styles.moodList}>
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

            <View style={styles.heroWrap}>
              <View style={styles.heroCard}>
                <Image
                  source={featuredTrack.artwork}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={240}
                />
                <View style={styles.heroOverlay} />
                <View style={styles.heroContent}>
                  <View style={styles.heroBadge}>
                    <SymbolView
                      name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                      tintColor={colors.onPrimaryContainer}
                      size={13}
                    />
                    <Text style={styles.heroBadgeText}>SPEED DIAL</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.heroTitle}>
                    {featuredTrack.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.heroSubtitle}>
                    {featuredTrack.artist}
                  </Text>
                  <Pressable
                    onPress={() => handlePlayTrack(featuredTrack)}
                    style={({ pressed }) => [styles.heroPlayBtn, pressed && styles.pressed]}>
                    <SymbolView
                      name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
                      tintColor={colors.onPrimary}
                      size={18}
                    />
                    <Text style={styles.heroPlayText}>Listen Now</Text>
                  </Pressable>
                </View>
              </View>
            </View>


            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Quick picks</Text>
                <Text style={styles.sectionSubtitle}>Start radio or jump right back in</Text>
              </View>
            </View>
            <QuickPicksGrid
              tracks={quickPicks}
              activeTrackId={activeTrack.id}
              isPlaying={playing}
              onPlayTrack={(t) => handlePlayTrack(t, quickPicks)}
              onOptionsPress={openOptions}
            />


            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Mixed for you</Text>
                <Text style={styles.sectionSubtitle}>Endless personalized stations</Text>
              </View>
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


            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Trending charts</Text>
                <Text style={styles.sectionSubtitle}>Most played tracks right now</Text>
              </View>
            </View>
            <View style={styles.chartList}>
              {trendingTracks.map((track, index) => (
                <SongRow
                  key={track.id}
                  track={track}
                  rank={index + 1}
                  active={track.id === activeTrack.id && playing}
                  onPress={() => handlePlayTrack(track, trendingTracks)}
                  onOptionsPress={openOptions}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>


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
    backgroundColor: colors.background,
  },
  content: {},
  heroWrap: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  heroCard: {
    height: 240,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHighest,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 21, 19, 0.65)',
  },
  heroContent: {
    padding: 22,
    gap: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: colors.onPrimaryContainer,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#F4FCF9',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSubtitle: {
    color: '#B6D1CB',
    fontSize: 14,
  },
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 8,
  },
  heroPlayText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  horizontalRow: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 28,
  },
  chartList: {
    paddingHorizontal: 12,
    gap: 2,
  },
  moodSection: {
    paddingTop: 8,
  },
  moodList: {
    paddingHorizontal: 12,
    gap: 4,
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
    left: 12,
    right: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});

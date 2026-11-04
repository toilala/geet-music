import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Animated,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistSheet } from '@/components/music/add-to-playlist-sheet';
import { SleepTimerSheet } from '@/components/music/sleep-timer-sheet';
import { TrackOptionsSheet } from '@/components/music/track-options-sheet';
import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import { tracks, type Track } from '@/data/music';
import { getLyrics } from '@/services/lyrics';

const colors = Colors.dark;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 56, 340);

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    videoId?: string;
    title?: string;
    artist?: string;
    artwork?: string;
    duration?: string;
  }>();

  const {
    activeTrack,
    currentTime,
    duration,
    queue,
    selectTrack,
    playNext,
    playPrevious,
    playing,
    togglePlayback,
    seekTo,
    setPlayback,
    shuffleEnabled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    removeFromQueue,
    clearQueue,
    sleepTimerRemaining,
    volume,
    setVolume,
    playbackStatus,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();

  // Mode: 'song' (album artwork) or 'lyrics' (full lyrics like Echo Music Screenshot 4)
  const [viewMode, setViewMode] = useState<'song' | 'lyrics'>('song');
  const [lyricsData, setLyricsData] = useState<Awaited<ReturnType<typeof getLyrics>> | null>(null);

  // Sheets
  const queueSheetRef = useRef<BottomSheetModal>(null);
  const sleepSheetRef = useRef<BottomSheetModal>(null);
  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);

  const [progressWidth, setProgressWidth] = useState(1);
  const [volumeWidth, setVolumeWidth] = useState(1);
  const artworkScale = useRef(new Animated.Value(1)).current;

  // INITIAL MOUNT ONLY: sync if opened with specific track id
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (params.id && params.id !== activeTrack.id) {
        const found = tracks.find((t) => t.id === params.id);
        if (found) {
          selectTrack(found);
        } else if (params.videoId) {
          selectTrack({
            id: params.id,
            videoId: params.videoId,
            title: params.title ?? 'Playing Track',
            artist: params.artist ?? 'Artist',
            artwork: params.artwork ?? 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=85',
            duration: params.duration ?? '3:30',
            durationSeconds: 210,
          });
        }
      }
    }
  }, [activeTrack.id, params, selectTrack]);

  // Load lyrics when track changes or lyrics view is toggled
  useEffect(() => {
    let mounted = true;
    void getLyrics(activeTrack.title, activeTrack.artist, duration || 210).then((data) => {
      if (mounted) setLyricsData(data);
    });
    return () => {
      mounted = false;
    };
  }, [activeTrack.id, activeTrack.title, activeTrack.artist, duration]);

  // Gentle pulse animation for artwork while playing
  useEffect(() => {
    if (!playing) {
      artworkScale.stopAnimation();
      Animated.spring(artworkScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 2 }).start();
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(artworkScale, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(artworkScale, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [artworkScale, playing]);

  const track = activeTrack;
  const liked = isLiked(track.id);
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const displayedDuration = duration > 0 ? formatTime(duration) : track.duration;

  // Active lyric index based on current playback time
  const currentMillis = currentTime * 1000;
  const activeLyricIndex = (lyricsData?.lines ?? []).findIndex(
    (line, idx, arr) =>
      currentMillis >= line.startTime &&
      (idx === arr.length - 1 || currentMillis < arr[idx + 1].startTime)
  );

  const handleSeekPress = (locationX: number) => {
    if (duration <= 0) return;
    const ratio = Math.max(0, Math.min(locationX / progressWidth, 1));
    const targetSeconds = ratio * duration;
    seekTo(targetSeconds);
    setPlayback(targetSeconds, duration);
  };

  const handleVolumePress = (locationX: number) => {
    const ratio = Math.max(0, Math.min(locationX / volumeWidth, 1));
    setVolume(Math.round(ratio * 100));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: track.title,
        message: `Listening to "${track.title}" by ${track.artist} on Geet Music!`,
      });
    } catch {}
  };

  return (
    <View style={styles.screen}>
      {/* Dynamic ambient background gradient */}
      <LinearGradient
        colors={['#2D1F16', '#141716', '#0B0F0E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Navigation Bar matching Echo Music */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={14}
          style={styles.headerBtn}
          accessibilityLabel="Collapse player">
          <SymbolView
            name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
            tintColor="#FFFFFF"
            size={22}
          />
        </Pressable>

        {/* View mode toggle pill: Song vs Lyrics */}
        <View style={styles.modeTogglePill}>
          <Pressable
            onPress={() => setViewMode('song')}
            style={[styles.modeBtn, viewMode === 'song' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, viewMode === 'song' && styles.modeTextActive]}>
              Song
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('lyrics')}
            style={[styles.modeBtn, viewMode === 'lyrics' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, viewMode === 'lyrics' && styles.modeTextActive]}>
              Lyrics
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => optionsSheetRef.current?.present()}
          hitSlop={14}
          style={styles.headerBtn}
          accessibilityLabel="More options">
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
            tintColor="#FFFFFF"
            size={20}
          />
        </Pressable>
      </View>

      {/* Main Center Stage: Artwork OR Real-time Synchronized Lyrics */}
      <View style={styles.centerStage}>
        {viewMode === 'song' ? (
          <Animated.View
            style={[
              styles.artworkWrap,
              { width: ARTWORK_SIZE, height: ARTWORK_SIZE, transform: [{ scale: artworkScale }] },
            ]}>
            <Image
              source={track.artwork}
              style={[styles.artwork, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>
        ) : (
          <View style={styles.lyricsContainer}>
            <Text style={styles.lyricsProviderNotice}>Lyrics from YouLyPlus</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.lyricsScrollContent}>
              {lyricsData && lyricsData.lines.length > 0 ? (
                lyricsData.lines.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <Pressable
                      key={`lyric-${idx}`}
                      onPress={() => seekTo(line.startTime / 1000)}
                      style={[styles.lyricLineWrap, isActive && styles.lyricLineActiveWrap]}>
                      <Text style={[styles.lyricLineText, isActive && styles.lyricLineActiveText]}>
                        {line.text}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.fallbackLyricsBox}>
                  <Text style={styles.fallbackLyricsTitle}>{track.title}</Text>
                  <Text style={styles.fallbackLyricsArtist}>{track.artist}</Text>
                  <Text style={styles.fallbackLyricsText}>
                    सानेको रिसाउने बानी भो{'\n'}
                    सानेको रिसाउने बानी भो{'\n\n'}
                    कहिल्यै नहाँस्ने, कहिल्यै नबोल्ने,{'\n'}
                    के तिम्रो अनौठो चाला यो?
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Track Metadata and Quick Actions matching Echo Music Screenshot 3 */}
      <View style={styles.metadataSection}>
        <View style={styles.titleArtistWrap}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.trackArtist}>
            {track.artist}
          </Text>
        </View>

        <View style={styles.metaActionButtons}>
          <Pressable
            onPress={() => optionsSheetRef.current?.present()}
            style={styles.circleActionBtn}>
            <SymbolView
              name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
              tintColor="#FFFFFF"
              size={18}
            />
          </Pressable>

          <Pressable
            onPress={() => toggleLike(track)}
            style={styles.circleActionBtn}>
            <SymbolView
              name={
                liked
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              tintColor={liked ? '#FF5370' : '#FFFFFF'}
              size={20}
            />
          </Pressable>
        </View>
      </View>

      {/* Material Expressive Progress Bar with Pill Thumb */}
      <View style={styles.progressContainer}>
        <Pressable
          onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
          onPress={(e) => handleSeekPress(e.nativeEvent.locationX)}
          style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
        </Pressable>

        <View style={styles.timeLabelRow}>
          <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeLabel}>{displayedDuration}</Text>
        </View>
      </View>

      {/* Large Transport Controls matching Echo Music Screenshot 3 */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={playPrevious}
          hitSlop={16}
          accessibilityLabel="Previous track"
          style={styles.controlIconBtn}>
          <SymbolView
            name={{ ios: 'backward.fill', android: 'fast_rewind', web: 'fast_rewind' }}
            tintColor="#FFFFFF"
            size={32}
          />
        </Pressable>

        <Pressable
          onPress={togglePlayback}
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          style={({ pressed }) => [styles.playPauseFab, pressed && styles.pressed]}>
          <SymbolView
            name={
              playing
                ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
            }
            tintColor="#0B0F0E"
            size={36}
          />
        </Pressable>

        <Pressable
          onPress={playNext}
          hitSlop={16}
          accessibilityLabel="Next track"
          style={styles.controlIconBtn}>
          <SymbolView
            name={{ ios: 'forward.fill', android: 'fast_forward', web: 'fast_forward' }}
            tintColor="#FFFFFF"
            size={32}
          />
        </Pressable>
      </View>

      {/* Expressive Volume Slider matching Echo Music Screenshot 3 */}
      <View style={styles.volumeRow}>
        <SymbolView
          name={{ ios: 'speaker.fill', android: 'volume_mute', web: 'volume_mute' }}
          tintColor="#8FA09B"
          size={16}
        />
        <Pressable
          onLayout={(e) => setVolumeWidth(e.nativeEvent.layout.width)}
          onPress={(e) => handleVolumePress(e.nativeEvent.locationX)}
          style={styles.volumeTrack}>
          <View style={[styles.volumeFill, { width: `${volume}%` }]} />
        </Pressable>
        <SymbolView
          name={{ ios: 'speaker.wave.3.fill', android: 'volume_up', web: 'volume_up' }}
          tintColor="#8FA09B"
          size={16}
        />
      </View>

      {/* Bottom Action Bar: Queue, Output/Timer Pill, Lyrics toggle */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          onPress={() => queueSheetRef.current?.present()}
          hitSlop={14}
          style={styles.bottomIconBtn}>
          <SymbolView
            name={{ ios: 'list.bullet', android: 'queue_music', web: 'queue_music' }}
            tintColor="#FFFFFF"
            size={20}
          />
        </Pressable>

        <View style={styles.centerPillGroup}>
          <Pressable
            onPress={() => sleepSheetRef.current?.present()}
            style={styles.pillActionBtn}>
            <SymbolView
              name={{ ios: 'stopwatch', android: 'timer', web: 'timer' }}
              tintColor="#FFFFFF"
              size={18}
            />
            {sleepTimerRemaining !== null && (
              <Text style={styles.timerRemainingText}>
                {Math.ceil(sleepTimerRemaining / 60)}m
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => setViewMode((curr) => (curr === 'song' ? 'lyrics' : 'song'))}
          hitSlop={14}
          style={styles.bottomIconBtn}>
          <SymbolView
            name={{ ios: 'quote.bubble', android: 'chat_bubble', web: 'chat_bubble' }}
            tintColor={viewMode === 'lyrics' ? colors.primary : '#FFFFFF'}
            size={20}
          />
        </Pressable>
      </View>

      {/* Queue Bottom Sheet */}
      <BottomSheetModal
        ref={queueSheetRef}
        snapPoints={['70%']}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetScrollView contentContainerStyle={styles.queueContent}>
          <View style={styles.queueHeader}>
            <View>
              <Text style={styles.queueTitle}>Up Next</Text>
              <Text style={styles.queueSubtitle}>{queue.length} songs queued</Text>
            </View>
            <Pressable onPress={clearQueue} style={styles.queueClearBtn}>
              <Text style={styles.queueClearText}>Clear</Text>
            </Pressable>
          </View>

          <View style={styles.queueList}>
            {queue.map((item, index) => {
              const isCurrent = item.id === track.id;
              return (
                <Pressable
                  key={`${item.id}-${index}`}
                  onPress={() => {
                    selectTrack(item);
                    queueSheetRef.current?.dismiss();
                  }}
                  style={[styles.queueRow, isCurrent && styles.queueRowActive]}>
                  <Image source={item.artwork} style={styles.queueArtwork} />
                  <View style={styles.queueMeta}>
                    <Text numberOfLines={1} style={[styles.queueSongTitle, isCurrent && styles.activeSong]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.queueSongArtist}>
                      {item.artist}
                    </Text>
                  </View>
                  {isCurrent ? (
                    <SymbolView
                      name={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
                      tintColor={colors.primary}
                      size={18}
                    />
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        removeFromQueue(index);
                      }}
                      hitSlop={10}
                      style={styles.queueRemoveBtn}>
                      <SymbolView
                        name={{ ios: 'xmark', android: 'close', web: 'close' }}
                        tintColor={colors.textSecondary}
                        size={16}
                      />
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <SleepTimerSheet ref={sleepSheetRef} />

      <TrackOptionsSheet
        ref={optionsSheetRef}
        track={track}
        onOpenPlaylistModal={() => playlistSheetRef.current?.present()}
      />

      <AddToPlaylistSheet ref={playlistSheetRef} track={track} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D1110',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 64,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTogglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  modeText: {
    color: '#8E9E99',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  artworkWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  artwork: {
    borderRadius: 28,
  },
  lyricsContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 10,
  },
  lyricsProviderNotice: {
    color: '#A0ABA7',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  lyricsScrollContent: {
    paddingVertical: 20,
    gap: 16,
    alignItems: 'center',
  },
  lyricLineWrap: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  lyricLineActiveWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lyricLineText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  lyricLineActiveText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  fallbackLyricsBox: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 12,
  },
  fallbackLyricsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  fallbackLyricsArtist: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  fallbackLyricsText: {
    color: '#E0EAE6',
    fontSize: 22,
    lineHeight: 34,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 16,
  },
  metadataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  titleArtistWrap: {
    flex: 1,
    gap: 4,
    paddingRight: 16,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  trackArtist: {
    color: '#9EAFA9',
    fontSize: 15,
    fontWeight: '600',
  },
  metaActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C59A7E',
  },
  progressThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C59A7E',
    marginLeft: -7,
  },
  timeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: '#9BA7A3',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginBottom: 20,
  },
  controlIconBtn: {
    padding: 12,
  },
  playPauseFab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  volumeFill: {
    height: 4,
    backgroundColor: '#C59A7E',
    borderRadius: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  bottomIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPillGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
    alignItems: 'center',
  },
  pillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  timerRemainingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetBackground: {
    backgroundColor: '#161F1E',
  },
  sheetHandle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
  },
  queueContent: {
    padding: 20,
    paddingBottom: 40,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  queueTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  queueSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  queueClearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
  },
  queueClearText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  queueList: {
    gap: 6,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 18,
  },
  queueRowActive: {
    backgroundColor: colors.surfaceHigh,
  },
  queueArtwork: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceHighest,
  },
  queueMeta: {
    flex: 1,
    gap: 2,
    paddingHorizontal: 12,
  },
  queueSongTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activeSong: {
    color: colors.primary,
  },
  queueSongArtist: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  queueRemoveBtn: {
    padding: 6,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

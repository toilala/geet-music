import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Animated,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistSheet } from '@/components/music/add-to-playlist-sheet';
import { LyricsSheet } from '@/components/music/lyrics-sheet';
import { SleepTimerSheet } from '@/components/music/sleep-timer-sheet';
import { TrackOptionsSheet } from '@/components/music/track-options-sheet';
import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import { tracks } from '@/data/music';

const colors = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 48, 340);

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
    isVideoMode,
    toggleVideoMode,
    playbackStatus,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();


  const fallbackTrack = tracks.find((item) => item.id === params.id) ?? tracks[0];
  const routeTrack = useMemo(
    () => ({
      ...fallbackTrack,
      ...(params.videoId
        ? {
            id: params.id ?? params.videoId,
            videoId: params.videoId,
            title: params.title ?? fallbackTrack.title,
            artist: params.artist ?? fallbackTrack.artist,
            artwork: params.artwork ?? fallbackTrack.artwork,
            duration: params.duration ?? fallbackTrack.duration,
          }
        : {}),
    }),
    [
      fallbackTrack,
      params.artist,
      params.artwork,
      params.duration,
      params.id,
      params.title,
      params.videoId,
    ]
  );

  const track = activeTrack.id === routeTrack.id ? activeTrack : routeTrack;
  const liked = isLiked(track.id);


  const queueSheetRef = useRef<BottomSheetModal>(null);
  const lyricsSheetRef = useRef<BottomSheetModal>(null);
  const sleepSheetRef = useRef<BottomSheetModal>(null);
  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);


  const [progressWidth, setProgressWidth] = useState(1);
  const [seekingPosition] = useState<number | null>(null);
  const [artworkScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (routeTrack.id !== activeTrack.id) {
      selectTrack(routeTrack);
    }
  }, [routeTrack, activeTrack.id, selectTrack]);

  useEffect(() => {
    if (!playing) {
      artworkScale.stopAnimation();
      Animated.spring(artworkScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 4 }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(artworkScale, { toValue: 1.018, duration: 1800, useNativeDriver: true }),
        Animated.timing(artworkScale, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [artworkScale, playing]);

  const displayTime = seekingPosition !== null ? seekingPosition : currentTime;
  const progress = duration > 0 ? Math.min(displayTime / duration, 1) : 0;
  const displayedDuration = duration > 0 ? formatTime(duration) : track.duration;

  const handleSeekPress = (locationX: number) => {
    if (duration <= 0) return;
    const ratio = Math.max(0, Math.min(locationX / progressWidth, 1));
    const targetSeconds = ratio * duration;
    seekTo(targetSeconds);
    setPlayback(targetSeconds, duration);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: track.title,
        message: `Listening to "${track.title}" by ${track.artist} on Geet Music! https://www.youtube.com/watch?v=${track.videoId}`,
      });
    } catch {

    }
  };

  return (
    <View style={styles.screen}>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityLabel="Collapse player">
          <SymbolView
            name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
            tintColor={colors.text}
            size={22}
          />
        </Pressable>


        <View style={styles.togglePill}>
          <Pressable
            onPress={() => isVideoMode && toggleVideoMode()}
            style={[styles.toggleOption, !isVideoMode && styles.toggleOptionActive]}>
            <Text style={[styles.toggleText, !isVideoMode && styles.toggleTextActive]}>Song</Text>
          </Pressable>
          <Pressable
            onPress={() => !isVideoMode && toggleVideoMode()}
            style={[styles.toggleOption, isVideoMode && styles.toggleOptionActive]}>
            <Text style={[styles.toggleText, isVideoMode && styles.toggleTextActive]}>Video</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => optionsSheetRef.current?.present()}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityLabel="More options">
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
            tintColor={colors.text}
            size={20}
          />
        </Pressable>
      </View>

      <View style={styles.content}>

        <Animated.View style={[styles.artworkContainer, { width: ARTWORK_SIZE, height: ARTWORK_SIZE, transform: [{ scale: artworkScale }] }]}>
          <Image
            source={track.artwork}
            style={[styles.artworkHero, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}
            contentFit="cover"
            transition={200}
          />
          {isVideoMode && (
            <View style={styles.videoOverlay}>
              <SymbolView
                name={{ ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display' }}
                tintColor={colors.primary}
                size={48}
              />
              <Text style={styles.videoBadge}>Now streaming audio & video</Text>
            </View>
          )}
        </Animated.View>


        <View style={styles.trackInfo}>
          <View style={styles.metaCopy}>
            <Text numberOfLines={1} style={styles.title}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {track.artist}
            </Text>
          </View>
          <Pressable
            onPress={() => toggleLike(track)}
            hitSlop={12}
            style={styles.likeBtn}
            accessibilityLabel={liked ? 'Unlike song' : 'Like song'}>
            <SymbolView
              name={
                liked
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              tintColor={liked ? '#FF5370' : colors.textSecondary}
              size={26}
            />
          </Pressable>
        </View>


        <View style={styles.progressSection}>
          <Pressable
            onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
            onPress={(e) => handleSeekPress(e.nativeEvent.locationX)}
            style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </Pressable>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
            <Text style={styles.timeText}>{displayedDuration}</Text>
          </View>
        </View>


        <View style={styles.controlsRow}>

          <Pressable
            onPress={toggleShuffle}
            hitSlop={14}
            accessibilityLabel="Shuffle"
            style={styles.controlBtn}>
            <SymbolView
              name={{ ios: 'shuffle', android: 'shuffle', web: 'shuffle' }}
              tintColor={shuffleEnabled ? colors.primary : colors.textSecondary}
              size={22}
            />
          </Pressable>


          <Pressable
            onPress={playPrevious}
            hitSlop={14}
            accessibilityLabel="Previous track"
            style={styles.controlBtn}>
            <SymbolView
              name={{ ios: 'backward.end.fill', android: 'skip_previous', web: 'skip_previous' }}
              tintColor={colors.text}
              size={30}
            />
          </Pressable>


          <Pressable
            onPress={togglePlayback}
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            style={({ pressed }) => [styles.playFab, pressed && styles.pressed]}>
            <SymbolView
              name={
                playing
                  ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                  : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
              }
              tintColor={colors.onPrimary}
              size={34}
            />
          </Pressable>


          <Pressable
            onPress={playNext}
            hitSlop={14}
            accessibilityLabel="Next track"
            style={styles.controlBtn}>
            <SymbolView
              name={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }}
              tintColor={colors.text}
              size={30}
            />
          </Pressable>


          <Pressable
            onPress={toggleRepeat}
            hitSlop={14}
            accessibilityLabel="Repeat mode"
            style={styles.controlBtn}>
            <View style={styles.repeatWrap}>
              <SymbolView
                name={{ ios: 'repeat', android: 'repeat', web: 'repeat' }}
                tintColor={repeatMode !== 'off' ? colors.primary : colors.textSecondary}
                size={22}
              />
              {repeatMode === 'one' && <Text style={styles.repeatBadge}>1</Text>}
            </View>
          </Pressable>
        </View>


        <View style={styles.secondaryActions}>

          <Pressable
            onPress={() => queueSheetRef.current?.present()}
            style={styles.actionCapsule}>
            <SymbolView
              name={{ ios: 'list.bullet', android: 'queue_music', web: 'queue_music' }}
              tintColor={colors.text}
              size={18}
            />
            <Text style={styles.actionCapsuleText}>Queue ({queue.length})</Text>
          </Pressable>


          <Pressable
            onPress={() => lyricsSheetRef.current?.present()}
            style={styles.actionCapsule}>
            <SymbolView
              name={{ ios: 'quote.bubble', android: 'lyrics', web: 'lyrics' }}
              tintColor={colors.primary}
              size={18}
            />
            <Text style={styles.actionCapsuleText}>Lyrics</Text>
          </Pressable>


          <Pressable
            onPress={() => sleepSheetRef.current?.present()}
            style={[styles.actionCapsule, sleepTimerRemaining !== null && styles.actionCapsuleActive]}>
            <SymbolView
              name={{ ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' }}
              tintColor={sleepTimerRemaining !== null ? colors.primary : colors.text}
              size={17}
            />
            <Text
              style={[
                styles.actionCapsuleText,
                sleepTimerRemaining !== null && styles.actionCapsuleTextActive,
              ]}>
              {sleepTimerRemaining !== null ? `${Math.ceil(sleepTimerRemaining / 60)}m` : 'Timer'}
            </Text>
          </Pressable>


          <Pressable onPress={handleShare} style={styles.actionCapsule}>
            <SymbolView
              name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              tintColor={colors.text}
              size={18}
            />
          </Pressable>
        </View>

        {playbackStatus === 'buffering' && (
          <Text style={styles.statusNotice}>Buffering high quality audio…</Text>
        )}
      </View>


      <BottomSheetModal
        ref={queueSheetRef}
        snapPoints={['65%']}
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
                <View
                  key={`${item.id}-${index}`}
                  style={[styles.queueRow, isCurrent && styles.queueRowActive]}>
                  <Pressable
                    onPress={() => {
                      selectTrack(item);
                      queueSheetRef.current?.dismiss();
                    }}
                    style={styles.queueRowMain}>
                    <Image source={item.artwork} style={styles.queueArtwork} />
                    <View style={styles.queueMeta}>
                      <Text numberOfLines={1} style={[styles.queueSongTitle, isCurrent && styles.activeSong]}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.queueSongArtist}>
                        {item.artist}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.queueRowActions}>
                    {isCurrent ? (
                      <SymbolView
                        name={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
                        tintColor={colors.primary}
                        size={18}
                      />
                    ) : (
                      <Pressable onPress={() => removeFromQueue(index)} hitSlop={10} style={styles.queueRemoveBtn}>
                        <SymbolView
                          name={{ ios: 'xmark', android: 'close', web: 'close' }}
                          tintColor={colors.textSecondary}
                          size={16}
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>


      <LyricsSheet
        key={track.id}
        sheetRef={lyricsSheetRef}
        track={track}
        currentTime={currentTime}
        duration={duration}
        onSeek={seekTo}
      />


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
    backgroundColor: '#0D1413',
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
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 3,
  },
  toggleOption: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  toggleOptionActive: {
    backgroundColor: colors.surfaceHigh,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-evenly',
    paddingBottom: 24,
  },
  artworkContainer: {
    alignSelf: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHighest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  artworkHero: {
    borderRadius: 28,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 20, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoBadge: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  metaCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  likeBtn: {
    padding: 6,
  },
  progressSection: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  controlBtn: {
    padding: 10,
  },
  playFab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  repeatWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionCapsuleActive: {
    backgroundColor: 'rgba(120, 214, 200, 0.16)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionCapsuleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  actionCapsuleTextActive: {
    color: colors.primary,
  },
  statusNotice: {
    color: colors.primary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  sheetBackground: {
    backgroundColor: '#161F1E',
  },
  sheetHandle: {
    backgroundColor: colors.outline,
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
    color: colors.text,
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
    backgroundColor: 'transparent',
  },
  queueRowActive: {
    backgroundColor: colors.surfaceHigh,
  },
  queueRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  },
  queueSongTitle: {
    color: colors.text,
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
  queueRowActions: {
    paddingLeft: 8,
  },
  queueRemoveBtn: {
    padding: 6,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
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

import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import YoutubePlayer, { PLAYER_STATES, type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { tracks } from '@/data/music';
import { usePlayer } from '@/context/player-context';
import { Colors } from '@/constants/theme';
import { LyricsSheet } from '@/components/music/lyrics-sheet';

const colors = Colors.dark;

export default function PlayerScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    videoId?: string;
    title?: string;
    artist?: string;
    artwork?: string;
    duration?: string;
  }>();
  const insets = useSafeAreaInsets();
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const { activeTrack, queue, selectTrack, playNext, playPrevious, playing, setPlaying, registerController } = usePlayer();
  const fallbackTrack = tracks.find((item) => item.id === params.id) ?? tracks[0];
  const routeTrack = useMemo(() => ({
    ...fallbackTrack,
    ...(params.videoId ? {
      id: params.id ?? params.videoId,
      videoId: params.videoId,
      title: params.title ?? fallbackTrack.title,
      artist: params.artist ?? fallbackTrack.artist,
      artwork: params.artwork ?? fallbackTrack.artwork,
      duration: params.duration ?? fallbackTrack.duration,
    } : {}),
  }), [fallbackTrack, params.artist, params.artwork, params.duration, params.id, params.title, params.videoId]);
  const track = activeTrack;
  const [hasError, setHasError] = useState(false);
  const [progressState, setProgressState] = useState({ trackId: '', value: 0 });
  const [durationState, setDurationState] = useState({ trackId: '', value: 0 });
  const [progressWidth, setProgressWidth] = useState(1);
  const queueSheetRef = useRef<ComponentRef<typeof BottomSheetModal> | null>(null);
  const lyricsSheetRef = useRef<ComponentRef<typeof BottomSheetModal> | null>(null);

  useEffect(() => {
    selectTrack(routeTrack);
  }, [routeTrack, selectTrack]);

  useEffect(() => {
    registerController({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      toggle: () => setPlaying((current) => !current),
    });
    return () => registerController(null);
  }, [registerController, setPlaying]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (playing) {
      timer = setInterval(() => {
        void Promise.all([playerRef.current?.getCurrentTime(), playerRef.current?.getDuration()])
          .then(([currentTime, currentDuration]) => {
            if (typeof currentTime === 'number' && typeof currentDuration === 'number' && currentDuration > 0) {
              setProgressState({ trackId: track.id, value: Math.min(currentTime / currentDuration, 1) });
              setDurationState({ trackId: track.id, value: currentDuration });
            }
          });
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [playing, track.id]);

  const handleStateChange = useCallback((state: PLAYER_STATES) => {
    if (state === PLAYER_STATES.PLAYING) setPlaying(true);
    if (state === PLAYER_STATES.PAUSED || state === PLAYER_STATES.ENDED) setPlaying(false);
  }, [setPlaying]);

  const progress = progressState.trackId === track.id ? progressState.value : 0;
  const duration = durationState.trackId === track.id ? durationState.value : 0;
  const displayedDuration = duration > 0 ? formatTime(duration) : track.duration;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton} accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} tintColor="#F8F2FB" size={24} />
        </Pressable>
        <Text style={styles.headerLabel}>NOW PLAYING</Text>
        <Pressable onPress={() => queueSheetRef.current?.present()} hitSlop={12} accessibilityLabel="Open queue"><SymbolView name={{ ios: 'list.bullet', android: 'queue_music', web: 'queue_music' }} tintColor={colors.text} size={22} /></Pressable>
      </View>

      <View style={styles.content}>
        <Image source={track.artwork} style={styles.artworkHero} contentFit="cover" transition={220} />
        <View style={styles.trackHeader}>
          <View style={styles.trackCopy}><Text numberOfLines={2} style={styles.title}>{track.title}</Text><Text numberOfLines={1} style={styles.artist}>{track.artist}</Text></View>
          <Pressable onPress={() => lyricsSheetRef.current?.present()} hitSlop={12} accessibilityLabel="Open lyrics"><SymbolView name={{ ios: 'quote.bubble', android: 'lyrics', web: 'lyrics' }} tintColor={colors.primary} size={25} /></Pressable>
        </View>
        <View style={styles.progress}>
          <Pressable onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)} onPress={(event) => { if (duration > 0) { const nextProgress = Math.max(0, Math.min(event.nativeEvent.locationX / progressWidth, 1)); playerRef.current?.seekTo(nextProgress * duration, true); setProgressState({ trackId: track.id, value: nextProgress }); } }} style={styles.progressTrack}>
            <View style={[styles.progressValue, { width: `${progress * 100}%` }]} />
          </Pressable>
          <View style={styles.timeRow}><Text style={styles.time}>{formatTime(progress * duration)}</Text><Text style={styles.time}>{displayedDuration}</Text></View>
        </View>
        <View style={styles.controls}>
          <Pressable accessibilityLabel="Shuffle" hitSlop={12}><SymbolView name={{ ios: 'shuffle', android: 'shuffle', web: 'shuffle' }} tintColor={colors.textSecondary} size={22} /></Pressable>
          <Pressable accessibilityLabel="Previous song" onPress={playPrevious} hitSlop={12}><SymbolView name={{ ios: 'backward.end.fill', android: 'skip_previous', web: 'skip_previous' }} tintColor={colors.text} size={29} /></Pressable>
          <Pressable accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={() => setPlaying(!playing)} style={styles.playButton}>
            <SymbolView name={{ ios: playing ? 'pause.fill' : 'play.fill', android: playing ? 'pause' : 'play_arrow', web: playing ? 'pause' : 'play_arrow' }} tintColor={colors.onPrimary} size={30} />
          </Pressable>
          <Pressable accessibilityLabel="Next song" onPress={playNext} hitSlop={12}><SymbolView name={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }} tintColor={colors.text} size={29} /></Pressable>
          <Pressable accessibilityLabel="Repeat" hitSlop={12}><SymbolView name={{ ios: 'repeat', android: 'repeat', web: 'repeat' }} tintColor={colors.textSecondary} size={22} /></Pressable>
        </View>
        {hasError && <View style={styles.errorState}><Text style={styles.errorTitle}>Playback is unavailable</Text><Text style={styles.errorText}>Try another song or check your connection.</Text></View>}
      </View>
      <YoutubePlayer
        ref={playerRef}
        height={200}
        width={200}
        videoId={track.videoId}
        play={playing}
        forceAndroidAutoplay
        initialPlayerParams={{ controls: false, rel: false, preventFullScreen: true }}
        webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
        onChangeState={handleStateChange}
        onError={() => setHasError(true)}
        onReady={() => setHasError(false)}
        viewContainerStyle={styles.playbackEngine}
        webViewStyle={styles.playbackWebView}
      />
      <BottomSheetModal ref={queueSheetRef} snapPoints={['58%']} backgroundStyle={styles.sheetBackground} handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetScrollView contentContainerStyle={styles.queueSheet}>
          <Text style={styles.sheetTitle}>Up next</Text>
          <Text style={styles.sheetSubtitle}>{queue.length} songs in your queue</Text>
          {queue.map((item) => <Pressable key={item.id} onPress={() => { selectTrack(item); setPlaying(true); }} style={[styles.queueItem, item.id === track.id && styles.queueItemActive]}><Image source={item.artwork} style={styles.queueArtwork} /><View style={styles.queueCopy}><Text numberOfLines={1} style={styles.queueTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.queueArtist}>{item.artist}</Text></View>{item.id === track.id && <SymbolView name={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }} tintColor={colors.primary} size={18} />}</Pressable>)}
        </BottomSheetScrollView>
      </BottomSheetModal>
      <LyricsSheet key={track.id} sheetRef={lyricsSheetRef} track={track} />

      <View style={{ height: insets.bottom + 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { height: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  content: { flex: 1, paddingHorizontal: 24 },
  artworkHero: { width: '100%', aspectRatio: 1, maxHeight: 360, borderRadius: 26, backgroundColor: colors.surfaceHigh },
  trackHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 26 },
  trackCopy: { flex: 1, gap: 6 },
  title: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  artist: { color: colors.textSecondary, fontSize: 15 },
  progress: { marginTop: 25 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceHighest, overflow: 'hidden' },
  progressValue: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { color: colors.textSecondary, fontSize: 11 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  playButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  playbackEngine: { position: 'absolute', width: 200, height: 200, opacity: 0.01, left: -210, bottom: -210 },
  playbackWebView: { opacity: 0.01 },
  errorState: { alignItems: 'center', padding: 18 },
  errorTitle: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  sheetBackground: { backgroundColor: colors.surface },
  sheetHandle: { backgroundColor: colors.outline },
  queueSheet: { padding: 24, paddingBottom: 48 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sheetSubtitle: { color: colors.textSecondary, marginTop: 4, marginBottom: 18 },
  queueItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16 },
  queueItemActive: { backgroundColor: colors.surfaceHigh },
  queueArtwork: { width: 48, height: 48, borderRadius: 12 },
  queueCopy: { flex: 1, gap: 3 },
  queueTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  queueArtist: { color: colors.textSecondary, fontSize: 12 },
});

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

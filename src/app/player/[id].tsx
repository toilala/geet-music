import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentType, type RefAttributes } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { tracks } from '@/data/music';
import { usePlayer } from '@/context/player-context';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

type WebViewInstance = { injectJavaScript: (script: string) => void };
const NativeWebView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebViewInstance>>;

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
  const webViewRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);
  const playingRef = useRef(false);
  const { activeTrack, selectTrack, playNext, playPrevious, playing, setPlaying, registerController } = usePlayer();
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
  const appReferrer = 'https://com.toilalaa.geetmusic';
  const playerUrl = `https://www.youtube.com/embed/${track.videoId}?playsinline=1&controls=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(appReferrer)}&widget_referrer=${encodeURIComponent(appReferrer)}`;
  const playerHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /><style>html,body,iframe{margin:0;width:100%;height:100%;background:#000;border:0;overflow:hidden}</style></head><body><iframe src="${playerUrl}" title="YouTube player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><script>window.addEventListener('message',function(event){try{var data=JSON.parse(event.data);if(data.event==='onStateChange'&&window.ReactNativeWebView){window.ReactNativeWebView.postMessage(String(data.info));}}catch(_){}});</script></body></html>`;
  const sendCommand = (func: 'playVideo' | 'pauseVideo') => {
    webViewRef.current?.injectJavaScript(`document.querySelector('iframe')?.contentWindow.postMessage(JSON.stringify({event:'command',func:'${func}',args:[]}), '*'); true;`);
  };

  useEffect(() => {
    selectTrack(routeTrack);
    setPlaying(false);
  }, [routeTrack, selectTrack, setPlaying]);

  useEffect(() => {
    registerController({
      play: () => sendCommand('playVideo'),
      pause: () => sendCommand('pauseVideo'),
      toggle: () => sendCommand(playingRef.current ? 'pauseVideo' : 'playVideo'),
    });
    return () => registerController(null);
  }, [registerController]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton} accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} tintColor="#F8F2FB" size={24} />
        </Pressable>
        <Text style={styles.headerLabel}>NOW PLAYING</Text>
        <Pressable hitSlop={12} accessibilityLabel="Open queue"><SymbolView name={{ ios: 'list.bullet', android: 'queue_music', web: 'queue_music' }} tintColor={colors.text} size={22} /></Pressable>
      </View>

      <View style={styles.content}>
        <Image source={track.artwork} style={styles.artworkHero} contentFit="cover" transition={220} />
        <View style={styles.trackHeader}>
          <View style={styles.trackCopy}><Text numberOfLines={2} style={styles.title}>{track.title}</Text><Text numberOfLines={1} style={styles.artist}>{track.artist}</Text></View>
          <Pressable hitSlop={12} accessibilityLabel="Like song"><SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} tintColor={colors.textSecondary} size={25} /></Pressable>
        </View>
        <View style={styles.progress}><View style={styles.progressTrack}><View style={[styles.progressValue, { width: '32%' }]} /></View><View style={styles.timeRow}><Text style={styles.time}>0:00</Text><Text style={styles.time}>{track.duration}</Text></View></View>
        <View style={styles.controls}>
          <Pressable accessibilityLabel="Shuffle" hitSlop={12}><SymbolView name={{ ios: 'shuffle', android: 'shuffle', web: 'shuffle' }} tintColor={colors.textSecondary} size={22} /></Pressable>
          <Pressable accessibilityLabel="Previous song" onPress={playPrevious} hitSlop={12}><SymbolView name={{ ios: 'backward.end.fill', android: 'skip_previous', web: 'skip_previous' }} tintColor={colors.text} size={29} /></Pressable>
          <Pressable accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={() => { if (playing) sendCommand('pauseVideo'); else sendCommand('playVideo'); }} style={styles.playButton}>
            <SymbolView name={{ ios: playing ? 'pause.fill' : 'play.fill', android: playing ? 'pause' : 'play_arrow', web: playing ? 'pause' : 'play_arrow' }} tintColor={colors.onPrimary} size={30} />
          </Pressable>
          <Pressable accessibilityLabel="Next song" onPress={playNext} hitSlop={12}><SymbolView name={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }} tintColor={colors.text} size={29} /></Pressable>
          <Pressable accessibilityLabel="Repeat" hitSlop={12}><SymbolView name={{ ios: 'repeat', android: 'repeat', web: 'repeat' }} tintColor={colors.textSecondary} size={22} /></Pressable>
        </View>
        {hasError && <View style={styles.errorState}><Text style={styles.errorTitle}>Playback is unavailable</Text><Text style={styles.errorText}>Try another song or check your connection.</Text></View>}
      </View>
      <NativeWebView
        ref={webViewRef}
        source={{ html: playerHtml, baseUrl: `${appReferrer}/` }}
        style={styles.playbackEngine}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        originWhitelist={['*']}
        onMessage={(event: WebViewMessageEvent) => {
          const state = Number(event.nativeEvent.data);
          if (state === 1) { playingRef.current = true; setPlaying(true); }
          if (state === 0 || state === 2) { playingRef.current = false; setPlaying(false); }
        }}
        onError={() => setHasError(true)}
      />

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
  playbackEngine: { position: 'absolute', width: 2, height: 2, opacity: 0.01, left: 0, bottom: 0 },
  errorState: { alignItems: 'center', padding: 18 },
  errorTitle: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});

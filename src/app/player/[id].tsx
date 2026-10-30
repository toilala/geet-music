import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { tracks } from '@/data/music';

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
  const fallbackTrack = tracks.find((item) => item.id === params.id) ?? tracks[0];
  const track = {
    ...fallbackTrack,
    ...(params.videoId ? {
      id: params.id ?? params.videoId,
      videoId: params.videoId,
      title: params.title ?? fallbackTrack.title,
      artist: params.artist ?? fallbackTrack.artist,
      artwork: params.artwork ?? fallbackTrack.artwork,
      duration: params.duration ?? fallbackTrack.duration,
    } : {}),
  };
  const [hasError, setHasError] = useState(false);
  const appReferrer = 'https://com.toilalaa.geetmusic';
  const playerUrl = `https://www.youtube.com/embed/${track.videoId}?playsinline=1&controls=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(appReferrer)}&widget_referrer=${encodeURIComponent(appReferrer)}`;
  const playerHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /><style>html,body,iframe{margin:0;width:100%;height:100%;background:#000;border:0;overflow:hidden}</style></head><body><iframe src="${playerUrl}" title="YouTube player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton} accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} tintColor="#F8F2FB" size={24} />
        </Pressable>
        <Text style={styles.headerLabel}>NOW PLAYING</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.videoFrame}>
        {hasError ? (
          <View style={styles.errorState}><Text style={styles.errorTitle}>This video could not be embedded</Text><Text style={styles.errorText}>Try opening another track.</Text></View>
        ) : (
          <WebView
            source={{ html: playerHtml, baseUrl: `${appReferrer}/` }}
            style={styles.webView}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction
            originWhitelist={['*']}
            onError={() => setHasError(true)}
          />
        )}
      </View>

      <View style={[styles.details, { paddingBottom: insets.bottom + 24 }]}>
        <Image source={track.artwork} style={styles.artwork} contentFit="cover" />
        <View style={styles.trackCopy}><Text numberOfLines={2} style={styles.title}>{track.title}</Text><Text style={styles.artist}>{track.artist}</Text></View>
        <Pressable hitSlop={12} accessibilityLabel="Like song"><SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} tintColor="#AAA0B3" size={24} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#100D15' },
  header: { height: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#282130', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { color: '#AAA0B3', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  headerSpacer: { width: 42 },
  text: { color: '#F8F2FB' },
  videoFrame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  webView: { flex: 1, backgroundColor: '#000' },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { color: '#F8F2FB', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  errorText: { color: '#AAA0B3', marginTop: 6 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  artwork: { width: 64, height: 64, borderRadius: 18 },
  trackCopy: { flex: 1, gap: 5 },
  title: { color: '#F8F2FB', fontSize: 20, lineHeight: 25, fontWeight: '800' },
  artist: { color: '#AAA0B3', fontSize: 14 },
});

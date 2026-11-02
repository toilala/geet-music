import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/music/mini-player';
import { SongRow } from '@/components/music/song-row';
import { tracks } from '@/data/music';
import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';

const colors = Colors.dark;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { activeTrack, currentTime, duration, playing, selectTrack, setPlaying, togglePlayback } = usePlayer();
  const savedTracks = useMemo(() => tracks.slice(0, 7), []);
  const play = (track = activeTrack) => {
    selectTrack(track);
    setPlaying(true);
    router.push({ pathname: '/player/[id]', params: { id: track.id, videoId: track.videoId, title: track.title, artist: track.artist, artwork: track.artwork, duration: track.duration } });
  };

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>YOUR SPACE</Text>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>Everything you want close at hand.</Text>
      <View style={styles.quickGrid}>
        {[
          { icon: 'favorite', title: 'Liked songs', count: '0 songs' },
          { icon: 'download', title: 'Downloads', count: 'Offline ready' },
          { icon: 'history', title: 'History', count: 'Recently played' },
          { icon: 'queue_music', title: 'Queue', count: 'Up next' },
        ].map((item) => <Pressable key={item.title} onPress={() => item.title === 'Queue' && play()} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
          <View style={styles.quickIcon}><SymbolView name={item.icon === 'favorite' ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : item.icon === 'download' ? { ios: 'arrow.down.circle.fill', android: 'download', web: 'download' } : item.icon === 'history' ? { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' } : { ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }} tintColor={colors.primary} size={22} /></View>
          <Text style={styles.quickTitle}>{item.title}</Text><Text style={styles.quickCount}>{item.count}</Text>
        </Pressable>)}
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Saved for later</Text><Text style={styles.sectionCount}>{savedTracks.length}</Text></View>
      <View style={styles.list}>{savedTracks.map((track) => <SongRow key={track.id} track={track} active={track.id === activeTrack.id && playing} onPress={() => play(track)} />)}</View>
    </ScrollView>
    <View style={[styles.playerDock, { bottom: insets.bottom + 78 }]}><MiniPlayer track={activeTrack} currentTime={currentTime} duration={duration} playing={playing} onToggle={() => playing ? togglePlayback() : play()} onOpen={() => play()} /></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 36, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 7, marginBottom: 26 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 34 },
  quickCard: { width: '48%', minHeight: 130, padding: 14, borderRadius: 26, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.surfaceHighest },
  quickIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  quickCount: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sectionCount: { color: colors.primary, fontWeight: '800' },
  list: { gap: 8 },
  playerDock: { position: 'absolute', left: 12, right: 12 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});

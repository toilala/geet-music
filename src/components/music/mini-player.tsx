import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Track } from '@/data/music';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function MiniPlayer({ track, playing, currentTime = 0, duration = 0, onToggle, onOpen }: { track: Track; playing: boolean; currentTime?: number; duration?: number; onToggle: () => void; onOpen: () => void }) {
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Image source={track.artwork} style={styles.artwork} contentFit="cover" />
      <View style={styles.copy}><Text numberOfLines={1} style={styles.title}>{track.title}</Text><Text numberOfLines={1} style={styles.subtitle}>{track.artist} · {playing ? 'Playing' : 'Paused'}</Text><View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${progress * 100}%` }]} /></View></View>
      <Pressable accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={onToggle} hitSlop={12} style={styles.playButton}>
        <SymbolView name={{ ios: playing ? 'pause.fill' : 'play.fill', android: playing ? 'pause' : 'play_arrow', web: playing ? 'pause' : 'play_arrow' }} tintColor="#21152E" size={17} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 28, padding: 8, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.outline },
  pressed: { opacity: 0.82 },
  artwork: { width: 48, height: 48, borderRadius: 16 },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 12 },
  playButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: colors.surfaceHighest, overflow: 'hidden', marginTop: 2 },
  progressValue: { height: 3, borderRadius: 2, backgroundColor: colors.primary },
});

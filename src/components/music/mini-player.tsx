import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Track } from '@/data/music';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function MiniPlayer({ track, playing, onToggle, onOpen }: { track: Track; playing: boolean; onToggle: () => void; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Image source={track.artwork} style={styles.artwork} contentFit="cover" />
      <View style={styles.copy}><Text numberOfLines={1} style={styles.title}>{track.title}</Text><Text numberOfLines={1} style={styles.subtitle}>{track.artist}</Text></View>
      <Pressable accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={onToggle} hitSlop={12} style={styles.playButton}>
        <SymbolView name={{ ios: playing ? 'pause.fill' : 'play.fill', android: playing ? 'pause' : 'play_arrow', web: playing ? 'pause' : 'play_arrow' }} tintColor="#21152E" size={17} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 8, backgroundColor: colors.surfaceHighest, borderWidth: 1, borderColor: colors.outline },
  pressed: { opacity: 0.82 },
  artwork: { width: 48, height: 48, borderRadius: 16 },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 12 },
  playButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
});

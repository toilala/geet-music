import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Track } from '@/data/music';

export function SongRow({ track, active, onPress }: { track: Track; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Image source={track.artwork} style={styles.artwork} contentFit="cover" transition={180} />
      <View style={styles.copy}>
        <View style={styles.titleLine}><View style={[styles.playingDot, active && styles.playingDotActive]} /><Text numberOfLines={1} style={styles.title}>{track.title}</Text></View>
        <Text numberOfLines={1} style={styles.subtitle}>{track.artist}</Text>
      </View>
      <Text style={styles.subtitle}>{track.duration}</Text>
      <SymbolView name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }} tintColor="#AAA0B3" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  pressed: { opacity: 0.7 },
  artwork: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#2A2432' },
  copy: { flex: 1, gap: 4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  playingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  playingDotActive: { backgroundColor: '#E2B7FF' },
  title: { color: '#F8F2FB', fontSize: 15, fontWeight: '700' },
  subtitle: { color: '#AAA0B3', fontSize: 12 },
});

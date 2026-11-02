import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Collection } from '@/data/music';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function AlbumCard({ collection, onPress }: { collection: Collection; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={[styles.artworkFrame, { backgroundColor: collection.accent }]}>
        <Image source={collection.artwork} style={styles.artwork} contentFit="cover" transition={180} />
      </View>
      <View style={styles.copy}>
        <View style={[styles.accentDot, { backgroundColor: collection.accent }]} />
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.title}>{collection.title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{collection.subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 168 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  artworkFrame: { borderRadius: 22, padding: 2 },
  artwork: { width: 164, height: 164, borderRadius: 20 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  accentDot: { width: 7, height: 7, borderRadius: 4 },
  textWrap: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 12 },
});

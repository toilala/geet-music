import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Collection } from '@/data/music';

const colors = Colors.dark;

type Props = {
  collection: Collection;
  onPress?: () => void;
  width?: number;
};

export function AlbumCard({ collection, onPress, width = 150 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${collection.title}`}
      style={({ pressed }) => [{ width }, styles.container, pressed && styles.pressed]}>
      <View style={styles.imageContainer}>
        <Image
          source={collection.artwork}
          style={[styles.artwork, { width, height: width }]}
          contentFit="cover"
          transition={180}
        />
        <View style={styles.playBadge}>
          <SymbolView
            name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
            tintColor={colors.onPrimary}
            size={18}
          />
        </View>
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>
          {collection.title}
        </Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {collection.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHighest,
  },
  artwork: {
    borderRadius: 22,
  },
  playBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 55, 49, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120, 214, 200, 0.4)',
  },
  meta: {
    gap: 2,
    paddingHorizontal: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

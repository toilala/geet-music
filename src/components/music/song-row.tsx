import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import type { Track } from '@/data/music';

const colors = Colors.dark;

type Props = {
  track: Track;
  active?: boolean;
  onPress?: () => void;
  onOptionsPress?: (track: Track) => void;
  rank?: number;
};

export function SongRow({ track, active, onPress, onOptionsPress, rank }: Props) {
  const { isLiked, toggleLike } = useLibrary();
  const liked = isLiked(track.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      style={({ pressed }) => [styles.container, active && styles.activeContainer, pressed && styles.pressed]}>
      {rank !== undefined ? (
        <Text style={[styles.rank, active && styles.activeRank]}>{rank}</Text>
      ) : null}

      <Image source={track.artwork} style={styles.artwork} contentFit="cover" transition={160} />

      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <Text numberOfLines={1} style={[styles.title, active && styles.activeTitle]}>
            {track.title}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.subtitle}>
          {track.artist}
        </Text>
      </View>

      <View style={styles.rightActions}>
        <Pressable
          hitSlop={10}
          onPress={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          style={styles.heartBtn}>
          <SymbolView
            name={
              liked
                ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
            }
            tintColor={liked ? '#FF5370' : colors.textSecondary}
            size={18}
          />
        </Pressable>

        <Text style={styles.duration}>{track.duration}</Text>

        {onOptionsPress && (
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              onOptionsPress(track);
            }}
            style={styles.moreBtn}>
            <SymbolView
              name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
              tintColor={colors.textSecondary}
              size={18}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: colors.surfaceHigh,
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: colors.surfaceHigh,
  },
  rank: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  activeRank: {
    color: colors.primary,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceHighest,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  activeTitle: {
    color: colors.primary,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartBtn: {
    padding: 6,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  moreBtn: {
    padding: 6,
  },
});

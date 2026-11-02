import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import type { Track } from '@/data/music';

const colors = Colors.dark;

type Props = {
  track: Track;
  playing: boolean;
  currentTime?: number;
  duration?: number;
  onToggle: () => void;
  onNext?: () => void;
  onOpen: () => void;
};

export function MiniPlayer({
  track,
  playing,
  currentTime = 0,
  duration = 0,
  onToggle,
  onNext,
  onOpen,
}: Props) {
  const { isLiked, toggleLike } = useLibrary();
  const liked = isLiked(track.id);
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Now playing ${track.title} by ${track.artist}. Tap to open player.`}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <View style={styles.container}>
        <Image source={track.artwork} style={styles.artwork} contentFit="cover" transition={160} />

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {track.artist}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              toggleLike(track);
            }}
            style={styles.actionBtn}>
            <SymbolView
              name={
                liked
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              tintColor={liked ? '#FF5370' : colors.textSecondary}
              size={20}
            />
          </Pressable>

          <Pressable
            hitSlop={10}
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            onPress={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={styles.playBtn}>
            <SymbolView
              name={
                playing
                  ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                  : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
              }
              tintColor={colors.onPrimary}
              size={18}
            />
          </Pressable>

          {onNext && (
            <Pressable
              hitSlop={10}
              accessibilityLabel="Skip next"
              onPress={(e) => {
                e.stopPropagation();
                onNext();
              }}
              style={styles.actionBtn}>
              <SymbolView
                name={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }}
                tintColor={colors.text}
                size={20}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressValue, { width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    backgroundColor: '#192624',
    borderWidth: 1,
    borderColor: 'rgba(120, 214, 200, 0.16)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 12,
    gap: 12,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceHighest,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 8,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressValue: {
    height: 2.5,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});

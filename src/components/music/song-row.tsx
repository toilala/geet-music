import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Track } from '@/data/music';
import { TrackArtwork } from '@/components/music/track-artwork';

const colors = Colors.dark;

type Props = {
  track: Track;
  active?: boolean;
  onPress?: () => void;
  onOptionsPress?: (track: Track) => void;
  rank?: number;
};

// Animated 3-bar Equalizer matching Echo Music's active track badge
function EqualizerBars() {
  const [bar1] = useState(() => new Animated.Value(4));
  const [bar2] = useState(() => new Animated.Value(12));
  const [bar3] = useState(() => new Animated.Value(8));

  useEffect(() => {
    const createAnim = (anim: Animated.Value, min: number, max: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: max, duration, useNativeDriver: false }),
          Animated.timing(anim, { toValue: min, duration, useNativeDriver: false }),
        ])
      );
    };

    const anim1 = createAnim(bar1, 4, 16, 420);
    const anim2 = createAnim(bar2, 3, 18, 360);
    const anim3 = createAnim(bar3, 5, 14, 480);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [bar1, bar2, bar3]);

  return (
    <View style={styles.equalizerOverlay}>
      <Animated.View style={[styles.eqBar, { height: bar1 }]} />
      <Animated.View style={[styles.eqBar, { height: bar2 }]} />
      <Animated.View style={[styles.eqBar, { height: bar3 }]} />
    </View>
  );
}

export function SongRow({ track, active, onPress, onOptionsPress, rank }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      style={({ pressed }) => [
        styles.container,
        active && styles.activeContainer,
        pressed && styles.pressed,
      ]}>
      {rank !== undefined ? (
        <Text style={[styles.rank, active && styles.activeRank]}>{rank}</Text>
      ) : null}

      <View style={styles.artworkContainer}>
        <TrackArtwork
          track={track}
          style={styles.artwork}
          contentFit="cover"
          transition={160}
        />
        {active && <EqualizerBars />}
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, active && styles.activeTitle]}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {track.artist}
        </Text>
      </View>

      {onOptionsPress && (
        <Pressable
          hitSlop={12}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: '#2A332B',
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  rank: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  activeRank: {
    color: colors.primary,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceHighest,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  equalizerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
  },
  eqBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  activeTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  moreBtn: {
    padding: 8,
  },
});

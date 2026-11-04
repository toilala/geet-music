import { SymbolView } from 'expo-symbols';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';
import type { Track } from '@/data/music';
import { TrackArtwork } from '@/components/music/track-artwork';

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
  const { isDockCollapsed, hidePlayerThumbnail } = usePlayer();
  const [visibility] = useState(() => new Animated.Value(isDockCollapsed ? 0 : 1));

  useEffect(() => {
    Animated.spring(visibility, {
      toValue: isDockCollapsed ? 0 : 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [isDockCollapsed, visibility]);

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <Animated.View
      pointerEvents={isDockCollapsed ? 'none' : 'auto'}
      style={[
        styles.animatedWrapper,
        {
          opacity: visibility,
          transform: [
            {
              translateY: visibility.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
            {
              scale: visibility.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Now playing ${track.title} by ${track.artist}. Tap to open player.`}
        style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
        <View style={styles.container}>
        {/* Rounded Artwork */}
        {!hidePlayerThumbnail && (
          <TrackArtwork
            track={track}
            style={styles.artwork}
            contentFit="cover"
            transition={160}
          />
        )}

        {/* Title & Artist */}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {track.artist}
          </Text>
        </View>

        {/* Transport Controls: Play/Pause and Skip Next */}
        <View style={styles.actions}>
          <Pressable
            hitSlop={12}
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            onPress={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={styles.controlBtn}>
            <SymbolView
              name={
                playing
                  ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                  : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
              }
              tintColor="#FFFFFF"
              size={22}
            />
          </Pressable>

          {onNext && (
            <Pressable
              hitSlop={12}
              accessibilityLabel="Skip next"
              onPress={(e) => {
                e.stopPropagation();
                onNext();
              }}
              style={styles.controlBtn}>
              <SymbolView
                name={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }}
                tintColor="#FFFFFF"
                size={22}
              />
            </Pressable>
          )}
        </View>
        </View>

        {/* Thin bottom progress line */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: `${progress * 100}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    width: '100%',
  },
  wrapper: {
    borderRadius: 28,
    backgroundColor: 'rgba(23, 28, 26, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    paddingRight: 14,
    gap: 12,
  },
  artwork: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceHighest,
  },
  meta: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#9EAAA6',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressValue: {
    height: 2,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});

import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Track } from '@/data/music';

const colors = Colors.dark;

type Props = {
  tracks: Track[];
  activeTrackId?: string;
  isPlaying?: boolean;
  onPlayTrack: (track: Track) => void;
  onOptionsPress: (track: Track) => void;
};

export function QuickPicksGrid({ tracks, activeTrackId, isPlaying, onPlayTrack, onOptionsPress }: Props) {

  const displayTracks = tracks.slice(0, 8);

  return (
    <View style={styles.container}>
      {displayTracks.map((track) => {
        const isActive = track.id === activeTrackId && isPlaying;
        return (
          <Pressable
            key={track.id}
            onPress={() => onPlayTrack(track)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <Image source={track.artwork} style={styles.artwork} contentFit="cover" transition={160} />
            <View style={styles.meta}>
              <Text numberOfLines={1} style={[styles.title, isActive && styles.activeTitle]}>
                {track.title}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {track.artist}
              </Text>
            </View>

            {isActive ? (
              <View style={styles.playingBadge}>
                <SymbolView
                  name={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
                  tintColor={colors.primary}
                  size={16}
                />
              </View>
            ) : null}

            <Pressable
              hitSlop={12}
              onPress={(e) => {
                e.stopPropagation();
                onOptionsPress(track);
              }}
              style={styles.moreButton}>
              <SymbolView
                name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
                tintColor={colors.textSecondary}
                size={18}
              />
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
  activeTitle: {
    color: colors.primary,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  playingBadge: {
    paddingHorizontal: 6,
  },
  moreButton: {
    padding: 8,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

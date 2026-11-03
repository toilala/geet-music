import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { forwardRef } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import type { Track } from '@/data/music';

const colors = Colors.dark;

type Props = {
  track: Track | null;
  onOpenPlaylistModal?: (track: Track) => void;
};

export const TrackOptionsSheet = forwardRef<BottomSheetModal, Props>(({ track, onOpenPlaylistModal }, ref) => {
  const { playNextInQueue, addToQueue, startRadio } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();

  if (!track) return null;
  const liked = isLiked(track.id);

  const handleShare = async () => {
    try {
      await Share.share({
        title: track.title,
        message: `Listen to "${track.title}" by ${track.artist} on Geet Music: https://www.youtube.com/watch?v=${track.videoId}`,
      });
    } catch {

    }
  };

  const handlePlayNext = () => {
    playNextInQueue(track);
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
    Alert.alert('Queue updated', `"${track.title}" will play next.`);
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
    Alert.alert('Queue updated', `"${track.title}" added to queue.`);
  };

  const handleStartRadio = () => {
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
    void startRadio(track);
  };

  const handleToggleLike = () => {
    toggleLike(track);
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['55%']}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>

        <View style={styles.trackCard}>
          <Image source={track.artwork} style={styles.artwork} contentFit="cover" />
          <View style={styles.trackMeta}>
            <Text numberOfLines={1} style={styles.title}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {track.artist}
            </Text>
          </View>
          <Pressable onPress={handleToggleLike} hitSlop={12} style={styles.heartButton}>
            <SymbolView
              name={
                liked
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              tintColor={liked ? '#FF5370' : colors.textSecondary}
              size={24}
            />
          </Pressable>
        </View>

        <View style={styles.divider} />


        <Pressable onPress={handleStartRadio} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
          <View style={styles.actionIcon}>
            <SymbolView name={{ ios: 'antenna.radiowaves.left.and.right', android: 'radio', web: 'radio' }} tintColor={colors.primary} size={22} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Start radio</Text>
            <Text style={styles.actionSubtitle}>Play endless music based on this song</Text>
          </View>
        </Pressable>

        <Pressable onPress={handlePlayNext} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
          <View style={styles.actionIcon}>
            <SymbolView name={{ ios: 'text.badge.plus', android: 'playlist_play', web: 'playlist_play' }} tintColor={colors.primary} size={22} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Play next</Text>
            <Text style={styles.actionSubtitle}>Add right after current track</Text>
          </View>
        </Pressable>

        <Pressable onPress={handleAddToQueue} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
          <View style={styles.actionIcon}>
            <SymbolView name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }} tintColor={colors.primary} size={22} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Add to queue</Text>
            <Text style={styles.actionSubtitle}>Append to end of your queue</Text>
          </View>
        </Pressable>

        {onOpenPlaylistModal && (
          <Pressable
            onPress={() => {
              if (typeof ref === 'object' && ref?.current) {
                ref.current.dismiss();
              }
              onOpenPlaylistModal(track);
            }}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
            <View style={styles.actionIcon}>
              <SymbolView name={{ ios: 'folder.badge.plus', android: 'library_add', web: 'library_add' }} tintColor={colors.primary} size={22} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Add to playlist</Text>
              <Text style={styles.actionSubtitle}>Save into custom collections</Text>
            </View>
          </Pressable>
        )}

        <Pressable onPress={handleShare} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
          <View style={styles.actionIcon}>
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} tintColor={colors.primary} size={22} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Share</Text>
            <Text style={styles.actionSubtitle}>Send to friends or copy link</Text>
          </View>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

TrackOptionsSheet.displayName = 'TrackOptionsSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#161F1E',
  },
  sheetHandle: {
    backgroundColor: colors.outline,
    width: 48,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceHighest,
  },
  trackMeta: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  heartButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceHighest,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pressed: {
    backgroundColor: colors.surfaceHigh,
  },
});

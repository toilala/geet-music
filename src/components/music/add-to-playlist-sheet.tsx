import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { forwardRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import type { Track } from '@/data/music';

const colors = Colors.dark;

type Props = {
  track: Track | null;
  onPlaylistCreated?: () => void;
};

export const AddToPlaylistSheet = forwardRef<BottomSheetModal, Props>(({ track }, ref) => {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibrary();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!track) return null;

  const handleSelectPlaylist = (playlistId: string, title: string) => {
    const success = addTrackToPlaylist(playlistId, track);
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
    if (success) {
      Alert.alert('Added to playlist', `"${track.title}" added to ${title}`);
    } else {
      Alert.alert('Already added', `This song is already in ${title}`);
    }
  };

  const handleCreateAndAdd = () => {
    if (!newTitle.trim()) return;
    const pl = createPlaylist(newTitle.trim());
    addTrackToPlaylist(pl.id, track);
    setNewTitle('');
    setIsCreating(false);
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
    Alert.alert('Created and added', `Created "${pl.title}" with "${track.title}"`);
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['60%']}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Add to playlist</Text>
        <Text style={styles.headerSubtitle}>Choose a collection or create a new one</Text>

        {isCreating ? (
          <View style={styles.createBox}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Playlist name..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              autoFocus
            />
            <View style={styles.createActions}>
              <Pressable onPress={() => setIsCreating(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateAndAdd}
                disabled={!newTitle.trim()}
                style={[styles.confirmBtn, !newTitle.trim() && styles.disabled]}>
                <Text style={styles.confirmText}>Create & Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setIsCreating(true)} style={styles.newPlaylistBtn}>
            <View style={styles.newIcon}>
              <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={colors.onPrimary} size={20} />
            </View>
            <Text style={styles.newPlaylistText}>New playlist</Text>
          </Pressable>
        )}

        <View style={styles.list}>
          {playlists.length === 0 && !isCreating ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No custom playlists yet. Create your first one above!</Text>
            </View>
          ) : (
            playlists.map((item) => {
              const inPlaylist = item.tracks.some((t) => t.id === track.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectPlaylist(item.id, item.title)}
                  style={({ pressed }) => [styles.playlistRow, pressed && styles.pressed]}>
                  <View style={styles.playlistIcon}>
                    <SymbolView
                      name={{ ios: 'music.note.list', android: 'playlist_play', web: 'playlist_play' }}
                      tintColor={colors.primary}
                      size={22}
                    />
                  </View>
                  <View style={styles.playlistMeta}>
                    <Text numberOfLines={1} style={styles.playlistTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.playlistCount}>{item.tracks.length} songs</Text>
                  </View>
                  {inPlaylist && (
                    <SymbolView
                      name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                      tintColor={colors.primary}
                      size={20}
                    />
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

AddToPlaylistSheet.displayName = 'AddToPlaylistSheet';

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
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    marginBottom: 16,
  },
  newIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlaylistText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  createBox: {
    backgroundColor: colors.surfaceHigh,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmText: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
  list: {
    gap: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistMeta: {
    flex: 1,
    gap: 3,
  },
  playlistTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  playlistCount: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  pressed: {
    backgroundColor: colors.surfaceHigh,
  },
});

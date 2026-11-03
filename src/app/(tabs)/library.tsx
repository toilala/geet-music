import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistSheet } from '@/components/music/add-to-playlist-sheet';
import { MiniPlayer } from '@/components/music/mini-player';
import { SongRow } from '@/components/music/song-row';
import { TrackOptionsSheet } from '@/components/music/track-options-sheet';
import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import type { Playlist, Track } from '@/data/music';

const colors = Colors.dark;

type FilterTab = 'all' | 'playlists' | 'liked' | 'history';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { activeTrack, currentTime, duration, playing, selectTrack, setPlaying, togglePlayback, playNext } =
    usePlayer();
  const {
    likedTracks,
    playlists,
    history,
    clearHistory,
    createPlaylist,
    deletePlaylist,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);

  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);

  const handlePlay = (track: Track, queueList?: Track[]) => {
    selectTrack(track, queueList);
    setPlaying(true);
    router.push({
      pathname: '/player/[id]',
      params: {
        id: track.id,
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
      },
    });
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert('Delete Playlist', `Are you sure you want to delete "${playlist.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(playlist.id);
          if (selectedPlaylist?.id === playlist.id) {
            setSelectedPlaylist(null);
          }
        },
      },
    ]);
  };

  const openOptions = (track: Track) => {
    setOptionsTrack(track);
    optionsSheetRef.current?.present();
  };

  const openAddToPlaylist = (track: Track) => {
    setPlaylistTrack(track);
    playlistSheetRef.current?.present();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR SPACE</Text>
            <Text style={styles.title}>Library</Text>
          </View>
          <Pressable
            onPress={() => setIsCreatingPlaylist(true)}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={colors.onPrimary}
              size={20}
            />
          </Pressable>
        </View>


        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'playlists', label: `Playlists (${playlists.length})` },
              { id: 'liked', label: `Liked (${likedTracks.length})` },
              { id: 'history', label: `History (${history.length})` },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => {
                setActiveTab(tab.id);
                setSelectedPlaylist(null);
              }}
              style={[styles.pill, activeTab === tab.id && styles.pillActive]}>
              <Text style={[styles.pillText, activeTab === tab.id && styles.pillTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>


        {isCreatingPlaylist && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>New Playlist</Text>
            <TextInput
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Give your playlist a title..."
              placeholderTextColor={colors.textSecondary}
              style={styles.createInput}
              autoFocus
            />
            <View style={styles.createActions}>
              <Pressable onPress={() => setIsCreatingPlaylist(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                style={[styles.confirmBtn, !newPlaylistName.trim() && styles.disabled]}>
                <Text style={styles.confirmText}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}


        {selectedPlaylist ? (
          <View style={styles.playlistDetail}>
            <Pressable onPress={() => setSelectedPlaylist(null)} style={styles.backBtn}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor={colors.primary}
                size={18}
              />
              <Text style={styles.backText}>All Playlists</Text>
            </Pressable>

            <View style={styles.playlistHero}>
              <View style={styles.playlistCover}>
                {selectedPlaylist.artwork ? (
                  <Image source={selectedPlaylist.artwork} style={StyleSheet.absoluteFill} />
                ) : (
                  <SymbolView
                    name={{ ios: 'music.note.list', android: 'playlist_play', web: 'playlist_play' }}
                    tintColor={colors.primary}
                    size={38}
                  />
                )}
              </View>
              <View style={styles.playlistMeta}>
                <Text style={styles.detailTitle}>{selectedPlaylist.title}</Text>
                <Text style={styles.detailCount}>{selectedPlaylist.tracks.length} songs</Text>
                <View style={styles.detailActions}>
                  {selectedPlaylist.tracks.length > 0 && (
                    <Pressable
                      onPress={() => handlePlay(selectedPlaylist.tracks[0], selectedPlaylist.tracks)}
                      style={styles.playAllBtn}>
                      <SymbolView
                        name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
                        tintColor={colors.onPrimary}
                        size={16}
                      />
                      <Text style={styles.playAllText}>Play</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleDeletePlaylist(selectedPlaylist)}
                    style={styles.deleteBtn}>
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                      tintColor="#FF8B8B"
                      size={18}
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {selectedPlaylist.tracks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>This playlist is empty.</Text>
                <Text style={styles.emptySub}>Add songs from Home, Search, or Liked Songs.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {selectedPlaylist.tracks.map((track) => (
                  <SongRow
                    key={track.id}
                    track={track}
                    active={track.id === activeTrack.id && playing}
                    onPress={() => handlePlay(track, selectedPlaylist.tracks)}
                    onOptionsPress={openOptions}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>

            {activeTab === 'all' && (
              <View style={styles.quickGrid}>

                <Pressable
                  onPress={() => setActiveTab('liked')}
                  style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
                  <View style={[styles.cardIcon, { backgroundColor: '#FF3B5C' }]}>
                    <SymbolView
                      name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
                      tintColor="#FFF"
                      size={22}
                    />
                  </View>
                  <Text style={styles.cardTitle}>Liked songs</Text>
                  <Text style={styles.cardSubtitle}>{likedTracks.length} auto playlist</Text>
                </Pressable>


                <Pressable
                  onPress={() => setActiveTab('history')}
                  style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.primary }]}>
                    <SymbolView
                      name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
                      tintColor={colors.onPrimary}
                      size={22}
                    />
                  </View>
                  <Text style={styles.cardTitle}>History</Text>
                  <Text style={styles.cardSubtitle}>{history.length} played</Text>
                </Pressable>
              </View>
            )}


            {(activeTab === 'all' || activeTab === 'playlists') && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Custom Playlists</Text>
                  <Text style={styles.sectionCount}>{playlists.length}</Text>
                </View>

                {playlists.length === 0 ? (
                  <Pressable onPress={() => setIsCreatingPlaylist(true)} style={styles.emptyCreateCard}>
                    <SymbolView
                      name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                      tintColor={colors.primary}
                      size={28}
                    />
                    <View style={styles.emptyCreateMeta}>
                      <Text style={styles.emptyCreateTitle}>Create your first playlist</Text>
                      <Text style={styles.emptyCreateSub}>Group songs for workout, chill, or road trips</Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.playlistList}>
                    {playlists.map((pl) => (
                      <Pressable
                        key={pl.id}
                        onPress={() => setSelectedPlaylist(pl)}
                        style={({ pressed }) => [styles.playlistItem, pressed && styles.pressed]}>
                        <View style={styles.itemArtwork}>
                          {pl.artwork ? (
                            <Image source={pl.artwork} style={StyleSheet.absoluteFill} />
                          ) : (
                            <SymbolView
                              name={{ ios: 'music.note.list', android: 'playlist_play', web: 'playlist_play' }}
                              tintColor={colors.primary}
                              size={22}
                            />
                          )}
                        </View>
                        <View style={styles.itemMeta}>
                          <Text numberOfLines={1} style={styles.itemTitle}>
                            {pl.title}
                          </Text>
                          <Text style={styles.itemSubtitle}>{pl.tracks.length} songs</Text>
                        </View>
                        <SymbolView
                          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                          tintColor={colors.textSecondary}
                          size={18}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}


            {(activeTab === 'all' || activeTab === 'liked') && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Liked Songs</Text>
                  <Text style={styles.sectionCount}>{likedTracks.length}</Text>
                </View>

                {likedTracks.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <SymbolView
                      name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
                      tintColor={colors.textSecondary}
                      size={28}
                    />
                    <Text style={styles.emptyText}>No liked songs yet</Text>
                    <Text style={styles.emptySub}>Tap the heart icon on any song to save it here</Text>
                  </View>
                ) : (
                  <View style={styles.list}>
                    {likedTracks.map((track) => (
                      <SongRow
                        key={track.id}
                        track={track}
                        active={track.id === activeTrack.id && playing}
                        onPress={() => handlePlay(track, likedTracks)}
                        onOptionsPress={openOptions}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}


            {(activeTab === 'all' || activeTab === 'history') && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recently Played</Text>
                  {history.length > 0 && (
                    <Pressable onPress={clearHistory} hitSlop={10}>
                      <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                  )}
                </View>

                {history.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No listening history yet</Text>
                    <Text style={styles.emptySub}>Tracks you play will show up here</Text>
                  </View>
                ) : (
                  <View style={styles.list}>
                    {history.map((track) => (
                      <SongRow
                        key={track.id}
                        track={track}
                        active={track.id === activeTrack.id && playing}
                        onPress={() => handlePlay(track, history)}
                        onOptionsPress={openOptions}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>


      <View style={[styles.playerDock, { bottom: insets.bottom + 65 }]}>
        <MiniPlayer
          track={activeTrack}
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          onToggle={togglePlayback}
          onNext={playNext}
          onOpen={() =>
            router.push({
              pathname: '/player/[id]',
              params: {
                id: activeTrack.id,
                videoId: activeTrack.videoId,
                title: activeTrack.title,
                artist: activeTrack.artist,
                artwork: activeTrack.artwork,
                duration: activeTrack.duration,
              },
            })
          }
        />
      </View>


      <TrackOptionsSheet
        ref={optionsSheetRef}
        track={optionsTrack}
        onOpenPlaylistModal={openAddToPlaylist}
      />


      <AddToPlaylistSheet ref={playlistSheetRef} track={playlistTrack} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPills: {
    gap: 8,
    paddingBottom: 20,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  createCard: {
    backgroundColor: colors.surfaceHigh,
    padding: 18,
    borderRadius: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    gap: 12,
  },
  createTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  createInput: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    color: colors.text,
    fontSize: 15,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  confirmText: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCount: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  clearText: {
    color: '#FF8B8B',
    fontWeight: '700',
    fontSize: 13,
  },
  playlistList: {
    gap: 8,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceHigh,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  itemArtwork: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemMeta: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyCreateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    borderStyle: 'dashed',
  },
  emptyCreateMeta: {
    flex: 1,
    gap: 2,
  },
  emptyCreateTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCreateSub: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyBox: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  playlistDetail: {
    gap: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  playlistHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surfaceHigh,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  playlistCover: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playlistMeta: {
    flex: 1,
    gap: 6,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  detailCount: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  playAllText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 6,
  },
  list: {
    gap: 2,
  },
  playerDock: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});

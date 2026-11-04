import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToPlaylistSheet } from '@/components/music/add-to-playlist-sheet';
import { MiniPlayer } from '@/components/music/mini-player';
import { SongRow } from '@/components/music/song-row';
import { TrackOptionsSheet } from '@/components/music/track-options-sheet';
import { Colors } from '@/constants/theme';
import { useLibrary } from '@/context/library-context';
import { usePlayer } from '@/context/player-context';
import { tracks, type Playlist, type Track } from '@/data/music';
import { getBottom50Tracks, getTop50Tracks } from '@/services/recommendations';

const colors = Colors.dark;

type FilterTab = 'Playlists' | 'Songs' | 'Albums' | 'Artists' | 'Local';
type ActiveView = 'main' | 'liked' | 'top50' | 'bottom50' | 'downloaded' | 'cached' | 'playlist-detail';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeTrack,
    currentTime,
    duration,
    playing,
    selectTrack,
    setPlaying,
    togglePlayback,
    playNext,
    isDockCollapsed,
    setIsDockCollapsed,
  } = usePlayer();
  const {
    likedTracks,
    playlists,
    createPlaylist,
    deletePlaylist,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<FilterTab>('Playlists');
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [top50Tracks, setTop50Tracks] = useState<Track[]>([]);
  const [bottom50Tracks, setBottom50Tracks] = useState<Track[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);

  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const playlistSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    void getTop50Tracks().then(setTop50Tracks);
    void getBottom50Tracks().then(setBottom50Tracks);
  }, []);

  const handlePlay = (track: Track, queueList?: Track[]) => {
    selectTrack(track, queueList || tracks);
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
            setActiveView('main');
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

  // Render detail view for Liked, Top 50, Bottom 50, or Selected Playlist
  const renderDetailList = (title: string, trackList: Track[]) => (
    <View style={styles.detailSection}>
      <Pressable onPress={() => setActiveView('main')} style={styles.backButton}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          tintColor={colors.primary}
          size={18}
        />
        <Text style={styles.backButtonText}>Back to Library</Text>
      </Pressable>

      <View style={styles.detailHeader}>
        <View>
          <Text style={styles.detailTitle}>{title}</Text>
          <Text style={styles.detailCount}>{trackList.length} songs</Text>
        </View>
        {trackList.length > 0 && (
          <Pressable onPress={() => handlePlay(trackList[0], trackList)} style={styles.playAllPill}>
            <SymbolView
              name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
              tintColor={colors.onPrimary}
              size={16}
            />
            <Text style={styles.playAllPillText}>Play All</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.cardContainer}>
        {trackList.length === 0 ? (
          <Text style={styles.emptyText}>No songs yet in this list.</Text>
        ) : (
          trackList.map((t) => (
            <SongRow
              key={t.id}
              track={t}
              active={t.id === activeTrack.id && playing}
              onPress={() => handlePlay(t, trackList)}
              onOptionsPress={openOptions}
            />
          ))
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 140 },
        ]}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (y > 60 && !isDockCollapsed) {
            setIsDockCollapsed(true);
          } else if (y <= 20 && isDockCollapsed) {
            setIsDockCollapsed(false);
          }
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Top Header matching Echo Music Screenshot 1 */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Library</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
                tintColor={colors.text}
                size={21}
              />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
                tintColor={colors.text}
                size={20}
              />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
                tintColor={colors.text}
                size={20}
              />
            </Pressable>
            <Pressable style={styles.avatarBtn}>
              <Text style={styles.avatarText}>GM</Text>
              <View style={styles.avatarOnlineDot} />
            </Pressable>
          </View>
        </View>

        {activeView === 'liked' ? (
          renderDetailList('Liked Songs', likedTracks)
        ) : activeView === 'top50' ? (
          renderDetailList('My Top 50', top50Tracks)
        ) : activeView === 'bottom50' ? (
          renderDetailList('My Bottom 50', bottom50Tracks)
        ) : activeView === 'playlist-detail' && selectedPlaylist ? (
          renderDetailList(selectedPlaylist.title, selectedPlaylist.tracks)
        ) : (
          <>
            {/* Filter Pills matching Echo Music: Playlists, Songs, Albums, Artists, Local */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsContainer}>
              {(['Playlists', 'Songs', 'Albums', 'Artists', 'Local'] as FilterTab[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => {
                      try {
                        Vibration.vibrate(8);
                      } catch {}
                      setActiveTab(tab);
                    }}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Sort Row: Date added + Chevron button */}
            <View style={styles.sortRow}>
              <View style={styles.sortPill}>
                <Text style={styles.sortText}>Date added</Text>
              </View>
              <Pressable style={styles.chevronBtn}>
                <SymbolView
                  name={{ ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }}
                  tintColor={colors.text}
                  size={16}
                />
              </Pressable>
            </View>

            {/* 2-Column Action Cards Grid matching Echo Music Screenshot 1 */}
            <View style={styles.actionGrid}>
              {/* Row 1: Liked & Downloaded */}
              <View style={styles.gridRow}>
                <Pressable
                  onPress={() => setActiveView('liked')}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>Liked</Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveView('liked')}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>Downloaded</Text>
                </Pressable>
              </View>

              {/* Row 2: Exported & Cached */}
              <View style={styles.gridRow}>
                <Pressable
                  onPress={() => setActiveView('liked')}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'square.and.arrow.down', android: 'download', web: 'download' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>Exported</Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveView('top50')}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>Cached</Text>
                </Pressable>
              </View>

              {/* Row 3: My top 50 & My bottom 50 */}
              <View style={styles.gridRow}>
                <Pressable
                  onPress={() => setActiveView('top50')}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>My top 50</Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveView('bottom50')}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'chart.line.downtrend.xyaxis', android: 'trending_down', web: 'trending_down' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>My bottom 50</Text>
                </Pressable>
              </View>

              {/* Row 4: Local */}
              <View style={styles.gridRow}>
                <Pressable
                  onPress={() => setActiveView('top50')}
                  style={({ pressed }) => [styles.gridCard, styles.singleGridCard, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'folder', android: 'folder', web: 'folder' }}
                    tintColor="#FFFFFF"
                    size={20}
                  />
                  <Text style={styles.gridCardText}>Local</Text>
                </Pressable>
              </View>
            </View>

            {/* Section: Playlists matching Screenshot 1 */}
            <View style={styles.playlistsSection}>
              <View style={styles.playlistsHeader}>
                <Text style={styles.sectionTitle}>Playlists</Text>
                <Pressable
                  onPress={() => setIsCreatingPlaylist(true)}
                  style={styles.addPlaylistBtn}>
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
                </Pressable>
              </View>

              {isCreatingPlaylist && (
                <View style={styles.createCard}>
                  <TextInput
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    placeholder="Playlist name..."
                    placeholderTextColor="#7C8D89"
                    style={styles.createInput}
                    autoFocus
                  />
                  <View style={styles.createActions}>
                    <Pressable onPress={() => setIsCreatingPlaylist(false)} style={styles.cancelBtn}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleCreatePlaylist} style={styles.confirmBtn}>
                      <Text style={styles.confirmText}>Create</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* 2-Column Playlists Grid with Collage Artworks */}
              <View style={styles.playlistsGrid}>
                {/* Default Playlist Icon Card */}
                <Pressable
                  onPress={() => {
                    if (playlists.length > 0) {
                      setSelectedPlaylist(playlists[0]);
                      setActiveView('playlist-detail');
                    } else {
                      setIsCreatingPlaylist(true);
                    }
                  }}
                  style={styles.playlistArtCard}>
                  <SymbolView
                    name={{ ios: 'music.note.list', android: 'playlist_play', web: 'playlist_play' }}
                    tintColor="#6E6460"
                    size={48}
                  />
                </Pressable>

                {/* 4-Quadrant Collage Playlist Card with `+` badge matching Screenshot 1 */}
                <Pressable
                  onPress={() => setIsCreatingPlaylist(true)}
                  style={styles.collageCard}>
                  <View style={styles.collageGrid}>
                    <Image
                      source="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80"
                      style={styles.collageQuarter}
                    />
                    <Image
                      source="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80"
                      style={styles.collageQuarter}
                    />
                    <Image
                      source="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&q=80"
                      style={styles.collageQuarter}
                    />
                    <Image
                      source="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80"
                      style={styles.collageQuarter}
                    />
                  </View>
                  <View style={styles.addCircleBadge}>
                    <SymbolView
                      name={{ ios: 'plus', android: 'add', web: 'add' }}
                      tintColor="#0D0B0A"
                      size={18}
                    />
                  </View>
                </Pressable>
              </View>

              {/* Custom Playlists List */}
              {playlists.length > 0 && (
                <View style={styles.playlistRows}>
                  {playlists.map((pl) => (
                    <Pressable
                      key={pl.id}
                      onPress={() => {
                        setSelectedPlaylist(pl);
                        setActiveView('playlist-detail');
                      }}
                      onLongPress={() => handleDeletePlaylist(pl)}
                      style={styles.playlistRowItem}>
                      <View style={styles.playlistIconBox}>
                        <SymbolView
                          name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }}
                          tintColor={colors.primary}
                          size={20}
                        />
                      </View>
                      <View style={styles.playlistMeta}>
                        <Text style={styles.playlistTitle}>{pl.title}</Text>
                        <Text style={styles.playlistSub}>{pl.tracks.length} songs</Text>
                      </View>
                      <SymbolView
                        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                        tintColor="#7C8D89"
                        size={16}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Mini Player positioned above floating bottom tabs */}
      <View style={[styles.playerDock, { bottom: insets.bottom + 72 }]}>
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
    backgroundColor: '#0D0B0A',
  },
  content: {
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 2,
    position: 'relative',
  },
  avatarText: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryContainer,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
    borderWidth: 1.5,
    borderColor: colors.outlineActive,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#3DD598',
    borderWidth: 2,
    borderColor: '#0D0B0A',
  },
  filterPillsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  filterPillText: {
    color: '#9E938F',
    fontSize: 13.5,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sortPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sortText: {
    color: '#D4DDD9',
    fontSize: 13,
    fontWeight: '700',
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGrid: {
    gap: 10,
    marginBottom: 28,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E1918',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  singleGridCard: {
    flex: 0.485,
  },
  gridCardText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  playlistsSection: {
    marginBottom: 20,
  },
  playlistsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  addPlaylistBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  playlistArtCard: {
    flex: 1,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#1E1918',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  collageCard: {
    flex: 1,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1918',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  collageGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collageQuarter: {
    width: '50%',
    height: '50%',
  },
  addCircleBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5A952',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playlistRows: {
    gap: 8,
    marginTop: 8,
  },
  playlistRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E1918',
    padding: 12,
    borderRadius: 18,
  },
  playlistIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#26201F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistMeta: {
    flex: 1,
    gap: 2,
  },
  playlistTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  playlistSub: {
    color: '#9E938F',
    fontSize: 12,
  },
  createCard: {
    backgroundColor: '#1E1918',
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    gap: 10,
  },
  createInput: {
    backgroundColor: '#120F0E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    color: '#9E938F',
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  confirmText: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  detailSection: {
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  detailCount: {
    color: '#9E938F',
    fontSize: 13,
  },
  playAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  playAllPillText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  cardContainer: {
    backgroundColor: '#1A1514',
    borderRadius: 24,
    padding: 6,
    gap: 2,
  },
  emptyText: {
    color: '#9E938F',
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
  },
  playerDock: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 900,
  },
  pressed: {
    opacity: 0.8,
  },
});

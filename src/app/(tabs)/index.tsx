import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumCard } from '@/components/music/album-card';
import { MiniPlayer } from '@/components/music/mini-player';
import { SearchBar } from '@/components/music/search-bar';
import { SongRow } from '@/components/music/song-row';
import { collections, tracks, type Track } from '@/data/music';
import { usePlayer } from '@/context/player-context';
import { getPopularYouTube } from '@/services/youtube';
import { Colors } from '@/constants/theme';

const colors = { background: Colors.dark.background, surface: Colors.dark.surface, surfaceHighest: Colors.dark.surfaceHighest, text: Colors.dark.text, muted: Colors.dark.textSecondary, accent: Colors.dark.primary, tertiary: Colors.dark.tertiary };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [homeTracks, setHomeTracks] = useState<Track[]>(tracks);
  const { activeTrack, playing, selectTrack, setPlaying, togglePlayback } = usePlayer();

  useEffect(() => {
    let mounted = true;
    void getPopularYouTube().then((popularTracks) => {
      if (mounted && popularTracks.length > 0) setHomeTracks(popularTracks);
    }).catch(() => {
      // The curated tracks keep the home screen useful when the API is unavailable.
    });
    return () => { mounted = false; };
  }, []);

  const playTrack = (track: Track) => {
    selectTrack(track);
    setPlaying(false);
    router.push({ pathname: '/player/[id]', params: { id: track.id, videoId: track.videoId, title: track.title, artist: track.artist, artwork: track.artwork, duration: track.duration } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.kicker}>YOUR LIBRARY</Text><Text style={styles.greeting}>Good evening</Text></View>
          <Pressable style={styles.avatar} accessibilityLabel="Open profile"><Text style={styles.avatarText}>G</Text></Pressable>
        </View>

        <SearchBar onPress={() => router.push('/explore')} />

        <View style={styles.hero}>
          <Image source={collections[0].artwork} style={StyleSheet.absoluteFill} contentFit="cover" transition={240} />
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>YOUR DAILY MIX</Text></View>
            <Text style={styles.heroTitle}>Music for this moment</Text>
            <Text style={styles.heroSubtitle}>Pick up where you left off and keep the music moving.</Text>
            <Pressable onPress={() => playTrack(homeTracks[0])} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
              <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} tintColor="#21152E" size={17} />
              <Text style={styles.heroButtonText}>Start listening</Text>
            </Pressable>
          </View>
        </View>

        <SectionHeader title="Made for you" action="See all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
          {collections.map((collection, index) => <AlbumCard key={collection.id} collection={collection} onPress={() => playTrack(homeTracks[index % homeTracks.length])} />)}
        </ScrollView>

        <SectionHeader title="Recently played" action="See all" />
        <View style={styles.songList}>{homeTracks.slice(0, 5).map((track) => <SongRow key={track.id} track={track} active={track.id === activeTrack.id && playing} onPress={() => playTrack(track)} />)}</View>

        <SectionHeader title="Jump back in" action="See all" />
        <View style={styles.resumeCard}>
          <View style={[styles.resumeIcon, { backgroundColor: colors.tertiary }]}><SymbolView name={{ ios: 'headphones', android: 'headphones', web: 'headphones' }} tintColor={colors.background} size={22} /></View>
          <View style={styles.moodCopy}><Text style={styles.moodTitle}>Continue listening</Text><Text style={styles.moodSubtitle}>Your recent music, right where you left it.</Text></View>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={colors.muted} size={18} />
        </View>
      </ScrollView>

      <View style={[styles.playerDock, { bottom: insets.bottom + 78 }]}><MiniPlayer track={activeTrack} playing={playing} onToggle={() => { if (playing) togglePlayback(); else playTrack(activeTrack); }} onOpen={() => playTrack(activeTrack)} /></View>
    </View>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }, greeting: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '800', marginTop: 5 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#21152E', fontSize: 18, fontWeight: '800' },
  hero: { height: 306, overflow: 'hidden', borderRadius: 28, backgroundColor: colors.surfaceHighest, marginBottom: 32 }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 24, 22, 0.56)' }, heroContent: { flex: 1, justifyContent: 'flex-end', padding: 22 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(120, 214, 200, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 12 }, heroBadgeText: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, heroTitle: { color: '#F3FFFC', fontSize: 27, lineHeight: 32, fontWeight: '800', maxWidth: 260 }, heroSubtitle: { color: '#D5E4E0', fontSize: 14, lineHeight: 20, marginTop: 7, maxWidth: 275 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 18, marginTop: 18 }, heroButtonText: { color: '#21152E', fontSize: 13, fontWeight: '800' }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800' }, sectionAction: { color: colors.accent, fontSize: 13, fontWeight: '700' }, horizontalRow: { gap: 16, paddingBottom: 32 }, songList: { gap: 4, marginBottom: 28 },
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: Colors.dark.outline }, resumeIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, moodCopy: { flex: 1, gap: 3 }, moodTitle: { color: colors.text, fontSize: 15, fontWeight: '700' }, moodSubtitle: { color: colors.muted, fontSize: 12 }, playerDock: { position: 'absolute', left: 12, right: 12 },
});

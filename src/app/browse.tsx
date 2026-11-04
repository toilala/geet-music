import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getChartsPage, getExplorePage, getMoodAndGenreSections, type BrowsePage, type BrowseSection } from '@/services/browse';
import { SongRow } from '@/components/music/song-row';
import { usePlayer } from '@/context/player-context';
import type { Track } from '@/types/music';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export default function BrowseScreen() {
  const { activeTrack, selectTrack, setPlaying } = usePlayer();
  const [page, setPage] = useState<BrowsePage | null>(null);
  const [sections, setSections] = useState<BrowseSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getExplorePage(), getChartsPage(), getMoodAndGenreSections()])
      .then(([explore, charts, moods]) => {
        setPage({ sections: [...explore.sections, ...charts.sections] });
        setSections(moods);
      })
      .catch((error) => console.warn('Browse loading failed:', error))
      .finally(() => setLoading(false));
  }, []);

  const play = (track: Track, queue: Track[]) => {
    selectTrack(track, queue);
    setPlaying(true);
    router.push({ pathname: '/player/[id]', params: { id: track.id, videoId: track.videoId, title: track.title, artist: track.artist, artwork: track.artwork, duration: track.duration } });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>EXPLORE</Text>
      <Text style={styles.title}>Browse everything</Text>
      {loading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {[...(page?.sections ?? []), ...sections].map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.slice(0, 5).map((track) => (
            <SongRow key={`${section.id}-${track.id}`} track={track} active={activeTrack.id === track.id} onPress={() => play(track, section.items)} onOptionsPress={() => undefined} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 140, backgroundColor: colors.background },
  back: { color: '#FFFFFF', fontSize: 17, marginBottom: 22 },
  eyebrow: { color: colors.primary, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: 8, marginBottom: 20 },
  loader: { marginVertical: 28 },
  section: { marginBottom: 26 },
  sectionTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', marginBottom: 8 },
});

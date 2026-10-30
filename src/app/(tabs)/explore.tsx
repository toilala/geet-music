import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SongRow } from '@/components/music/song-row';
import { tracks, type Track } from '@/data/music';
import { searchYouTube } from '@/services/youtube';

function openTrack(track: Track) {
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
}

const colors = { background: '#100D15', surface: '#1C1722', text: '#F8F2FB', muted: '#AAA0B3', accent: '#E2B7FF' };

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [results, setResults] = useState<Track[]>(tracks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const heading = useMemo(() => searchedQuery ? `Results for “${searchedQuery}”` : 'Popular right now', [searchedQuery]);

  const runSearch = async (value = query) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;
    setQuery(nextQuery);
    setSearchedQuery(nextQuery);
    setLoading(true);
    setError('');
    try {
      setResults(await searchYouTube(nextQuery));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>DISCOVER</Text>
        <Text style={styles.title}>Find your next song</Text>
        <View style={styles.searchBox}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.muted} size={20} />
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => void runSearch()} placeholder="Songs, artists, albums" placeholderTextColor={colors.muted} style={styles.input} returnKeyType="search" />
          {query.length > 0 && <Pressable onPress={() => { setQuery(''); setSearchedQuery(''); setResults(tracks); setError(''); }}><SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={colors.muted} size={18} /></Pressable>}
        </View>
        <View style={styles.chips}>{['Chill', 'Focus', 'New releases'].map((chip) => <Pressable key={chip} onPress={() => void runSearch(chip)} style={styles.chip}><Text style={styles.chipText}>{chip}</Text></Pressable>)}</View>
        <View style={styles.resultHeader}><Text style={styles.sectionTitle}>{heading}</Text>{!loading && <Text style={styles.count}>{results.length} songs</Text>}</View>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.loadingText}>Searching YouTube…</Text></View> : error ? <View style={styles.error}><Text style={styles.errorTitle}>Search needs one setup step</Text><Text style={styles.errorText}>{error}</Text></View> : <View style={styles.results}>{results.map((track) => <SongRow key={track.id} track={track} onPress={() => openTrack(track)} />)}</View>}
        {!loading && !error && results.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>Nothing found yet</Text><Text style={styles.emptyText}>Try another artist, song, or mood.</Text></View>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20 }, kicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 31, lineHeight: 38, fontWeight: '800', marginTop: 6, marginBottom: 24 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 15, height: 56, borderWidth: 1, borderColor: '#30273A' }, input: { flex: 1, color: colors.text, fontSize: 15 }, chips: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 32 }, chip: { backgroundColor: '#282130', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14 }, chipText: { color: '#D7C9E0', fontSize: 12, fontWeight: '700' }, resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800', flex: 1 }, count: { color: colors.muted, fontSize: 12 }, results: { gap: 4 }, loading: { alignItems: 'center', gap: 12, paddingTop: 60 }, loadingText: { color: colors.muted }, error: { padding: 18, borderRadius: 18, backgroundColor: '#2A1E2E' }, errorTitle: { color: colors.text, fontWeight: '800', fontSize: 16 }, errorText: { color: colors.muted, lineHeight: 20, marginTop: 7 }, empty: { alignItems: 'center', paddingTop: 80 }, emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' }, emptyText: { color: colors.muted, marginTop: 6 },
});

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SongRow } from '@/components/music/song-row';
import { tracks } from '@/data/music';

const colors = { background: '#100D15', surface: '#1C1722', text: '#F8F2FB', muted: '#AAA0B3', accent: '#E2B7FF' };

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const results = useMemo(() => tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>DISCOVER</Text>
        <Text style={styles.title}>Find your next song</Text>
        <View style={styles.searchBox}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.muted} size={20} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Songs, artists, albums" placeholderTextColor={colors.muted} style={styles.input} returnKeyType="search" />
          {query.length > 0 && <Pressable onPress={() => setQuery('')}><SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={colors.muted} size={18} /></Pressable>}
        </View>
        <View style={styles.chips}>{['Chill', 'Focus', 'New releases'].map((chip) => <Pressable key={chip} onPress={() => setQuery(chip)} style={styles.chip}><Text style={styles.chipText}>{chip}</Text></Pressable>)}</View>
        <View style={styles.resultHeader}><Text style={styles.sectionTitle}>{query ? 'Results' : 'Popular right now'}</Text><Text style={styles.count}>{results.length} songs</Text></View>
        <View style={styles.results}>{results.map((track) => <SongRow key={track.id} track={track} onPress={() => undefined} />)}</View>
        {results.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>Nothing found yet</Text><Text style={styles.emptyText}>Try another artist, song, or mood.</Text></View>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20 }, kicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 31, lineHeight: 38, fontWeight: '800', marginTop: 6, marginBottom: 24 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 15, height: 56, borderWidth: 1, borderColor: '#30273A' }, input: { flex: 1, color: colors.text, fontSize: 15 }, chips: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 32 }, chip: { backgroundColor: '#282130', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14 }, chipText: { color: '#D7C9E0', fontSize: 12, fontWeight: '700' }, resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800' }, count: { color: colors.muted, fontSize: 12 }, results: { gap: 4 }, empty: { alignItems: 'center', paddingTop: 80 }, emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' }, emptyText: { color: colors.muted, marginTop: 6 },
});

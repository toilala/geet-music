import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SongRow } from '@/components/music/song-row';
import { usePlayer } from '@/context/player-context';
import { tracks, type Track } from '@/data/music';
import { getPopularYouTube, searchYouTube } from '@/services/youtube';

const colors = {
  background: '#100D15', surface: '#1C1722', surfaceHigh: '#282130', surfaceHighest: '#342A3E',
  text: '#F8F2FB', muted: '#B9ACBF', accent: '#E2B7FF', accentText: '#241331', outline: '#51455A', error: '#FFB4AB',
};
const suggestions = ['Chill', 'Focus', 'New releases', 'Adele', 'Afrobeats'];

function openTrack(track: Track, selectTrack: (track: Track) => void, setPlaying: (playing: boolean) => void) {
  selectTrack(track);
  setPlaying(false);
  router.push({ pathname: '/player/[id]', params: { id: track.id, videoId: track.videoId, title: track.title, artist: track.artist, artwork: track.artwork, duration: track.duration } });
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { selectTrack, setPlaying } = usePlayer();
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const heading = useMemo(() => searchedQuery ? `Results for “${searchedQuery}”` : 'Trending music', [searchedQuery]);

  useEffect(() => {
    let mounted = true;
    void getPopularYouTube().then((popularTracks) => {
      if (mounted) setResults(popularTracks.length > 0 ? popularTracks : tracks);
    }).catch(() => {
      if (mounted) { setResults(tracks); setError('Live trends are unavailable, so your starter picks are shown.'); }
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const runSearch = async (value = query) => {
    const nextQuery = value.trim();
    if (!nextQuery || loading) return;
    setQuery(nextQuery); setSearchedQuery(nextQuery); setLoading(true); setError('');
    try { setResults(await searchYouTube(nextQuery)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Search failed. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  const clearSearch = () => {
    setQuery(''); setSearchedQuery(''); setError(''); setLoading(true);
    void getPopularYouTube().then((popularTracks) => setResults(popularTracks.length > 0 ? popularTracks : tracks)).catch(() => setResults(tracks)).finally(() => setLoading(false));
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 110 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DISCOVER</Text>
            <Text style={styles.title}>What do you want{`\n`}to hear?</Text>
            <Text style={styles.subtitle}>Search the world of music on YouTube.</Text>
          </View>
          <View style={styles.headerIcon}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={colors.accent} size={23} /></View>
        </View>

        <View style={styles.searchShell}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.muted} size={21} />
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => void runSearch()} placeholder="Songs, artists, albums" placeholderTextColor={colors.muted} style={styles.input} returnKeyType="search" accessibilityLabel="Search YouTube music" />
          {query.length > 0 && <Pressable onPress={clearSearch} hitSlop={8} accessibilityLabel="Clear search"><SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={colors.muted} size={19} /></Pressable>}
          <Pressable onPress={() => void runSearch()} disabled={!query.trim() || loading} style={({ pressed }) => [styles.searchButton, (!query.trim() || loading) && styles.disabled, pressed && styles.pressed]} accessibilityLabel="Search"><SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor={colors.accentText} size={18} /></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {suggestions.map((suggestion, index) => <Pressable key={suggestion} onPress={() => void runSearch(suggestion)} style={[styles.chip, index === 0 && styles.chipSelected]}><Text style={[styles.chipText, index === 0 && styles.chipTextSelected]}>{suggestion}</Text></Pressable>)}
        </ScrollView>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>{heading}</Text><Text style={styles.sectionSubtitle}>{searchedQuery ? 'Matched videos from YouTube' : 'Fresh picks, updated live'}</Text></View><View style={styles.countBadge}><Text style={styles.count}>{results.length || '—'}</Text></View></View>
        {error.length > 0 && <View style={styles.errorBanner}><SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} tintColor={colors.error} size={18} /><Text style={styles.errorText}>{error}</Text></View>}
        {loading && results.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.accent} size="small" /><Text style={styles.loadingText}>Finding music…</Text></View> : results.length > 0 ? <View style={styles.results}>{results.map((track) => <SongRow key={track.id} track={track} onPress={() => openTrack(track, selectTrack, setPlaying)} />)}</View> : <View style={styles.empty}><View style={styles.emptyIcon}><SymbolView name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }} tintColor={colors.accent} size={24} /></View><Text style={styles.emptyTitle}>No music found</Text><Text style={styles.emptyText}>Try another artist, song, or mood.</Text></View>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }, headerCopy: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.7 }, title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.7, marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 10 },
  headerIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  searchShell: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 64, backgroundColor: colors.surfaceHigh, borderRadius: 24, paddingLeft: 18, paddingRight: 8, borderWidth: 1, borderColor: colors.outline }, input: { flex: 1, color: colors.text, fontSize: 16, minHeight: 56 },
  searchButton: { width: 46, height: 46, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  chips: { gap: 9, paddingTop: 16, paddingBottom: 30 }, chip: { borderRadius: 18, borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.surface }, chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, chipTextSelected: { color: colors.accentText },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.2 }, sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 }, countBadge: { minWidth: 36, height: 30, borderRadius: 15, backgroundColor: colors.surfaceHighest, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, count: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  results: { gap: 8 }, loading: { alignItems: 'center', gap: 12, paddingTop: 70 }, loadingText: { color: colors.muted, fontSize: 14 }, errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 17, backgroundColor: '#321E2A', marginBottom: 12 }, errorText: { flex: 1, color: colors.error, fontSize: 12, lineHeight: 17 },
  empty: { alignItems: 'center', paddingTop: 60 }, emptyIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 14 }, emptyText: { color: colors.muted, marginTop: 6 },
});

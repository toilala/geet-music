import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useState, type ComponentRef, type RefObject } from 'react';

import type { Track } from '@/data/music';
import { getLyrics, lyricText } from '@/services/lyrics';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function LyricsSheet({ sheetRef, track }: { sheetRef: RefObject<ComponentRef<typeof BottomSheetModal> | null>; track: Track }) {
  const [lines, setLines] = useState<Awaited<ReturnType<typeof getLyrics>>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Open lyrics to load them.');

  const loadLyrics = () => {
    if (loading || lines.length > 0) return;
    setLoading(true);
    void getLyrics(track.title, track.artist)
      .then((result) => {
        setLines(result);
        if (result.length === 0) setMessage('No lyrics were found for this song.');
      })
      .catch(() => setMessage('Lyrics could not be loaded right now.'))
      .finally(() => setLoading(false));
  };

  return <BottomSheetModal ref={sheetRef} snapPoints={['72%']} backgroundStyle={styles.background} handleIndicatorStyle={styles.handle} onChange={(index) => { if (index >= 0) loadLyrics(); }}>
    <BottomSheetScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>LYRICS</Text>
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.artist}>{track.artist}</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : lines.length > 0 ? lines.map((line, index) => <Text key={`${line.startTime}-${index}`} style={styles.line}>{lyricText(line)}</Text>) : <Text style={styles.message}>{message}</Text>}
    </BottomSheetScrollView>
  </BottomSheetModal>;
}

const styles = StyleSheet.create({
  background: { backgroundColor: colors.surface },
  handle: { backgroundColor: colors.outline },
  content: { padding: 24, paddingBottom: 48 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  artist: { color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 24 },
  line: { color: colors.text, fontSize: 20, lineHeight: 32, marginBottom: 18 },
  message: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 32 },
  loader: { marginTop: 40 },
});

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, type BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { Track } from '@/data/music';
import { getLyrics } from '@/services/lyrics';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function LyricsSheet({
  sheetRef,
  track,
  currentTime,
  duration,
  onSeek,
}: {
  sheetRef: RefObject<any>;
  track: Track;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}) {
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof getLyrics>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Open lyrics to load them.');
  const scrollRef = useRef<BottomSheetScrollViewMethods | null>(null);

  const loadLyrics = () => {
    if (loading || payload) return;
    setLoading(true);
    void getLyrics(track.title, track.artist, duration || parseTrackDuration(track.duration), undefined, track.videoId)
      .then((result) => {
        setPayload(result);
        if (result.lines.length === 0) setMessage('No lyrics were found from the available providers.');
      })
      .catch(() => setMessage('Lyrics could not be loaded right now.'))
      .finally(() => setLoading(false));
  };
  const activeIndex = useMemo(() => {
    const lines = payload?.lines ?? [];
    if (!payload?.synced) return -1;
    const time = currentTime * 1000;
    let index = -1;
    lines.forEach((line, lineIndex) => {
      if (line.startTime <= time) index = lineIndex;
    });
    return index;
  }, [currentTime, payload]);

  useEffect(() => {
    if (activeIndex >= 0) {
      scrollRef.current?.scrollTo({ y: Math.max(0, activeIndex * 56 - 100), animated: true });
    }
  }, [activeIndex]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['72%']}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      onChange={(index) => {
        if (index >= 0) loadLyrics();
      }}>
      <BottomSheetScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>LYRICS</Text>
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.artist}>{track.artist}</Text>
        {payload && payload.lines.length > 0 && (
          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>
              {payload.wordTimed ? 'WORD SYNC' : payload.synced ? 'SYNCED' : 'LYRICS'} · {payload.source}
            </Text>
          </View>
        )}
        {payload && !payload.synced && payload.lines.length > 0 && (
          <Text style={styles.syncMessage}>Timing is not available for this version.</Text>
        )}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : payload && payload.lines.length > 0 ? (
          payload.lines.map((line, index) => (
            <Pressable
              key={`${line.startTime}-${index}`}
              onPress={() => onSeek(line.startTime / 1000)}
              style={[styles.line, index === activeIndex && styles.activeLine]}
              accessibilityRole="button">
              <Text style={[styles.lineText, index === activeIndex && styles.activeLineText]}>
                {line.words.map((word, wordIndex) => {
                  const activeWord =
                    payload.wordTimed &&
                    index === activeIndex &&
                    currentTime * 1000 >= word.startTime &&
                    currentTime * 1000 < word.endTime;
                  return (
                    <Text key={`${word.startTime}-${wordIndex}`} style={activeWord ? styles.activeWord : undefined}>
                      {word.word}
                    </Text>
                  );
                })}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.message}>{message}</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: colors.surface },
  handle: { backgroundColor: colors.outline },
  content: { padding: 24, paddingBottom: 48 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  artist: { color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 24 },
  line: { marginBottom: 18, paddingVertical: 2 },
  lineText: { color: colors.text, fontSize: 20, lineHeight: 32 },
  activeLine: { transform: [{ scale: 1.02 }] },
  activeLineText: { color: colors.primary, fontWeight: '800' },
  activeWord: { color: colors.tertiary, textDecorationLine: 'underline' },
  sourcePill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  sourceText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  syncMessage: { color: colors.textSecondary, fontSize: 12, marginBottom: 18 },
  message: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 32 },
  loader: { marginTop: 40 },
});

function parseTrackDuration(value: string) {
  const parts = value.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
}

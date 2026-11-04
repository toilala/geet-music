import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { recognizeNearbySong, type RecognitionStatus } from '@/services/recognition';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export default function RecognitionScreen() {
  const [status, setStatus] = useState<RecognitionStatus>({ state: 'ready' });
  const isBusy = status.state === 'listening' || status.state === 'processing';

  const identify = async () => {
    setStatus({ state: 'listening' });
    const result = await recognizeNearbySong();
    setStatus(result);
  };

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor="#FFFFFF" size={22} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>DISCOVERY</Text>
        <Text style={styles.title}>Echo Find</Text>
        <Text style={styles.subtitle}>Identify the song playing around you.</Text>
        <Pressable disabled={isBusy} onPress={identify} style={[styles.findButton, isBusy && styles.disabled]}>
          {isBusy ? <ActivityIndicator color="#08100E" /> : <SymbolView name={{ ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' }} tintColor="#08100E" size={28} />}
          <Text style={styles.findLabel}>{isBusy ? 'Listening…' : 'Find this song'}</Text>
        </Pressable>
        {status.state === 'success' && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>{status.title}</Text>
            <Text style={styles.resultArtist}>{status.artist}</Text>
          </View>
        )}
        {status.state === 'no-match' && <Text style={styles.message}>{status.message}</Text>}
        {status.state === 'error' && <Text style={styles.error}>{status.message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  backText: { color: '#FFFFFF', fontSize: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  eyebrow: { color: colors.primary, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', marginTop: 10 },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 12, textAlign: 'center' },
  findButton: { backgroundColor: colors.primary, borderRadius: 28, paddingHorizontal: 26, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 38 },
  disabled: { opacity: 0.75 },
  findLabel: { color: '#08100E', fontSize: 16, fontWeight: '800' },
  result: { alignItems: 'center', marginTop: 36 },
  resultTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  resultArtist: { color: colors.textSecondary, fontSize: 16, marginTop: 6 },
  message: { color: colors.textSecondary, marginTop: 28, textAlign: 'center' },
  error: { color: '#FF8D8D', marginTop: 28, textAlign: 'center' },
});

import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';
import {
  DEFAULT_PLAYER_PREFERENCES,
  readPlayerPreferences,
  updatePlayerPreferences,
  type PlayerPreferences,
} from '@/services/player-preferences';

const colors = Colors.dark;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const [preferences, setPreferences] = useState<PlayerPreferences | null>(null);

  useEffect(() => {
    void readPlayerPreferences().then(setPreferences);
  }, []);

  const update = (patch: Partial<PlayerPreferences>) => {
    setPreferences((current) => {
      const next = { ...(current ?? DEFAULT_PLAYER_PREFERENCES), ...patch };
      void updatePlayerPreferences(patch);
      return next;
    });
  };

  const setTheme = (mode: PlayerPreferences['themeMode']) => {
    player.setThemeMode(mode);
    update({ themeMode: mode });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={colors.text} size={22} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.eyebrow}>PLAYBACK</Text>
        <View style={styles.group}>
          <SettingRow label="Shuffle by default" description="Keep discovery varied when advancing the queue." value={preferences?.shuffleEnabled ?? false} onChange={(value) => { if (value !== player.shuffleEnabled) player.toggleShuffle(); update({ shuffleEnabled: value }); }} />
          <SettingRow label="Video mode" description="Prefer video playback when a video source is available." value={preferences?.isVideoMode ?? false} onChange={(value) => { if (value !== player.isVideoMode) player.toggleVideoMode(); update({ isVideoMode: value }); }} />
          <SettingRow label="Data saver" description="A preference for lower-bandwidth playback when a native stream is connected." value={preferences?.dataSaverEnabled ?? false} onChange={(value) => update({ dataSaverEnabled: value })} />
          <SettingRow label="Crossfade" description="Reserved for a native audio engine; YouTube playback cannot crossfade." value={preferences?.crossfadeEnabled ?? false} onChange={(value) => update({ crossfadeEnabled: value })} />
        </View>

        <Text style={styles.eyebrow}>PLAYER</Text>
        <View style={styles.group}>
          <SettingRow label="Hide player thumbnail" description="Keep the mini player compact and text-first." value={preferences?.hidePlayerThumbnail ?? false} onChange={(value) => { player.setHidePlayerThumbnail(value); update({ hidePlayerThumbnail: value }); }} />
          <SettingRow label="Smooth lyric animation" description="Use synchronized, animated lyric transitions in the player." value={preferences?.lyricAnimation === 'smooth'} onChange={(value) => update({ lyricAnimation: value ? 'smooth' : 'minimal' })} />
        </View>

        <Text style={styles.eyebrow}>APPEARANCE</Text>
        <View style={styles.group}>
          <ThemeRow active={preferences?.themeMode === 'material-expressive'} label="Material expressive" onPress={() => setTheme('material-expressive')} />
          <ThemeRow active={preferences?.themeMode === 'liquid-glass'} label="Liquid glass" onPress={() => setTheme('liquid-glass')} />
        </View>

        <Text style={styles.note}>
          Echo features that require Android services (background audio, offline audio, high-resolution extensions, and microphone capture) need a development build and native modules. This Expo build keeps their settings visible without claiming unsupported behavior.
        </Text>
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.surfaceHighest, true: colors.primaryContainer }} thumbColor={value ? colors.primary : colors.textMuted} />
    </View>
  );
}

function ThemeRow({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.themeRow, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
      <SymbolView name={{ ios: active ? 'checkmark.circle.fill' : 'circle', android: active ? 'radio_button_checked' : 'radio_button_unchecked', web: active ? 'check_circle' : 'radio_button_unchecked' }} tintColor={active ? colors.primary : colors.textMuted} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginTop: 18, marginBottom: 10 },
  group: { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowCopy: { flex: 1, gap: 4 },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  description: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  themeRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { opacity: 0.7 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 24, marginHorizontal: 4 },
});

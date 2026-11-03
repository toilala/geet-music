import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';

const colors = Colors.dark;

const TIMER_OPTIONS = [
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: 'End of song', minutes: -1 },
];

export const SleepTimerSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const { sleepTimerRemaining, setSleepTimer, duration, currentTime } = usePlayer();

  const handleSelect = (minutes: number) => {
    if (minutes === -1) {

      const remainingSecs = Math.max(10, duration - currentTime);
      setSleepTimer(remainingSecs / 60);
    } else {
      setSleepTimer(minutes);
    }
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
  };

  const handleTurnOff = () => {
    setSleepTimer(null);
    if (typeof ref === 'object' && ref?.current) {
      ref.current.dismiss();
    }
  };

  const formattedRemaining =
    sleepTimerRemaining !== null
      ? `${Math.floor(sleepTimerRemaining / 60)}m ${sleepTimerRemaining % 60}s remaining`
      : null;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['52%']}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <SymbolView name={{ ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' }} tintColor={colors.primary} size={24} />
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.title}>Sleep Timer</Text>
            <Text style={styles.subtitle}>
              {formattedRemaining ? `Active: ${formattedRemaining}` : 'Music will stop automatically'}
            </Text>
          </View>
        </View>

        <View style={styles.optionsList}>
          {TIMER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => handleSelect(opt.minutes)}
              style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}>
              <Text style={styles.optionText}>{opt.label}</Text>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                tintColor={colors.textSecondary}
                size={18}
              />
            </Pressable>
          ))}

          {sleepTimerRemaining !== null && (
            <Pressable onPress={handleTurnOff} style={[styles.optionRow, styles.turnOffRow]}>
              <Text style={styles.turnOffText}>Turn off sleep timer</Text>
              <SymbolView
                name={{ ios: 'xmark.circle', android: 'cancel', web: 'cancel' }}
                tintColor="#FF8B8B"
                size={20}
              />
            </Pressable>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

SleepTimerSheet.displayName = 'SleepTimerSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#161F1E',
  },
  sheetHandle: {
    backgroundColor: colors.outline,
    width: 48,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceHigh,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  turnOffRow: {
    backgroundColor: '#30181A',
    marginTop: 8,
  },
  turnOffText: {
    color: '#FFB4AB',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

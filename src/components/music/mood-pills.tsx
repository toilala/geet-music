import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, Vibration } from 'react-native';

import { Colors } from '@/constants/theme';
import { moodCategories, type MoodCategory } from '@/data/music';

const colors = Colors.dark;

type Props = {
  selectedMoodId: string;
  onSelectMood: (mood: MoodCategory) => void;
};

export function MoodPills({ selectedMoodId, onSelectMood }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {moodCategories.map((mood) => {
        const isSelected = mood.id === selectedMoodId;
        return (
          <Pressable
            key={mood.id}
            onPress={() => {
              try {
                Vibration.vibrate(8);
              } catch {

              }
              onSelectMood(mood);
            }}
            style={({ pressed }) => [
              styles.pill,
              isSelected && styles.pillSelected,
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={mood.icon as any}
              tintColor={isSelected ? colors.onPrimary : colors.textSecondary}
              size={15}
            />
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {mood.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

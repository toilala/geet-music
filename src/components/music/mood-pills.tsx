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
              } catch {}
              onSelectMood(mood);
            }}
            style={({ pressed }) => [
              styles.pill,
              isSelected && styles.pillSelected,
              pressed && styles.pressed,
            ]}>
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
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillSelected: {
    backgroundColor: '#23302B',
    borderColor: 'rgba(124, 213, 198, 0.45)',
  },
  pillText: {
    color: '#D4DDD9',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  pillTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

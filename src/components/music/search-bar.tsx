import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function SearchBar({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search YouTube music"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        tintColor={colors.textSecondary}
        size={21}
      />
      <Text style={styles.placeholder}>Songs, artists, albums</Text>
      <SymbolView
        name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
        tintColor={colors.textSecondary}
        size={20}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  placeholder: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

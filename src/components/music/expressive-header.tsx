import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function ExpressiveHeader() {
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <SymbolView
            name={{ ios: 'play.circle.fill', android: 'play_circle_filled', web: 'play_circle_filled' }}
            tintColor={colors.primary}
            size={28}
          />
          <Text style={styles.brandName}>Geet Music</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Cast audio"
            onPress={() => {}}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'airplayaudio', android: 'cast', web: 'cast' }}
              tintColor={colors.text}
              size={20}
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Search music"
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              tintColor={colors.text}
              size={20}
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Library"
            onPress={() => router.push('/library')}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
            <Text style={styles.avatarText}>GM</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.greeting}>{greeting}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.onPrimaryContainer,
    fontSize: 13,
    fontWeight: '900',
  },
  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});

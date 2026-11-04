import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, Pressable, Vibration } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export function ExpressiveHeader() {
  const handleAction = () => {
    try {
      Vibration.vibrate(8);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Clean, authentic Geet Music typography matching Echo Music Screenshot 1 */}
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.brandWrap}>
          <Text style={styles.brandTitle}>Geet Music</Text>
        </Pressable>

        {/* Action icons matching Echo Music: History, Trending, People, Profile Avatar */}
        <View style={styles.actionRow}>
          {/* History */}
          <Pressable
            accessibilityLabel="Listening history"
            onPress={() => {
              handleAction();
              router.push('/(tabs)/library');
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
              tintColor={colors.text}
              size={21}
            />
          </Pressable>

          {/* Stats / Trending */}
          <Pressable
            accessibilityLabel="Charts and trending"
            onPress={() => {
              handleAction();
              router.push('/(tabs)/explore');
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
              tintColor={colors.text}
              size={20}
            />
          </Pressable>

          {/* People / Community */}
          <Pressable
            accessibilityLabel="Friends & shared music"
            onPress={() => {
              handleAction();
              router.push('/(tabs)/library');
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
              tintColor={colors.text}
              size={20}
            />
          </Pressable>

          {/* User Profile Avatar with green status ring like in Echo Music */}
          <Pressable
            accessibilityLabel="User profile"
            onPress={() => {
              handleAction();
              router.push('/(tabs)/library');
            }}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
            <Text style={styles.avatarText}>GM</Text>
            <View style={styles.avatarOnlineDot} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 2,
    position: 'relative',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: colors.outlineActive,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3DD598',
    borderWidth: 2,
    borderColor: '#0D1110',
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
});

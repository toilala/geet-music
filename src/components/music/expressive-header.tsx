import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, Pressable, Vibration } from 'react-native';

import { Colors } from '@/constants/theme';
import { usePlayer } from '@/context/player-context';

const colors = Colors.dark;

export function ExpressiveHeader() {
  const { themeMode, toggleThemeMode } = usePlayer();

  const handleAction = () => {
    try {
      Vibration.vibrate(8);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Creative stylized brand text - NO icon, creative typographic identity */}
        <View style={styles.brandWrap}>
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandPrimary}>Geet</Text>
            <Text style={styles.brandSecondary}>Music</Text>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.brandTagline}>
            {themeMode === 'liquid-glass' ? 'Liquid Glass' : 'Expressive'}
          </Text>
        </View>

        {/* Right action icons matching Echo Music: History, Trending, People, Profile Avatar */}
        <View style={styles.actionRow}>
          {/* History */}
          <Pressable
            accessibilityLabel="Listening history"
            onPress={() => {
              handleAction();
              router.push('/library');
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
              router.push('/explore');
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
              toggleThemeMode();
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
              tintColor={colors.text}
              size={20}
            />
          </Pressable>

          {/* User Profile Avatar with active ring */}
          <Pressable
            accessibilityLabel="User profile"
            onPress={() => {
              handleAction();
              router.push('/library');
            }}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
            <Image
              source="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&q=80"
              style={styles.avatarImg}
              contentFit="cover"
            />
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
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTextGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandPrimary: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  brandSecondary: {
    color: colors.primary,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginLeft: 2,
    marginBottom: 4,
  },
  brandTagline: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 213, 198, 0.4)',
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
    borderColor: colors.background,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
});

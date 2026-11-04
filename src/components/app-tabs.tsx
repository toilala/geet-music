import { router, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
  const isExplore = pathname.includes('explore');
  const isLibrary = pathname.includes('library');

  const handleTabPress = (route: string) => {
    try {
      Vibration.vibrate(8);
    } catch {}
    router.replace(route as any);
  };

  return (
    <View style={[styles.floatingDock, { bottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={styles.tabContainer}>
        {/* Tab 1: Home Pill */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)')}
          style={({ pressed }) => [
            styles.tabItem,
            isHome && styles.activePill,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'house.fill', android: 'home', web: 'home' }}
            tintColor={isHome ? '#FFFFFF' : colors.textSecondary}
            size={19}
          />
          {isHome && <Text style={styles.activeLabel}>Home</Text>}
        </Pressable>

        {/* Tab 2: Mic / Voice Discovery */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)/explore')}
          style={({ pressed }) => [styles.iconOnlyBtn, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
            tintColor={colors.textSecondary}
            size={20}
          />
        </Pressable>

        {/* Tab 3: Music Library */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)/library')}
          style={({ pressed }) => [
            styles.tabItem,
            isLibrary && styles.activePill,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }}
            tintColor={isLibrary ? '#FFFFFF' : colors.textSecondary}
            size={20}
          />
          {isLibrary && <Text style={styles.activeLabel}>Library</Text>}
        </Pressable>

        {/* Tab 4: Search Button */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)/explore')}
          style={({ pressed }) => [
            styles.searchCircle,
            isExplore && styles.activeSearchCircle,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor="#FFFFFF"
            size={18}
          />
        </Pressable>

        {/* Tab 5: Arrow forward */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)/explore')}
          style={({ pressed }) => [styles.iconOnlyBtn, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
            tintColor={colors.textSecondary}
            size={18}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingDock: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 23, 21, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    maxWidth: 380,
    width: '100%',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 24,
  },
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  iconOnlyBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  searchCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSearchCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});

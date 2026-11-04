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
        {/* Home Tab */}
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
            size={20}
          />
          {isHome && <Text style={styles.activeLabel}>Home</Text>}
        </Pressable>

        {/* Explore / Flow Tab */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)/explore')}
          style={({ pressed }) => [
            styles.tabItem,
            isExplore && styles.activePill,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
            tintColor={isExplore ? '#FFFFFF' : colors.textSecondary}
            size={20}
          />
          {isExplore && <Text style={styles.activeLabel}>Explore</Text>}
        </Pressable>

        {/* Library Tab */}
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

        {/* Search Shortcut */}
        <Pressable
          onPress={() => handleTabPress('/(tabs)/explore')}
          style={({ pressed }) => [styles.searchCircle, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor="#FFFFFF"
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
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 23, 21, 0.92)',
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
    minWidth: 280,
    maxWidth: 360,
    width: '100%',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 26,
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
  searchCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
});

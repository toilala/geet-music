import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PlayerProvider } from '@/context/player-context';
import { LibraryProvider } from '@/context/library-context';
import { PlaybackEngine } from '@/components/music/playback-engine';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme({ fallbackSourceColor: '#176B63' });
  const isDark = colorScheme === 'dark';
  const paperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: { ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors), ...theme[isDark ? 'dark' : 'light'] },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <BottomSheetModalProvider>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <PlayerProvider>
              <LibraryProvider>
                <PlaybackEngine />
                <AnimatedSplashOverlay />
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="player/[id]" options={{ headerShown: false, presentation: 'modal' }} />
                </Stack>
              </LibraryProvider>
            </PlayerProvider>
          </ThemeProvider>
        </BottomSheetModalProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

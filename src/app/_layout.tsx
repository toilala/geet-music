import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';

import { PlayerProvider } from '@/context/player-context';
import { LibraryProvider } from '@/context/library-context';
import { PlaybackEngine } from '@/components/music/playback-engine';
import { AppErrorBoundary } from '@/components/app-error-boundary';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme({ fallbackSourceColor: '#176B63' });
  const isDark = colorScheme === 'dark';
  const paperTheme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: { ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors), ...theme[isDark ? 'dark' : 'light'] },
  };

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <BottomSheetModalProvider>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <PlayerProvider>
              <LibraryProvider>
                <PlaybackEngine />
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="recognition" options={{ headerShown: false, presentation: 'modal' }} />
                  <Stack.Screen name="browse" options={{ headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
                  <Stack.Screen name="player/[id]" options={{ headerShown: false, presentation: 'modal' }} />
                </Stack>
              </LibraryProvider>
            </PlayerProvider>
          </ThemeProvider>
        </BottomSheetModalProvider>
      </PaperProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

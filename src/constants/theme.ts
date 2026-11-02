/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#171D1C',
    background: '#F6FBF9',
    backgroundElement: '#E7F2EF',
    backgroundSelected: '#B8E1D9',
    textSecondary: '#526360',
    surface: '#F6FBF9',
    surfaceHigh: '#EAF3F1',
    surfaceHighest: '#DDEBE7',
    primary: '#176B63',
    onPrimary: '#FFFFFF',
    secondary: '#526A78',
    tertiary: '#966044',
    outline: '#71817E',
  },
  dark: {
    text: '#DEE5E2',
    background: '#0F1514',
    backgroundElement: '#1A2523',
    backgroundSelected: '#2D5A54',
    textSecondary: '#AABAB6',
    surface: '#17201F',
    surfaceHigh: '#202C2A',
    surfaceHighest: '#2A3936',
    primary: '#78D6C8',
    onPrimary: '#003731',
    secondary: '#AFC8D8',
    tertiary: '#F2B69A',
    outline: '#899A96',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

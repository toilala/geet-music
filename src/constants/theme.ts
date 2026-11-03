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
    primaryContainer: '#A5F2E6',
    onPrimaryContainer: '#00201C',
    onPrimary: '#FFFFFF',
    secondary: '#526A78',
    secondaryContainer: '#D5E6F3',
    onSecondaryContainer: '#0E1D25',
    tertiary: '#966044',
    tertiaryContainer: '#FFDCCB',
    onTertiaryContainer: '#351000',
    outline: '#71817E',
    surfaceTint: '#176B63',
    success: '#3D6B3C',
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
    primaryContainer: '#005047',
    onPrimaryContainer: '#A5F2E6',
    onPrimary: '#003731',
    secondary: '#AFC8D8',
    secondaryContainer: '#394A56',
    onSecondaryContainer: '#D5E6F3',
    tertiary: '#F2B69A',
    tertiaryContainer: '#713719',
    onTertiaryContainer: '#FFDCCB',
    outline: '#899A96',
    surfaceTint: '#78D6C8',
    success: '#A6D99D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

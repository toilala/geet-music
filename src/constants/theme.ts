import { Platform } from 'react-native';

export type ThemeMode = 'material-expressive' | 'liquid-glass';

export const Colors = {
  dark: {
    // Exact Echo Music dark warm espresso palette from screenshots
    text: '#FFFFFF',
    textSecondary: '#A39893',
    textMuted: '#6E6460',
    background: '#0D0B0A',
    backgroundElement: '#1A1514',
    backgroundSelected: '#322624',
    backgroundSurface: '#14100F',
    backgroundCard: '#1E1918',
    surface: '#1A1514',
    surfaceHigh: '#241D1C',
    surfaceHighest: '#2F2625',
    primary: '#7CD5C6',
    primaryContainer: '#23322E',
    onPrimaryContainer: '#A6F5E7',
    onPrimary: '#003831',
    secondary: '#D4A58E',
    secondaryContainer: '#3D2A22',
    tertiary: '#EAB299',
    accentGreen: '#3DD598',
    accentAmber: '#F5A952',
    accentPink: '#FF5370',
    outline: 'rgba(255, 255, 255, 0.08)',
    outlineActive: 'rgba(124, 213, 198, 0.35)',
    divider: 'rgba(255, 255, 255, 0.06)',
    activeTrackBackground: '#2E221E',

    // Liquid Glass specifics
    glassBackground: 'rgba(26, 21, 20, 0.88)',
    glassBackgroundActive: 'rgba(38, 30, 28, 0.94)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderHighlight: 'rgba(124, 213, 198, 0.3)',
    glassOverlay: 'rgba(0, 0, 0, 0.55)',
    glassPill: 'rgba(255, 255, 255, 0.08)',
    glassPillActive: 'rgba(255, 255, 255, 0.18)',
  },
  light: {
    text: '#171D1C',
    textSecondary: '#526360',
    textMuted: '#7D8E8B',
    background: '#F5FAF8',
    backgroundElement: '#E7F2EF',
    backgroundSelected: '#B8E1D9',
    backgroundSurface: '#EBF4F1',
    backgroundCard: '#DFECE8',
    surface: '#F6FBF9',
    surfaceHigh: '#D3E3DF',
    surfaceHighest: '#C5D8D3',
    primary: '#176B63',
    primaryContainer: '#A5F2E6',
    onPrimaryContainer: '#00201C',
    onPrimary: '#FFFFFF',
    secondary: '#526A78',
    secondaryContainer: '#D5E6F3',
    tertiary: '#966044',
    accentGreen: '#2E8B57',
    accentAmber: '#D97706',
    accentPink: '#E11D48',
    outline: 'rgba(0, 0, 0, 0.08)',
    outlineActive: 'rgba(23, 107, 99, 0.35)',
    divider: 'rgba(0, 0, 0, 0.06)',
    activeTrackBackground: '#CBE5DF',

    glassBackground: 'rgba(255, 255, 255, 0.78)',
    glassBackgroundActive: 'rgba(235, 246, 243, 0.92)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassBorderHighlight: 'rgba(23, 107, 99, 0.25)',
    glassOverlay: 'rgba(255, 255, 255, 0.5)',
    glassPill: 'rgba(0, 0, 0, 0.06)',
    glassPillActive: 'rgba(23, 107, 99, 0.15)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

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

import { Platform, StyleSheet } from 'react-native';

export type ThemeMode = 'material-expressive' | 'liquid-glass';

export const Colors = {
  dark: {
    // Material Expressive / Liquid Glass Dark Palette
    text: '#F2F5F4',
    textSecondary: '#9AA7A3',
    textMuted: '#687773',
    background: '#0D1110',
    backgroundElement: '#1A2523',
    backgroundSelected: '#2D5A54',
    backgroundSurface: '#131817',
    backgroundCard: '#1A201E',
    surface: '#17201F',
    surfaceHigh: '#222A28',
    surfaceHighest: '#2B3533',
    primary: '#7CD5C6',
    primaryContainer: '#1C3833',
    onPrimaryContainer: '#A6F5E7',
    onPrimary: '#003831',
    secondary: '#AFC8D8',
    secondaryContainer: '#28363F',
    tertiary: '#EAB299',
    accentGreen: '#63D188',
    accentAmber: '#F5A952',
    accentPink: '#FF5370',
    outline: 'rgba(255, 255, 255, 0.08)',
    outlineActive: 'rgba(124, 213, 198, 0.35)',
    divider: 'rgba(255, 255, 255, 0.06)',
    activeTrackBackground: '#26332C',

    // Liquid Glass specifics
    glassBackground: 'rgba(20, 26, 24, 0.72)',
    glassBackgroundActive: 'rgba(32, 44, 40, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassBorderHighlight: 'rgba(124, 213, 198, 0.28)',
    glassOverlay: 'rgba(0, 0, 0, 0.45)',
    glassPill: 'rgba(255, 255, 255, 0.08)',
    glassPillActive: 'rgba(124, 213, 198, 0.22)',
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

export const GlassStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.glassBackground,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    borderRadius: 24,
    overflow: 'hidden',
  },
  pill: {
    backgroundColor: Colors.dark.glassPill,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    borderRadius: 24,
    overflow: 'hidden',
  },
  activePill: {
    backgroundColor: Colors.dark.glassPillActive,
    borderColor: Colors.dark.glassBorderHighlight,
  },
  dock: {
    backgroundColor: 'rgba(16, 21, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
});

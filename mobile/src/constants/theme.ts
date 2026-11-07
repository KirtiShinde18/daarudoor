import { MD3DarkTheme, MD3LightTheme, configureFonts, useTheme } from 'react-native-paper';
import { useMemo } from 'react';

import { FONT_FAMILY } from './typography';

const fontConfig = {
  fontFamily: FONT_FAMILY.regular,
  regular: {
    fontFamily: FONT_FAMILY.regular,
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: FONT_FAMILY.medium,
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: FONT_FAMILY.bold,
    fontWeight: '700' as const,
  },
  heavy: {
    fontFamily: FONT_FAMILY.bold,
    fontWeight: '700' as const,
  },
} as any;

export const darkColors = {
  primary: '#6A0409', // Wine
  primaryDark: '#370617', // Deep Wine
  primaryLight: '#9D0208', // Accent Wine
  background: '#000000', // Pure Black
  surface: '#111111',
  card: '#181818',
  white: '#FFFFFF',
  text: '#FFFFFF',
  muted: '#A1A1AA', // Secondary Text
  border: '#292929',
  error: '#FF4C4C',
  success: '#4CAF50',
};

export const lightColors = {
  primary: '#6A0409', 
  primaryDark: '#370617', 
  primaryLight: '#9D0208', 
  background: '#F9FAFB', 
  surface: '#FFFFFF',
  card: '#FFFFFF',
  white: '#FFFFFF', // Keep for absolute white elements
  text: '#111827',
  muted: '#6B7280', 
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#22C55E',
};

// Fallback static export for files not yet refactored
export const colors = darkColors;

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
    onPrimary: darkColors.white,
    primaryContainer: darkColors.primaryDark,
    onPrimaryContainer: darkColors.white,
    secondary: darkColors.primaryDark,
    onSecondary: darkColors.white,
    secondaryContainer: darkColors.card,
    onSecondaryContainer: darkColors.white,
    tertiary: darkColors.muted,
    onTertiary: darkColors.white,
    errorContainer: darkColors.primaryDark,
    onErrorContainer: darkColors.white,
    onBackground: darkColors.text,
    onSurface: darkColors.text,
    surfaceVariant: darkColors.card,
    onSurfaceVariant: darkColors.muted,
    outline: darkColors.border,
    elevation: { level0: 'transparent', level1: darkColors.card, level2: darkColors.card, level3: darkColors.card, level4: darkColors.card, level5: darkColors.card },
  },
  fonts: configureFonts({config: fontConfig}),
  roundness: 12,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
    onPrimary: lightColors.white,
    primaryContainer: lightColors.primaryLight,
    onPrimaryContainer: lightColors.white,
    secondary: lightColors.primaryDark,
    onSecondary: lightColors.white,
    secondaryContainer: lightColors.card,
    onSecondaryContainer: lightColors.text,
    tertiary: lightColors.muted,
    onTertiary: lightColors.text,
    errorContainer: '#FEE2E2',
    onErrorContainer: lightColors.error,
    onBackground: lightColors.text,
    onSurface: lightColors.text,
    surfaceVariant: lightColors.card,
    onSurfaceVariant: lightColors.muted,
    outline: lightColors.border,
    elevation: { level0: 'transparent', level1: lightColors.card, level2: lightColors.card, level3: lightColors.card, level4: lightColors.card, level5: lightColors.card },
  },
  fonts: configureFonts({config: fontConfig}),
  roundness: 12,
};

// Hook for custom components to access colors
export type AppThemeColors = typeof darkColors;

export const useAppTheme = () => {
  const paperTheme = useTheme();
  const isDark = paperTheme.dark;
  
  const currentColors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  return { colors: currentColors, isDark };
};

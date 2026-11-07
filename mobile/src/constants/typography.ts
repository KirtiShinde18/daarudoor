import { TextStyle } from 'react-native';

export const FONT_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

// Global text presets
export const typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  h3: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  title: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  badge: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
};

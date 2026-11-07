import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../constants/theme';

export type BadgeVariant = 'available' | 'popular' | 'limited' | 'out_of_stock' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge = ({ label, variant = 'default', style }: BadgeProps) => {
  const { colors } = useAppTheme();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'available':
        return { bg: colors.surface, text: colors.success, border: colors.border };
      case 'popular':
        return { bg: colors.primary, text: colors.white };
      case 'limited':
        return { bg: colors.primaryDark, text: colors.white };
      case 'out_of_stock':
        return { bg: colors.border, text: colors.muted };
      default:
        return { bg: colors.surface, text: colors.muted, border: colors.border };
    }
  };

  const vStyle = getVariantStyle();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: vStyle.bg },
      vStyle.border ? { borderWidth: 1, borderColor: vStyle.border } : null,
      style
    ]}>
      <Text style={[styles.text, { color: vStyle.text }]}>{label}</Text>
    </View>
  );
};

import { FONT_FAMILY } from '../../constants/typography';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

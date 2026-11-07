import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { useAppTheme } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'disabled';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  icon,
  loading = false,
  disabled = false
}: ButtonProps) => {
  const { colors } = useAppTheme();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: colors.primary, borderWidth: 0 },
          text: { color: colors.white }
        };
      case 'secondary':
        return {
          button: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
          text: { color: colors.text }
        };
      case 'outline':
        return {
          button: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
          text: { color: colors.primary }
        };
      case 'success':
        return {
          button: { backgroundColor: colors.success, borderWidth: 0 },
          text: { color: colors.white }
        };
      case 'danger':
        return {
          button: { backgroundColor: colors.error, borderWidth: 0 },
          text: { color: colors.white }
        };
      case 'disabled':
        return {
          button: { backgroundColor: colors.border, borderWidth: 0 },
          text: { color: colors.muted }
        };
      default:
        return {
          button: { backgroundColor: colors.primary, borderWidth: 0 },
          text: { color: colors.white }
        };
    }
  };

  const vStyle = getVariantStyle();
  const isDisabled = variant === 'disabled' || loading || disabled;

  return (
    <TouchableOpacity 
      style={[styles.button, vStyle.button, style]} 
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyle.text.color} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, vStyle.text, textStyle, icon ? { marginLeft: 8 } : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

import { FONT_FAMILY } from '../../constants/typography';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.semiBold,
  },
});

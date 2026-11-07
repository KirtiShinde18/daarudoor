import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button, ButtonVariant } from './Button';

const { width } = Dimensions.get('window');

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  disableBackdropDismiss?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  icon = 'help-outline',
  iconColor,
  iconBgColor,
  loading = false,
  onConfirm,
  onCancel,
  disableBackdropDismiss = false,
}) => {
  const { colors, isDark } = useAppTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const resolvedIconColor = iconColor || colors.primary;
  const resolvedIconBg = iconBgColor || (isDark ? 'rgba(157, 2, 8, 0.18)' : 'rgba(106, 4, 9, 0.08)');

  const handleBackdropPress = () => {
    if (!loading && !disableBackdropDismiss) {
      onCancel();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={loading ? undefined : onCancel}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Close Button at top right (disabled when loading) */}
              {!loading && (
                <TouchableOpacity
                  style={styles.closeIconBtn}
                  onPress={onCancel}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Close confirmation modal"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={20} color={colors.muted} />
                </TouchableOpacity>
              )}

              {/* Icon Badge */}
              <View style={[styles.iconWrap, { backgroundColor: resolvedIconBg }]}>
                <MaterialIcons name={icon} size={30} color={resolvedIconColor} />
              </View>

              {/* Title & Description */}
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <View style={styles.btnCol}>
                  <Button
                    title={cancelText}
                    variant="secondary"
                    onPress={onCancel}
                    disabled={loading}
                    style={styles.btnStyle}
                  />
                </View>
                <View style={styles.btnCol}>
                  <Button
                    title={confirmText}
                    variant={confirmVariant}
                    onPress={onConfirm}
                    loading={loading}
                    disabled={loading}
                    style={styles.btnStyle}
                  />
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: Math.min(width - 40, 420),
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  closeIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btnCol: {
    flex: 1,
  },
  btnStyle: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 13,
  },
});

export default ConfirmationModal;

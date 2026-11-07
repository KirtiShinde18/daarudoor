import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastItem = ({ toast, onRemove }: { toast: ToastOptions, onRemove: (id: string) => void }) => {
  const { isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      closeToast();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const closeToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onRemove(toast.id));
  }, [onRemove, toast.id]);

  let backgroundColor, borderColor, textColor, iconName;
  switch (toast.type) {
    case 'success':
      backgroundColor = theme === 'dark' ? 'rgba(20, 83, 45, 0.9)' : '#F0FDF4';
      borderColor = theme === 'dark' ? '#166534' : '#BBF7D0';
      textColor = theme === 'dark' ? '#86EFAC' : '#166534';
      iconName = 'checkmark-circle';
      break;
    case 'error':
      backgroundColor = theme === 'dark' ? 'rgba(127, 29, 29, 0.9)' : '#FEF2F2';
      borderColor = theme === 'dark' ? '#991B1B' : '#FECACA';
      textColor = theme === 'dark' ? '#FCA5A5' : '#991B1B';
      iconName = 'close-circle';
      break;
    case 'warning':
      backgroundColor = theme === 'dark' ? 'rgba(113, 63, 18, 0.9)' : '#FEFCE8';
      borderColor = theme === 'dark' ? '#854D0E' : '#FEF08A';
      textColor = theme === 'dark' ? '#FDE047' : '#854D0E';
      iconName = 'warning';
      break;
    case 'info':
    default:
      backgroundColor = theme === 'dark' ? 'rgba(30, 58, 138, 0.9)' : '#EFF6FF';
      borderColor = theme === 'dark' ? '#1E40AF' : '#BFDBFE';
      textColor = theme === 'dark' ? '#93C5FD' : '#1E40AF';
      iconName = 'information-circle';
      break;
  }

  return (
    <Animated.View style={[
      styles.toastContainer, 
      { 
        backgroundColor, 
        borderColor,
        opacity,
        transform: [{ translateY }] 
      }
    ]}>
      <Ionicons name={iconName as any} size={24} color={textColor} style={styles.icon} />
      <Text style={[styles.message, { color: textColor }]}>{toast.message}</Text>
      <TouchableOpacity onPress={closeToast} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={textColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.overlay, { top: Math.max(insets.top, 20) }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'column',
    gap: 12,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    opacity: 0.7,
  }
});

import React, { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store';
import { setThemeMode, ThemeMode, syncSystemTheme } from '../store/slices/themeSlice';
import { lightTheme, darkTheme } from '../constants/theme';
import { View, ActivityIndicator } from 'react-native';

export const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { isDark, mode } = useSelector((state: RootState) => state.theme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
          dispatch(setThemeMode(storedTheme as ThemeMode));
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();

    const subscription = Appearance.addChangeListener(() => {
      dispatch(syncSystemTheme());
    });

    return () => subscription.remove();
  }, [dispatch]);

  if (!isReady) {
    return null;
  }

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
};

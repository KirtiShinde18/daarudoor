import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

const getIsDark = (mode: ThemeMode) => {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark';
  }
  return mode === 'dark';
};

const initialState: ThemeState = {
  mode: 'system',
  isDark: getIsDark('system'),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      state.isDark = getIsDark(action.payload);
    },
    syncSystemTheme: (state) => {
      if (state.mode === 'system') {
        state.isDark = Appearance.getColorScheme() === 'dark';
      }
    },
  },
});

export const { setThemeMode, syncSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;

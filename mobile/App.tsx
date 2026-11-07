import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { RootNavigator } from './src/navigation';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { ThemeProvider } from './src/providers/ThemeProvider';
import { ToastProvider } from './src/providers/ToastProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}

const MainApp = () => {
  const onLayoutRootView = useCallback(async () => {
    // This is called when the theme is ready and MainApp is rendered
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#111111' }} onLayout={onLayoutRootView}>
      <RootNavigator />
    </View>
  );
};

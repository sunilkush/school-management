import React, { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { persistor, store } from './src/store';
import { AppThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

function StatusBarBridge() {
  const { scheme } = useAppTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

// Web brands itself with Inter (index.css: font-family: "Inter", "Poppins", sans-serif) — the
// app previously never loaded it, so every screen silently fell back to the OS default (San
// Francisco / Roboto) despite typography.js styling text as if Inter were active. Splash screen
// stays up (see the `if (!fontsLoaded...) return null` below) until these 4 weights — the same
// ones typography.js's fontFamily entries and ThemeProvider's Paper font config reference — are
// ready, so there's no flash of the wrong font.
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onRootLayout = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider onLayout={onRootLayout}>
          <ReduxProvider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <AppThemeProvider>
                <StatusBarBridge />
                <RootNavigator />
              </AppThemeProvider>
            </PersistGate>
          </ReduxProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

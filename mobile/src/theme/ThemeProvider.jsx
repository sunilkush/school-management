import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme, configureFonts } from 'react-native-paper';
import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { darkColors, lightColors, radii, spacing, typography } from './tokens';

const AppThemeContext = createContext(null);

// react-native-paper's own components (Button/Chip/TextInput/SegmentedButtons labels) render
// through the Paper theme's own `fonts` config, not through typography.js — without this they'd
// keep using MD3's default system-font config even after App.jsx loads Inter everywhere else.
const paperFonts = configureFonts({ config: { fontFamily: 'Inter_500Medium' } });

function buildTheme(scheme) {
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  const paperTheme = {
    ...base,
    roundness: radii.md,
    fonts: paperFonts,
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.textOnPrimary,
      secondary: colors.accent,
      background: colors.background,
      surface: colors.surface,
      surfaceVariant: colors.surfaceSoft,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.border,
      error: colors.danger,
    },
  };

  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
  });
  const navBase = isDark ? DarkTheme : LightTheme;
  const navigationTheme = {
    ...navBase,
    colors: {
      ...navBase.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return {
    scheme: isDark ? 'dark' : 'light',
    colors,
    spacing,
    radii,
    typography,
    paperTheme,
    navigationTheme,
  };
}

export function AppThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const themeMode = useSelector((state) => state.ui.themeMode); // 'system' | 'light' | 'dark'

  const resolvedScheme = themeMode === 'system' ? systemScheme || 'light' : themeMode;
  const theme = useMemo(() => buildTheme(resolvedScheme), [resolvedScheme]);

  return (
    <AppThemeContext.Provider value={theme}>
      <PaperProvider theme={theme.paperTheme}>{children}</PaperProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}

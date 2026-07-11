import React from 'react';
import { useAppTheme } from '../theme/ThemeProvider';
import { AppHeader } from './AppHeader';

/** Shared header look for pre-auth screens (AuthStack) — flat (a hairline border instead of a
 * harsh drop shadow, matching the rest of the app's card borders), a bold title instead of the
 * platform default, and a brand-tinted back button/icon color. No academic year/notifications/
 * theme toggle here since there's no signed-in user yet. */
export function useHeaderScreenOptions() {
  const { colors, typography } = useAppTheme();

  return {
    headerStyle: { backgroundColor: colors.surface },
    headerShadowVisible: false,
    headerTitleStyle: { ...typography.h3, color: colors.text },
    headerTintColor: colors.primary,
    headerBackTitleVisible: false,
  };
}

/** Header for every authenticated screen (TabShell, and its nested Profile/More stacks) — a
 * custom AppHeader replaces the native title bar with page icon + title on the left and
 * Academic Year / theme toggle / notification bell on the right. */
export function useAppHeaderOptions() {
  return {
    header: (props) => <AppHeader {...props} />,
  };
}

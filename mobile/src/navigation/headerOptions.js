import { useAppTheme } from '../theme/ThemeProvider';

/** Shared header look for every navigator in the app (TabShell, and every nested Stack) — flat
 * (a hairline border instead of a harsh drop shadow, matching the rest of the app's card borders),
 * a bold title instead of the platform default, and a brand-tinted back button/icon color. */
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

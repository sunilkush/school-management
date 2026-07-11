import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Bordered surface card for grouping a chart/section — the app's one "panel" convention, used by
 * the School Admin dashboard and Reports screens. */
export function Panel({ children, style }) {
  const { colors, spacing, radii } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          marginBottom: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

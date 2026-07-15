import React from 'react';
import { View, Text } from 'react-native';
import { pillStyle } from '../../theme/patterns';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Dot + text badge on a tinted background — direct port of the web app's pill() pattern. Pass
 * either a semantic `color` hex directly (e.g. an attendance status color) or resolve one from
 * STATUS_SEMANTICS[tone].text for the shared active/pending/overdue/... vocabulary. */
export function StatusPill({ label, color }) {
  const { spacing } = useAppTheme();

  return (
    <View style={[pillStyle(color), { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

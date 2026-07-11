import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { IconWell } from './IconWell';
import { pillStyle } from '../../theme/patterns';

/** Icon-well + title + colored tag pill — mirrors the web dashboard's per-section header
 * ("Key Metrics"/Today, "Finance Overview"/This Month, "Human Resources"/Staff). */
export function SectionHeader({ icon, color, title, tag }) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
      <IconWell icon={icon} color={color} size={32} />
      <Text style={[typography.bodyStrong, { color: colors.text, marginLeft: spacing.sm, flex: 1 }]}>{title}</Text>
      {tag ? (
        <View style={pillStyle(color)}>
          <Text style={[typography.caption, { color, fontWeight: '700' }]}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
}

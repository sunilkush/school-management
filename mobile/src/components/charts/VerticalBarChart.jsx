import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';

const TRACK_HEIGHT = 120;
const BAR_WIDTH = 32;

/**
 * Vertical bar-per-category chart — mirrors the web dashboard's hand-rolled div bars
 * (SalaryStatistics.jsx / TotalSalaryByUnit.jsx): a gradient-filled rounded bar per category,
 * value label above, category label below. Horizontally scrollable so 12-month data doesn't
 * get squeezed on narrow screens.
 */
export function VerticalBarChart({ data = [], color, valueFormatter = (v) => String(v) }) {
  const { colors, typography, spacing } = useAppTheme();
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.lg, paddingHorizontal: spacing.xs }}>
        {data.map((item) => {
          const barColor = item.color || color;
          const barHeight = Math.max((item.value / maxValue) * TRACK_HEIGHT, 4);
          return (
            <View key={item.label} style={{ alignItems: 'center', width: BAR_WIDTH + 16 }}>
              <Text style={[typography.caption, { color: colors.text, fontWeight: '700', marginBottom: spacing.xs }]} numberOfLines={1}>
                {valueFormatter(item.value)}
              </Text>
              <View style={{ height: TRACK_HEIGHT, width: BAR_WIDTH, justifyContent: 'flex-end', backgroundColor: colors.borderMuted, borderRadius: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={[`${barColor}CC`, barColor]}
                  style={{ width: BAR_WIDTH, height: barHeight }}
                />
              </View>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

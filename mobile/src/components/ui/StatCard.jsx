import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeProvider';
import { STAT_COLORS } from '../../theme/patterns';
import { IconWell } from './IconWell';
import { formatMetricValue } from '../../utils/format';

const ENTRANCE_STEP_MS = 60;

function iconForMetric(metric) {
  if (metric.icon) return metric.icon;
  if (metric.format === 'currency') return 'cash-multiple';
  if (metric.suffix === '%') return 'chart-donut';
  return 'chart-box-outline';
}

/** Horizontal KPI tile — icon-well + label/value, matching the web dashboard's MetricCard layout.
 * When `metric.growth` is a finite number, renders a trend pill (▲/▼ + %) and caption footer,
 * matching the web SummaryCards' "vs last month" row. */
export function StatCard({ label, metric, style, entranceIndex = 0, trendCaption = 'vs last month' }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const accent = metric.color || STAT_COLORS[entranceIndex % STAT_COLORS.length];
  const hasGrowth = typeof metric.growth === 'number' && Number.isFinite(metric.growth);
  const isPositive = hasGrowth && metric.growth >= 0;
  const trendColor = isPositive ? colors.success : colors.danger;

  return (
    <Animated.View
      entering={FadeInUp.delay(entranceIndex * ENTRANCE_STEP_MS).springify().damping(18)}
      style={[{ flexGrow: 1, flexBasis: '47%' }, style]}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: accent,
          padding: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconWell icon={iconForMetric(metric)} color={accent} size={42} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {label}
            </Text>
            <Text style={[typography.h3, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>
              {formatMetricValue(metric)}
            </Text>
          </View>
        </View>
        {hasGrowth && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6 }}>
            <Text style={{ color: trendColor, fontWeight: '700', fontSize: 12 }}>
              {isPositive ? '▲' : '▼'} {Math.abs(metric.growth)}%
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {trendCaption}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// A one-time staggered settle-in when the dashboard's numbers first arrive — not repeated on
// every re-render (see FadeInUp.delay above, which only fires on mount/entering, not on updates).
export function StatGrid({ children }) {
  const { spacing } = useAppTheme();
  const items = React.Children.toArray(children);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map((child, index) => (React.isValidElement(child) ? React.cloneElement(child, { entranceIndex: index }) : child))}
    </View>
  );
}

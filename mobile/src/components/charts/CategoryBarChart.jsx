import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

const BAR_HEIGHT = 14;
const CORNER_RADIUS = 4;

/**
 * Horizontal magnitude-comparison bar chart for a single measure across categories (e.g. income
 * by fee head, headcount by department). One consistent hue for every bar — the categories are
 * already identified by their labels, so a different color per bar would be decorative, not
 * encoding anything (per the dataviz skill's "color follows the entity" rule, not row rank).
 *
 * Each bar is drawn as a rounded rect (4px) plus a small square rect masking the left corners, so
 * the data-end (right) is rounded and the baseline-end (left) is square, without hand-authored
 * SVG path arcs.
 */
export function CategoryBarChart({ data, valueFormatter = (v) => String(v) }) {
  const { colors, typography, spacing } = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View>
      {data.map((item, index) => {
        const barWidth = trackWidth > 0 ? Math.max((item.value / maxValue) * trackWidth, CORNER_RADIUS) : 0;
        return (
          <View key={item.label} style={{ marginTop: index === 0 ? 0 : spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                {valueFormatter(item.value)}
              </Text>
            </View>
            <View onLayout={(e) => trackWidth === 0 && setTrackWidth(e.nativeEvent.layout.width)}>
              {trackWidth > 0 && (
                <Svg width={trackWidth} height={BAR_HEIGHT}>
                  <Rect x={0} y={0} width={barWidth} height={BAR_HEIGHT} rx={CORNER_RADIUS} fill={colors.chartSeries} />
                  <Rect x={0} y={0} width={Math.min(CORNER_RADIUS, barWidth)} height={BAR_HEIGHT} fill={colors.chartSeries} />
                </Svg>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

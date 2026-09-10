import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

const SIZE = 160;
const STROKE_WIDTH = 22;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut chart with a center total overlay + colored-dot legend — mirrors the web dashboard's
 * recharts `<Pie innerRadius="40%" outerRadius="70%">` widgets (IncomeAnalysis/EmployeeStructure).
 * `data` values are raw magnitudes (counts or ₹); shares are computed here so callers don't have
 * to pre-normalize to percentages.
 */
export function DonutChart({ data = [], centerLabel, centerValueFormatter = (v) => String(v) }) {
  const { colors, typography, spacing } = useAppTheme();
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  let cumulative = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const share = total > 0 ? d.value / total : 0;
      const segmentLength = share * CIRCUMFERENCE;
      const offset = cumulative;
      cumulative += segmentLength;
      return { ...d, share, segmentLength, offset };
    });

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SIZE} height={SIZE}>
          {/* An SVG <circle>'s path naturally starts at 3 o'clock; adding a quarter-circumference
              to the dash offset shifts that start to 12 o'clock instead — the same visual result
              as the `<G rotation={-90}>` wrapper this replaced, without it (react-native-svg's
              web build translates G's rotation/origin props into a CSS `transform-origin` style
              using a raw hyphenated key, which React's DOM renderer warns is invalid). */}
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.borderMuted} strokeWidth={STROKE_WIDTH} fill="none" />
          {segments.map((seg) => (
            <Circle
              key={seg.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={seg.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${seg.segmentLength} ${CIRCUMFERENCE - seg.segmentLength}`}
              strokeDashoffset={CIRCUMFERENCE / 4 - seg.offset}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={[typography.h3, { color: colors.text }]}>{centerValueFormatter(total)}</Text>
          {centerLabel ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>{centerLabel}</Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md }}>
        {segments.map((seg) => (
          <View key={seg.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {seg.label} · {Math.round(seg.share * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

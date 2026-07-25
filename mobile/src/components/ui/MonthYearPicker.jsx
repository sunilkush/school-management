import React from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { FormField } from './FormField';
import { useAppTheme } from '../../theme/ThemeProvider';

const MONTHS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];

/** Month-chip-row + year field, shared by every Payroll admin screen that operates on a single
 * monthly cycle (Monthly Run, Payslip Center, Monthly Reports). */
export function MonthYearPicker({ month, year, onChangeMonth, onChangeYear, disabled }) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>MONTH</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
        {MONTHS.map((m) => (
          <Chip key={m.value} selected={m.value === month} onPress={() => !disabled && onChangeMonth(m.value)}>
            {m.label}
          </Chip>
        ))}
      </ScrollView>
      <FormField
        label="Year"
        value={String(year)}
        onChangeText={(text) => onChangeYear(Number(text.replace(/[^0-9]/g, '')) || year)}
        keyboardType="numeric"
        disabled={disabled}
        style={{ maxWidth: 140, marginTop: spacing.xs }}
      />
    </View>
  );
}

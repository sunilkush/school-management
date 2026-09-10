import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

/**
 * Whose data am I looking at? A Parent with two children is looking at one child's homework, not
 * "homework" in the abstract, and every Tier A module they can open has the same question.
 *
 * Unlike FilterChips there is no "All" here: these options are mutually exclusive subjects, not a
 * narrowing of one list, and most of the backend endpoints behind them take a single id.
 */
export function ScopePicker({ options = [], value, onChange }) {
  const { spacing } = useAppTheme();

  // One option is not a choice — showing a single permanently-selected chip is just noise.
  if (options.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={option.value === value}
          showSelectedCheck={false}
          mode={option.value === value ? 'flat' : 'outlined'}
          onPress={() => onChange(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </ScrollView>
  );
}

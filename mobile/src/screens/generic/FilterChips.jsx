import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Horizontal single-select filter row for a module list. `null` is the "all" state. */
export function FilterChips({ options = [], value, onChange, allLabel = 'All' }) {
  const { spacing } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
    >
      <Chip selected={value == null} showSelectedCheck={false} onPress={() => onChange(null)} compact>
        {allLabel}
      </Chip>
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          showSelectedCheck={false}
          onPress={() => onChange(option.value)}
          compact
        >
          {option.label}
        </Chip>
      ))}
    </ScrollView>
  );
}

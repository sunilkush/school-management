import React from 'react';
import { Searchbar } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

export function SearchField({ value, onChangeText, placeholder = 'Search', style }) {
  const { colors, radii } = useAppTheme();

  return (
    <Searchbar
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={[{ backgroundColor: colors.surfaceSoft, borderRadius: radii.md, elevation: 0 }, style]}
      inputStyle={{ minHeight: 0 }}
    />
  );
}

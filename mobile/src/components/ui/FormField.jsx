import React from 'react';
import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

export function FormField({ error, style, ...inputProps }) {
  const { spacing } = useAppTheme();

  return (
    <View style={[{ marginBottom: spacing.xs }, style]}>
      <TextInput mode="outlined" error={Boolean(error)} {...inputProps} />
      {Boolean(error) && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { APP_NAME } from '../../constants/config';

export function SplashScreen() {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary, padding: spacing.xl }]}>
      <Text style={[typography.h1, { color: colors.textOnPrimary, marginBottom: spacing.xl }]}>{APP_NAME}</Text>
      <ActivityIndicator color={colors.textOnPrimary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

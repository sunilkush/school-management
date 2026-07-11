import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

/**
 * Standard loading / error / empty wrapper for RTK Query screens, so every data screen in the
 * app handles these three states the same way instead of each reinventing it.
 *
 * <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}
 *             isEmpty={!data?.length} emptyLabel="No records yet">
 *   {...real content...}
 * </QueryState>
 */
export function QueryState({
  isLoading,
  isError,
  error,
  onRetry,
  isEmpty,
  emptyIcon = 'tray-arrow-down',
  emptyLabel = 'Nothing to show yet',
  loadingLabel = 'Loading…',
  children,
}) {
  const { colors, typography, spacing } = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>{loadingLabel}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Icon source="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={[typography.bodyStrong, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
          {error?.message || 'Something went wrong'}
        </Text>
        {onRetry && (
          <Button mode="outlined" onPress={onRetry} style={{ marginTop: spacing.lg }}>
            Try Again
          </Button>
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Icon source={emptyIcon} size={40} color={colors.textMuted} />
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return children;
}

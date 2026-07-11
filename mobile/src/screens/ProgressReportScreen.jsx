import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { ParentProgressReportView } from './parent/ParentProgressReportView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

export function ProgressReportScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-line" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Progress Report</Text>
        </View>
      </View>

      {role?.name === 'Parent' ? (
        <ParentProgressReportView />
      ) : (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="chart-line" emptyLabel="Progress report isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

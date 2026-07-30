import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { StudentFeesView } from './fees/StudentFeesView';
import { ParentFeesView } from './fees/ParentFeesView';
import { AccountantFeesView } from './fees/AccountantFeesView';

const HANDLED_ROLES = new Set(['Student', 'Parent', 'Accountant']);

export function FeesScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cash-multiple" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Fees</Text>
        </View>
      </View>

      {role?.name === 'Student' && <StudentFeesView />}
      {role?.name === 'Parent' && <ParentFeesView />}
      {role?.name === 'Accountant' && <AccountantFeesView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="cash-remove" emptyLabel="Fees view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

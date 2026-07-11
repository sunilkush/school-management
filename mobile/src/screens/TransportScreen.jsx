import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { MyTransportView } from './student/MyTransportView';
import { ParentTransportView } from './parent/ParentTransportView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const HANDLED_ROLES = new Set(['Student', 'Parent']);

export function TransportScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="bus-school" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Transport</Text>
        </View>
      </View>

      {role?.name === 'Student' && <MyTransportView />}
      {role?.name === 'Parent' && <ParentTransportView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="bus-alert" emptyLabel="Transport view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

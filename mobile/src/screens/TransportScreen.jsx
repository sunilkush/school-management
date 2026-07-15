import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { MyTransportView } from './student/MyTransportView';
import { ParentTransportView } from './parent/ParentTransportView';
import { RoutesScreen } from './RoutesScreen';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const HANDLED_ROLES = new Set(['Student', 'Parent', 'Principal']);

export function TransportScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  // RoutesScreen renders its own full header/ScreenContainer (a real routes browse, gated
  // read-only for Principal) — returned directly rather than nested inside this screen's own
  // wrapper below, to avoid a doubled header.
  if (role?.name === 'Principal') return <RoutesScreen />;

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

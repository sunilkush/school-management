import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { SchoolAdminEventsView } from './events/SchoolAdminEventsView';
import { AgendaEventsView } from './events/AgendaEventsView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const AGENDA_ROLES = new Set(['Student', 'Parent']);

export function EventsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="calendar-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Events</Text>
        </View>
      </View>

      {role?.name === 'School Admin' && <SchoolAdminEventsView />}
      {AGENDA_ROLES.has(role?.name) && <AgendaEventsView />}
      {role?.name !== 'School Admin' && !AGENDA_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="calendar-remove-outline" emptyLabel="Events view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

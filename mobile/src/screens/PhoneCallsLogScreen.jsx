import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateCallLogSheet } from './reception/CreateCallLogSheet';
import { formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteCallLogMutation, useGetCallLogsQuery } from '../store/api/apiSlice';

const TYPE_COLOR = { Incoming: '#22C55E', Outgoing: '#2563EB', Missed: '#EF4444' };

/** Front-desk call log — mirrors frontend/src/pages/Receptionist/ReceptionistPages.jsx's CallLog
 * section. */
export function PhoneCallsLogScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetCallLogsQuery({});
  const logs = data?.logs ?? [];
  const [deleteLog] = useDeleteCallLogMutation();

  const stats = useMemo(
    () => ({
      incoming: logs.filter((l) => l.type === 'Incoming').length,
      outgoing: logs.filter((l) => l.type === 'Outgoing').length,
      missed: logs.filter((l) => l.type === 'Missed').length,
    }),
    [logs]
  );

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="phone-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Phone Calls Log</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Incoming" metric={{ label: 'Incoming', icon: 'phone-incoming-outline', color: '#22C55E', value: stats.incoming }} />
          <StatCard label="Outgoing" metric={{ label: 'Outgoing', icon: 'phone-outgoing-outline', color: '#2563EB', value: stats.outgoing }} />
          <StatCard label="Missed" metric={{ label: 'Missed', icon: 'phone-missed-outline', color: '#EF4444', value: stats.missed }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Log Call
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={logs.length === 0}
        emptyIcon="phone-off-outline"
        emptyLabel="No calls logged yet"
      >
        {logs.map((l) => (
          <AccentListCard
            key={l._id}
            accent={TYPE_COLOR[l.type] || colors.primary}
            avatar={<AvatarInitials name={l.callerName} size={40} />}
            title={l.callerName}
            subtitle={l.phone ?? ''}
            badge={<StatusPill label={l.type} color={TYPE_COLOR[l.type] || colors.textMuted} />}
            meta={[
              { label: 'Time', value: formatDate(l.callTime) },
              ...(l.duration != null ? [{ label: 'Duration', value: `${l.duration} min` }] : []),
              ...(l.purpose ? [{ label: 'Purpose', value: l.purpose }] : []),
              ...(l.notes ? [{ label: 'Notes', value: l.notes }] : []),
              { label: 'Handled By', value: l.handledBy?.name ?? '—' },
            ]}
            expandable
            actions={<IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={() => deleteLog(l._id)} />}
          />
        ))}
      </QueryState>

      <CreateCallLogSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

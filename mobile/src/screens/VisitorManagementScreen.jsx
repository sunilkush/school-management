import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateGateEntrySheet } from './reception/CreateGateEntrySheet';
import { formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteGateEntryMutation, useGetGateEntriesQuery, useGetGateEntryStatsQuery, useMarkGateExitMutation } from '../store/api/apiSlice';

const STATUS_COLOR = { Inside: '#2563EB', Exited: '#22C55E' };

/** Front-desk visitor check-in/out log — the GateEntry model, distinct from Hostel Warden's own
 * HostelVisitor system. Mirrors frontend/src/pages/Receptionist/ReceptionistPages.jsx's
 * VisitorManagement section. */
export function VisitorManagementScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const statsQuery = useGetGateEntryStatsQuery();
  const stats = statsQuery.data ?? {};

  const { data, isLoading, isFetching, isError, error, refetch } = useGetGateEntriesQuery({});
  const entries = data?.entries ?? [];
  const [markExit, exitState] = useMarkGateExitMutation();
  const [deleteEntry] = useDeleteGateEntryMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-plus-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Visitor Management</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Currently Inside" metric={{ label: 'Currently Inside', icon: 'account-clock-outline', color: '#2563EB', value: stats.inside ?? 0 }} />
          <StatCard label="Today's Entries" metric={{ label: "Today's Entries", icon: 'login', color: '#22C55E', value: stats.todayEntries ?? 0 }} />
          <StatCard label="Today's Exits" metric={{ label: "Today's Exits", icon: 'logout', color: '#94A3B8', value: stats.todayExits ?? 0 }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Entry
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={entries.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel="No gate entries yet"
      >
        {entries.map((e) => (
          <AccentListCard
            key={e._id}
            accent={STATUS_COLOR[e.status] || colors.primary}
            avatar={<AvatarInitials name={e.name} size={40} />}
            title={e.name}
            subtitle={`${e.type}${e.purpose ? ` · ${e.purpose}` : ''}`}
            badge={<StatusPill label={e.status} color={STATUS_COLOR[e.status] || colors.textMuted} />}
            meta={[
              { label: 'Entry', value: formatDate(e.entryTime) },
              ...(e.exitTime ? [{ label: 'Exit', value: formatDate(e.exitTime) }] : []),
              ...(e.phone ? [{ label: 'Phone', value: e.phone }] : []),
              ...(e.vehicleNo ? [{ label: 'Vehicle', value: e.vehicleNo }] : []),
              { label: 'Gate', value: e.gate },
            ]}
            expandable
            actions={
              <>
                {e.status === 'Inside' && (
                  <Button size="small" mode="contained-tonal" onPress={() => markExit(e._id)} loading={exitState.isLoading} disabled={exitState.isLoading}>
                    Mark Exit
                  </Button>
                )}
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={() => deleteEntry(e._id)} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateGateEntrySheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

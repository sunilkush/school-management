import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateVisitorEntrySheet } from './hostel/CreateVisitorEntrySheet';
import { formatDate } from '../utils/format';
import { confirmDelete } from '../utils/confirm';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteVisitorEntryMutation, useGetHostelVisitorsQuery, useMarkVisitorExitMutation } from '../store/api/apiSlice';

const STATUS_COLOR = { visiting: '#2563EB', exited: '#22C55E' };
const STATUS_OPTIONS = [null, 'visiting', 'exited'];

/** Hostel visitor check-in/out log — its own model/routes, distinct from Receptionist's separate
 * gate-entry visitor system. Mirrors frontend/src/pages/HostelWarden/VisitorLog.jsx. */
export function VisitorLogScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  // Backend default limit=25 with no override would silently truncate the visitor history.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetHostelVisitorsQuery({ status: status || undefined, limit: 500 });
  const visitors = data?.visitors ?? [];
  const [markExit, exitState] = useMarkVisitorExitMutation();
  const [deleteVisitor] = useDeleteVisitorEntryMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-plus-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Visitor Log</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Today" metric={{ label: 'Today', icon: 'calendar-today', color: colors.primary, value: data?.visitorsToday ?? 0 }} />
          <StatCard label="Currently Visiting" metric={{ label: 'Currently Visiting', icon: 'account-clock-outline', color: '#2563EB', value: visitors.filter((v) => v.status === 'visiting').length }} />
          <StatCard label="Total Records" metric={{ label: 'Total Records', icon: 'notebook-outline', color: '#94A3B8', value: data?.total ?? visitors.length }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Entry
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        {STATUS_OPTIONS.map((s) => (
          <Chip key={s || 'all'} selected={status === s} onPress={() => setStatus(s)}>
            {s ?? 'All'}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={visitors.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel="No visitor entries yet"
      >
        {visitors.map((v) => (
          <AccentListCard
            key={v._id}
            accent={STATUS_COLOR[v.status] || colors.textMuted}
            avatar={<AvatarInitials name={v.visitorName} size={40} />}
            title={v.visitorName}
            subtitle={`${v.relation} · visiting ${v.studentId?.name ?? 'Unknown'}`}
            badge={<StatusPill label={v.status} color={STATUS_COLOR[v.status] || colors.textMuted} />}
            meta={[
              { label: 'Pass No.', value: v.passNumber },
              { label: 'Phone', value: v.visitorPhone },
              { label: 'Purpose', value: v.purpose },
              { label: 'Entry', value: formatDate(v.createdAt) },
              ...(v.exitTime ? [{ label: 'Exit', value: formatDate(v.exitTime) }] : []),
            ]}
            expandable
            actions={
              <>
                {v.status === 'visiting' && (
                  <Button size="small" mode="contained-tonal" onPress={() => markExit({ id: v._id })} loading={exitState.isLoading} disabled={exitState.isLoading}>
                    Mark Exit
                  </Button>
                )}
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={() => confirmDelete(() => deleteVisitor(v._id), 'this visitor entry')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateVisitorEntrySheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

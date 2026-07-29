import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateHostelComplaintSheet } from './hostel/CreateHostelComplaintSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetHostelComplaintsQuery, useUpdateHostelComplaintMutation } from '../store/api/apiSlice';

const STATUS_COLOR = { open: '#F59E0B', in_progress: '#2563EB', resolved: '#22C55E', closed: '#94A3B8', rejected: '#EF4444' };
const PRIORITY_COLOR = { low: '#64748B', medium: '#2563EB', high: '#F59E0B', urgent: '#EF4444' };
const STATUS_OPTIONS = [null, 'open', 'in_progress', 'resolved', 'closed', 'rejected'];
const NEXT_STATUS = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed', closed: 'open', rejected: 'open' };

/** Hostel complaint tracking with a full status workflow (open→in_progress→resolved/closed, or
 * rejected) — the backend keeps its own actionHistory audit trail per status change. Mirrors
 * frontend/src/pages/HostelWarden/ComplaintManagement.jsx. */
export function ComplaintsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  // Backend default limit=25 with no override would silently truncate the complaint list.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetHostelComplaintsQuery({ status: status || undefined, limit: 500 });
  const complaints = data?.complaints ?? [];
  const summary = data?.summary ?? [];
  const [updateComplaint, updateState] = useUpdateHostelComplaintMutation();

  const countFor = (s) => summary.find((row) => row._id === s)?.count ?? 0;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="message-alert-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Complaints</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Open" metric={{ label: 'Open', icon: 'alert-circle-outline', color: '#F59E0B', value: countFor('open') }} />
          <StatCard label="In Progress" metric={{ label: 'In Progress', icon: 'progress-clock', color: '#2563EB', value: countFor('in_progress') }} />
          <StatCard label="Resolved" metric={{ label: 'Resolved', icon: 'check-circle-outline', color: '#22C55E', value: countFor('resolved') }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Complaint
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        {STATUS_OPTIONS.map((s) => (
          <Chip key={s || 'all'} selected={status === s} onPress={() => setStatus(s)}>
            {s ? s.replace('_', ' ') : 'All'}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={complaints.length === 0}
        emptyIcon="message-alert-outline"
        emptyLabel="No complaints to show"
      >
        {complaints.map((c) => (
          <AccentListCard
            key={c._id}
            accent={PRIORITY_COLOR[c.priority] || colors.primary}
            avatar={<AvatarInitials name={c.studentId?.name} size={40} />}
            title={c.title}
            subtitle={`${c.type} · ${c.studentId?.name ?? 'Unknown'}`}
            badge={<StatusPill label={c.status.replace('_', ' ')} color={STATUS_COLOR[c.status] || colors.textMuted} />}
            meta={[
              { label: 'Complaint No.', value: c.complaintNo },
              { label: 'Description', value: c.description },
              { label: 'Priority', value: c.priority },
              ...(c.roomNumber ? [{ label: 'Room', value: c.roomNumber }] : []),
              ...(c.resolution ? [{ label: 'Resolution', value: c.resolution }] : []),
            ]}
            expandable
            actions={
              <Button
                size="small"
                mode="contained-tonal"
                onPress={() => updateComplaint({ id: c._id, status: NEXT_STATUS[c.status] })}
                loading={updateState.isLoading}
                disabled={updateState.isLoading}
              >
                Advance
              </Button>
            }
          />
        ))}
      </QueryState>

      <CreateHostelComplaintSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

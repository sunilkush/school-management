import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateSupportTicketSheet } from './CreateSupportTicketSheet';
import { timeAgo } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetSupportTicketsQuery, useUpdateSupportTicketStatusMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { Open: '#2563EB', 'In Progress': '#F59E0B', Resolved: '#22C55E', Closed: '#64748B' };
const PRIORITY_COLOR = { Low: '#64748B', Medium: '#2563EB', High: '#F59E0B', Urgent: '#EF4444' };
const STATUS_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
];
const NEXT_STATUS = { Open: 'In Progress', 'In Progress': 'Resolved', Resolved: 'Closed', Closed: 'Open' };

/** Support Tickets — shared across every role server-side (list auto-scopes to createdBy for
 * non-privileged roles; School Admin/Principal/VP see the whole school's tickets). */
export function SupportTicketsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSupportTicketsQuery({ status: status || undefined });
  const tickets = data ?? [];
  const [updateStatus, updateState] = useUpdateSupportTicketStatusMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="help-circle-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Support Tickets</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Raise and track support requests
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Ticket
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        {STATUS_OPTIONS.map((opt) => (
          <Chip key={opt.label} selected={status === opt.value} onPress={() => setStatus(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={tickets.length === 0}
        emptyIcon="help-circle-outline"
        emptyLabel="No support tickets yet"
      >
        {tickets.map((ticket) => (
          <AccentListCard
            key={ticket._id}
            accent={PRIORITY_COLOR[ticket.priority] || colors.primary}
            avatar={<IconWell icon="help-circle-outline" color={PRIORITY_COLOR[ticket.priority] || colors.primary} size={40} />}
            title={ticket.title}
            subtitle={`${ticket.category} · ${timeAgo(ticket.createdAt)}`}
            badge={<StatusPill label={ticket.status} color={STATUS_COLOR[ticket.status] || colors.textMuted} />}
            meta={[
              { label: 'Description', value: ticket.description },
              { label: 'Priority', value: ticket.priority },
              { label: 'Created By', value: ticket.createdBy?.name ?? '—' },
            ]}
            actions={
              <Button
                size="small"
                mode="contained-tonal"
                onPress={() => updateStatus({ id: ticket._id, status: NEXT_STATUS[ticket.status] })}
                loading={updateState.isLoading}
                disabled={updateState.isLoading}
              >
                Mark {NEXT_STATUS[ticket.status]}
              </Button>
            }
            expandable
          />
        ))}
      </QueryState>

      <CreateSupportTicketSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

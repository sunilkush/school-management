import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { pillStyle } from '../../theme/patterns';
import { CreateEventSheet } from './CreateEventSheet';
import { EVENT_TYPES, eventTypeColor } from '../../utils/events';
import { formatDate } from '../../utils/format';
import { confirmDelete } from '../../utils/confirm';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeleteEventMutation, useGetEventStatsQuery, useGetEventsQuery } from '../../store/api/apiSlice';

/** Mirrors frontend/src/pages/School_Admin/Events_&_Calendar/events.jsx (the CRUD table, not the
 * month-grid calendar — see CalendarPage.jsx, simplified out here). Editing an event is deferred
 * (create + delete covers the core workflow). */
export function SchoolAdminEventsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [typeFilter, setTypeFilter] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data: stats } = useGetEventStatsQuery();
  const { data: events = [], isLoading, isFetching, isError, error, refetch } = useGetEventsQuery({ type: typeFilter || undefined });
  const [deleteEvent, deleteState] = useDeleteEventMutation();

  const statCards = [
    { key: 'total', label: 'Total', icon: 'calendar-outline', color: colors.primary, value: stats?.total ?? 0 },
    { key: 'upcoming', label: 'Upcoming', icon: 'calendar-arrow-right', color: '#22C55E', value: stats?.upcoming ?? 0 },
    { key: 'past', label: 'Past', icon: 'calendar-check-outline', color: '#94A3B8', value: stats?.past ?? 0 },
    { key: 'cancelled', label: 'Cancelled', icon: 'calendar-remove-outline', color: '#EF4444', value: stats?.cancelled ?? 0 },
  ];

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Add Event
        </Button>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {statCards.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
        <Chip selected={!typeFilter} onPress={() => setTypeFilter(null)}>
          All Types
        </Chip>
        {EVENT_TYPES.map((t) => (
          <Chip key={t} selected={t === typeFilter} onPress={() => setTypeFilter(t)}>
            {t}
          </Chip>
        ))}
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={events.length === 0}
        emptyIcon="calendar-blank-outline"
        emptyLabel="No events scheduled yet"
      >
        {events.map((e) => {
          const color = eventTypeColor(e.type);
          return (
            <AccentListCard
              key={e._id}
              accent={e.status === 'cancelled' ? '#94A3B8' : color}
              avatar={<IconWell icon="calendar-outline" color={color} size={38} />}
              title={e.title}
              subtitle={`${formatDate(e.startDate)}${e.endDate && e.endDate !== e.startDate ? ` — ${formatDate(e.endDate)}` : ''} · ${e.audience}`}
              badge={
                <View style={pillStyle(color)}>
                  <Text style={[typography.caption, { color, fontWeight: '700', fontSize: 10.5 }]}>{e.type}</Text>
                </View>
              }
              meta={[{ label: 'Location', value: e.location }, { label: 'Description', value: e.description }]}
              expandable
              actions={
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={18}
                  disabled={deleteState.isLoading}
                  onPress={() => confirmDelete(() => deleteEvent(e._id), 'this event')}
                />
              }
            />
          );
        })}
      </QueryState>

      <CreateEventSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </View>
  );
}

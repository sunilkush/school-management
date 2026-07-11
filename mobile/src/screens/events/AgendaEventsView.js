import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { pillStyle } from '../../theme/patterns';
import { eventTypeColor } from '../../utils/events';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetEventsQuery } from '../../store/api/apiSlice';

/** Read-only agenda list — simplified from the web app's month-grid AcademicCalendar.jsx (a heavy
 * calendar-grid component not ported here). Built against the real `type`/`startDate` fields; the
 * web version of this exact page has a live bug reading nonexistent `eventType`/`date` fields
 * instead, which silently breaks its color-coding and stat tiles — not replicated here. */
export function AgendaEventsView() {
  const { typography } = useAppTheme();
  const { data: events = [], isLoading, isFetching, isError, error, refetch } = useGetEventsQuery();

  return (
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
            subtitle={`${formatDate(e.startDate)}${e.endDate && e.endDate !== e.startDate ? ` — ${formatDate(e.endDate)}` : ''}`}
            badge={
              <View style={pillStyle(color)}>
                <Text style={[typography.caption, { color, fontWeight: '700', fontSize: 10.5 }]}>{e.type}</Text>
              </View>
            }
            meta={[{ label: 'Location', value: e.location }, { label: 'Description', value: e.description }]}
            expandable
          />
        );
      })}
    </QueryState>
  );
}

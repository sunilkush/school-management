import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { LogIncidentSheet } from './LogIncidentSheet';
import { UpdateIncidentSheet } from './UpdateIncidentSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetIncidentsQuery } from '../../store/api/apiSlice';

const SEVERITY_COLOR = { Minor: '#F59E0B', Moderate: '#F97316', Major: '#EF4444' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Reused across School Admin, Principal, Vice Principal, Teacher, Class Teacher — same
 * DISCIPLINE_ROLES gate as web's disciplineIncident.routes.js. No Parent/Student view exists here
 * (or on web) since the backend has no endpoint for it. */
export function DisciplineView() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState(null);
  const [logging, setLogging] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);

  const params = useMemo(() => ({ search: search.trim() || undefined, severity: severity || undefined, limit: 50 }), [search, severity]);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetIncidentsQuery(params);
  const incidents = data?.incidents ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="shield-alert-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Discipline</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {data?.pagination?.total ?? incidents.length} incidents
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => setLogging(true)} compact>Log</Button>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by student name" style={{ marginBottom: spacing.sm }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        <Chip selected={!severity} onPress={() => setSeverity(null)}>All</Chip>
        {['Minor', 'Moderate', 'Major'].map((s) => (
          <Chip key={s} selected={severity === s} onPress={() => setSeverity(s)}>{s}</Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={incidents.length === 0}
        emptyIcon="shield-alert-outline"
        emptyLabel={search || severity ? 'No incidents match these filters' : 'No discipline incidents logged yet'}
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading…'}
      >
        {incidents.map((incident) => (
          <AccentListCard
            key={incident._id}
            accent={SEVERITY_COLOR[incident.severity] || colors.primary}
            avatar={<AvatarInitials name={incident.studentName} size={40} />}
            title={incident.studentName}
            subtitle={[incident.className, incident.sectionName].filter(Boolean).join(' · ') || incident.category}
            badge={<StatusPill label={incident.severity} color={SEVERITY_COLOR[incident.severity] || colors.textMuted} />}
            meta={[
              { label: 'Category', value: incident.category },
              { label: 'Description', value: incident.description },
              { label: 'Date', value: fmtDate(incident.incidentDate) },
              { label: 'Status', value: incident.status },
              { label: 'Demerit Points', value: incident.demeritPoints ?? 0 },
              { label: 'Parent Notified', value: incident.parentNotified ? 'Yes' : 'No' },
            ]}
            expandable
            actions={<Button compact mode="contained-tonal" onPress={() => setEditingIncident(incident)}>Update</Button>}
          />
        ))}
      </QueryState>

      <LogIncidentSheet visible={logging} onDismiss={() => setLogging(false)} onCreated={() => setLogging(false)} />
      <UpdateIncidentSheet incident={editingIncident} onDismiss={() => setEditingIncident(null)} />
    </ScreenContainer>
  );
}

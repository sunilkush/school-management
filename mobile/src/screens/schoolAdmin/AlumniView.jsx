import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { MarkAlumniSheet } from './MarkAlumniSheet';
import { EditAlumniSheet } from './EditAlumniSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAlumniQuery } from '../../store/api/apiSlice';

/** Super Admin/School Admin/Principal/Vice Principal only — same ALUMNI_ROLES gate as web's
 * alumniProfile.routes.js. No self-service portal, per the user's own scope decision. */
export function AlumniView() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = useMemo(() => ({ search: search.trim() || undefined, limit: 50 }), [search]);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAlumniQuery(params);
  const alumni = data?.alumni ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="school-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Alumni</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {data?.pagination?.total ?? alumni.length} graduates
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => setMarking(true)} compact>Mark</Button>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name, occupation, employer" style={{ marginBottom: spacing.md }} />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={alumni.length === 0}
        emptyIcon="school-outline"
        emptyLabel={search ? 'No alumni match this search' : 'No students marked as alumni yet'}
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading…'}
      >
        {alumni.map((a) => (
          <AccentListCard
            key={a._id}
            accent={a.isReachable === false ? '#94A3B8' : colors.primary}
            avatar={<AvatarInitials name={a.fullName} size={40} />}
            title={a.fullName}
            subtitle={`Class of ${a.graduationYear}`}
            badge={<StatusPill label={a.isReachable === false ? 'Unreachable' : 'Reachable'} color={a.isReachable === false ? '#94A3B8' : '#22C55E'} />}
            meta={[
              { label: 'Last Class', value: [a.lastClassName, a.lastSectionName].filter(Boolean).join(' - ') || '—' },
              { label: 'Occupation', value: a.currentOccupation || '—' },
              { label: 'Employer', value: a.currentEmployer || '—' },
              { label: 'Phone', value: a.currentPhone || '—' },
            ]}
            expandable
            actions={<Button compact mode="contained-tonal" onPress={() => setEditing(a)}>Edit</Button>}
          />
        ))}
      </QueryState>

      <MarkAlumniSheet visible={marking} onDismiss={() => setMarking(false)} onCreated={() => setMarking(false)} />
      <EditAlumniSheet alumnus={editing} onDismiss={() => setEditing(null)} />
    </ScreenContainer>
  );
}

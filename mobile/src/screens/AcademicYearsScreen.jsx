import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateAcademicYearSheet } from './superAdmin/CreateAcademicYearSheet';
import { formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  useActivateAcademicYearMutation,
  useArchiveAcademicYearMutation,
  useDeleteAcademicYearMutation,
  useGetAcademicYearsBySchoolQuery,
  useGetAllSchoolsQuery,
} from '../store/api/apiSlice';

const STATUS_COLOR = { active: '#22C55E', inactive: '#94A3B8', archived: '#64748B' };

export function AcademicYearsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [schoolId, setSchoolId] = useState(null);
  const [creating, setCreating] = useState(false);

  const schoolsQuery = useGetAllSchoolsQuery({});
  const schools = schoolsQuery.data?.schools ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  const years = data ?? [];

  const [activateYear, activateState] = useActivateAcademicYearMutation();
  const [archiveYear, archiveState] = useArchiveAcademicYearMutation();
  const [deleteYear, deleteState] = useDeleteAcademicYearMutation();
  const isBusy = activateState.isLoading || archiveState.isLoading || deleteState.isLoading;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="calendar-range-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Academic Years</Text>
        </View>
      </View>

      <QueryState isLoading={schoolsQuery.isLoading} isError={schoolsQuery.isError} error={schoolsQuery.error} onRetry={schoolsQuery.refetch} isEmpty={schools.length === 0} emptyIcon="domain" emptyLabel="No schools found">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {schools.map((s) => (
            <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
              {s.name}
            </Chip>
          ))}
        </ScrollView>

        {schoolId && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
              <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
                New Academic Year
              </Button>
            </View>

            <QueryState
              isLoading={isLoading || isFetching}
              isError={isError}
              error={error}
              onRetry={refetch}
              isEmpty={years.length === 0}
              emptyIcon="calendar-range-outline"
              emptyLabel="No academic years for this school yet"
            >
              {years.map((y) => (
                <AccentListCard
                  key={y._id}
                  accent={STATUS_COLOR[y.status] || colors.primary}
                  avatar={<IconWell icon="calendar-range-outline" color={STATUS_COLOR[y.status] || colors.primary} size={40} />}
                  title={y.name}
                  subtitle={`${formatDate(y.startDate)} – ${formatDate(y.endDate)}`}
                  badge={<StatusPill label={y.status} color={STATUS_COLOR[y.status] || colors.textMuted} />}
                  actions={
                    y.status === 'archived' ? undefined : (
                      <>
                        {y.status !== 'active' && (
                          <Button size="small" mode="contained-tonal" compact onPress={() => activateYear(y._id)} disabled={isBusy}>
                            Activate
                          </Button>
                        )}
                        <IconButton icon="archive-outline" size={18} disabled={isBusy} onPress={() => archiveYear(y._id)} />
                        <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={isBusy} onPress={() => deleteYear(y._id)} />
                      </>
                    )
                  }
                />
              ))}
            </QueryState>
          </>
        )}
      </QueryState>

      <CreateAcademicYearSheet visible={creating} schoolId={schoolId} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

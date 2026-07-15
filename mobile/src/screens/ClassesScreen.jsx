import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { pillStyle } from '../theme/patterns';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetClassDetailsQuery } from '../store/api/apiSlice';

/** Read-only class/section/subject-teacher overview — mirrors the web app's Classes page
 * (frontend/src/pages/School_Admin/Academic_Management/Classes.jsx) minus the assign-teacher
 * modal, which is a separate write flow not built here. */
export function ClassesScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  const { data, isLoading, isFetching, isError, error, refetch } = useGetClassDetailsQuery(
    { schoolId, academicYearId },
    { skip: !schoolId }
  );
  const classes = data ?? [];

  const stats = useMemo(() => {
    let sectionCount = 0;
    let unassignedCount = 0;
    classes.forEach((cls) => {
      sectionCount += cls.sections?.length ?? 0;
      cls.sections?.forEach((sec) => {
        sec.subjects?.forEach((sub) => {
          if (sub.teacherName === 'Unassigned') unassignedCount += 1;
        });
      });
    });
    return [
      { key: 'classes', label: 'Classes', icon: 'google-classroom', color: colors.primary, value: classes.length },
      { key: 'sections', label: 'Sections', icon: 'view-grid-outline', color: '#14B8A6', value: sectionCount },
      { key: 'unassigned', label: 'Unassigned Subjects', icon: 'account-alert-outline', color: '#F59E0B', value: unassignedCount },
    ];
  }, [classes, colors.primary]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="google-classroom" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Classes</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Sections and subject-teacher assignments
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={classes.length === 0}
        emptyIcon="google-classroom"
        emptyLabel="No classes found"
      >
        {classes.map((cls) => (
          <AccentListCard
            key={cls._id}
            accent={colors.primary}
            avatar={<IconWell icon="google-classroom" color={colors.primary} size={38} />}
            title={cls.name}
            subtitle={cls.boardClass?.name ?? 'No board assigned'}
            badge={
              <View style={pillStyle('#14B8A6')}>
                <Text style={[typography.caption, { color: '#14B8A6', fontWeight: '700', fontSize: 10.5 }]}>
                  {cls.sections?.length ?? 0} sections
                </Text>
              </View>
            }
            meta={(cls.sections ?? []).map((sec) => {
              const unassigned = sec.subjects?.filter((s) => s.teacherName === 'Unassigned').length ?? 0;
              return {
                label: `Section ${sec.name}`,
                value: `${sec.subjects?.length ?? 0} subjects${unassigned > 0 ? ` · ${unassigned} unassigned` : ''}`,
              };
            })}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

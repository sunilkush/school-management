import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllSchoolsQuery, useGetAllUsersQuery } from '../store/api/apiSlice';

/** Per-school user-count vs. plan limit — no dedicated backend endpoint, entirely computed
 * client-side from the schools list + platform-wide user list (same as web's own
 * PlatformUsage.jsx), which is also why the web page's own "recent activity" timeline is really
 * just school.createdAt sorted, not real activity data — not reproduced here since ActivityLogs
 * (a real, separate feature) already covers genuine activity. */
export function PlatformUsageScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const schoolsQuery = useGetAllSchoolsQuery({ limit: 200 });
  const schools = schoolsQuery.data?.schools ?? [];
  const usersQuery = useGetAllUsersQuery({});
  const users = usersQuery.data ?? [];

  const usageBySchool = useMemo(() => {
    const countBySchool = new Map();
    users.forEach((u) => {
      const id = u.school?._id;
      if (!id) return;
      countBySchool.set(id, (countBySchool.get(id) || 0) + 1);
    });
    return schools
      .map((s) => {
        const userCount = countBySchool.get(s._id) || 0;
        const maxUsers = s.subscriptionPlan?.limits?.maxUsers;
        const percent = maxUsers ? Math.round((userCount / maxUsers) * 100) : null;
        return { ...s, userCount, maxUsers, percent };
      })
      .sort((a, b) => b.userCount - a.userCount);
  }, [schools, users]);

  const isLoading = schoolsQuery.isLoading || usersQuery.isLoading;
  const isFetching = schoolsQuery.isFetching || usersQuery.isFetching;
  const isError = schoolsQuery.isError || usersQuery.isError;
  const error = schoolsQuery.error || usersQuery.error;
  const refetchAll = () => {
    schoolsQuery.refetch();
    usersQuery.refetch();
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-bar" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Platform Usage</Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetchAll}
        isEmpty={schools.length === 0}
        emptyIcon="chart-bar"
        emptyLabel="No schools found"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Schools" metric={{ label: 'Schools', icon: 'domain', color: colors.primary, value: schools.length }} />
            <StatCard label="Total Users" metric={{ label: 'Total Users', icon: 'account-group-outline', color: '#22C55E', value: users.length }} />
            <StatCard label="Active Users" metric={{ label: 'Active Users', icon: 'check-circle-outline', color: '#0891B2', value: users.filter((u) => u.isActive).length }} />
          </StatGrid>
        </View>

        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Usage by School</Text>
        {usageBySchool.map((s) => (
          <AccentListCard
            key={s._id}
            accent={s.percent != null && s.percent >= 90 ? '#EF4444' : colors.primary}
            avatar={<IconWell icon="domain" color={colors.primary} size={38} />}
            title={s.name}
            subtitle={s.maxUsers ? `${s.userCount} / ${s.maxUsers} users` : `${s.userCount} users`}
            badge={s.percent != null ? <StatusPill label={`${s.percent}%`} color={s.percent >= 90 ? '#EF4444' : '#22C55E'} /> : null}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

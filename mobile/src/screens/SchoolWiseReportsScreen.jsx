import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { formatCurrency } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAttendanceSummaryQuery, useGetFinanceSummaryQuery } from '../store/api/apiSlice';

/** Cross-school comparison — combines /analytics/finance's per-school topSchools breakdown with
 * /analytics/attendance's own per-school schoolStats breakdown (both already return this shape
 * server-side when called by Super Admin with no schoolId) into one row per school. Mirrors
 * frontend's SchoolWiseReports.jsx, simplified from its full drill-down drawer. */
export function SchoolWiseReportsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const financeQuery = useGetFinanceSummaryQuery({});
  const attendanceQuery = useGetAttendanceSummaryQuery({});

  const rows = useMemo(() => {
    const finance = financeQuery.data?.topSchools ?? [];
    const attendance = attendanceQuery.data?.schoolStats ?? [];
    const attendanceById = new Map(attendance.map((a) => [String(a.schoolId), a]));

    const financeById = new Map(finance.map((f) => [String(f.schoolId ?? f._id), f]));
    const allIds = new Set([...attendanceById.keys(), ...financeById.keys()]);

    return [...allIds].map((id) => {
      const a = attendanceById.get(id);
      const f = financeById.get(id);
      return {
        schoolId: id,
        schoolName: a?.schoolName ?? f?.schoolName ?? 'Unknown School',
        attendanceRate: a?.attendanceRate,
        totalCollected: f?.totalCollected,
        paymentCount: f?.paymentCount,
      };
    });
  }, [financeQuery.data, attendanceQuery.data]);

  const isLoading = financeQuery.isLoading || attendanceQuery.isLoading;
  const isFetching = financeQuery.isFetching || attendanceQuery.isFetching;
  const isError = financeQuery.isError || attendanceQuery.isError;
  const error = financeQuery.error || attendanceQuery.error;
  const refetchAll = () => {
    financeQuery.refetch();
    attendanceQuery.refetch();
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="domain" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>School-Wise Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Today's attendance + this financial year's collection, by school
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetchAll}
        isEmpty={rows.length === 0}
        emptyIcon="domain"
        emptyLabel="No school data available yet"
      >
        {rows.map((r) => (
          <AccentListCard
            key={r.schoolId}
            accent={r.attendanceRate != null && r.attendanceRate < 75 ? '#EF4444' : colors.primary}
            avatar={<IconWell icon="domain" color={colors.primary} size={38} />}
            title={r.schoolName}
            badge={r.attendanceRate != null ? <StatusPill label={`${r.attendanceRate}% today`} color={r.attendanceRate < 75 ? '#EF4444' : '#22C55E'} /> : null}
            meta={[
              ...(r.totalCollected != null ? [{ label: 'Collected (FY)', value: formatCurrency(r.totalCollected) }] : []),
              ...(r.paymentCount != null ? [{ label: 'Payments (FY)', value: r.paymentCount }] : []),
            ]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { Panel } from '../components/ui/Panel';
import { DonutChart } from '../components/charts/DonutChart';
import { STAT_COLORS } from '../theme/patterns';
import { formatCurrency } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllSchoolsQuery } from '../store/api/apiSlice';

/** Revenue breakdown by subscription plan — has no dedicated backend endpoint; entirely computed
 * client-side from each school's current subscriptionPlan (same source frontend's own
 * RevenueAnalytics.jsx uses, just simplified here to a category breakdown + per-school list
 * rather than a month/quarter/year trend chart, since there's no per-payment date data behind
 * this endpoint to trend against — only each school's CURRENT plan). */
export function RevenueAnalyticsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllSchoolsQuery({ limit: 200 });
  const schools = data?.schools ?? [];

  const withPlan = useMemo(() => schools.filter((s) => s.subscriptionPlan), [schools]);

  const totalRevenue = useMemo(() => withPlan.reduce((sum, s) => sum + (s.subscriptionPlan?.price || 0), 0), [withPlan]);

  const categoryBreakdown = useMemo(() => {
    const byCategory = new Map();
    withPlan.forEach((s) => {
      const cat = s.subscriptionPlan?.category ?? 'Other';
      byCategory.set(cat, (byCategory.get(cat) || 0) + (s.subscriptionPlan?.price || 0));
    });
    return [...byCategory.entries()].map(([label, value], i) => ({ label, value, color: STAT_COLORS[i % STAT_COLORS.length] }));
  }, [withPlan]);

  const topSchools = useMemo(
    () => [...withPlan].sort((a, b) => (b.subscriptionPlan?.price || 0) - (a.subscriptionPlan?.price || 0)).slice(0, 20),
    [withPlan]
  );

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-areaspline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Revenue Analytics</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Based on each school's current subscription plan
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={withPlan.length === 0}
        emptyIcon="chart-areaspline"
        emptyLabel="No schools with an active subscription plan yet"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Monthly Revenue (est.)" metric={{ label: 'Monthly Revenue (est.)', icon: 'cash-multiple', color: '#22C55E', value: totalRevenue, format: 'currency' }} />
            <StatCard label="Subscribed Schools" metric={{ label: 'Subscribed Schools', icon: 'domain', color: colors.primary, value: withPlan.length }} />
          </StatGrid>
        </View>

        {categoryBreakdown.length > 0 && (
          <Panel>
            <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Revenue by Plan Category</Text>
            <DonutChart data={categoryBreakdown} centerLabel="Revenue" centerValueFormatter={formatCurrency} />
          </Panel>
        )}

        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Top Schools by Plan Value</Text>
        {topSchools.map((s) => (
          <AccentListCard
            key={s._id}
            accent={colors.primary}
            avatar={<IconWell icon="domain" color={colors.primary} size={38} />}
            title={s.name}
            subtitle={s.subscriptionPlan?.name ?? ''}
            meta={[{ label: 'Plan Price', value: formatCurrency(s.subscriptionPlan?.price ?? 0) }]}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

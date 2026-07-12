import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { formatCurrency } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllSchoolsQuery, useGetFinanceSummaryQuery } from '../store/api/apiSlice';

const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

/** Platform-wide fee collection summary, by financial year (Apr–Mar) — mirrors
 * frontend/src/pages/Super_Admin/Reports_&Analytics/FinanceSummary.jsx. topSchools rows only
 * carry totalCollected/paymentCount server-side (no transactions/pending fields, despite what the
 * web table's dead columns imply). */
export function FinanceSummaryScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [schoolId, setSchoolId] = useState(null);
  const [year, setYear] = useState(now.getFullYear());

  const schoolsQuery = useGetAllSchoolsQuery({});
  const schools = schoolsQuery.data?.schools ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetFinanceSummaryQuery({ schoolId: schoolId || undefined, year });
  const topSchools = data?.topSchools ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="finance" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Finance Summary</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
        {YEARS.map((y) => (
          <Chip key={y} selected={y === year} onPress={() => setYear(y)}>
            {y}–{y + 1}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        <Chip selected={!schoolId} onPress={() => setSchoolId(null)}>
          All Schools
        </Chip>
        {schools.map((s) => (
          <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
            {s.name}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!data}
        emptyIcon="finance"
        emptyLabel="No finance data available yet"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Total Income" metric={{ label: 'Total Income', icon: 'cash-multiple', color: '#22C55E', value: data?.totalIncome ?? 0, format: 'currency' }} />
            <StatCard label="Payments" metric={{ label: 'Payments', icon: 'receipt-text-outline', color: colors.primary, value: data?.paymentCount ?? 0 }} />
            {!schoolId && (
              <StatCard label="Schools" metric={{ label: 'Schools', icon: 'domain', color: '#F59E0B', value: data?.totalSchools ?? 0 }} />
            )}
          </StatGrid>
        </View>

        {!schoolId && (
          <>
            <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Top Schools by Collection</Text>
            {topSchools.map((s, i) => (
              <AccentListCard
                key={i}
                accent={colors.primary}
                avatar={<IconWell icon="domain" color={colors.primary} size={38} />}
                title={s.schoolName ?? 'Unknown School'}
                meta={[
                  { label: 'Collected', value: formatCurrency(s.totalCollected ?? 0) },
                  { label: 'Payments', value: s.paymentCount ?? 0 },
                ]}
              />
            ))}
          </>
        )}
      </QueryState>
    </ScreenContainer>
  );
}

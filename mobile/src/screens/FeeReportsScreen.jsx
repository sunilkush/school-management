import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { formatCurrency, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetPaymentSummaryQuery, useGetPaymentsQuery, useGetStudentFeeSummaryQuery } from '../store/api/apiSlice';

const STATUS_COLOR = { pending: '#F59E0B', partial: '#2563EB', paid: '#22C55E' };

/** Fee collection reporting — mirrors frontend/src/pages/Accountant/Reports/FeeReports.jsx, which
 * itself combines these same 3 endpoints client-side rather than a dedicated report route. */
export function FeeReportsScreen() {
  const { colors, typography, spacing } = useAppTheme();

  const feeSummaryQuery = useGetStudentFeeSummaryQuery();
  const feeSummary = feeSummaryQuery.data ?? [];
  const totalCollected = feeSummary.reduce((sum, s) => sum + (s.totalCollected || 0), 0);
  const totalDue = feeSummary.reduce((sum, s) => sum + (s.totalDue || 0), 0);

  const paymentSummaryQuery = useGetPaymentSummaryQuery();
  const paymentSummary = paymentSummaryQuery.data ?? {};

  const paymentsQuery = useGetPaymentsQuery({ limit: 30 });
  const payments = paymentsQuery.data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={feeSummaryQuery.isLoading || paymentSummaryQuery.isLoading}
        isError={feeSummaryQuery.isError || paymentSummaryQuery.isError}
        error={feeSummaryQuery.error || paymentSummaryQuery.error}
        onRetry={() => {
          feeSummaryQuery.refetch();
          paymentSummaryQuery.refetch();
        }}
        isEmpty={false}
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Collected" metric={{ label: 'Collected', icon: 'cash-check', color: '#22C55E', value: totalCollected, format: 'currency' }} />
            <StatCard label="Due" metric={{ label: 'Due', icon: 'cash-clock', color: '#EF4444', value: totalDue, format: 'currency' }} />
            <StatCard label="Transactions" metric={{ label: 'Transactions', icon: 'receipt-text-outline', color: colors.primary, value: paymentSummary.totalTransactions ?? 0 }} />
          </StatGrid>
        </View>

        {feeSummary.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
            {feeSummary.map((s) => (
              <StatusPill key={s._id} label={`${s._id}: ${s.studentsCount}`} color={STATUS_COLOR[s._id] || colors.textMuted} />
            ))}
          </View>
        )}
      </QueryState>

      <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Recent Payments</Text>
      <QueryState
        isLoading={paymentsQuery.isLoading || paymentsQuery.isFetching}
        isError={paymentsQuery.isError}
        error={paymentsQuery.error}
        onRetry={paymentsQuery.refetch}
        isEmpty={payments.length === 0}
        emptyIcon="receipt-text-outline"
        emptyLabel="No payments recorded yet"
      >
        {payments.map((p) => (
          <AccentListCard
            key={p._id}
            accent={colors.primary}
            avatar={<IconWell icon="receipt-text-outline" color={colors.primary} size={38} />}
            title={p.studentId?.name ?? 'Unknown Student'}
            subtitle={`${formatDate(p.createdAt)} · ${p.paymentMode ?? ''}`}
            badge={<StatusPill label={p.status} color={STATUS_COLOR[p.status] || colors.textMuted} />}
            meta={[
              { label: 'Amount', value: formatCurrency(p.amountPaid) },
              ...(p.receiptNo ? [{ label: 'Receipt', value: p.receiptNo }] : []),
            ]}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

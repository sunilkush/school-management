import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { PayInstallmentSheet } from './PayInstallmentSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetFeeInstallmentsQuery, useGetMyFeesSummaryQuery, useGenerateFeeInstallmentsMutation } from '../../store/api/apiSlice';
import { FEE_STATUS_META, summarizeFees } from '../../utils/fees';
import { formatCurrency, formatDate } from '../../utils/format';

export function FeesContent({ studentId, academicYearId }) {
  const { colors, typography, spacing } = useAppTheme();
  const [payingInstallment, setPayingInstallment] = useState(null);

  const summaryQuery = useGetMyFeesSummaryQuery({ studentId, academicYearId }, { skip: !studentId });
  const installmentsQuery = useGetFeeInstallmentsQuery({ studentId, academicYearId }, { skip: !studentId });
  const [generateInstallments, generateState] = useGenerateFeeInstallmentsMutation();

  const feeRows = summaryQuery.data ?? [];
  const installments = installmentsQuery.data ?? [];
  const { total, paid, due } = summarizeFees(feeRows);

  const handleGenerate = () => {
    generateInstallments({ studentId, academicYearId }).catch(() => {});
  };

  return (
    <View>
      <QueryState
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
        error={summaryQuery.error}
        onRetry={summaryQuery.refetch}
        isEmpty={feeRows.length === 0}
        emptyIcon="cash-remove"
        emptyLabel="No fees assigned yet"
      >
        <StatGrid>
          <StatCard label="Total Fees" metric={{ value: total, format: 'currency', icon: 'clipboard-text-outline' }} />
          <StatCard label="Total Paid" metric={{ value: paid, format: 'currency', icon: 'check-circle-outline', color: '#22C55E' }} />
          <StatCard label="Total Due" metric={{ value: due, format: 'currency', icon: due > 0 ? 'alert-circle-outline' : 'check-circle-outline', color: due > 0 ? '#EF4444' : '#22C55E' }} />
        </StatGrid>

        <View style={{ marginTop: spacing.lg }}>
          {feeRows.map((row) => {
            const meta = FEE_STATUS_META[row.status] ?? FEE_STATUS_META.pending;
            return (
              <AccentListCard
                key={row._id}
                accent={meta.color}
                avatar={<IconWell icon="cash" color={meta.color} size={38} />}
                title={row.feeStructureId?.feeHeadId?.name ?? 'Fee'}
                subtitle={`Paid ${formatCurrency(row.paidAmount)} of ${formatCurrency(row.totalAmount)}`}
                badge={<StatusPill label={meta.label} color={meta.color} />}
              />
            );
          })}
        </View>
      </QueryState>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm }}>
        <Text style={[typography.h3, { color: colors.text }]}>Installments</Text>
        {installments.length === 0 && feeRows.length > 0 && (
          <Button mode="outlined" compact onPress={handleGenerate} loading={generateState.isLoading} disabled={generateState.isLoading}>
            Generate
          </Button>
        )}
      </View>

      <QueryState
        isLoading={installmentsQuery.isLoading}
        isError={installmentsQuery.isError}
        error={installmentsQuery.error}
        onRetry={installmentsQuery.refetch}
        isEmpty={installments.length === 0}
        emptyIcon="calendar-blank-outline"
        emptyLabel={feeRows.length === 0 ? 'Assign a fee structure first' : 'No installments generated yet'}
      >
        {installments.map((item) => {
          const meta = FEE_STATUS_META[item.status] ?? FEE_STATUS_META.pending;
          const remaining = item.amount - item.paidAmount;
          return (
            <AccentListCard
              key={item._id}
              accent={meta.color}
              avatar={<IconWell icon={meta.icon} color={meta.color} size={38} />}
              title={item.installmentName}
              subtitle={`Due ${formatDate(item.dueDate)} · ${formatCurrency(item.amount)}`}
              badge={<StatusPill label={meta.label} color={meta.color} />}
              actions={
                item.status !== 'paid' ? (
                  <Button mode="contained" compact onPress={() => setPayingInstallment(item)}>
                    Pay {formatCurrency(remaining)}
                  </Button>
                ) : null
              }
            />
          );
        })}
      </QueryState>

      <PayInstallmentSheet
        installment={payingInstallment}
        onDismiss={() => setPayingInstallment(null)}
        onPaid={() => setPayingInstallment(null)}
      />
    </View>
  );
}

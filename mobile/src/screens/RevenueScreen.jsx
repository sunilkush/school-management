import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { CreateInvoiceSheet } from './superAdmin/CreateInvoiceSheet';
import { AddManualPaymentSheet } from './superAdmin/AddManualPaymentSheet';
import { IconWell } from '../components/ui/IconWell';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetRevenueSummaryQuery } from '../store/api/apiSlice';

/** Platform revenue overview + invoice/payment creation — mirrors frontend's RevenuePage.jsx.
 * The invoice/payment LISTS themselves live on the PaymentHistory screen; this is the
 * summary + the 2 write actions. */
export function RevenueScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetRevenueSummaryQuery();
  const countByStatus = data?.countByStatus ?? {};

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-line" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Revenue</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="outlined" icon="cash-plus" onPress={() => setAddingPayment(true)}>
          Add Payment
        </Button>
        <Button mode="contained" icon="receipt-text-outline" onPress={() => setCreatingInvoice(true)}>
          Create Invoice
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!data}
        emptyIcon="chart-line"
        emptyLabel="No revenue data yet"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Invoiced" metric={{ label: 'Invoiced', icon: 'receipt-text-outline', color: colors.primary, value: data?.totalInvoiced ?? 0, format: 'currency' }} />
            <StatCard label="Paid" metric={{ label: 'Paid', icon: 'cash-check', color: '#22C55E', value: data?.totalPaid ?? 0, format: 'currency' }} />
            <StatCard label="Outstanding" metric={{ label: 'Outstanding', icon: 'cash-clock', color: '#F59E0B', value: data?.totalOutstanding ?? 0, format: 'currency' }} />
            <StatCard label="Overdue" metric={{ label: 'Overdue', icon: 'alert-outline', color: '#EF4444', value: data?.overdue ?? 0, format: 'currency' }} />
          </StatGrid>
        </View>

        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Invoices by Status</Text>
        {Object.entries(countByStatus).map(([status, count]) => (
          <View key={status} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{status}</Text>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{count}</Text>
          </View>
        ))}
      </QueryState>

      <CreateInvoiceSheet visible={creatingInvoice} onDismiss={() => setCreatingInvoice(false)} onCreated={() => setCreatingInvoice(false)} />
      <AddManualPaymentSheet visible={addingPayment} onDismiss={() => setAddingPayment(false)} onCreated={() => setAddingPayment(false)} />
    </ScreenContainer>
  );
}

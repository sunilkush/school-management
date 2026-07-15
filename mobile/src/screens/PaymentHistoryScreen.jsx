import React, { useState } from 'react';
import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { formatCurrency, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllInvoicesQuery, useGetAllSubscriptionPaymentsQuery } from '../store/api/apiSlice';

const INVOICE_STATUS_COLOR = { draft: '#94A3B8', unpaid: '#F59E0B', paid: '#22C55E', overdue: '#EF4444', cancelled: '#64748B' };
const PAYMENT_STATUS_COLOR = { pending: '#F59E0B', success: '#22C55E', failed: '#EF4444', refunded: '#94A3B8' };

/** Platform billing history (subscription invoices + payments) — distinct from the school-level
 * fee Payment model Accountant already uses. Mirrors frontend's PaymentsPage.jsx. */
export function PaymentHistoryScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [tab, setTab] = useState('invoices');

  const invoicesQuery = useGetAllInvoicesQuery(undefined, { skip: tab !== 'invoices' });
  const paymentsQuery = useGetAllSubscriptionPaymentsQuery(undefined, { skip: tab !== 'payments' });
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const query = tab === 'invoices' ? invoicesQuery : paymentsQuery;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cash-check" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Payment History</Text>
        </View>
      </View>

      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        style={{ marginBottom: spacing.md }}
        buttons={[
          { value: 'invoices', label: 'Invoices' },
          { value: 'payments', label: 'Payments' },
        ]}
      />

      <QueryState
        isLoading={query.isLoading || query.isFetching}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isEmpty={(tab === 'invoices' ? invoices : payments).length === 0}
        emptyIcon="cash-check"
        emptyLabel={`No ${tab} yet`}
      >
        {tab === 'invoices'
          ? invoices.map((inv) => (
              <AccentListCard
                key={inv._id}
                accent={INVOICE_STATUS_COLOR[inv.status] || colors.primary}
                avatar={<IconWell icon="receipt-text-outline" color={INVOICE_STATUS_COLOR[inv.status] || colors.primary} size={38} />}
                title={inv.invoiceNumber}
                subtitle={inv.schoolId?.name ?? 'Unknown School'}
                badge={<StatusPill label={inv.status} color={INVOICE_STATUS_COLOR[inv.status] || colors.textMuted} />}
                meta={[
                  { label: 'Total', value: formatCurrency(inv.totalAmount) },
                  { label: 'Due Date', value: formatDate(inv.dueDate) },
                  ...(inv.paidDate ? [{ label: 'Paid Date', value: formatDate(inv.paidDate) }] : []),
                ]}
                expandable
              />
            ))
          : payments.map((p) => (
              <AccentListCard
                key={p._id}
                accent={PAYMENT_STATUS_COLOR[p.status] || colors.primary}
                avatar={<IconWell icon="cash-check" color={PAYMENT_STATUS_COLOR[p.status] || colors.primary} size={38} />}
                title={p.schoolId?.name ?? 'Unknown School'}
                subtitle={p.invoiceId?.invoiceNumber ?? ''}
                badge={<StatusPill label={p.status} color={PAYMENT_STATUS_COLOR[p.status] || colors.textMuted} />}
                meta={[
                  { label: 'Amount', value: formatCurrency(p.amount) },
                  { label: 'Mode', value: p.paymentMode },
                  { label: 'Date', value: formatDate(p.paymentDate) },
                  ...(p.transactionId ? [{ label: 'Transaction ID', value: p.transactionId }] : []),
                ]}
                expandable
              />
            ))}
      </QueryState>
    </ScreenContainer>
  );
}

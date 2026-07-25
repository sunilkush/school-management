import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateSalaryAdvanceSheet } from './CreateSalaryAdvanceSheet';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useApproveAdvanceMutation, useCloseAdvanceMutation, useGetAdvancesQuery, useRejectAdvanceMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { pending: '#F59E0B', active: '#2563EB', rejected: '#EF4444', closed: '#22C55E' };

/** Employee salary advance (loan) requests — mirrors
 * frontend/src/pages/School_Admin/Payroll/SalaryAdvance.jsx. */
export function SalaryAdvanceView() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdvancesQuery();
  const advances = data ?? [];
  const [approveAdvance, approveState] = useApproveAdvanceMutation();
  const [rejectAdvance, rejectState] = useRejectAdvanceMutation();
  const [closeAdvance, closeState] = useCloseAdvanceMutation();
  const busy = approveState.isLoading || rejectState.isLoading || closeState.isLoading;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Advance
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={advances.length === 0}
        emptyIcon="cash-fast"
        emptyLabel="No salary advance requests yet"
      >
        {advances.map((a) => (
          <AccentListCard
            key={a._id}
            accent={STATUS_COLOR[a.status] || colors.primary}
            avatar={<AvatarInitials name={a.employeeId?.userId?.name} size={38} />}
            title={a.employeeId?.userId?.name ?? 'Employee'}
            subtitle={`Started ${formatDate(a.startMonth)}`}
            badge={<StatusPill label={a.status} color={STATUS_COLOR[a.status] || colors.textMuted} />}
            meta={[
              { label: 'Total Amount', value: formatCurrency(a.totalAmount) },
              { label: 'Remaining', value: formatCurrency(a.remainingAmount) },
              { label: 'EMI', value: formatCurrency(a.emiAmount) },
            ]}
            expandable
            actions={
              a.status === 'pending' ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button mode="outlined" compact disabled={busy} onPress={() => rejectAdvance({ id: a._id, reason: 'Rejected by admin' })}>
                    Reject
                  </Button>
                  <Button mode="contained" compact disabled={busy} onPress={() => approveAdvance(a._id)}>
                    Approve
                  </Button>
                </View>
              ) : a.status === 'active' ? (
                <Button mode="outlined" compact disabled={busy} onPress={() => closeAdvance(a._id)}>
                  Close
                </Button>
              ) : null
            }
          />
        ))}
      </QueryState>

      <CreateSalaryAdvanceSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

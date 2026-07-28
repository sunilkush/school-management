import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateReimbursementSheet } from './CreateReimbursementSheet';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import {
  useApproveFinanceReimbursementMutation,
  useApproveManagerReimbursementMutation,
  useDeleteReimbursementMutation,
  useGetReimbursementsQuery,
  useRejectReimbursementMutation,
} from '../../store/api/apiSlice';

const STATUS_COLOR = {
  pending_manager: '#F59E0B', pending_finance: '#2563EB',
  approved: '#22C55E', rejected: '#EF4444', added_to_payroll: '#8B5CF6',
};
const STATUS_LABEL = {
  pending_manager: 'Awaiting Manager', pending_finance: 'Awaiting Finance',
  approved: 'Approved', rejected: 'Rejected', added_to_payroll: 'Added to Payroll',
};
const TYPE_LABEL = { travel: 'Travel', fuel: 'Fuel', internet: 'Internet', medical: 'Medical', food: 'Food', other: 'Other' };

/** Employee expense reimbursement claims (two-stage manager-then-finance approval) — mirrors
 * frontend/src/pages/School_Admin/Payroll/ReimbursementsPage.jsx. */
export function ReimbursementsView() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetReimbursementsQuery();
  const reimbursements = data ?? [];
  const [approveManager, managerState] = useApproveManagerReimbursementMutation();
  const [approveFinance, financeState] = useApproveFinanceReimbursementMutation();
  const [reject, rejectState] = useRejectReimbursementMutation();
  const [remove, deleteState] = useDeleteReimbursementMutation();
  const busy = managerState.isLoading || financeState.isLoading || rejectState.isLoading || deleteState.isLoading;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Claim
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={reimbursements.length === 0}
        emptyIcon="cash-refund"
        emptyLabel="No reimbursement claims yet"
      >
        {reimbursements.map((r) => (
          <AccentListCard
            key={r._id}
            accent={STATUS_COLOR[r.status] || colors.primary}
            avatar={<AvatarInitials name={r.employeeId?.userId?.name} size={38} />}
            title={r.employeeId?.userId?.name ?? 'Employee'}
            subtitle={`${TYPE_LABEL[r.type] ?? r.type} · ${formatDate(r.claimDate)}`}
            badge={<StatusPill label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] || colors.textMuted} />}
            meta={[
              { label: 'Amount', value: formatCurrency(r.amount) },
              { label: 'Description', value: r.description || '—' },
            ]}
            expandable
            actions={
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {r.status === 'pending_manager' && (
                  <>
                    <Button mode="outlined" compact disabled={busy} onPress={() => reject({ id: r._id, reason: 'Rejected by admin' })}>
                      Reject
                    </Button>
                    <Button mode="contained" compact disabled={busy} onPress={() => approveManager(r._id)}>
                      Manager Approve
                    </Button>
                  </>
                )}
                {r.status === 'pending_finance' && (
                  <>
                    <Button mode="outlined" compact disabled={busy} onPress={() => reject({ id: r._id, reason: 'Rejected by admin' })}>
                      Reject
                    </Button>
                    <Button mode="contained" compact disabled={busy} onPress={() => approveFinance(r._id)}>
                      Finance Approve
                    </Button>
                  </>
                )}
                {(r.status === 'pending_manager' || r.status === 'rejected') && (
                  <Button mode="text" compact textColor={colors.danger} disabled={busy} onPress={() => confirmDelete(() => remove(r._id), 'this reimbursement')}>
                    Delete
                  </Button>
                )}
              </View>
            }
          />
        ))}
      </QueryState>

      <CreateReimbursementSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

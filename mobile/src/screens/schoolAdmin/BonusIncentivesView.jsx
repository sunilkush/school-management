import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateBonusSheet } from './CreateBonusSheet';
import { formatCurrency } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useApproveBonusMutation, useCancelBonusMutation, useGetBonusesQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { draft: '#94A3B8', approved: '#2563EB', paid: '#22C55E', cancelled: '#EF4444' };
const TYPE_LABEL = {
  festival_bonus: 'Festival Bonus', performance_bonus: 'Performance Bonus', incentive: 'Incentive',
  target_bonus: 'Target Bonus', one_time_payout: 'One-Time Payout',
};

/** Bonus & incentive payouts (festival, performance, target, etc.) — mirrors
 * frontend/src/pages/School_Admin/Payroll/BonusIncentivePage.jsx. */
export function BonusIncentivesView() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetBonusesQuery();
  const bonuses = data ?? [];
  const [approveBonus, approveState] = useApproveBonusMutation();
  const [cancelBonus, cancelState] = useCancelBonusMutation();
  const busy = approveState.isLoading || cancelState.isLoading;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Bonus
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={bonuses.length === 0}
        emptyIcon="gift-outline"
        emptyLabel="No bonuses or incentives recorded yet"
      >
        {bonuses.map((b) => (
          <AccentListCard
            key={b._id}
            accent={STATUS_COLOR[b.status] || colors.primary}
            avatar={<AvatarInitials name={b.employeeId?.userId?.name} size={38} />}
            title={b.title}
            subtitle={`${b.employeeId?.userId?.name ?? 'Employee'} · ${TYPE_LABEL[b.type] ?? b.type}`}
            badge={<StatusPill label={b.status} color={STATUS_COLOR[b.status] || colors.textMuted} />}
            meta={[
              { label: 'Amount', value: formatCurrency(b.amount) },
              { label: 'Payout Month', value: `${b.payoutMonth}/${b.payoutYear}` },
            ]}
            expandable
            actions={
              b.status === 'paid' || b.status === 'cancelled' ? null : (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {b.status === 'draft' && (
                    <Button mode="contained" compact disabled={busy} onPress={() => approveBonus(b._id)}>
                      Approve
                    </Button>
                  )}
                  <Button mode="outlined" compact disabled={busy} onPress={() => cancelBonus(b._id)}>
                    Cancel
                  </Button>
                </View>
              )
            }
          />
        ))}
      </QueryState>

      <CreateBonusSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

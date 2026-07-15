import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useCancelSchoolSubscriptionMutation,
  useChangeSchoolPlanMutation,
  useGetSchoolSubscriptionQuery,
  useGetSubscriptionPlansQuery,
  useReactivateSchoolSubscriptionMutation,
  useRenewSchoolSubscriptionMutation,
  useSuspendSchoolSubscriptionMutation,
} from '../../store/api/apiSlice';

const STATUS_COLOR = { active: '#22C55E', trial: '#2563EB', expired: '#EF4444', cancelled: '#94A3B8', suspended: '#F59E0B' };

export function ManageSubscriptionSheet({ school, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [changingPlan, setChangingPlan] = useState(false);
  const [error, setError] = useState(null);

  const { data: subscription, isLoading, isError, error: fetchError, refetch } = useGetSchoolSubscriptionQuery(school?._id, { skip: !school });
  const plansQuery = useGetSubscriptionPlansQuery(undefined, { skip: !changingPlan });
  const plans = (plansQuery.data ?? []).filter((p) => p.isActive);

  const [renew, renewState] = useRenewSchoolSubscriptionMutation();
  const [cancel, cancelState] = useCancelSchoolSubscriptionMutation();
  const [suspend, suspendState] = useSuspendSchoolSubscriptionMutation();
  const [reactivate, reactivateState] = useReactivateSchoolSubscriptionMutation();
  const [changePlan, changePlanState] = useChangeSchoolPlanMutation();
  const isBusy = renewState.isLoading || cancelState.isLoading || suspendState.isLoading || reactivateState.isLoading || changePlanState.isLoading;

  const runAction = async (fn) => {
    setError(null);
    try {
      await fn(school._id).unwrap();
    } catch (err) {
      setError(err?.data?.message || 'Action failed');
    }
  };

  const handleChangePlan = async (planId, action) => {
    setError(null);
    try {
      await changePlan({ schoolId: school._id, planId, action }).unwrap();
      setChangingPlan(false);
    } catch (err) {
      setError(err?.data?.message || 'Failed to change plan');
    }
  };

  return (
    <Portal>
      <Modal visible={!!school} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        {school && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{school.name} · Subscription</Text>

            <QueryState
              isLoading={isLoading}
              isError={isError}
              error={fetchError}
              onRetry={refetch}
              isEmpty={!subscription}
              emptyIcon="credit-card-outline"
              emptyLabel="No subscription assigned to this school yet"
            >
              {subscription && (
                <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]}>{subscription.planId?.name ?? 'Unknown Plan'}</Text>
                    <StatusPill label={subscription.status} color={STATUS_COLOR[subscription.status] || colors.textMuted} />
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {formatDate(subscription.startDate)} – {formatDate(subscription.endDate)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Price: {formatCurrency(subscription.snapshot?.price ?? 0)}
                  </Text>
                </View>
              )}

              {!changingPlan && (
                <View style={{ gap: spacing.sm }}>
                  <Button mode="contained-tonal" onPress={() => runAction(renew)} loading={renewState.isLoading} disabled={isBusy}>
                    Renew
                  </Button>
                  {subscription?.status !== 'suspended' ? (
                    <Button mode="outlined" onPress={() => runAction(suspend)} loading={suspendState.isLoading} disabled={isBusy}>
                      Suspend
                    </Button>
                  ) : (
                    <Button mode="outlined" onPress={() => runAction(reactivate)} loading={reactivateState.isLoading} disabled={isBusy}>
                      Reactivate
                    </Button>
                  )}
                  <Button mode="outlined" textColor={colors.danger} onPress={() => runAction(cancel)} loading={cancelState.isLoading} disabled={isBusy}>
                    Cancel Subscription
                  </Button>
                  <Button mode="outlined" onPress={() => setChangingPlan(true)} disabled={isBusy}>
                    Change Plan
                  </Button>
                </View>
              )}

              {changingPlan && (
                <View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SELECT NEW PLAN</Text>
                  <QueryState isLoading={plansQuery.isLoading} isError={plansQuery.isError} error={plansQuery.error} onRetry={plansQuery.refetch} isEmpty={plans.length === 0} emptyIcon="credit-card-outline" emptyLabel="No active plans available">
                    {plans.map((p) => (
                      <View key={p._id} style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <Chip style={{ flex: 1 }}>{p.name} · {formatCurrency(p.price)}</Chip>
                        <Button size="small" mode="contained" compact onPress={() => handleChangePlan(p._id, 'upgrade')} disabled={isBusy}>
                          Upgrade
                        </Button>
                        <Button size="small" mode="contained-tonal" compact onPress={() => handleChangePlan(p._id, 'downgrade')} disabled={isBusy}>
                          Downgrade
                        </Button>
                      </View>
                    ))}
                  </QueryState>
                  <Button mode="text" onPress={() => setChangingPlan(false)}>
                    Back
                  </Button>
                </View>
              )}
            </QueryState>

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <Button mode="outlined" onPress={onDismiss} style={{ marginTop: spacing.lg }}>
              Close
            </Button>
          </ScrollView>
        )}
      </Modal>
    </Portal>
  );
}

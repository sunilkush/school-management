import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateSubscriptionPlanSheet } from './superAdmin/CreateSubscriptionPlanSheet';
import { formatCurrency } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeactivateSubscriptionPlanMutation, useGetSubscriptionPlansQuery } from '../store/api/apiSlice';

const CATEGORY_COLOR = { Starter: '#64748B', Premium: '#2563EB', Enterprise: '#7C3AED', Custom: '#F59E0B' };

/** Plan create/update via the newer superAdminBilling "V2" endpoints (confirmed to be what the
 * real web SubscriptionPlans page uses); list via the older, broadly-readable
 * /subscription/allplan. "Delete" is really a deactivate (isActive: false) server-side. */
export function SubscriptionPlansScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSubscriptionPlansQuery();
  const plans = data ?? [];
  const [deactivatePlan, deactivateState] = useDeactivateSubscriptionPlanMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="credit-card-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Subscription Plans</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Plan
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={plans.length === 0}
        emptyIcon="credit-card-outline"
        emptyLabel="No subscription plans yet"
      >
        {plans.map((p) => (
          <AccentListCard
            key={p._id}
            accent={CATEGORY_COLOR[p.category] || colors.primary}
            avatar={<IconWell icon="credit-card-outline" color={CATEGORY_COLOR[p.category] || colors.primary} size={40} />}
            title={p.name}
            subtitle={formatCurrency(p.price)}
            badge={<StatusPill label={p.isActive ? p.category : `${p.category} (Inactive)`} color={p.isActive ? CATEGORY_COLOR[p.category] || colors.textMuted : colors.textMuted} />}
            meta={[
              { label: 'Duration', value: `${p.durationInDays} days` },
              ...(p.limits?.maxStudents ? [{ label: 'Max Students', value: p.limits.maxStudents }] : []),
              ...(p.limits?.maxTeachers ? [{ label: 'Max Teachers', value: p.limits.maxTeachers }] : []),
              ...(p.limits?.maxUsers ? [{ label: 'Max Users', value: p.limits.maxUsers }] : []),
            ]}
            expandable
            actions={
              <>
                <IconButton icon="pencil-outline" size={18} onPress={() => setEditingPlan(p)} />
                {p.isActive && (
                  <IconButton
                    icon="close-circle-outline"
                    iconColor={colors.danger}
                    size={18}
                    disabled={deactivateState.isLoading}
                    onPress={() => deactivatePlan(p._id)}
                  />
                )}
              </>
            }
          />
        ))}
      </QueryState>

      <CreateSubscriptionPlanSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <CreateSubscriptionPlanSheet visible={!!editingPlan} plan={editingPlan} onDismiss={() => setEditingPlan(null)} onCreated={() => setEditingPlan(null)} />
    </ScreenContainer>
  );
}

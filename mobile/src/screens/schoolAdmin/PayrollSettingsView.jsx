import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { PayrollSettingsFormSheet } from './PayrollSettingsFormSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetPayrollSettingsQuery } from '../../store/api/apiSlice';

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** PF (EPF) + ESI statutory payroll rules — Super Admin/School Admin/Accountant, matching the
 * backend's FULL_ACCESS_ROLES on payroll.routes.js (web only wires this into School Admin's own
 * sidebar today; the backend has always allowed Accountant here, this just exposes it on mobile).
 * Same versioned-settings model as web's PayrollSettingsPage.jsx: every save creates a new
 * effective-dated version rather than editing in place, so past payroll cycles keep the rates
 * that were actually in effect when they ran. */
export function PayrollSettingsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetPayrollSettingsQuery();
  const current = data?.current;
  const versions = data?.versions ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cog-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Payroll Settings</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            PF (EPF) and ESI statutory rules
          </Text>
        </View>
        <Button mode="contained" icon="plus" compact onPress={() => setCreating(true)}>New Version</Button>
      </View>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {current && (
          <View style={{ marginBottom: spacing.lg }}>
            <StatGrid>
              <StatCard
                label="PF (EPF)"
                metric={{ label: 'PF (EPF)', icon: 'shield-check-outline', color: current.pfEnabled === false ? '#94A3B8' : colors.primary, value: current.pfEnabled === false ? 'Off' : `${current.pfPercent}%` }}
              />
              <StatCard
                label="ESI"
                metric={{ label: 'ESI', icon: 'heart-outline', color: current.esiEnabled === false ? '#94A3B8' : '#14B8A6', value: current.esiEnabled === false ? 'Off' : `${current.esiPercent}%` }}
              />
            </StatGrid>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              Currently effective since {fmtDate(current.effectiveFrom)}
            </Text>
          </View>
        )}

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SETTINGS HISTORY</Text>
        <QueryState isLoading={false} isEmpty={versions.length === 0} emptyIcon="history" emptyLabel="No settings versions yet">
          {versions.map((v) => (
            <AccentListCard
              key={v._id}
              accent={v._id === current?._id ? colors.success : colors.border}
              avatar={<IconWell icon="history" color={v._id === current?._id ? colors.success : colors.textMuted} size={40} />}
              title={`Effective ${fmtDate(v.effectiveFrom)}`}
              subtitle={v.notes || undefined}
              badge={v._id === current?._id ? <StatusPill label="Currently effective" color={colors.success} /> : <StatusPill label="Historical" color={colors.textMuted} />}
              meta={[
                { label: 'PF', value: v.pfEnabled === false ? 'Off' : `${v.pfPercent}% (ceiling ₹${v.pfWageCeiling})` },
                { label: 'ESI', value: v.esiEnabled === false ? 'Off' : `${v.esiPercent}% (ceiling ₹${v.esiWageCeiling})` },
              ]}
              expandable
            />
          ))}
        </QueryState>
      </QueryState>

      <PayrollSettingsFormSheet visible={creating} current={current} onDismiss={() => setCreating(false)} onSaved={() => setCreating(false)} />
    </ScreenContainer>
  );
}

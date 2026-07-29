import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { MonthYearPicker } from '../../components/ui/MonthYearPicker';
import { IconWell } from '../../components/ui/IconWell';
import { formatCurrency } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGeneratePayrollCycleMutation,
  useGetPayrollCycleQuery,
  useLockPayrollCycleMutation,
  usePayPayrollCycleMutation,
} from '../../store/api/apiSlice';

const STATUS_COLOR = { draft: '#F59E0B', locked: '#2563EB', paid: '#22C55E' };
const PAYMENT_MODES = ['bank', 'cash', 'upi', 'cheque', 'other'];
const now = new Date();

/** Generate → lock → pay a monthly payroll cycle for the whole school — mirrors
 * frontend/src/pages/School_Admin/Payroll/EmployeeSalaries.jsx. Each step is a one-way gate
 * server-side: a paid cycle can never be regenerated, unlocked, or re-run. */
export function MonthlyRunView() {
  const { colors, typography, spacing } = useAppTheme();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [paymentMode, setPaymentMode] = useState('bank');

  const cycleQuery = useGetPayrollCycleQuery({ month, year });
  const [generateCycle, generateState] = useGeneratePayrollCycleMutation();
  const [lockCycle, lockState] = useLockPayrollCycleMutation();
  const [payCycle, payState] = usePayPayrollCycleMutation();
  const [actionError, setActionError] = useState(null);

  const notGeneratedYet = cycleQuery.isError && cycleQuery.error?.status === 404;
  const cycle = cycleQuery.data?.cycle;
  const entries = cycleQuery.data?.entries ?? [];

  const handleGenerate = async () => {
    setActionError(null);
    try {
      await generateCycle({ month, year }).unwrap();
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to generate payroll cycle');
    }
  };

  const handleLock = async () => {
    setActionError(null);
    try {
      await lockCycle(cycle._id).unwrap();
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to lock cycle');
    }
  };

  const handlePay = async () => {
    setActionError(null);
    try {
      await payCycle({ id: cycle._id, paymentMode }).unwrap();
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to mark cycle as paid');
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cash-sync" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Monthly Payroll Run</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Generate, lock and pay the school's monthly payroll cycle
          </Text>
        </View>
      </View>

      <MonthYearPicker month={month} year={year} onChangeMonth={setMonth} onChangeYear={setYear} disabled={generateState.isLoading} />

      {notGeneratedYet ? (
        <View style={{ alignItems: 'center', padding: spacing.xl }}>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' }]}>
            No payroll cycle exists yet for this month. Generating pulls every active employee's salary structure and attendance for the period.
          </Text>
          <Button mode="contained" icon="play" onPress={handleGenerate} loading={generateState.isLoading} disabled={generateState.isLoading}>
            Generate Payroll Cycle
          </Button>
          {actionError && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.md }]}>{actionError}</Text>}
        </View>
      ) : (
        <QueryState
          isLoading={cycleQuery.isLoading || cycleQuery.isFetching}
          isError={cycleQuery.isError}
          error={cycleQuery.error}
          onRetry={cycleQuery.refetch}
          isEmpty={false}
        >
          {cycle && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <StatusPill label={cycle.status} color={STATUS_COLOR[cycle.status] || colors.textMuted} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>{entries.length} employees</Text>
              </View>

              {cycle.status === 'draft' && (
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                  <Button mode="contained" icon="refresh" onPress={handleGenerate} loading={generateState.isLoading} disabled={generateState.isLoading} style={{ flex: 1 }}>
                    Regenerate
                  </Button>
                  <Button mode="contained" icon="lock-outline" onPress={handleLock} loading={lockState.isLoading} disabled={lockState.isLoading} style={{ flex: 1 }}>
                    Lock Cycle
                  </Button>
                </View>
              )}

              {cycle.status === 'locked' && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>PAYMENT MODE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
                    {PAYMENT_MODES.map((m) => (
                      <Chip key={m} selected={m === paymentMode} onPress={() => setPaymentMode(m)}>
                        {m}
                      </Chip>
                    ))}
                  </ScrollView>
                  <Button mode="contained" icon="cash-check" onPress={handlePay} loading={payState.isLoading} disabled={payState.isLoading}>
                    Mark Cycle as Paid
                  </Button>
                </View>
              )}

              {actionError && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{actionError}</Text>}

              {entries.map((entry) => (
                <AccentListCard
                  key={entry._id}
                  accent={entry.paymentStatus === 'paid' ? colors.success : colors.warning}
                  avatar={<AvatarInitials name={entry.employeeId?.userId?.name} size={38} />}
                  title={entry.employeeId?.userId?.name ?? 'Employee'}
                  subtitle={[entry.employeeId?.designation, entry.employeeId?.department].filter(Boolean).join(' · ')}
                  badge={<StatusPill label={entry.paymentStatus} color={entry.paymentStatus === 'paid' ? colors.success : colors.warning} />}
                  meta={[
                    { label: 'Gross', value: formatCurrency(entry.grossEarnings) },
                    { label: 'Deductions', value: formatCurrency(entry.totalDeductions) },
                    { label: 'Net Pay', value: formatCurrency(entry.netPay) },
                    { label: 'Present Days', value: entry.presentDays ?? '—' },
                  ]}
                  expandable
                />
              ))}
            </>
          )}
        </QueryState>
      )}
    </ScreenContainer>
  );
}

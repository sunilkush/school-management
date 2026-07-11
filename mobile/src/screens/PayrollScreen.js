import React, { useState } from 'react';
import { View } from 'react-native';
import { ProgressBar, SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { Panel } from '../components/ui/Panel';
import { paymentStatusMeta, monthLabel } from '../utils/payroll';
import { formatCurrency, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetMyPayrollSummaryQuery } from '../store/api/apiSlice';

const EARNING_FIELDS = [
  ['basic', 'Basic'], ['hra', 'HRA'], ['da', 'DA'], ['conveyance', 'Conveyance'],
  ['medical', 'Medical'], ['specialAllowance', 'Special Allowance'], ['bonus', 'Bonus'], ['incentive', 'Incentive'],
];
const DEDUCTION_FIELDS = [
  ['pf', 'PF'], ['esi', 'ESI'], ['professionalTax', 'Professional Tax'], ['tds', 'TDS'], ['lateFine', 'Late Fine'],
];

/** Read-only self-service view — mirrors frontend/src/pages/Employee/PayrollSelfServicePage.jsx
 * exactly (My Payslips / Salary Breakdown / Attendance tabs, single GET, no writes). */
export function PayrollScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [tab, setTab] = useState('payslips');
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyPayrollSummaryQuery();

  const employee = data?.employee;
  const structure = data?.structure;
  const payslips = data?.payslips ?? [];
  const latest = payslips[0];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cash-multiple" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Payroll</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {employee?.designation ?? ''}{employee?.department ? ` · ${employee.department}` : ''}
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!employee}
        emptyIcon="cash-remove"
        emptyLabel="No payroll profile found for your account"
      >
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          style={{ marginBottom: spacing.lg }}
          buttons={[
            { value: 'payslips', label: 'Payslips' },
            { value: 'breakdown', label: 'Breakdown' },
            { value: 'attendance', label: 'Attendance' },
          ]}
        />

        {tab === 'payslips' && (
          <QueryState isLoading={false} isError={false} isEmpty={payslips.length === 0} emptyIcon="file-document-outline" emptyLabel="No payslips generated yet">
            {payslips.map((p) => {
              const meta = paymentStatusMeta(p.paymentStatus);
              return (
                <AccentListCard
                  key={p._id}
                  accent={meta.color}
                  avatar={<IconWell icon="file-document-outline" color={meta.color} size={38} />}
                  title={`${monthLabel(p.month)} ${p.year}`}
                  subtitle={`Net Pay: ${formatCurrency(p.netPay)}`}
                  badge={<StatusPill label={meta.label} color={meta.color} />}
                  meta={[
                    { label: 'Gross Earnings', value: formatCurrency(p.grossEarnings) },
                    { label: 'Deductions', value: formatCurrency(p.totalDeductions) },
                    { label: 'Present Days', value: `${p.presentDays}/${p.workingDays}` },
                    { label: 'Paid On', value: p.paidAt ? formatDate(p.paidAt) : '—' },
                  ]}
                  expandable
                />
              );
            })}
          </QueryState>
        )}

        {tab === 'breakdown' && (
          <QueryState isLoading={false} isError={false} isEmpty={!structure} emptyIcon="cash-remove" emptyLabel="No active salary structure on file">
            <Panel>
              <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Earnings</Text>
              {EARNING_FIELDS.map(([key, label]) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[typography.body, { color: colors.text }]}>{formatCurrency(structure?.[key])}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>Gross Monthly</Text>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{formatCurrency(structure?.grossMonthly)}</Text>
              </View>
            </Panel>

            <Panel style={{ marginBottom: 0 }}>
              <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Deductions</Text>
              {DEDUCTION_FIELDS.map(([key, label]) => (
                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[typography.body, { color: colors.text }]}>{formatCurrency(structure?.deductions?.[key])}</Text>
                </View>
              ))}
            </Panel>
          </QueryState>
        )}

        {tab === 'attendance' && (
          <QueryState isLoading={false} isError={false} isEmpty={!latest} emptyIcon="calendar-remove-outline" emptyLabel="No attendance-linked payslip yet">
            {latest && (
              <>
                <View style={{ marginBottom: spacing.lg }}>
                  <StatGrid>
                    <StatCard label="Working Days" metric={{ value: latest.workingDays, icon: 'calendar-outline', color: colors.primary }} />
                    <StatCard label="Present Days" metric={{ value: latest.presentDays, icon: 'check-circle-outline', color: '#22C55E' }} />
                    <StatCard label="Paid Leaves" metric={{ value: latest.paidLeaves, icon: 'calendar-clock-outline', color: '#2563EB' }} />
                    <StatCard label="LOP Days" metric={{ value: latest.lopDays, icon: 'calendar-remove-outline', color: '#EF4444' }} />
                  </StatGrid>
                </View>
                <Panel style={{ marginBottom: 0 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>
                    Attendance ({monthLabel(latest.month)} {latest.year})
                  </Text>
                  <ProgressBar progress={latest.workingDays > 0 ? latest.presentDays / latest.workingDays : 0} color={colors.primary} style={{ height: 8, borderRadius: 4 }} />
                </Panel>
              </>
            )}
          </QueryState>
        )}
      </QueryState>
    </ScreenContainer>
  );
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { MonthYearPicker } from '../../components/ui/MonthYearPicker';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMonthlyPayrollReportQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { draft: '#F59E0B', locked: '#2563EB', paid: '#22C55E' };
const now = new Date();

/** Aggregate totals for a generated payroll cycle — mirrors
 * frontend/src/pages/School_Admin/Payroll/MonthlyPayrollReport.jsx. */
export function PayrollMonthlyReportsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const reportQuery = useGetMonthlyPayrollReportQuery({ month, year });
  const notGeneratedYet = reportQuery.isError && reportQuery.error?.status === 404;
  const cycle = reportQuery.data?.cycle;
  const summary = reportQuery.data?.summary;

  return (
    <ScreenContainer scrollable>
      <MonthYearPicker month={month} year={year} onChangeMonth={setMonth} onChangeYear={setYear} />

      {notGeneratedYet ? (
        <View style={{ alignItems: 'center', padding: spacing.xl }}>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            No payroll cycle has been generated for this month yet — generate it from Monthly Run first.
          </Text>
        </View>
      ) : (
        <QueryState
          isLoading={reportQuery.isLoading || reportQuery.isFetching}
          isError={reportQuery.isError}
          error={reportQuery.error}
          onRetry={reportQuery.refetch}
          isEmpty={false}
        >
          {cycle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.text }]}>
                {new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <StatusPill label={cycle.status} color={STATUS_COLOR[cycle.status] || colors.textMuted} />
            </View>
          )}

          {summary && (
            <StatGrid>
              <StatCard label="Total Employees" metric={{ value: summary.totalEmployees }} />
              <StatCard label="Total Gross" metric={{ value: summary.totalGross, format: 'currency' }} />
              <StatCard label="Total Deductions" metric={{ value: summary.totalDeductions, format: 'currency' }} />
              <StatCard label="Total Net Pay" metric={{ value: summary.totalNetPay, format: 'currency' }} />
              <StatCard label="Unpaid Employees" metric={{ value: summary.unpaidCount, color: summary.unpaidCount > 0 ? colors.danger : colors.success }} />
            </StatGrid>
          )}
        </QueryState>
      )}
    </ScreenContainer>
  );
}

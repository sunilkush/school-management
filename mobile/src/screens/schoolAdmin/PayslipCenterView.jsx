import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { MonthYearPicker } from '../../components/ui/MonthYearPicker';
import { SearchField } from '../../components/ui/SearchField';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetPayrollCycleQuery } from '../../store/api/apiSlice';

const now = new Date();

/** Browse every employee's payslip for a generated cycle — mirrors
 * frontend/src/pages/School_Admin/Payroll/GeneratePayslip.jsx. Reuses the same GET
 * /payroll/cycle/:month/:year Monthly Run already calls; its entries already carry the full
 * per-employee breakdown a payslip needs, so no separate per-employee fetch is needed here. */
export function PayslipCenterView() {
  const { colors, typography, spacing } = useAppTheme();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');

  const cycleQuery = useGetPayrollCycleQuery({ month, year });
  const notGeneratedYet = cycleQuery.isError && cycleQuery.error?.status === 404;
  const entries = cycleQuery.data?.entries ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.employeeId?.userId?.name?.toLowerCase().includes(q));
  }, [entries, search]);

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
        <>
          <SearchField placeholder="Search employee…" value={search} onChangeText={setSearch} style={{ marginBottom: spacing.md }} />
          <QueryState
            isLoading={cycleQuery.isLoading || cycleQuery.isFetching}
            isError={cycleQuery.isError}
            error={cycleQuery.error}
            onRetry={cycleQuery.refetch}
            isEmpty={filtered.length === 0}
            emptyIcon="file-document-outline"
            emptyLabel="No payslips found"
          >
            {filtered.map((entry) => (
              <AccentListCard
                key={entry._id}
                accent={entry.paymentStatus === 'paid' ? colors.success : colors.warning}
                avatar={<AvatarInitials name={entry.employeeId?.userId?.name} size={38} />}
                title={entry.employeeId?.userId?.name ?? 'Employee'}
                subtitle={[entry.employeeId?.designation, entry.employeeId?.department].filter(Boolean).join(' · ')}
                badge={<StatusPill label={entry.paymentStatus} color={entry.paymentStatus === 'paid' ? colors.success : colors.warning} />}
                meta={[
                  { label: 'Gross Earnings', value: formatCurrency(entry.grossEarnings) },
                  { label: 'Total Deductions', value: formatCurrency(entry.totalDeductions) },
                  { label: 'Net Pay', value: formatCurrency(entry.netPay) },
                  { label: 'Working Days', value: entry.workingDays ?? '—' },
                  { label: 'Present Days', value: entry.presentDays ?? '—' },
                  { label: 'Paid Leaves', value: entry.paidLeaves ?? '—' },
                  { label: 'LOP Days', value: entry.lopDays ?? '—' },
                  { label: 'Payment Mode', value: entry.paymentMode ?? '—' },
                  { label: 'Paid On', value: entry.paidAt ? formatDate(entry.paidAt) : '—' },
                  { label: 'Transaction Ref', value: entry.transactionRef ?? '—' },
                ]}
                expandable
              />
            ))}
          </QueryState>
        </>
      )}
    </ScreenContainer>
  );
}

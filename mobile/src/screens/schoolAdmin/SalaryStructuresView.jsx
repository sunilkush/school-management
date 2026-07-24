import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateSalaryStructureSheet } from './CreateSalaryStructureSheet';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetPayrollStructuresQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { active: '#22C55E', inactive: '#64748B' };

/** Per-employee salary structure (basic/HRA/DA/allowances) that Monthly Run pulls from —
 * mirrors frontend/src/pages/School_Admin/Payroll/SalaryStructures.jsx. */
export function SalaryStructuresView() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPayrollStructuresQuery();
  const structures = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Structure
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={structures.length === 0}
        emptyIcon="file-table-outline"
        emptyLabel="No salary structures yet"
      >
        {structures.map((s) => (
          <AccentListCard
            key={s._id}
            accent={STATUS_COLOR[s.status] || colors.primary}
            avatar={<IconWell icon="file-table-outline" color={STATUS_COLOR[s.status] || colors.primary} size={40} />}
            title={s.employeeId?.userId?.name ?? 'Employee'}
            subtitle={[s.employeeId?.designation, s.employeeId?.department].filter(Boolean).join(' · ')}
            badge={<StatusPill label={s.status} color={STATUS_COLOR[s.status] || colors.textMuted} />}
            meta={[
              { label: 'Gross Monthly', value: formatCurrency(s.grossMonthly) },
              { label: 'Basic', value: formatCurrency(s.basic) },
              { label: 'Effective From', value: formatDate(s.effectiveFrom) },
              { label: 'Effective To', value: s.effectiveTo ? formatDate(s.effectiveTo) : 'Ongoing' },
            ]}
            expandable
          />
        ))}
      </QueryState>

      <CreateSalaryStructureSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Panel } from '../../components/ui/Panel';
import { DonutChart } from '../../components/charts/DonutChart';
import { VerticalBarChart } from '../../components/charts/VerticalBarChart';
import { EmployeePerformanceList } from '../../components/dashboard/EmployeePerformanceList';
import { pillStyle } from '../../theme/patterns';
import { formatCurrency } from '../../utils/format';
import { useGetSchoolAdminAnalyticsQuery } from '../../store/api/apiSlice';

function ChartTitle({ title, subtitle }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  );
}

function SalaryByUnitChart({ units = [], chartData = [] }) {
  const { colors, spacing } = useAppTheme();
  const [activeKey, setActiveKey] = useState(units[0]?.key);
  const activeUnit = units.find((u) => u.key === activeKey) ?? units[0];
  const bars = chartData.map((row) => ({ label: row.month, value: row[activeUnit?.key] || 0, color: activeUnit?.color }));

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
        {units.map((unit) => {
          const active = unit.key === activeKey;
          return (
            <Pressable
              key={unit.key}
              onPress={() => setActiveKey(unit.key)}
              hitSlop={8}
              style={[
                pillStyle(unit.color),
                {
                  paddingVertical: spacing.xs,
                  minHeight: 36,
                  justifyContent: 'center',
                  backgroundColor: active ? `${unit.color}30` : `${unit.color}15`,
                },
              ]}
            >
              <Text style={{ color: unit.color, fontWeight: '700', fontSize: 12 }}>{unit.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {activeUnit ? <VerticalBarChart data={bars} color={activeUnit.color} valueFormatter={(v) => formatCurrency(v)} /> : null}
    </View>
  );
}

export function SchoolAdminDashboard() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSchoolAdminAnalyticsQuery();

  const summaryCards = useMemo(() => {
    const s = data?.summary;
    if (!s) return [];
    return [
      { key: 'newAdmissions', label: 'New Admissions', icon: 'account-plus-outline', color: '#1677FF', ...s.newAdmissions },
      { key: 'totalStudents', label: 'Total Students', icon: 'school-outline', color: '#0EA472', ...s.totalStudents },
      { key: 'totalTeachers', label: 'Total Teachers', icon: 'account-tie-outline', color: '#14B8A6', ...s.totalTeachers },
      { key: 'totalIncome', label: 'Total Income', icon: 'cash-multiple', color: '#EF4444', format: 'currency', ...s.totalIncome },
    ];
  }, [data]);

  return (
    <View>
      <View style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[typography.h1, { color: colors.text }]}>School Dashboard</Text>
          <View style={pillStyle('#7C3AED')}>
            <Text style={[typography.caption, { color: '#7C3AED', fontWeight: '700' }]}>Live Overview</Text>
          </View>
        </View>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Monitor school performance, finance and staff activity
        </Text>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!data}
        emptyIcon="view-dashboard-outline"
        emptyLabel="No dashboard data available yet"
      >
        <SectionHeader icon="trending-up" color="#1677FF" title="Key Metrics" tag="Today" />
        <View style={{ marginBottom: spacing.xl }}>
          <StatGrid>
            {summaryCards.map((m) => (
              <StatCard key={m.key} label={m.label} metric={m} />
            ))}
          </StatGrid>
        </View>

        <SectionHeader icon="cash-multiple" color="#0EA472" title="Finance Overview" tag="This Month" />
        <View style={{ marginBottom: spacing.xl }}>
          <Panel>
            <ChartTitle title="Salary Statistics" subtitle="By department" />
            <VerticalBarChart data={(data?.salaryStatistics ?? []).map((d) => ({ label: d.title, value: d.value, color: d.color }))} valueFormatter={formatCurrency} />
          </Panel>
          <Panel>
            <ChartTitle title="Income Analysis" subtitle="By payment mode" />
            <DonutChart data={data?.incomeAnalysis ?? []} centerLabel="Total" centerValueFormatter={(v) => `${v}%`} />
          </Panel>
          <Panel style={{ marginBottom: 0 }}>
            <ChartTitle title="Salary by Unit" subtitle="Last 12 months" />
            <SalaryByUnitChart units={data?.salaryByUnit?.units ?? []} chartData={data?.salaryByUnit?.chartData ?? []} />
          </Panel>
        </View>

        <SectionHeader icon="account-group" color="#7C3AED" title="Human Resources" tag="Staff" />
        <View>
          <Panel>
            <ChartTitle title="School Structure" subtitle="User distribution overview" />
            <DonutChart data={(data?.employeeStructure ?? []).map((d) => ({ label: d.label, value: d.count, color: d.color }))} centerLabel="Total" />
          </Panel>
          <ChartTitle title="Teacher Performance" subtitle="Top 5 this month" />
          <EmployeePerformanceList data={data?.employeePerformance ?? []} />
        </View>
      </QueryState>
    </View>
  );
}

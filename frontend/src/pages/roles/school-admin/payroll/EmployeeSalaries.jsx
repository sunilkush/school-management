import React, { useMemo, useState } from "react";
import { Alert, Breadcrumb, Card, Layout, Space } from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import PayrollHeaderActions from "../../../../components/payroll/PayrollHeaderActions";
import PayrollCycleStatus from "../../../../components/payroll/PayrollCycleStatus";
import PayrollSummaryCards from "../../../../components/payroll/PayrollSummaryCards";
import PayrollEntriesTable from "../../../../components/payroll/PayrollEntriesTable";
import { usePayrollActions, usePayrollCycle } from "../../../../hooks/payrollHooks";
import { getPayrollActionPermissions } from "../../../../utils/payroll";

const { Content } = Layout;

const EmployeeSalaries = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const userRole = useSelector((state) => state.auth.user?.role?.name);
  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { loading, cycle, entries, summary, isCycleMissing, refreshCycle } = usePayrollCycle(month, year);
  const { actionLoading, generateCycle, lockCycle, payCycle } = usePayrollActions({
    month,
    year,
    cycleId: cycle?._id,
    onSuccess: refreshCycle,
  });

  const permissions = useMemo(
    () => getPayrollActionPermissions(userRole, cycle?.status),
    [userRole, cycle?.status]
  );

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Monthly Run</Breadcrumb.Item>
      </Breadcrumb>
      <Content>
        <Card style={{ marginBottom: 16 }}>
          <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
            <PayrollHeaderActions
              selectedMonth={selectedMonth}
              onMonthChange={(value) => value && setSelectedMonth(value)}
              onRefresh={refreshCycle}
              onGenerate={generateCycle}
              onLock={lockCycle}
              onPay={payCycle}
              loading={loading}
              actionLoading={actionLoading}
              permissions={permissions}
            />
            <PayrollCycleStatus status={cycle?.status} />
          </Space>
        </Card>

        {isCycleMissing && (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="No payroll cycle found"
            description="Generate cycle for this month, then review / lock / pay actions apply."
          />
        )}

        <div style={{ marginBottom: 16 }}>
          <PayrollSummaryCards summary={summary} />
        </div>

        <Card title="Payroll Entries">
          <PayrollEntriesTable entries={entries} loading={loading} />
        </Card>
      </Content>
    </Layout>
  );
};

export default EmployeeSalaries;

import React, { useMemo, useState } from "react";
import { Alert, Space } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import PayrollHeaderActions from "../../../components/payroll/PayrollHeaderActions";
import PayrollCycleStatus from "../../../components/payroll/PayrollCycleStatus";
import PayrollSummaryCards from "../../../components/payroll/PayrollSummaryCards";
import PayrollEntriesTable from "../../../components/payroll/PayrollEntriesTable";
import { usePayrollActions, usePayrollCycle } from "../../../hooks/payrollHooks";
import { getPayrollActionPermissions } from "../../../utils/payroll";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
} from "../../../styles/pageStyles";

const EmployeeSalaries = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [cycleType, setCycleType] = useState("monthly");
  const [paymentMode, setPaymentMode] = useState("bank");
  const userRole = useSelector((state) => state.auth.user?.role?.name);
  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { loading, cycle, entries, summary, isCycleMissing, refreshCycle } = usePayrollCycle(month, year);
  const { actionLoading, generateCycle, lockCycle, payCycle } = usePayrollActions({
    month,
    year,
    cycleId: cycle?._id,
    cycleType,
    paymentMode,
    onSuccess: refreshCycle,
  });

  const permissions = useMemo(
    () => getPayrollActionPermissions(userRole, cycle?.status),
    [userRole, cycle?.status]
  );

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Monthly Payroll Run"
        subtitle="Generate, review and process monthly payroll"
        icon={<TeamOutlined />}
      />

      <div style={{ padding: "20px" }}>
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
            <PayrollHeaderActions
              selectedMonth={selectedMonth}
              onMonthChange={(value) => value && setSelectedMonth(value)}
              onRefresh={refreshCycle}
              onGenerate={generateCycle}
              onLock={lockCycle}
              onPay={payCycle}
              cycleType={cycleType}
              onCycleTypeChange={setCycleType}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
              loading={loading}
              actionLoading={actionLoading}
              permissions={permissions}
            />
            <PayrollCycleStatus status={cycle?.status} />
          </Space>
        </div>

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

        <div style={{ ...pageCard, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Payroll Entries</div>
          <PayrollEntriesTable entries={entries} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeSalaries;

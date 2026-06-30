import React, { useEffect, useMemo, useState } from "react";
import { Button, Space } from "antd";
import { ArrowRightOutlined, CalendarOutlined, CheckCircleOutlined, LockOutlined, PlusCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import PayrollHeaderActions from "../../../components/payroll/PayrollHeaderActions";
import PayrollCycleStatus from "../../../components/payroll/PayrollCycleStatus";
import PayrollSummaryCards from "../../../components/payroll/PayrollSummaryCards";
import PayrollEntriesTable from "../../../components/payroll/PayrollEntriesTable";
import { useLatestPayrollCycle, usePayrollActions, usePayrollCycle } from "../../../hooks/payrollHooks";
import { getPayrollActionPermissions } from "../../../utils/payroll";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
} from "../../../styles/pageStyles";

const EmployeeSalaries = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [initialised, setInitialised] = useState(false);
  const [cycleType, setCycleType] = useState("monthly");
  const [paymentMode, setPaymentMode] = useState("bank");
  const userRole = useSelector((state) => state.auth.user?.role?.name);
  const latestCycle = useLatestPayrollCycle();

  useEffect(() => {
    if (!initialised && latestCycle?.month && latestCycle?.year) {
      setSelectedMonth(dayjs(`${latestCycle.year}-${String(latestCycle.month).padStart(2, "0")}-01`));
      setInitialised(true);
    }
  }, [latestCycle, initialised]);

  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  // First month that has no existing cycle (right after the latest known cycle)
  const nextFreshMonth = latestCycle?.month && latestCycle?.year
    ? dayjs(`${latestCycle.year}-${String(latestCycle.month).padStart(2, "0")}-01`).add(1, "month")
    : selectedMonth.add(1, "month");

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

        {cycle && (cycle.status === "paid" || cycle.status === "locked") && (
          <div style={{
            marginBottom: 16,
            background: cycle.status === "paid" ? "#f0fdf4" : "#EFF6FF",
            border: `1px solid ${cycle.status === "paid" ? "#86EFAC" : "#93C5FD"}`,
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {cycle.status === "paid"
                ? <CheckCircleOutlined style={{ fontSize: 18, color: "#16A34A" }} />
                : <LockOutlined style={{ fontSize: 18, color: "#2563EB" }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: cycle.status === "paid" ? "#15803D" : "#1D4ED8" }}>
                  {selectedMonth.format("MMMM YYYY")} payroll is {cycle.status === "paid" ? "paid ✓" : "locked"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  This cycle cannot be regenerated. Next payroll to run: <strong>{nextFreshMonth.format("MMMM YYYY")}</strong>
                </div>
              </div>
            </div>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => setSelectedMonth(nextFreshMonth)}
              style={{ borderRadius: 8, whiteSpace: "nowrap" }}
            >
              Generate {nextFreshMonth.format("MMMM YYYY")} Payroll
            </Button>
          </div>
        )}

        {isCycleMissing && (
          <div style={{
            marginBottom: 16,
            background: "var(--surface, #fff)",
            border: "1px dashed #d1d5db",
            borderRadius: 12,
            padding: "32px 24px",
            textAlign: "center",
          }}>
            <CalendarOutlined style={{ fontSize: 40, color: "#94a3b8", marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 6 }}>
              No Payroll Cycle for {selectedMonth.format("MMMM YYYY")}
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }}>
              No cycle has been generated for this month yet. Click <strong>Generate / Refresh</strong> above to create one,
              or use the month picker to view an existing cycle.
            </div>
            {permissions.canGenerate && (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                size="large"
                loading={actionLoading.generate}
                onClick={generateCycle}
                style={{ borderRadius: 8 }}
              >
                Generate Payroll for {selectedMonth.format("MMMM YYYY")}
              </Button>
            )}
          </div>
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

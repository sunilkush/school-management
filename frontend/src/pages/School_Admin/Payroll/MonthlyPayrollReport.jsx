import React, { useMemo, useState } from "react";
import { Alert, Button, DatePicker, Space, Table } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePayrollCycle, useMonthlyPayrollReport } from "../../../hooks/payrollHooks";
import MonthlyPayrollReportCards from "../../../components/payroll/MonthlyPayrollReportCards";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  tableHeadCss,
} from "../../../styles/pageStyles";

const MonthlyPayrollReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { entries } = usePayrollCycle(month, year);
  const { loading, report, isEmpty, refreshReport } = useMonthlyPayrollReport(month, year);

  const deptRows = useMemo(() => {
    const map = entries.reduce((acc, item) => {
      const dept = item.employeeId?.department || "Unknown";
      if (!acc[dept]) acc[dept] = { key: dept, department: dept, employees: 0, netPay: 0 };
      acc[dept].employees += 1;
      acc[dept].netPay += Number(item.netPay || 0);
      return acc;
    }, {});
    return Object.values(map);
  }, [entries]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("payroll-report-tbl")}</style>
      <PageHeader
        title="Monthly Payroll Report"
        subtitle="Department-wise payroll summary and export"
        icon={<BarChartOutlined />}
      />

      <div style={{ padding: "20px" }}>
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Space wrap>
            <DatePicker picker="month" value={selectedMonth} onChange={(v) => v && setSelectedMonth(v)} />
            <Button onClick={refreshReport}>Refresh</Button>
            <Button onClick={() => window.print()} disabled={!report}>Export / Print</Button>
          </Space>
        </div>

        {isEmpty ? (
          <Alert type="info" showIcon message="No report for selected month" description="Generate payroll cycle for this month first." />
        ) : (
          <>
            <MonthlyPayrollReportCards
              summary={
                report?.summary || {
                  totalEmployees: 0,
                  totalGross: 0,
                  totalDeductions: 0,
                  totalNetPay: 0,
                  unpaidCount: 0,
                }
              }
            />

            <div style={{ ...pageCard, padding: 24, marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>
                Department-wise Distribution
              </div>
              <Table
                className="payroll-report-tbl"
                rowKey="department"
                dataSource={deptRows}
                loading={loading}
                columns={[
                  { title: "Department", dataIndex: "department" },
                  { title: "Employees", dataIndex: "employees" },
                  { title: "Net Pay", dataIndex: "netPay" },
                ]}
                pagination={false}
                scroll={{ x: "max-content" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyPayrollReport;

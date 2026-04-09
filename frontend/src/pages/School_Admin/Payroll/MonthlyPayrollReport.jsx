import React, { useMemo, useState } from "react";
import { Alert, Breadcrumb, Button, Card, DatePicker, Layout, Space, Table } from "antd";
import dayjs from "dayjs";
import { usePayrollCycle, useMonthlyPayrollReport } from "../../../hooks/payrollHooks";
import MonthlyPayrollReportCards from "../../../components/payroll/MonthlyPayrollReportCards";

const { Content } = Layout;

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
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Monthly Reports</Breadcrumb.Item>
      </Breadcrumb>
      <Content>
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <DatePicker picker="month" value={selectedMonth} onChange={(v) => v && setSelectedMonth(v)} />
            <Button onClick={refreshReport}>Refresh</Button>
            <Button onClick={() => window.print()} disabled={!report}>Export / Print</Button>
          </Space>
        </Card>

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

            <Card title="Department-wise Distribution" style={{ marginTop: 16 }} loading={loading}>
              <Table
                rowKey="department"
                dataSource={deptRows}
                columns={[
                  { title: "Department", dataIndex: "department" },
                  { title: "Employees", dataIndex: "employees" },
                  { title: "Net Pay", dataIndex: "netPay" },
                ]}
                pagination={false}
              />
            </Card>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default MonthlyPayrollReport;

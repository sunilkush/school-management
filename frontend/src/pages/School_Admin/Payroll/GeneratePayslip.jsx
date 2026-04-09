import React, { useEffect, useMemo, useState } from "react";
import { Alert, Breadcrumb, Button, Card, Col, Empty, Layout, Row, Space, Table, message } from "antd";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";
import { usePayrollCycle, usePayslip } from "../../../hooks/payrollHooks";
import PayslipFilters from "../../../components/payroll/PayslipFilters";
import PayslipPreview from "../../../components/payroll/PayslipPreview";
import { formatCurrencyINR } from "../../../utils/payroll";

const { Content } = Layout;

const GeneratePayslip = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState();

  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { entries, loading, isCycleMissing, refreshCycle } = usePayrollCycle(month, year);
  const { loading: payslipLoading, payslip, notFound, fetchPayslip, setPayslip } = usePayslip({
    month,
    year,
    employeeId: selectedEmployeeId,
  });

  useEffect(() => {
    httpClient
      .get("/employee")
      .then((res) => setEmployees(res?.data?.data || []))
      .catch(() => message.error("Employees load failed"));
  }, []);

  useEffect(() => {
    setPayslip(null);
  }, [month, year, setPayslip]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee._id,
        label: `${employee.userId?.name || "Employee"} (${employee.designation || "Staff"})`,
      })),
    [employees]
  );

  const entriesColumns = [
    { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
    { title: "Net Pay", dataIndex: "netPay", render: (v) => formatCurrencyINR(v) },
    { title: "Status", dataIndex: "paymentStatus" },
    {
      title: "Action",
      render: (_, r) => (
        <Button
          onClick={() => {
            const id = r.employeeId?._id;
            setSelectedEmployeeId(id);
            fetchPayslip(id);
          }}
        >
          Preview
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Payslip Center</Breadcrumb.Item>
      </Breadcrumb>
      <Content>
        <Card style={{ marginBottom: 16 }}>
          <PayslipFilters
            monthValue={selectedMonth}
            onMonthChange={(v) => v && setSelectedMonth(v)}
            employeeOptions={employeeOptions}
            employeeId={selectedEmployeeId}
            setEmployeeId={setSelectedEmployeeId}
            onRefresh={refreshCycle}
            onFetch={() => fetchPayslip()}
            onPrint={() => window.print()}
            loading={payslipLoading}
          />
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title={`Cycle Entries - ${selectedMonth.format("MMMM YYYY")}`}>
              {isCycleMissing ? (
                <Alert type="info" showIcon message="Cycle not found" description="Generate cycle first for this month." />
              ) : entries.length ? (
                <Table rowKey="_id" columns={entriesColumns} dataSource={entries} loading={loading} pagination={{ pageSize: 6 }} />
              ) : (
                <Empty description="No payroll entries" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Payslip Preview"
              extra={<Space>{notFound && <Alert type="warning" message="Payslip not found for selected employee/month" showIcon />}</Space>}
            >
              <PayslipPreview payslip={payslip} monthLabel={selectedMonth.format("MMMM YYYY")} />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default GeneratePayslip;

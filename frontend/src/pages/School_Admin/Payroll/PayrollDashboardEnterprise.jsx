import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPayrollDashboard, fetchPayrollRuns } from "../../../features/payrollEnterpriseSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };

export default function PayrollDashboardEnterprise() {
  const dispatch = useDispatch();
  const { dashboard, runs, loading, error } = useSelector((s) => s.payrollEnterprise);

  useEffect(() => {
    dispatch(fetchPayrollDashboard());
    dispatch(fetchPayrollRuns());
  }, [dispatch]);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>Enterprise Payroll Dashboard</Typography.Title>
      {error && <Alert type="error" showIcon message={error} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} xl={6}><Card loading={loading}><Statistic title="Total Payout" value={dashboard?.totalPayout || 0} formatter={money} /></Card></Col>
        <Col xs={24} md={8} xl={6}><Card loading={loading}><Statistic title="Employees Processed" value={dashboard?.employeesProcessed || 0} /></Card></Col>
        <Col xs={24} md={8} xl={6}><Card loading={loading}><Statistic title="Payroll Runs" value={dashboard?.totalRuns || 0} /></Card></Col>
        <Col xs={24} md={8} xl={6}><Card loading={loading}><Statistic title="Pending Approvals" value={dashboard?.pendingApprovals || 0} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Recent Payroll Runs">
            <Table
              rowKey="_id"
              size="small"
              pagination={{ pageSize: 5 }}
              dataSource={runs}
              columns={[
                { title: "Period", render: (_, r) => `${r.month}/${r.year}` },
                { title: "Employees", dataIndex: "totalEmployees" },
                { title: "Payout", dataIndex: "totalPayout", render: money },
                { title: "Status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{String(v || "-").replaceAll("_", " ").toUpperCase()}</Tag> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Compliance Snapshot">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Typography.Text>PF Employee: <b>{dashboard?.activeTaxConfig?.pfEmployeePercent ?? "Not set"}%</b></Typography.Text>
              <Typography.Text>ESI Employee: <b>{dashboard?.activeTaxConfig?.esiEmployeePercent ?? "Not set"}%</b></Typography.Text>
              <Typography.Text>TDS: <b>{dashboard?.activeTaxConfig?.tdsPercent ?? "Not set"}%</b></Typography.Text>
              <Typography.Text>Professional Tax: <b>{money(dashboard?.activeTaxConfig?.professionalTax)}</b></Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

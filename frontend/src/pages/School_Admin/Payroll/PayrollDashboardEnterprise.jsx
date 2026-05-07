import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPayrollDashboard, fetchPayrollRuns } from "../../../features/payrollEnterpriseSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 52%, #fff7ed 100%)", border: "1px solid #dbeafe" };

export default function PayrollDashboardEnterprise() {
  const dispatch = useDispatch();
  const { dashboard, runs, loading, error } = useSelector((s) => s.payrollEnterprise);

  useEffect(() => {
    dispatch(fetchPayrollDashboard());
    dispatch(fetchPayrollRuns());
  }, [dispatch]);

  const activeTax = dashboard?.activeTaxConfig || {};

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="blue">Enterprise salary module</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Salary dashboard overview</Typography.Title>
          <Typography.Text type="secondary">
            Is page par accountant ko total payout, processed staff, pending approvals aur statutory settings ek hi jagah clear dikhte hain.
          </Typography.Text>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Total salary payout" value={dashboard?.totalPayout || 0} formatter={money} />
            <Typography.Text type="secondary">Selected runs ka total payable amount.</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Employees processed" value={dashboard?.employeesProcessed || 0} />
            <Typography.Text type="secondary">Payroll calculation me include employees.</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Payroll runs created" value={dashboard?.totalRuns || 0} />
            <Typography.Text type="secondary">Ab tak generated monthly salary cycles.</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Pending approvals" value={dashboard?.pendingApprovals || 0} />
            <Typography.Text type="secondary">Action required before final lock.</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            title="Recent salary runs"
            extra={<Typography.Text type="secondary">Latest month-wise payroll status</Typography.Text>}
            style={cardStyle}
          >
            <Table
              rowKey="_id"
              size="middle"
              pagination={{ pageSize: 5 }}
              dataSource={runs}
              columns={[
                { title: "Salary month", render: (_, r) => `${r.month}/${r.year}` },
                { title: "Employees", dataIndex: "totalEmployees" },
                { title: "Net payout", dataIndex: "totalPayout", render: money },
                { title: "Workflow status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{label(v)}</Tag> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="Active tax & statutory rates" style={cardStyle}>
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Alert showIcon type="info" message="Ye rates salary deduction calculation me use hote hain." />
              <Row gutter={[12, 12]}>
                <Col span={12}><Statistic title="PF employee" value={activeTax.pfEmployeePercent ?? 0} suffix="%" /></Col>
                <Col span={12}><Statistic title="PF employer" value={activeTax.pfEmployerPercent ?? 0} suffix="%" /></Col>
                <Col span={12}><Statistic title="ESI employee" value={activeTax.esiEmployeePercent ?? 0} suffix="%" /></Col>
                <Col span={12}><Statistic title="TDS" value={activeTax.tdsPercent ?? 0} suffix="%" /></Col>
              </Row>
              <Typography.Text>Professional tax per employee: <b>{money(activeTax.professionalTax)}</b></Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

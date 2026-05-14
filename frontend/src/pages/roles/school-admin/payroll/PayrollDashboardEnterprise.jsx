import { Alert, Button, Card, Col, List, Progress, Row, Space, Statistic, Table, Tabs, Tag, Timeline, Typography } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchComplianceFilings, fetchPayrollDashboard, fetchPayrollRuns, fetchReimbursements, fetchUnifiedPayrollOverview } from "../../../../features/payrollEnterpriseSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", processing: "cyan", verified: "blue", hr_approved: "geekblue", accountant_approved: "purple", principal_approved: "magenta", approved: "green", paid: "lime", locked: "gold", rolled_back: "red" };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 52%, #fff7ed 100%)", border: "1px solid #dbeafe" };

const summaryValue = (rows = [], key, field = "count") => rows.find((item) => item._id === key)?.[field] || 0;

export default function PayrollDashboardEnterprise() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { dashboard, unifiedOverview, runs, reimbursements, complianceFilings, loading, error } = useSelector((s) => s.payrollEnterprise);

  useEffect(() => {
    dispatch(fetchPayrollDashboard());
    dispatch(fetchUnifiedPayrollOverview());
    dispatch(fetchPayrollRuns());
    dispatch(fetchReimbursements());
    dispatch(fetchComplianceFilings());
  }, [dispatch]);

  const activeTax = dashboard?.activeTaxConfig || {};
  const unifiedSummary = unifiedOverview?.summary || {};
  const unifiedRuns = unifiedOverview?.runs || [];
  const approvalProgress = Math.min(100, ((dashboard?.lockedRuns || 0) / Math.max(1, dashboard?.totalRuns || 1)) * 100);
  const payrollBasePath = location.pathname.includes("/accountant/") ? "/dashboard/accountant/salary" : "/dashboard/schooladmin/payroll";

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="blue">Unified payroll ecosystem</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Payroll command center</Typography.Title>
          <Typography.Text type="secondary">
            Basic payroll cycles aur enterprise payroll runs ko ek merged command center me analyze karein: salary structures, payouts, approvals, compliance, reimbursements, bank transfer aur audit logs.
          </Typography.Text>
        </Space>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Unified salary expense" value={unifiedSummary.totalPayout || dashboard?.totalPayout || 0} formatter={money} />
            <Typography.Text type="secondary">Basic + enterprise payroll ka merged payout.</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Basic / Enterprise runs" value={`${unifiedSummary.basicRuns || 0} / ${unifiedSummary.enterpriseRuns || 0}`} />
            <Typography.Text type="secondary">Legacy cycles aur advanced runs dono visible.</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Active salary structures" value={unifiedSummary.activeStructures || 0} />
            <Typography.Text type="secondary">Employees ready for basic or enterprise payroll.</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading} style={cardStyle}>
            <Statistic title="Pending approvals" value={unifiedSummary.pendingApprovals || dashboard?.pendingApprovals || 0} />
            <Typography.Text type="secondary">Enterprise HR → Accounts → Principal → Management flow.</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: "unified",
            label: "Merged overview",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title="Basic + enterprise payroll timeline" extra={<Typography.Text type="secondary">Source-wise merged latest payroll activity</Typography.Text>} style={cardStyle}>
                    <Table
                      rowKey={(row) => `${row.source}-${row._id}`}
                      size="middle"
                      pagination={{ pageSize: 6 }}
                      dataSource={unifiedRuns}
                      columns={[
                        { title: "Source", dataIndex: "source", render: (source) => <Tag color={source === "enterprise" ? "purple" : "blue"}>{label(source)}</Tag> },
                        { title: "Salary period", render: (_, r) => `${String(r.month).padStart(2, "0")}/${r.year}` },
                        { title: "Employees", dataIndex: "totalEmployees" },
                        { title: "Gross", dataIndex: "totalEarnings", render: money },
                        { title: "Deductions", dataIndex: "totalDeductions", render: money },
                        { title: "Net payout", dataIndex: "totalPayout", render: money },
                        { title: "Status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{label(v)}</Tag> },
                      ]}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="Migration readiness" style={cardStyle}>
                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                      <Alert showIcon type="success" message="Basic payroll remains available while enterprise features add approvals, compliance, loans and bank transfers." />
                      <Statistic title="Active employees" value={unifiedSummary.activeEmployees || 0} />
                      <Statistic title="Employees processed" value={unifiedSummary.totalEmployeesProcessed || 0} />
                      <Statistic title="Unified deductions" value={unifiedSummary.totalDeductions || 0} formatter={money} />
                      <Space wrap>
                        <Button type="primary" onClick={() => navigate(`${payrollBasePath}/monthly-run`)}>Open basic run</Button>
                        <Button onClick={() => navigate(`${payrollBasePath}/enterprise/run`)}>Open enterprise run</Button>
                        <Button onClick={() => navigate(`${payrollBasePath}/salary-structures`)}>Salary structures</Button>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "runs",
            label: "Payroll cycles",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title="Recent salary runs" extra={<Typography.Text type="secondary">Draft → Processing → Verified → Approved → Paid → Locked</Typography.Text>} style={cardStyle}>
                    <Table
                      rowKey="_id"
                      size="middle"
                      pagination={{ pageSize: 5 }}
                      dataSource={runs}
                      columns={[
                        { title: "Salary period", render: (_, r) => `${r.month}/${r.year}` },
                        { title: "Cycle", dataIndex: "cycleType", render: label },
                        { title: "Employees", dataIndex: "totalEmployees" },
                        { title: "Net payout", dataIndex: "totalPayout", render: money },
                        { title: "PF", dataIndex: "pfLiability", render: money },
                        { title: "Workflow status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{label(v)}</Tag> },
                      ]}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="Approval readiness" style={cardStyle}>
                    <Progress type="dashboard" percent={Math.round(approvalProgress)} />
                    <Timeline
                      style={{ marginTop: 16 }}
                      items={["HR Verify", "Accounts Verify", "Principal Approve", "Management Final Approve", "Paid", "Locked"].map((item) => ({ children: item }))}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "compliance",
            label: "Compliance & tax",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={9}>
                  <Card title="Active India compliance setup" style={cardStyle}>
                    <Space direction="vertical" size={14} style={{ width: "100%" }}>
                      <Alert showIcon type="info" message="PF, ESI, PT, TDS aur Form 16 settings payroll deduction engine me use hoti hain." />
                      <Row gutter={[12, 12]}>
                        <Col span={12}><Statistic title="PF employee" value={activeTax.pfEmployeePercent ?? 0} suffix="%" /></Col>
                        <Col span={12}><Statistic title="PF employer" value={activeTax.pfEmployerPercent ?? 0} suffix="%" /></Col>
                        <Col span={12}><Statistic title="ESI employee" value={activeTax.esiEmployeePercent ?? 0} suffix="%" /></Col>
                        <Col span={12}><Statistic title="TDS" value={activeTax.tdsPercent ?? 0} suffix="%" /></Col>
                      </Row>
                      <Typography.Text>Tax regime: <b>{label(activeTax.taxRegime || "new")}</b></Typography.Text>
                      <Typography.Text>Professional tax: <b>{money(activeTax.professionalTax)}</b></Typography.Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={15}>
                  <Card title="Compliance filing tracker" style={cardStyle}>
                    <Table
                      rowKey="_id"
                      dataSource={complianceFilings}
                      pagination={{ pageSize: 5 }}
                      columns={[
                        { title: "Return", dataIndex: "type", render: label },
                        { title: "Period", dataIndex: "period" },
                        { title: "Amount", dataIndex: "amount", render: money },
                        { title: "Status", dataIndex: "status", render: (status) => <Tag color={status === "filed" ? "green" : status === "overdue" ? "red" : "gold"}>{label(status)}</Tag> },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "ecosystem",
            label: "HR + finance ecosystem",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card title="Loans & advances" style={cardStyle}>
                    <Statistic title="Active balance" value={summaryValue(dashboard?.loanSummary, "active", "remaining")} formatter={money} />
                    <Typography.Text type="secondary">Auto EMI deduction aur remaining balance tracking enabled.</Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card title="Reimbursements" style={cardStyle}>
                    <Statistic title="Pending manager" value={summaryValue(dashboard?.reimbursementSummary, "pending_manager")} />
                    <Statistic title="Approved amount" value={summaryValue(dashboard?.reimbursementSummary, "approved", "amount")} formatter={money} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card title="Audit & security" style={cardStyle}>
                    <List
                      size="small"
                      dataSource={dashboard?.recentAuditLogs || []}
                      locale={{ emptyText: "No audit logs yet" }}
                      renderItem={(item) => <List.Item><Tag color="blue">{item.action}</Tag>{item.summary}</List.Item>}
                    />
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="Latest reimbursement claims" style={cardStyle}>
                    <Table
                      rowKey="_id"
                      dataSource={reimbursements}
                      pagination={{ pageSize: 5 }}
                      columns={[
                        { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
                        { title: "Type", dataIndex: "type", render: label },
                        { title: "Amount", dataIndex: "amount", render: money },
                        { title: "Workflow", dataIndex: "status", render: (status) => <Tag color={status === "approved" ? "green" : status === "rejected" ? "red" : "gold"}>{label(status)}</Tag> },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Space>
  );
}

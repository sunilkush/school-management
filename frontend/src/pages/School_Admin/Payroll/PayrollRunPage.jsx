import { Alert, Button, Card, Col, Descriptions, Drawer, Empty, Form, Input, InputNumber, List, Popconfirm, Row, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approvePayrollRun, fetchPayrollRunDetails, fetchPayrollRuns, generatePayrollRun, lockPayrollRun } from "../../../features/payrollEnterpriseSlice";

const { Text } = Typography;

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const statusTone = {
  draft: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },
  hr_approved: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  accountant_approved: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" },
  approved: { bg: "#ecfdf5", border: "#bbf7d0", text: "#047857" },
  locked: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
};
const deductionLabels = {
  pf: "PF",
  esi: "ESI",
  tds: "TDS",
  professionalTax: "Professional tax",
  leaveDeduction: "LOP / leave deduction",
  loanEmi: "Loan EMI",
};
const deductionHelp = {
  pf: "Employee provident fund contribution.",
  esi: "ESI contribution, applied only when gross salary is within the ESI limit.",
  tds: "Tax deducted at source as per active tax settings.",
  professionalTax: "Fixed professional tax from tax settings.",
  leaveDeduction: "Unpaid leave / LOP amount based on working days and LOP days.",
  loanEmi: "Approved loan or advance monthly EMI deducted from salary.",
};
const deductionTone = {
  pf: "blue",
  esi: "cyan",
  tds: "volcano",
  professionalTax: "purple",
  leaveDeduction: "orange",
  loanEmi: "magenta",
};
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #ecfeff 0%, #f8fafc 55%, #eef2ff 100%)", border: "1px solid #bae6fd" };

export default function PayrollRunPage() {
  const [form] = Form.useForm();
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { runs, runDetails, saving } = useSelector((s) => s.payrollEnterprise);

  useEffect(() => { dispatch(fetchPayrollRuns()); }, [dispatch]);

  const summary = useMemo(() => {
    const totalPayout = runs.reduce((sum, run) => sum + Number(run.totalPayout || 0), 0);
    const totalEmployees = runs.reduce((sum, run) => sum + Number(run.totalEmployees || 0), 0);
    const pendingApprovals = runs.filter((run) => !["approved", "locked"].includes(run.status)).length;
    const lockedRuns = runs.filter((run) => run.status === "locked").length;
    return { totalPayout, totalEmployees, pendingApprovals, lockedRuns };
  }, [runs]);

  const onFinish = async (values) => {
    try {
      await dispatch(generatePayrollRun(values)).unwrap();
      message.success("Payroll run generated");
      form.resetFields();
    } catch (e) { message.error(e); }
  };

  const approve = async (id) => {
    try {
      await dispatch(approvePayrollRun({ id, comment })).unwrap();
      message.success("Approval stage updated");
      setComment("");
    } catch (e) { message.error(e); }
  };

  const lock = async (id) => {
    try {
      await dispatch(lockPayrollRun({ id, comment })).unwrap();
      message.success("Payroll locked");
      setComment("");
    } catch (e) { message.error(e); }
  };

  const viewDetails = (id) => {
    dispatch(fetchPayrollRunDetails(id));
    setOpen(true);
  };

  const cols = [
    { title: "Salary month", render: (_, r) => `${r.month}/${r.year}` },
    { title: "Employees", dataIndex: "totalEmployees" },
    { title: "Net payout", dataIndex: "totalPayout", render: money },
    { title: "Workflow status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{label(v)}</Tag> },
    { title: "Actions", render: (_, r) => (
      <Space wrap>
        <Button onClick={() => viewDetails(r._id)}>View details</Button>
        {!["approved", "locked"].includes(r.status) && <Popconfirm title="Approve next stage?" description="Comment box ka note approval log me save hoga." onConfirm={() => approve(r._id)}><Button type="primary">Approve next</Button></Popconfirm>}
        {r.status === "approved" && <Popconfirm title="Lock this payroll?" description="Lock ke baad salary cycle final ho jayega." onConfirm={() => lock(r._id)}><Button danger>Lock payroll</Button></Popconfirm>}
      </Space>
    ) },
  ];

  const payrollItems = useMemo(() => runDetails?.items || [], [runDetails?.items]);
  const deductionSummary = useMemo(() => {
    const employeesWithDeductions = payrollItems.filter((item) => Number(item.totalDeductions || 0) > 0);
    const totalDeductions = employeesWithDeductions.reduce((sum, item) => sum + Number(item.totalDeductions || 0), 0);
    const byType = employeesWithDeductions.reduce((acc, item) => {
      Object.entries(item.deductions || {}).forEach(([key, value]) => {
        const amount = Number(value || 0);
        if (amount > 0) acc[key] = (acc[key] || 0) + amount;
      });
      return acc;
    }, {});

    return { employeesWithDeductions, totalDeductions, byType };
  }, [payrollItems]);

  const getDeductionLines = (item) => Object.entries(item.deductions || {})
    .map(([key, value]) => ({ key, amount: Number(value || 0) }))
    .filter((line) => line.amount > 0);

  const renderPayrollItemCard = (item) => {
    const employee = item.employeeId;
    const user = employee?.userId;
    const deductionLines = getDeductionLines(item);
    const hasDeductions = deductionLines.length > 0;
    const perDaySalary = Number(item.gross || 0) / Math.max(1, Number(item.attendance?.workingDays || 30));

    return (
      <Card
        key={item._id}
        size="small"
        style={{ ...cardStyle, marginBottom: 14, borderColor: hasDeductions ? "#fecaca" : "#bbf7d0" }}
        title={
          <Space direction="vertical" size={0}>
            <Text strong>{user?.name || "Employee"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.regId || user?.email || "No employee code"} • {employee?.department || "No department"} • {employee?.designation || "No designation"}
            </Text>
          </Space>
        }
        extra={<Tag color={hasDeductions ? "red" : "green"}>{hasDeductions ? "DEDUCTION APPLIED" : "NO DEDUCTION"}</Tag>}
      >
        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}><Statistic title="Gross salary" value={Number(item.gross || 0)} formatter={money} /></Col>
          <Col xs={12} md={6}><Statistic title="Total deductions" value={Number(item.totalDeductions || 0)} formatter={money} valueStyle={{ color: hasDeductions ? "#dc2626" : "#16a34a" }} /></Col>
          <Col xs={12} md={6}><Statistic title="Net payable" value={Number(item.netSalary || 0)} formatter={money} valueStyle={{ color: "#047857" }} /></Col>
          <Col xs={12} md={6}><Statistic title="LOP days" value={Number(item.attendance?.lopDays || 0)} suffix={`/ ${Number(item.attendance?.workingDays || 30)} days`} /></Col>
        </Row>

        <Alert
          showIcon
          type={hasDeductions ? "warning" : "success"}
          style={{ marginTop: 14 }}
          message={hasDeductions ? `${user?.name || "Employee"} ke salary se ${money(item.totalDeductions)} deduct hua.` : "Is employee ke salary me koi deduction apply nahi hua."}
          description={hasDeductions ? `Calculation: Gross salary ${money(item.gross)} - total deductions ${money(item.totalDeductions)} = net payable ${money(item.netSalary)}. Per day salary approx ${money(perDaySalary)} hai, jo LOP deduction explain karne me help karta hai.` : `Full gross salary ${money(item.gross)} payable hai because PF/ESI/TDS/professional tax/LOP/loan EMI me koi positive deduction nahi mila.`}
        />

        {hasDeductions && (
          <List
            size="small"
            style={{ marginTop: 10 }}
            dataSource={deductionLines}
            renderItem={(line) => (
              <List.Item>
                <Space direction="vertical" size={0}>
                  <Space wrap>
                    <Tag color={deductionTone[line.key] || "default"}>{deductionLabels[line.key] || label(line.key)}</Tag>
                    <Text strong>{money(line.amount)}</Text>
                  </Space>
                  <Text type="secondary">{deductionHelp[line.key] || "Payroll policy ke according deduction apply hua."}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    );
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="cyan">Step 1: Generate salary</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Enterprise payroll run</Typography.Title>
          <Typography.Text type="secondary">
            Month, year, working days aur LOP days clearly fill karein. Generate ke baad run approval workflow me chala jayega.
          </Typography.Text>
        </Space>
      </Card>

      <Card title="Generate monthly salary run" style={cardStyle}>
        <Alert showIcon type="info" style={{ marginBottom: 16 }} message="Tip: Working days total payable days hain, LOP days unpaid leave deduction ke liye use hote hain." />
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ workingDays: 30, lopDays: 0 }}>
          <Row gutter={16}>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="Salary month number" name="month" extra="Example: January ke liye 1, December ke liye 12." rules={[{ required: true, message: "Month is required" }]}>
                <InputNumber min={1} max={12} placeholder="e.g. 5" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="Salary year" name="year" extra="Jis year ka payroll generate karna hai." rules={[{ required: true, message: "Year is required" }]}>
                <InputNumber min={2020} max={2100} placeholder="e.g. 2026" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="Total working days" name="workingDays" extra="Usually 26, 30 ya 31 as per policy.">
                <InputNumber min={1} max={31} placeholder="e.g. 30" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="LOP / unpaid leave days" name="lopDays" extra="Agar unpaid leave nahi hai to 0 rakhein.">
                <InputNumber min={0} max={31} placeholder="e.g. 0" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Button loading={saving} type="primary" htmlType="submit">Generate salary run</Button>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card style={cardStyle}><Statistic title="Total payroll payout" value={summary.totalPayout} formatter={money} valueStyle={{ color: "#047857" }} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card style={cardStyle}><Statistic title="Employees processed" value={summary.totalEmployees} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card style={cardStyle}><Statistic title="Pending approval runs" value={summary.pendingApprovals} valueStyle={{ color: statusTone.hr_approved.text }} /></Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card style={cardStyle}><Statistic title="Locked runs" value={summary.lockedRuns} valueStyle={{ color: statusTone.locked.text }} /></Card>
        </Col>
      </Row>

      <Card
        title="Generated payroll runs"
        extra={<Input value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Approval or lock comment" placeholder="Approval/lock comment likhein" style={{ width: 280 }} />}
        style={cardStyle}
      >
        <Table rowKey="_id" columns={cols} dataSource={runs} scroll={{ x: 820 }} />
      </Card>

      <Drawer width={980} open={open} onClose={() => setOpen(false)} title="Payroll run details">
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Salary period">{runDetails?.run ? `${runDetails.run.month}/${runDetails.run.year}` : "-"}</Descriptions.Item>
          <Descriptions.Item label="Workflow status"><Tag color={statusColor[runDetails?.run?.status]}>{label(runDetails?.run?.status)}</Tag></Descriptions.Item>
          <Descriptions.Item label="Employees processed">{runDetails?.run?.totalEmployees || 0}</Descriptions.Item>
          <Descriptions.Item label="Total net payout">{money(runDetails?.run?.totalPayout)}</Descriptions.Item>
        </Descriptions>

        <Alert
          showIcon
          type="info"
          style={{ marginBottom: 16 }}
          message={`Total deductions: ${money(deductionSummary.totalDeductions)} from ${deductionSummary.employeesWithDeductions.length} employee(s)`}
          description="Neeche cards me clearly dikh raha hai ki kis employee ki salary se deduction hua, deduction kis type ka tha, aur gross salary se net payable salary ka calculation kaise bana."
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small" style={cardStyle}>
              <Statistic title="Employees with deduction" value={deductionSummary.employeesWithDeductions.length} suffix={`/ ${payrollItems.length}`} valueStyle={{ color: "#dc2626" }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={cardStyle}>
              <Statistic title="Total deduction amount" value={deductionSummary.totalDeductions} formatter={money} valueStyle={{ color: "#dc2626" }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={cardStyle}>
              <Statistic title="Net payout after deduction" value={Number(runDetails?.run?.totalPayout || 0)} formatter={money} valueStyle={{ color: "#047857" }} />
            </Card>
          </Col>
        </Row>

        {Object.keys(deductionSummary.byType).length > 0 && (
          <Card size="small" title="Deduction type summary" style={{ ...cardStyle, marginBottom: 16 }}>
            <Space wrap>
              {Object.entries(deductionSummary.byType).map(([key, amount]) => (
                <Tag key={key} color={deductionTone[key] || "default"} style={{ padding: "6px 10px", fontSize: 13 }}>
                  {deductionLabels[key] || label(key)}: {money(amount)}
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {payrollItems.length ? payrollItems.map(renderPayrollItemCard) : <Empty description="Payroll employee details not available" />}
      </Drawer>
    </Space>
  );
}

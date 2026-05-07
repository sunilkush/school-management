import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { CalendarClock, CheckCircle2, Eye, FileLock2, IndianRupee, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approvePayrollRun, fetchPayrollRunDetails, fetchPayrollRuns, generatePayrollRun, lockPayrollRun } from "../../../features/payrollEnterpriseSlice";

const { Text, Title } = Typography;

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const statusTone = {
  draft: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },
  hr_approved: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  accountant_approved: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" },
  approved: { bg: "#ecfdf5", border: "#bbf7d0", text: "#047857" },
  locked: { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
};
const statusProgress = { draft: 25, hr_approved: 50, accountant_approved: 75, approved: 90, locked: 100 };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const getStatusTone = (status) => statusTone[status] || statusTone.draft;

const cardStyle = { borderRadius: 20, boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)", border: "1px solid #edf2f7" };
const softCardStyle = { borderRadius: 18, border: "1px solid #e2e8f0", background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" };

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
    {
      title: "Payroll Period",
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text strong>{`${String(r.month).padStart(2, "0")}/${r.year}`}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Monthly enterprise run</Text>
        </Space>
      ),
    },
    { title: "Employees", dataIndex: "totalEmployees", render: (v) => <Text strong>{v || 0}</Text> },
    { title: "Total Payout", dataIndex: "totalPayout", render: (v) => <Text strong>{money(v)}</Text> },
    {
      title: "Approval Flow",
      dataIndex: "status",
      render: (v) => (
        <Space direction="vertical" size={6} style={{ minWidth: 170 }}>
          <Tag color={statusColor[v]} style={{ width: "fit-content", fontWeight: 700 }}>{label(v)}</Tag>
          <Progress percent={statusProgress[v] || 0} showInfo={false} size="small" strokeColor={v === "locked" ? "#d97706" : "#2563eb"} />
        </Space>
      ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space wrap>
          <Button icon={<Eye size={16} />} onClick={() => viewDetails(r._id)}>View</Button>
          {!["approved", "locked"].includes(r.status) && (
            <Popconfirm title="Approve next stage?" description="This will move the run to the next approval checkpoint." onConfirm={() => approve(r._id)}>
              <Button type="primary" icon={<CheckCircle2 size={16} />}>Approve</Button>
            </Popconfirm>
          )}
          {r.status === "approved" && (
            <Popconfirm title="Lock this payroll?" description="Locked payroll cannot be changed from this run screen." onConfirm={() => lock(r._id)}>
              <Button danger icon={<FileLock2 size={16} />}>Lock</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const detailColumns = [
    { title: "Employee", render: (_, r) => <Text strong>{r.employeeId?.userId?.name || "-"}</Text> },
    { title: "Gross", dataIndex: "gross", render: money },
    { title: "Deductions", dataIndex: "totalDeductions", render: money },
    { title: "Loan EMI", dataIndex: "loanEmiDeduction", render: money },
    { title: "Net Salary", dataIndex: "netSalary", render: (v) => <Text strong style={{ color: "#047857" }}>{money(v)}</Text> },
  ];

  return (
    <div style={{ minHeight: "100%", padding: 4, background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 46%)" }}>
      <Space direction="vertical" style={{ width: "100%" }} size={20}>
        <Card
          bordered={false}
          style={{
            borderRadius: 28,
            overflow: "hidden",
            background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #06b6d4 100%)",
            boxShadow: "0 24px 60px rgba(29, 78, 216, 0.26)",
          }}
          styles={{ body: { padding: 28 } }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={12}>
                <Tag color="cyan" style={{ width: "fit-content", borderRadius: 999, padding: "4px 12px", fontWeight: 700 }}>
                  <Space size={6}><Sparkles size={14} /> Enterprise Payroll Control</Space>
                </Tag>
                <Title level={2} style={{ color: "#fff", margin: 0 }}>Run payroll with guided approvals</Title>
                <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 15 }}>
                  Generate monthly payroll, track every approval checkpoint, and lock final payouts from one streamlined workspace.
                </Text>
              </Space>
            </Col>
            <Col xs={24} lg={10}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                    <Text style={{ color: "rgba(255,255,255,0.76)" }}>Runs</Text>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{runs.length}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                    <Text style={{ color: "rgba(255,255,255,0.76)" }}>Pending</Text>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{summary.pendingApprovals}</div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card style={softCardStyle}><Statistic title="Total payout" value={summary.totalPayout} formatter={money} prefix={<IndianRupee size={18} />} /></Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card style={softCardStyle}><Statistic title="Employees processed" value={summary.totalEmployees} prefix={<UsersRound size={18} />} /></Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card style={softCardStyle}><Statistic title="Pending approvals" value={summary.pendingApprovals} prefix={<ShieldCheck size={18} />} /></Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card style={softCardStyle}><Statistic title="Locked runs" value={summary.lockedRuns} prefix={<FileLock2 size={18} />} /></Card>
          </Col>
        </Row>

        <Row gutter={[20, 20]} align="stretch">
          <Col xs={24} xl={8}>
            <Card
              title={<Space><CalendarClock size={18} /> Generate new run</Space>}
              extra={<Tag color="blue">Step 1</Tag>}
              style={{ ...cardStyle, height: "100%" }}
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 18, borderRadius: 12 }}
                message="Create payroll for a month and send it into the approval workflow."
              />
              <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ workingDays: 30, lopDays: 0 }}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Month" name="month" rules={[{ required: true, message: "Month is required" }]}>
                      <InputNumber min={1} max={12} placeholder="MM" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Year" name="year" rules={[{ required: true, message: "Year is required" }]}>
                      <InputNumber min={2020} max={2100} placeholder="YYYY" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Working days" name="workingDays">
                      <InputNumber min={1} max={31} placeholder="30" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="LOP days" name="lopDays">
                      <InputNumber min={0} max={31} placeholder="0" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Button loading={saving} type="primary" htmlType="submit" block size="large" icon={<Sparkles size={17} />}>Generate payroll run</Button>
              </Form>
            </Card>
          </Col>

          <Col xs={24} xl={16}>
            <Card
              title="Payroll runs"
              extra={(
                <Tooltip title="This comment is applied when approving or locking a run.">
                  <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Approval / lock comment" style={{ width: 280 }} />
                </Tooltip>
              )}
              style={cardStyle}
            >
              <Table
                rowKey="_id"
                columns={cols}
                dataSource={runs}
                pagination={{ pageSize: 6, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="No payroll runs yet" /> }}
                scroll={{ x: 760 }}
              />
            </Card>
          </Col>
        </Row>

        <Drawer width={980} open={open} onClose={() => setOpen(false)} title="Payroll Run Details">
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Period">{runDetails?.run ? `${runDetails.run.month}/${runDetails.run.year}` : "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColor[runDetails?.run?.status]}>{label(runDetails?.run?.status)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Employees">{runDetails?.run?.totalEmployees || 0}</Descriptions.Item>
            <Descriptions.Item label="Payout">{money(runDetails?.run?.totalPayout)}</Descriptions.Item>
          </Descriptions>
          {runDetails?.run?.status && (
            <div style={{ ...getStatusTone(runDetails.run.status), padding: 14, borderRadius: 14, border: `1px solid ${getStatusTone(runDetails.run.status).border}`, marginBottom: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text strong style={{ color: getStatusTone(runDetails.run.status).text }}>Approval progress: {label(runDetails.run.status)}</Text>
                <Progress percent={statusProgress[runDetails.run.status] || 0} strokeColor={getStatusTone(runDetails.run.status).text} />
              </Space>
            </div>
          )}
          <Table rowKey="_id" size="small" dataSource={runDetails?.items || []} columns={detailColumns} scroll={{ x: 760 }} />
        </Drawer>
      </Space>
    </div>
  );
}

import { Button, Card, Col, Descriptions, Input, Popconfirm, Row, Space, Steps, Table, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approvePayrollRun, fetchPayrollRunDetails, fetchPayrollRuns, lockPayrollRun } from "../../../features/payrollEnterpriseSlice";

const steps = ["draft", "hr_approved", "accountant_approved", "approved", "locked"];
const color = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const stepTitle = { draft: "Draft", hr_approved: "HR approved", accountant_approved: "Accountant approved", approved: "Final approved", locked: "Locked" };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #f5f3ff 0%, #f8fafc 55%, #ecfdf5 100%)", border: "1px solid #ddd6fe" };

export default function PayrollApprovalPanel() {
  const dispatch = useDispatch();
  const { runs, runDetails } = useSelector((s) => s.payrollEnterprise);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => { dispatch(fetchPayrollRuns()); }, [dispatch]);
  useEffect(() => {
    const target = selected || runs?.[0]?._id;
    if (target) {
      setSelected(target);
      dispatch(fetchPayrollRunDetails(target));
    }
  }, [dispatch, runs, selected]);

  const latest = runDetails?.run;
  const currentIndex = useMemo(() => Math.max(0, steps.indexOf(latest?.status)), [latest?.status]);

  const approve = async (id) => {
    try {
      await dispatch(approvePayrollRun({ id, comment })).unwrap();
      await dispatch(fetchPayrollRunDetails(id)).unwrap();
      message.success("Payroll approved to next stage");
      setComment("");
    } catch (e) { message.error(e); }
  };

  const lock = async (id) => {
    try {
      await dispatch(lockPayrollRun({ id, comment })).unwrap();
      await dispatch(fetchPayrollRunDetails(id)).unwrap();
      message.success("Payroll locked");
      setComment("");
    } catch (e) { message.error(e); }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="purple">Step 2: Review & approve</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Payroll approval workflow</Typography.Title>
          <Typography.Text type="secondary">
            Salary run ko approve karne se pehle payout, employees aur comments verify karein. Comment field me clear reason/note likhein.
          </Typography.Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card
            title="Approval queue"
            extra={<Input value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Approval workflow comment" placeholder="Approval comment likhein" style={{ width: 280 }} />}
            style={cardStyle}
          >
            <Table
              rowKey="_id"
              dataSource={runs.filter((r) => r.status !== "locked")}
              scroll={{ x: 820 }}
              columns={[
                { title: "Salary month", render: (_, r) => `${r.month}/${r.year}` },
                { title: "Employees", dataIndex: "totalEmployees" },
                { title: "Net payout", dataIndex: "totalPayout", render: money },
                { title: "Current stage", dataIndex: "status", render: (v) => <Tag color={color[v]}>{label(v)}</Tag> },
                { title: "Action", render: (_, r) => <Space wrap><Button onClick={() => setSelected(r._id)}>View timeline</Button>{r.status !== "approved" ? <Popconfirm title="Approve next workflow stage?" description="Is action ke baad run next approver stage me jayega." onConfirm={() => approve(r._id)}><Button type="primary">Approve next</Button></Popconfirm> : <Popconfirm title="Lock approved payroll?" description="Lock final action hai." onConfirm={() => lock(r._id)}><Button danger>Lock payroll</Button></Popconfirm>}</Space> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Selected run summary" style={cardStyle}>
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Salary period">{latest ? `${latest.month}/${latest.year}` : "-"}</Descriptions.Item>
              <Descriptions.Item label="Employees processed">{latest?.totalEmployees || 0}</Descriptions.Item>
              <Descriptions.Item label="Net payout">{money(latest?.totalPayout)}</Descriptions.Item>
              <Descriptions.Item label="Current stage"><Tag color={color[latest?.status]}>{label(latest?.status)}</Tag></Descriptions.Item>
            </Descriptions>
            <Steps
              direction="vertical"
              size="small"
              current={currentIndex}
              items={steps.map((st) => ({ title: stepTitle[st], description: st === latest?.status ? "Current stage" : undefined }))}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Approval log" style={cardStyle}>
        <Table
          rowKey="_id"
          size="small"
          pagination={false}
          dataSource={runDetails?.approvals || []}
          columns={[
            { title: "Stage", dataIndex: "level" },
            { title: "Action taken", dataIndex: "action" },
            { title: "Comment / note", dataIndex: "comment" },
            { title: "Approved by", render: (_, r) => r.createdBy?.name || "-" },
          ]}
        />
      </Card>
    </Space>
  );
}

import { Button, Card, Descriptions, Input, Popconfirm, Space, Table, Tag, Timeline, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approvePayrollRun, fetchPayrollRunDetails, fetchPayrollRuns, lockPayrollRun } from "../../../features/payrollEnterpriseSlice";

const steps = ["draft", "hr_approved", "accountant_approved", "approved", "locked"];
const color = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

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
  const currentIndex = useMemo(() => steps.indexOf(latest?.status), [latest?.status]);

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
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>Payroll Approval Workflow</Typography.Title>
      <Card title="Approval Queue" extra={<Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Approval comment" style={{ width: 280 }} />}>
        <Table
          rowKey="_id"
          dataSource={runs.filter((r) => r.status !== "locked")}
          columns={[
            { title: "Period", render: (_, r) => `${r.month}/${r.year}` },
            { title: "Employees", dataIndex: "totalEmployees" },
            { title: "Payout", dataIndex: "totalPayout", render: money },
            { title: "Status", dataIndex: "status", render: (v) => <Tag color={color[v]}>{label(v)}</Tag> },
            { title: "Action", render: (_, r) => <Space><Button onClick={() => setSelected(r._id)}>View</Button>{r.status !== "approved" ? <Popconfirm title="Approve next workflow stage?" onConfirm={() => approve(r._id)}><Button type="primary">Approve</Button></Popconfirm> : <Popconfirm title="Lock approved payroll?" onConfirm={() => lock(r._id)}><Button danger>Lock</Button></Popconfirm>}</Space> },
          ]}
        />
      </Card>
      <Card title="Selected Run Timeline">
        <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Run">{latest ? `${latest.month}/${latest.year}` : "-"}</Descriptions.Item>
          <Descriptions.Item label="Employees">{latest?.totalEmployees || 0}</Descriptions.Item>
          <Descriptions.Item label="Payout">{money(latest?.totalPayout)}</Descriptions.Item>
        </Descriptions>
        <Timeline items={steps.map((st, index) => ({ color: index <= currentIndex ? "green" : "gray", children: label(st) }))} />
        <Typography.Title level={5}>Approval Log</Typography.Title>
        <Table rowKey="_id" size="small" pagination={false} dataSource={runDetails?.approvals || []} columns={[{ title: "Stage", dataIndex: "level" }, { title: "Action", dataIndex: "action" }, { title: "Comment", dataIndex: "comment" }, { title: "By", render: (_, r) => r.createdBy?.name || "-" }]} />
      </Card>
    </Space>
  );
}

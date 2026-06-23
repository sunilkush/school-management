import React, { useEffect, useMemo, useState } from "react";
import {
  Button, DatePicker, Form, Input, InputNumber, Modal,
  Select, Space, Table, Tooltip, message,
} from "antd";
import {
  PlusOutlined, CheckOutlined, CloseOutlined, DeleteOutlined,
  CarOutlined, MedicineBoxOutlined, WifiOutlined,
  CoffeeOutlined, FileTextOutlined, BankOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fetchReimbursements, createReimbursement,
  managerApproveReimb, financeApproveReimb,
  rejectReimb, deleteReimb,
} from "../../../features/advanceSlice";
import { getEmployees } from "../../../features/employeeSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../../styles/pageStyles";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  success: "#22C55E", successLight: "#DCFCE7",
  danger: "#EF4444", dangerLight: "#FEE2E2",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  purple: "#7C3AED", purpleLight: "#F5F3FF",
  orange: "#F97316", orangeLight: "#FFF7ED",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const TYPE_CFG = {
  travel:   { label: "Travel",    icon: <CarOutlined />,          color: C.primary, bg: C.primaryLighter, border: C.primaryLight },
  fuel:     { label: "Fuel",      icon: "⛽",                     color: C.orange,  bg: C.orangeLight,    border: "#FED7AA",     emoji: true },
  internet: { label: "Internet",  icon: <WifiOutlined />,         color: C.accent,  bg: C.accentLight,    border: "#99F6E4" },
  medical:  { label: "Medical",   icon: <MedicineBoxOutlined />,  color: "#DC2626", bg: "#FEE2E2",        border: "#FCA5A5" },
  food:     { label: "Food",      icon: <CoffeeOutlined />,       color: C.warning, bg: C.warningLight,   border: "#FDE68A" },
  other:    { label: "Other",     icon: <RupeeIcon />,       color: C.textSub, bg: "#F1F5F9",        border: C.border  },
};

const STATUS_CFG = {
  pending_manager:  { label: "Pending Manager",  color: C.warning, bg: C.warningLight,  border: "#FDE68A" },
  pending_finance:  { label: "Pending Finance",  color: C.orange,  bg: C.orangeLight,   border: "#FED7AA" },
  approved:         { label: "Approved",         color: "#15803D", bg: C.successLight,  border: "#86EFAC" },
  rejected:         { label: "Rejected",         color: "#991B1B", bg: C.dangerLight,   border: "#FCA5A5" },
  added_to_payroll: { label: "Added to Payroll", color: C.primary, bg: C.primaryLighter, border: C.primaryLight },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || TYPE_CFG.other;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.emoji ? <span style={{ fontSize: 12 }}>{cfg.icon}</span> : cfg.icon}
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending_manager;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
};

const ApprovalPipeline = ({ approvals = [] }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
    {approvals.map((a, i) => {
      const dot = a.status === "approved" ? C.success : a.status === "rejected" ? C.danger : C.border;
      return (
        <Tooltip key={i} title={`${a.level === "manager" ? "Manager" : "Finance"}: ${a.status}`}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: dot, border: `1px solid ${dot === C.border ? C.textMuted : dot}`,
          }} />
        </Tooltip>
      );
    })}
  </div>
);

const getInitials = (name = "") => {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ReimbursementsPage = () => {
  const dispatch = useDispatch();
  const { reimbursements = [], loading } = useSelector((s) => s.advance);
  const { employees = [] } = useSelector((s) => s.employee);
  const { profile } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);
  const schoolId = profile?.school?._id;
  const academicYearId = activeYear?._id;

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchReimbursements({ schoolId }));
      dispatch(getEmployees({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e._id, label: e.userId?.name || "Unknown" })),
    [employees],
  );

  const stats = useMemo(() => ({
    total:    reimbursements.length,
    pending:  reimbursements.filter((r) => ["pending_manager", "pending_finance"].includes(r.status)).length,
    approved: reimbursements.filter((r) => r.status === "approved").length,
    totalAmt: reimbursements.filter((r) => r.status === "approved").reduce((s, r) => s + (r.amount || 0), 0),
  }), [reimbursements]);

  const refresh = () => dispatch(fetchReimbursements({ schoolId }));

  const handleCreate = async (values) => {
    try {
      await dispatch(createReimbursement({
        ...values,
        schoolId, academicYearId,
        claimDate: values.claimDate?.toISOString() || new Date().toISOString(),
      })).unwrap();
      message.success("Reimbursement claim submitted");
      setModalOpen(false);
      form.resetFields();
      refresh();
    } catch (e) { message.error(e || "Failed to submit claim"); }
  };

  const handleManagerApprove = (record) => Modal.confirm({
    title: "Approve this claim (Manager Level)?",
    content: `${record.empName} — ${fmt(record.amount)} for ${TYPE_CFG[record.type]?.label || record.type}`,
    okText: "Approve", okButtonProps: { style: { background: C.success, borderColor: C.success, borderRadius: 8, color: "#fff" } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(managerApproveReimb({ id: record._id })).unwrap(); message.success("Approved by manager"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const handleFinanceApprove = (record) => Modal.confirm({
    title: "Final Finance Approval?",
    content: `This will fully approve the claim for ${fmt(record.amount)}.`,
    okText: "Final Approve", okButtonProps: { style: { background: C.primary, borderColor: C.primary, borderRadius: 8, color: "#fff" } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(financeApproveReimb({ id: record._id })).unwrap(); message.success("Claim fully approved"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const handleReject = (record) => {
    let reason = "";
    Modal.confirm({
      title: "Reject this reimbursement claim?",
      content: (
        <Input.TextArea rows={3} placeholder="Reason for rejection…" onChange={(e) => { reason = e.target.value; }} style={{ marginTop: 12 }} />
      ),
      okText: "Reject", okButtonProps: { danger: true, style: { borderRadius: 8 } },
      cancelButtonProps: { style: { borderRadius: 8 } },
      onOk: async () => {
        try { await dispatch(rejectReimb({ id: record._id, reason })).unwrap(); message.success("Claim rejected"); refresh(); }
        catch (e) { message.error(e || "Failed"); }
      },
    });
  };

  const handleDelete = (record) => Modal.confirm({
    title: "Delete this claim?",
    okText: "Delete", okButtonProps: { danger: true, style: { borderRadius: 8 } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(deleteReimb(record._id)).unwrap(); message.success("Claim deleted"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const dataSource = useMemo(() => reimbursements.map((r) => ({
    key: r._id, _id: r._id,
    empName: r.employeeId?.userId?.name || "—",
    type: r.type, amount: r.amount,
    claimDate: r.claimDate,
    description: r.description,
    status: r.status,
    approvals: r.approvals || [],
  })), [reimbursements]);

  const columns = [
    {
      title: "Employee",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.accent}, ${C.primary})`,
            color: "#fff", fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {getInitials(r.empName)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{r.empName}</div>
            {r.description && <div style={{ fontSize: 11, color: C.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>}
          </div>
        </div>
      ),
    },
    { title: "Type", dataIndex: "type", render: (v) => <TypeBadge type={v} /> },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{fmt(v)}</span>,
    },
    {
      title: "Claim Date",
      dataIndex: "claimDate",
      render: (v) => v ? <span style={{ fontSize: 12, color: C.textSub }}>{dayjs(v).format("DD MMM YYYY")}</span> : "—",
    },
    { title: "Approval", render: (_, r) => <ApprovalPipeline approvals={r.approvals} /> },
    {
      title: "Status",
      dataIndex: "status",
      filters: Object.entries(STATUS_CFG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => r.status === v,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: "Actions",
      width: 150,
      render: (_, r) => (
        <Space size={5}>
          {r.status === "pending_manager" && (
            <Tooltip title="Manager Approve">
              <Button size="small" icon={<CheckOutlined />} onClick={() => handleManagerApprove(r)}
                style={{ borderRadius: 7, borderColor: C.success, color: C.success, background: C.successLight }} />
            </Tooltip>
          )}
          {r.status === "pending_finance" && (
            <Tooltip title="Finance Approve">
              <Button size="small" icon={<BankOutlined />} onClick={() => handleFinanceApprove(r)}
                style={{ borderRadius: 7, borderColor: C.primary, color: C.primary, background: C.primaryLighter }} />
            </Tooltip>
          )}
          {["pending_manager", "pending_finance"].includes(r.status) && (
            <Tooltip title="Reject">
              <Button size="small" icon={<CloseOutlined />} onClick={() => handleReject(r)}
                style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }} />
            </Tooltip>
          )}
          {["pending_manager", "rejected"].includes(r.status) && (
            <Tooltip title="Delete">
              <Button size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(r)}
                style={{ borderRadius: 7, borderColor: C.border, color: C.textMuted, background: C.surfaceSoft }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("reimb-tbl")}</style>

      <PageHeader
        title="Expense Reimbursements"
        subtitle="Manage employee expense claims — travel, medical, fuel, and more"
        icon={<FileTextOutlined />}
        extra={
          <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}
            style={{ background: C.accent, borderColor: C.accent, color: "#fff", borderRadius: 10, fontWeight: 600 }}>
            Add Claim
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(150), margin: "20px 0 20px" }}>
        {[
          { icon: <FileTextOutlined />,   label: "Total Claims",    value: stats.total,          color: C.primary },
          { icon: <CarOutlined />,        label: "Pending",         value: stats.pending,         color: C.warning },
          { icon: <CheckOutlined />,      label: "Approved",        value: stats.approved,        color: C.success },
          { icon: <RupeeIcon />,     label: "Approved Amount", value: fmt(stats.totalAmt),  color: C.accent, small: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.surface, borderRadius: 14, border: "1px solid " + C.border,
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={iconWell(s.color, 42)}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: s.small ? 18 : 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Claims</span>
          <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 20, background: C.accentLight, color: "#0F766E", border: "1px solid #99F6E4", fontWeight: 600 }}>
            {reimbursements.length}
          </span>
        </div>
        <Table
          className="reimb-tbl"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} claims` }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No reimbursement claims found. Click 'Add Claim' to submit one." }}
        />
      </div>

      {/* New Claim Modal */}
      <Modal
        title={<Space><FileTextOutlined style={{ color: C.accent }} /><span style={{ fontWeight: 700 }}>Submit Reimbursement Claim</span></Space>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={[
          <Button key="c" onClick={() => { setModalOpen(false); form.resetFields(); }}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>Cancel</Button>,
          <Button key="s" onClick={() => form.submit()} loading={loading}
            style={{ borderRadius: 8, background: C.accent, borderColor: C.accent, color: "#fff", fontWeight: 600 }}>
            Submit Claim
          </Button>,
        ]}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 8 }}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={employeeOptions} placeholder="Select employee…" size="large" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item name="type" label="Expense Type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                {Object.entries(TYPE_CFG).map(([k, v]) => (
                  <Select.Option key={k} value={k}>
                    {v.emoji ? v.icon : null} {v.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="amount" label="Claim Amount (₹)" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 1500"
                formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/₹\s?|(,*)/g, "")} />
            </Form.Item>
          </div>
          <Form.Item name="claimDate" label="Expense Date" initialValue={dayjs()}>
            <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item name="description" label="Description / Details">
            <Input.TextArea rows={3} placeholder="Describe the expense — route taken, purpose, etc." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReimbursementsPage;

import React, { useEffect, useMemo, useState } from "react";
import {
  Button, DatePicker, Form, Input, InputNumber, Modal,
  Progress, Select, Space, Table, Tooltip, message,
} from "antd";
import {
  PlusOutlined, CheckOutlined, CloseOutlined,
  MinusCircleOutlined, StopOutlined, ClockCircleOutlined,
  TeamOutlined, WalletOutlined, FieldTimeOutlined, CheckCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fetchAdvances, createAdvance, approveAdvance, rejectAdvance,
  deductEmi, closeAdvance,
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
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const STATUS_CFG = {
  pending:  { color: "#B45309", bg: C.warningLight, border: "#FDE68A", dot: C.warning, label: "Pending" },
  active:   { color: "#15803D", bg: C.successLight, border: "#86EFAC", dot: C.success, label: "Active"  },
  rejected: { color: "#991B1B", bg: C.dangerLight,  border: "#FCA5A5", dot: C.danger,  label: "Rejected" },
  closed:   { color: C.textSub, bg: "#F1F5F9",      border: C.border,  dot: C.textMuted, label: "Closed" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
};

const getInitials = (name = "") => {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const SalaryAdvance = () => {
  const dispatch = useDispatch();
  const { advances = [], loading } = useSelector((s) => s.advance);
  const { employees = [] } = useSelector((s) => s.employee);
  const { profile } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);
  const schoolId = profile?.school?._id;
  const academicYearId = activeYear?._id;

  const [modalOpen, setModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAdvances({ schoolId }));
      dispatch(getEmployees({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({
      value: e._id,
      label: e.userId?.name || "Unknown",
    })),
    [employees],
  );

  const stats = useMemo(() => ({
    total:       advances.length,
    active:      advances.filter((a) => a.status === "active").length,
    pending:     advances.filter((a) => a.status === "pending").length,
    outstanding: advances.filter((a) => a.status === "active").reduce((s, a) => s + (a.remainingAmount || 0), 0),
  }), [advances]);

  const refresh = () => dispatch(fetchAdvances({ schoolId }));

  const handleCreate = async (values) => {
    try {
      await dispatch(createAdvance({
        ...values,
        schoolId,
        academicYearId,
        startMonth: values.startMonth.toISOString(),
      })).unwrap();
      message.success("Advance request created successfully");
      setModalOpen(false);
      form.resetFields();
      refresh();
    } catch (e) {
      message.error(e || "Failed to create advance");
    }
  };

  const handleApprove = (record) => Modal.confirm({
    title: `Approve ₹${record.totalAmount?.toLocaleString("en-IN")} advance for ${record.empName}?`,
    okText: "Approve", okButtonProps: { style: { background: C.success, borderColor: C.success, borderRadius: 8, color: "#fff" } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(approveAdvance({ id: record._id })).unwrap(); message.success("Advance approved"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const handleReject = (record) => {
    let reason = "";
    Modal.confirm({
      title: "Reject this advance request?",
      content: (
        <Input.TextArea
          rows={3} placeholder="Reason for rejection (optional)"
          onChange={(e) => { reason = e.target.value; }}
          style={{ marginTop: 12 }}
        />
      ),
      okText: "Reject", okButtonProps: { danger: true, style: { borderRadius: 8 } },
      cancelButtonProps: { style: { borderRadius: 8 } },
      onOk: async () => {
        try { await dispatch(rejectAdvance({ id: record._id, reason })).unwrap(); message.success("Advance rejected"); refresh(); }
        catch (e) { message.error(e || "Failed"); }
      },
    });
  };

  const handleDeductEmi = (record) => Modal.confirm({
    title: `Deduct EMI of ${fmt(record.emiAmount)}?`,
    content: `Remaining after deduction: ${fmt((record.remainingAmount || 0) - (record.emiAmount || 0))}`,
    okText: "Deduct",
    okButtonProps: { style: { background: C.primary, borderColor: C.primary, borderRadius: 8, color: "#fff" } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(deductEmi({ id: record._id })).unwrap(); message.success("EMI deducted"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const handleClose = (record) => Modal.confirm({
    title: "Close this advance early?",
    content: "Remaining balance will be waived/cleared.",
    okText: "Close Advance", okButtonProps: { danger: true, style: { borderRadius: 8 } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(closeAdvance({ id: record._id })).unwrap(); message.success("Advance closed"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const dataSource = useMemo(() => advances.map((a) => ({
    key: a._id, _id: a._id,
    empName:       a.employeeId?.userId?.name || "—",
    totalAmount:   a.totalAmount,
    emiAmount:     a.emiAmount,
    remainingAmount: a.remainingAmount,
    startMonth:    a.startMonth,
    status:        a.status,
    history:       a.history || [],
    paidPercent:   a.totalAmount > 0
      ? Math.round(((a.totalAmount - a.remainingAmount) / a.totalAmount) * 100)
      : 0,
  })), [advances]);

  const columns = [
    {
      title: "Employee",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            color: "#fff", fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {getInitials(r.empName)}
          </div>
          <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{r.empName}</span>
        </div>
      ),
    },
    {
      title: "Total / EMI",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{fmt(r.totalAmount)}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>EMI: {fmt(r.emiAmount)}/month</div>
        </div>
      ),
    },
    {
      title: "Repayment",
      width: 180,
      render: (_, r) => (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.textSub }}>Remaining: {fmt(r.remainingAmount)}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: r.paidPercent === 100 ? C.success : C.primary }}>
              {r.paidPercent}%
            </span>
          </div>
          <Progress
            percent={r.paidPercent}
            showInfo={false}
            strokeColor={r.paidPercent === 100 ? C.success : C.primary}
            trailColor={C.border}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "Start Month",
      dataIndex: "startMonth",
      render: (v) => v ? (
        <span style={{ fontSize: 12, color: C.textSub }}>
          {dayjs(v).format("MMM YYYY")}
        </span>
      ) : "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: ["pending", "active", "rejected", "closed"].map((s) => ({ text: STATUS_CFG[s].label, value: s })),
      onFilter: (v, r) => r.status === v,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: "Actions",
      width: 180,
      render: (_, r) => (
        <Space size={4} wrap>
          {r.status === "pending" && (
            <>
              <Tooltip title="Approve">
                <Button size="small" icon={<CheckOutlined />} onClick={() => handleApprove(r)}
                  style={{ borderRadius: 7, borderColor: C.success, color: C.success, background: C.successLight }} />
              </Tooltip>
              <Tooltip title="Reject">
                <Button size="small" icon={<CloseOutlined />} onClick={() => handleReject(r)}
                  style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }} />
              </Tooltip>
            </>
          )}
          {r.status === "active" && (
            <>
              <Tooltip title="Deduct EMI">
                <Button size="small" icon={<MinusCircleOutlined />} onClick={() => handleDeductEmi(r)}
                  style={{ borderRadius: 7, borderColor: C.primary, color: C.primary, background: C.primaryLighter }} />
              </Tooltip>
              <Tooltip title="Close Advance">
                <Button size="small" icon={<StopOutlined />} onClick={() => handleClose(r)}
                  style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }} />
              </Tooltip>
            </>
          )}
          <Tooltip title="View History">
            <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryModal(r)}
              style={{ borderRadius: 7, borderColor: C.border, color: C.textSub, background: C.surfaceSoft }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("adv-tbl")}</style>

      <PageHeader
        title="Salary Advance"
        subtitle="Manage employee salary advances and EMI deductions"
        icon={<WalletOutlined />}
        extra={
          <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}
            style={{ background: C.primary, borderColor: C.primary, color: "#fff", borderRadius: 10, fontWeight: 600 }}>
            New Advance Request
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(150), margin: "20px 0 20px" }}>
        {[
          { icon: <WalletOutlined />,       label: "Total Advances",    value: stats.total,                  color: C.primary },
          { icon: <CheckCircleOutlined />,  label: "Active",            value: stats.active,                 color: C.success },
          { icon: <ClockCircleOutlined />,  label: "Pending Approval",  value: stats.pending,                color: C.warning },
          { icon: <FieldTimeOutlined />,    label: "Total Outstanding", value: fmt(stats.outstanding),       color: C.purple, small: true },
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
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Advances</span>
          <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 20, background: C.primaryLighter, color: C.primary, border: "1px solid " + C.primaryLight, fontWeight: 600 }}>
            {advances.length}
          </span>
        </div>
        <Table
          className="adv-tbl"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} records` }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No advance records found. Click 'New Advance Request' to add one." }}
        />
      </div>

      {/* New Advance Modal */}
      <Modal
        title={<Space><WalletOutlined style={{ color: C.primary }} /><span style={{ fontWeight: 700 }}>New Advance Request</span></Space>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={[
          <Button key="c" onClick={() => { setModalOpen(false); form.resetFields(); }}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>Cancel</Button>,
          <Button key="s" onClick={() => form.submit()} loading={loading}
            style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, color: "#fff", fontWeight: 600 }}>
            Submit Request
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
            <Form.Item name="totalAmount" label="Advance Amount (₹)" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 25000" formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(v) => v.replace(/₹\s?|(,*)/g, "")} />
            </Form.Item>
            <Form.Item name="emiAmount" label="Monthly EMI (₹)" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 5000" formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(v) => v.replace(/₹\s?|(,*)/g, "")} />
            </Form.Item>
          </div>
          <Form.Item name="startMonth" label="Deduction Start Month" rules={[{ required: true }]}>
            <DatePicker picker="month" style={{ width: "100%" }} format="MMM YYYY" />
          </Form.Item>
          <Form.Item name="note" label="Reason / Note">
            <Input.TextArea rows={3} placeholder="Reason for advance request (medical emergency, house repair, etc.)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal
        title={<Space><HistoryOutlined style={{ color: C.primary }} /><span style={{ fontWeight: 700 }}>Advance History — {historyModal?.empName}</span></Space>}
        open={!!historyModal}
        onCancel={() => setHistoryModal(null)}
        footer={<Button onClick={() => setHistoryModal(null)} style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>Close</Button>}
        width={480}
      >
        {(historyModal?.history || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>No history available</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
            {(historyModal?.history || []).map((h, i) => {
              const ACTION_CFG = {
                created:    { color: C.primary,  bg: C.primaryLighter, label: "Created" },
                approved:   { color: C.success,  bg: C.successLight,   label: "Approved" },
                rejected:   { color: C.danger,   bg: C.dangerLight,    label: "Rejected" },
                emi_deducted: { color: C.warning, bg: C.warningLight,  label: "EMI Deducted" },
                closed:     { color: C.textSub,  bg: "#F1F5F9",        label: "Closed" },
              };
              const cfg = ACTION_CFG[h.action] || ACTION_CFG.created;
              return (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: cfg.bg, borderRadius: 10, border: `1px solid ${cfg.color}22` }}>
                  <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: cfg.color, marginTop: 6 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>{cfg.label}</div>
                    {h.amount > 0 && <div style={{ fontSize: 12, color: C.textSub }}>Amount: {fmt(h.amount)}</div>}
                    {h.note && <div style={{ fontSize: 12, color: C.textSub }}>{h.note}</div>}
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      {h.actedAt ? dayjs(h.actedAt).format("DD MMM YYYY, hh:mm A") : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalaryAdvance;

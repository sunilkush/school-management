import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Form, Input, InputNumber, Modal, Select, Space, Table, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined,
  StopOutlined, GiftOutlined, TrophyOutlined, StarOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBonuses, createBonus, updateBonus, deleteBonus, approveBonus, cancelBonus,
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
  festival_bonus:     { label: "Festival Bonus",     emoji: "🪔", color: C.warning,  bg: C.warningLight,  border: "#FDE68A" },
  performance_bonus:  { label: "Performance Bonus",  emoji: "🏆", color: C.success,  bg: C.successLight,  border: "#86EFAC" },
  incentive:          { label: "Incentive",          emoji: "⭐", color: C.primary,  bg: C.primaryLighter, border: C.primaryLight },
  target_bonus:       { label: "Target Bonus",       emoji: "🎯", color: C.purple,   bg: C.purpleLight,   border: "#DDD6FE" },
  one_time_payout:    { label: "One-Time Payout",    emoji: "💰", color: C.orange,   bg: C.orangeLight,   border: "#FED7AA" },
};

const STATUS_CFG = {
  draft:     { color: C.textSub, bg: "#F1F5F9",    border: C.border,    label: "Draft"     },
  approved:  { color: "#15803D", bg: C.successLight, border: "#86EFAC", label: "Approved"  },
  paid:      { color: C.primary, bg: C.primaryLighter, border: C.primaryLight, label: "Paid" },
  cancelled: { color: "#991B1B", bg: C.dangerLight, border: "#FCA5A5",  label: "Cancelled" },
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || { label: type, emoji: "💼", color: C.textSub, bg: "#F1F5F9", border: C.border };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
};

const getInitials = (name = "") => {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const BonusIncentivePage = () => {
  const dispatch = useDispatch();
  const { bonuses = [], loading } = useSelector((s) => s.advance);
  const { employees = [] } = useSelector((s) => s.employee);
  const { profile } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);
  const schoolId = profile?.school?._id;
  const academicYearId = activeYear?._id;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchBonuses({ schoolId }));
      dispatch(getEmployees({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e._id, label: e.userId?.name || "Unknown" })),
    [employees],
  );

  const stats = useMemo(() => ({
    total:    bonuses.length,
    festival: bonuses.filter((b) => b.type === "festival_bonus").length,
    perf:     bonuses.filter((b) => b.type === "performance_bonus").length,
    totalAmt: bonuses.filter((b) => b.status !== "cancelled").reduce((s, b) => s + (b.amount || 0), 0),
  }), [bonuses]);

  const refresh = () => dispatch(fetchBonuses({ schoolId }));

  const openCreate = () => { setEditingId(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({ ...record });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingId) {
        await dispatch(updateBonus({ id: editingId, payload: values })).unwrap();
        message.success("Bonus updated");
      } else {
        await dispatch(createBonus({ ...values, schoolId, academicYearId })).unwrap();
        message.success("Bonus created");
      }
      setModalOpen(false);
      form.resetFields();
      refresh();
    } catch (e) { message.error(e || "Failed to save bonus"); }
  };

  const handleApprove = (record) => Modal.confirm({
    title: `Approve ${fmt(record.amount)} for ${record.empName}?`,
    okText: "Approve", okButtonProps: { style: { background: C.success, borderColor: C.success, borderRadius: 8, color: "#fff" } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(approveBonus(record._id)).unwrap(); message.success("Bonus approved"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const handleCancel = (record) => Modal.confirm({
    title: "Cancel this bonus?",
    okText: "Cancel Bonus", okButtonProps: { danger: true, style: { borderRadius: 8 } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(cancelBonus(record._id)).unwrap(); message.success("Bonus cancelled"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const handleDelete = (record) => Modal.confirm({
    title: "Delete this bonus permanently?",
    okText: "Delete", okButtonProps: { danger: true, style: { borderRadius: 8 } },
    cancelButtonProps: { style: { borderRadius: 8 } },
    onOk: async () => {
      try { await dispatch(deleteBonus(record._id)).unwrap(); message.success("Bonus deleted"); refresh(); }
      catch (e) { message.error(e || "Failed"); }
    },
  });

  const dataSource = useMemo(() => bonuses.map((b) => ({
    key: b._id, _id: b._id,
    empName: b.employeeId?.userId?.name || "—",
    type: b.type, title: b.title,
    amount: b.amount, payoutMonth: b.payoutMonth,
    payoutYear: b.payoutYear, status: b.status,
    rule: b.rule,
  })), [bonuses]);

  const columns = [
    {
      title: "Employee",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.warning}, #EF4444)`,
            color: "#fff", fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {getInitials(r.empName)}
          </div>
          <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{r.empName}</span>
        </div>
      ),
    },
    { title: "Type",   dataIndex: "type",   render: (v) => <TypeBadge type={v} /> },
    { title: "Title",  dataIndex: "title",  render: (v) => <span style={{ color: C.textSub, fontSize: 13 }}>{v}</span> },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => <span style={{ fontWeight: 700, color: C.success, fontSize: 14 }}>{fmt(v)}</span>,
    },
    {
      title: "Payout",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: C.textSub }}>
          {MONTHS[(r.payoutMonth || 1) - 1]} {r.payoutYear}
        </span>
      ),
    },
    { title: "Status", dataIndex: "status", render: (v) => <StatusBadge status={v} /> },
    {
      title: "Actions",
      width: 150,
      render: (_, r) => (
        <Space size={5}>
          {(r.status === "draft") && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => handleApprove(r)}
              style={{ borderRadius: 7, borderColor: C.success, color: C.success, background: C.successLight }} />
          )}
          {r.status !== "paid" && r.status !== "cancelled" && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}
              style={{ borderRadius: 7, borderColor: C.primary, color: C.primary, background: C.primaryLighter }} />
          )}
          {r.status !== "paid" && r.status !== "cancelled" && (
            <Button size="small" icon={<StopOutlined />} onClick={() => handleCancel(r)}
              style={{ borderRadius: 7, borderColor: C.warning, color: C.warning, background: C.warningLight }} />
          )}
          {r.status !== "paid" && (
            <Button size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(r)}
              style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("bonus-tbl")}</style>

      <PageHeader
        title="Bonus & Incentives"
        subtitle="Manage festival bonuses, performance incentives, and one-time payouts"
        icon={<GiftOutlined />}
        extra={
          <Button icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: C.warning, borderColor: C.warning, color: "#fff", borderRadius: 10, fontWeight: 600 }}>
            Add Bonus
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(150), margin: "20px 0 20px" }}>
        {[
          { icon: <GiftOutlined />,   label: "Total Bonuses",    value: stats.total,               color: C.primary },
          { icon: "🪔",              label: "Festival Bonuses", value: stats.festival,             color: C.warning, emoji: true },
          { icon: <TrophyOutlined />, label: "Performance",      value: stats.perf,                 color: C.success },
          { icon: <StarOutlined />,   label: "Total Value",      value: fmt(stats.totalAmt),        color: C.purple, small: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.surface, borderRadius: 14, border: "1px solid " + C.border,
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={iconWell(s.color, 42)}>
              {s.emoji ? <span style={{ fontSize: 20 }}>{s.icon}</span> : s.icon}
            </div>
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
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Bonuses & Incentives</span>
          <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 20, background: C.warningLight, color: "#92400E", border: "1px solid #FDE68A", fontWeight: 600 }}>
            {bonuses.length}
          </span>
        </div>
        <Table
          className="bonus-tbl"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} records` }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No bonuses found. Click 'Add Bonus' to create one." }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={<Space><GiftOutlined style={{ color: C.warning }} /><span style={{ fontWeight: 700 }}>{editingId ? "Edit Bonus" : "Add Bonus / Incentive"}</span></Space>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={[
          <Button key="c" onClick={() => { setModalOpen(false); form.resetFields(); }}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>Cancel</Button>,
          <Button key="s" onClick={() => form.submit()} loading={loading}
            style={{ borderRadius: 8, background: C.warning, borderColor: C.warning, color: "#fff", fontWeight: 600 }}>
            {editingId ? "Update" : "Create Bonus"}
          </Button>,
        ]}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={employeeOptions} placeholder="Select employee…" size="large" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item name="type" label="Bonus Type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                {Object.entries(TYPE_CFG).map(([k, v]) => (
                  <Select.Option key={k} value={k}>{v.emoji} {v.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 5000"
                formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/₹\s?|(,*)/g, "")} />
            </Form.Item>
          </div>
          <Form.Item name="title" label="Bonus Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Diwali Bonus 2024, Q3 Performance Bonus" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item name="payoutMonth" label="Payout Month" rules={[{ required: true }]}>
              <Select placeholder="Select month">
                {MONTHS.map((m, i) => <Select.Option key={i + 1} value={i + 1}>{m}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="payoutYear" label="Payout Year" rules={[{ required: true }]}>
              <Select placeholder="Select year">
                {YEARS.map((y) => <Select.Option key={y} value={y}>{y}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="rule" label="Note / Criteria (optional)">
            <Input.TextArea rows={2} placeholder="Criteria or note about this bonus…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BonusIncentivePage;

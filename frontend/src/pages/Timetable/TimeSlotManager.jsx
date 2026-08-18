import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, App } from "antd";
import {
  PlusOutlined, ClockCircleOutlined, EditOutlined, DeleteOutlined,
  CalendarOutlined, CoffeeOutlined,
} from "@ant-design/icons";
import {
  createTimeSlot, deleteTimeSlot, fetchTimeSlots, updateTimeSlot,
} from "../../features/timetableSlice";
import { schoolIdFromUser } from "./timetableUi";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../styles/pageStyles";

const C = {
  primary: "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  accent: "var(--accent)", accentLight: "var(--accent-light)",
  warning: "var(--warning)", warningLight: "var(--warning-light)",
  success: "var(--success)", successLight: "var(--success-light)",
  danger: "var(--danger)", dangerLight: "var(--danger-light)",
  purple: "var(--purple)", purpleLight: "rgba(var(--purple-rgb), 0.08)",
  border: "var(--border)", text: "var(--text)", textSub: "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface: "var(--surface)",
};

const TYPE_CFG = {
  period:   { color: C.primary,  bg: C.primaryLighter, label: "Period" },
  break:    { color: "var(--orange)",  bg: "rgba(var(--warning-rgb), 0.08)", label: "Break" },
  lunch:    { color: C.accent,   bg: C.accentLight,     label: "Lunch" },
  assembly: { color: "var(--info)",  bg: "var(--info-light)", label: "Assembly" },
  activity: { color: C.success,  bg: C.successLight,    label: "Activity" },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || { color: C.textSub, bg: "var(--surface-soft)", label: type };
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 700,
      border: `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`,
    }}>
      {cfg.label}
    </span>
  );
};

export default function TimeSlotManager() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const { timeSlots, loading } = useSelector((s) => s.timetable);
  const schoolId = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(fetchTimeSlots({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const openAdd = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, schoolId, academicYearId };
      if (editing) {
        await dispatch(updateTimeSlot({ id: editing._id, payload })).unwrap();
        message.success("Time slot updated");
      } else {
        await dispatch(createTimeSlot(payload)).unwrap();
        message.success("Time slot created");
      }
      setOpen(false);
    } catch (e) {
      if (typeof e === "string") message.error(e);
    }
  };

  const sorted = [...timeSlots].sort((a, b) => (a.order || 0) - (b.order || 0));

  const stats = {
    total:    timeSlots.length,
    periods:  timeSlots.filter((s) => s.type === "period").length,
    breaks:   timeSlots.filter((s) => ["break", "lunch"].includes(s.type)).length,
  };

  const columns = [
    {
      title: "#",
      dataIndex: "order",
      width: 64,
      render: (v) => (
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: C.primaryLighter, color: C.primary,
          fontSize: 13, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {v}
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (v) => <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{v}</span>,
    },
    {
      title: "Time Range",
      render: (_, r) => (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 14px", borderRadius: 20,
          background: "var(--background)", border: "1px solid " + C.border,
          fontSize: 13, color: C.textSub, fontWeight: 600,
        }}>
          <ClockCircleOutlined style={{ fontSize: 12, color: C.accent }} />
          {r.startTime} – {r.endTime}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (v) => <TypeBadge type={v} />,
    },
    {
      title: "Actions",
      width: 110,
      render: (_, r) => (
        <Space size={6}>
          <Button
            size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}
            style={{ borderRadius: 7, borderColor: C.primary, color: C.primary, background: C.primaryLighter }}
          />
          <Button
            size="small" icon={<DeleteOutlined />}
            onClick={() => dispatch(deleteTimeSlot(r._id)).unwrap().catch(message.error)}
            style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("ts-tbl")}</style>

      <PageHeader
        title="Time Slot Manager"
        subtitle="Define period, break, and assembly slots for the active academic year"
        icon={<ClockCircleOutlined />}
        extra={
          <Button
            icon={<PlusOutlined />}
            disabled={!academicYearId}
            onClick={openAdd}
            style={{
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 600,
            }}
          >
            Add Time Slot
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(160), margin: "20px 0 20px" }}>
        {[
          { icon: <ClockCircleOutlined />, label: "Total Slots",    value: stats.total,   color: C.primary },
          { icon: <CalendarOutlined />,    label: "Periods",        value: stats.periods,  color: C.accent },
          { icon: <CoffeeOutlined />,      label: "Breaks / Lunch", value: stats.breaks,   color: "var(--orange)" },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.surface, borderRadius: 14,
            border: "1px solid " + C.border,
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={iconWell(s.color, 42)}>{s.icon}</div>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: s.color,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2,
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px 12px",
          borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Time Slots</span>
          <span style={{
            fontSize: 12, padding: "2px 9px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight, fontWeight: 600,
          }}>
            {timeSlots.length}
          </span>
        </div>
        <Table
          className="ts-tbl"
          loading={loading}
          rowKey="_id"
          dataSource={sorted}
          columns={columns}
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No time slots yet — click 'Add Time Slot' to create one." }}
        />
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={
          <Space>
            <ClockCircleOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700 }}>{editing ? "Edit Time Slot" : "Add Time Slot"}</span>
          </Space>
        }
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>
            Cancel
          </Button>,
          <Button key="save" onClick={save}
            style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, color: "#fff", fontWeight: 600 }}>
            {editing ? "Update" : "Create"}
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="order" label="Order" rules={[{ required: true, message: "Required" }]}>
              <InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
            </Form.Item>
            <Form.Item name="type" label="Type" initialValue="period">
              <Select
                options={["period", "break", "lunch", "assembly", "activity"].map((t) => ({
                  value: t,
                  label: TYPE_CFG[t]?.label || t,
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="name" label="Slot Name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="e.g. Period 1, Lunch Break" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: "Required" }]}>
              <Input type="time" />
            </Form.Item>
            <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: "Required" }]}>
              <Input type="time" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

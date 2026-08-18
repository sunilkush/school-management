import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, App } from "antd";
import {
  PlusOutlined, HomeOutlined, EditOutlined, DeleteOutlined,
  ExperimentOutlined, ApartmentOutlined, TeamOutlined,
} from "@ant-design/icons";
import { createRoom, deleteRoom, fetchRooms, updateRoom } from "../../features/timetableSlice";
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

const ROOM_TYPE_CFG = {
  classroom:  { color: C.primary,  bg: C.primaryLighter, label: "Classroom" },
  lab:        { color: C.purple,   bg: C.purpleLight,     label: "Lab" },
  library:    { color: C.accent,   bg: C.accentLight,     label: "Library" },
  auditorium: { color: C.warning,  bg: C.warningLight,    label: "Auditorium" },
  sports:     { color: C.success,  bg: C.successLight,    label: "Sports" },
  other:      { color: C.textSub,  bg: "var(--surface-soft)", label: "Other" },
};

const RoomTypeBadge = ({ type }) => {
  const cfg = ROOM_TYPE_CFG[type] || ROOM_TYPE_CFG.other;
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

export default function RoomManager() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { user } = useSelector((s) => s.auth);
  const { rooms, loading } = useSelector((s) => s.timetable);
  const schoolId = schoolIdFromUser(user);

  useEffect(() => {
    if (schoolId) dispatch(fetchRooms({ schoolId }));
  }, [dispatch, schoolId]);

  const openAdd = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, schoolId };
      if (editing) {
        await dispatch(updateRoom({ id: editing._id, payload })).unwrap();
        message.success("Room updated");
      } else {
        await dispatch(createRoom(payload)).unwrap();
        message.success("Room created");
      }
      setOpen(false);
    } catch (e) {
      if (typeof e === "string") message.error(e);
    }
  };

  const stats = {
    total:      rooms.length,
    classrooms: rooms.filter((r) => r.type === "classroom").length,
    labs:       rooms.filter((r) => r.type === "lab").length,
  };

  const columns = [
    {
      title: "Room",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: (ROOM_TYPE_CFG[r.type] || ROOM_TYPE_CFG.other).bg,
            color: (ROOM_TYPE_CFG[r.type] || ROOM_TYPE_CFG.other).color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>
            {r.type === "lab" ? <ExperimentOutlined /> : <HomeOutlined />}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{r.name}</div>
            {r.code && (
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>Code: {r.code}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      render: (v) => (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 12px", borderRadius: 20,
          background: "var(--background)", border: "1px solid " + C.border,
          fontSize: 13, color: C.textSub, fontWeight: 600,
        }}>
          <TeamOutlined style={{ fontSize: 11 }} />
          {v || 0}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (v) => <RoomTypeBadge type={v} />,
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
            onClick={() => dispatch(deleteRoom(r._id)).unwrap().catch(message.error)}
            style={{ borderRadius: 7, borderColor: C.danger, color: C.danger, background: C.dangerLight }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("room-tbl")}</style>

      <PageHeader
        title="Room Manager"
        subtitle="Manage classrooms, labs, and facilities used in timetable scheduling"
        icon={<HomeOutlined />}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={openAdd}
            style={{
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 600,
            }}
          >
            Add Room
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(160), margin: "20px 0 20px" }}>
        {[
          { icon: <HomeOutlined />,        label: "Total Rooms",  value: stats.total,      color: C.primary },
          { icon: <ApartmentOutlined />,   label: "Classrooms",   value: stats.classrooms,  color: C.accent },
          { icon: <ExperimentOutlined />,  label: "Labs",         value: stats.labs,         color: C.purple },
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
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Rooms</span>
          <span style={{
            fontSize: 12, padding: "2px 9px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight, fontWeight: 600,
          }}>
            {rooms.length}
          </span>
        </div>
        <Table
          className="room-tbl"
          loading={loading}
          rowKey="_id"
          dataSource={rooms}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No rooms added yet — click 'Add Room' to get started." }}
        />
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={
          <Space>
            <HomeOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700 }}>{editing ? "Edit Room" : "Add Room"}</span>
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
            <Form.Item name="name" label="Room Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="e.g. Room 101" />
            </Form.Item>
            <Form.Item name="code" label="Room Code">
              <Input placeholder="e.g. R101" />
            </Form.Item>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="capacity" label="Capacity" initialValue={0}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
            </Form.Item>
            <Form.Item name="type" label="Room Type" initialValue="classroom">
              <Select
                options={Object.entries(ROOM_TYPE_CFG).map(([value, cfg]) => ({
                  value,
                  label: cfg.label,
                }))}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

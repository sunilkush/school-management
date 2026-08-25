import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Form, Input, InputNumber, Modal, Progress, Select, Space, Table, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserAddOutlined, UserDeleteOutlined, ReloadOutlined,
  HomeOutlined, TeamOutlined, SearchOutlined, BankOutlined,
} from "@ant-design/icons";
import {
  assignHostelStudent, createHostelRoom, deleteHostelRoom,
  fetchHostelRooms, unassignHostelStudent, updateHostelRoom,
} from "../../../features/hostelSlice";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../../styles/pageStyles";
import { CATEGORICAL_COLORS } from "../../../utils/colorPalette";

// Shared design tokens (frontend/src/index.css) — replaces a local hardcoded
// hex palette that never adapted to dark mode.
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

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getOccupancyColor = (occupied, capacity) => {
  if (!capacity) return C.textMuted;
  const pct = occupied / capacity;
  if (pct >= 1)   return C.danger;
  if (pct >= 0.8) return C.warning;
  return C.success;
};

const OccupancyBar = ({ occupied, capacity }) => {
  const pct     = capacity ? Math.round((occupied / capacity) * 100) : 0;
  const color   = getOccupancyColor(occupied, capacity);
  const isFull  = occupied >= capacity && capacity > 0;
  return (
    <div style={{ minWidth: 140 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 5,
      }}>
        <span style={{
          padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: isFull ? C.dangerLight : C.successLight,
          color: isFull ? C.danger : "var(--success-hover)",
          border: `1px solid ${isFull ? "rgba(var(--danger-rgb), 0.35)" : "rgba(var(--success-rgb), 0.35)"}`,
        }}>
          {occupied}/{capacity}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</span>
      </div>
      <Progress
        percent={pct}
        showInfo={false}
        size={["100%", 6]}
        strokeColor={color}
        trailColor={C.border}
        style={{ margin: 0 }}
      />
    </div>
  );
};

const HostelManagement = () => {
  const dispatch = useDispatch();
  const { rooms = [], loading, actionLoading } = useSelector((s) => s.hostel);
  const { schoolStudents = [] }               = useSelector((s) => s.students);
  const { user }                              = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear }  = useSelector((s) => s.academicYear);

  const schoolId      = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || activeYear?._id;
  const userRole      = user?.role?.name;
  const canManage     = ["Super Admin","School Admin","Admin","Principal","Vice Principal","Hostel Warden"].includes(userRole);

  const [modalOpen, setModalOpen]         = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingRoom, setEditingRoom]     = useState(null);
  const [selectedRoom, setSelectedRoom]   = useState(null);
  const [searchTerm, setSearchTerm]       = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [form]       = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => { dispatch(fetchHostelRooms()); }, [dispatch]);
  useEffect(() => {
    // Populates the "assign student to room" search dropdown below, which needs to search across
    // the whole roster — passes an explicit, documented cap instead of silently relying on the
    // backend's 500-record default.
    if (schoolId) dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, limit: 2000 }));
  }, [dispatch, schoolId, academicYearId]);

  const stats = useMemo(() => {
    const totalRooms    = rooms.length;
    const totalCapacity = rooms.reduce((a, r) => a + Number(r.capacity || 0), 0);
    const totalOccupied = rooms.reduce((a, r) => a + (r.students?.length || 0), 0);
    const totalAvailable = Math.max(totalCapacity - totalOccupied, 0);
    return { totalRooms, totalOccupied, totalAvailable };
  }, [rooms]);

  const closeRoomModal = () => { setModalOpen(false); setEditingRoom(null); form.resetFields(); };

  const handleSaveRoom = async (values) => {
    try {
      if (editingRoom?._id) {
        await dispatch(updateHostelRoom({ id: editingRoom._id, payload: values })).unwrap();
        message.success("Room updated");
      } else {
        await dispatch(createHostelRoom(values)).unwrap();
        message.success("Room added");
      }
      closeRoomModal();
    } catch (err) {
      message.error(err || "Unable to save room");
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    form.setFieldsValue({ roomNumber: room.roomNumber, capacity: room.capacity });
    setModalOpen(true);
  };

  const handleDeleteRoom = (room) =>
    Modal.confirm({
      title: `Delete Room ${room.roomNumber}?`,
      content: "All student allocations will be removed.",
      okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteHostelRoom(room._id)).unwrap();
          message.success("Room deleted");
        } catch (err) { message.error(err || "Unable to delete"); }
      },
    });

  const handleOpenAssignModal = (room) => {
    setSelectedRoom(room);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  const handleAssignStudent = async (values) => {
    if (!selectedRoom?._id) return;
    const student = schoolStudents.find((s) => (s?.user?._id || s._id) === values.studentId);
    try {
      await dispatch(assignHostelStudent({
        id: selectedRoom._id,
        studentId: values.studentId,
        studentName: student?.name || student?.fullName || student?.user?.name || "Unnamed Student",
      })).unwrap();
      message.success("Student assigned");
      setAssignModalOpen(false);
      setSelectedRoom(null);
      assignForm.resetFields();
      dispatch(fetchHostelRooms());
    } catch (err) { message.error(err || "Unable to assign student"); }
  };

  const handleUnassignStudent = (room, student) =>
    Modal.confirm({
      title: `Remove ${student.name || student.fullName} from Room ${room.roomNumber}?`,
      okText: "Remove", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(unassignHostelStudent({ roomId: room._id, studentId: student._id })).unwrap();
          message.success("Student removed");
          dispatch(fetchHostelRooms());
        } catch (err) { message.error(err || "Unable to unassign"); }
      },
    });

  const filteredRooms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rooms.filter((room) => {
      const occupied  = room.students?.length || 0;
      const capacity  = Number(room.capacity) || 0;
      const isFull    = capacity > 0 && occupied >= capacity;
      const isAvailable = occupied < capacity;
      const matchesSearch = !q
        || String(room.roomNumber || "").toLowerCase().includes(q)
        || (room.students || []).some((s) => String(s.name || s.fullName || "").toLowerCase().includes(q));
      const matchesFilter =
        occupancyFilter === "all" ||
        (occupancyFilter === "full" && isFull) ||
        (occupancyFilter === "available" && isAvailable);
      return matchesSearch && matchesFilter;
    });
  }, [rooms, searchTerm, occupancyFilter]);

  const studentOptions = useMemo(
    () => (schoolStudents || []).map((s) => ({
      value: s?.user?._id || s._id,
      label: s?.name || s?.fullName || s?.user?.name || "Unnamed Student",
    })),
    [schoolStudents],
  );

  const columns = [
    {
      title: "Room",
      dataIndex: "roomNumber",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: C.primaryLighter, border: "1.5px solid " + C.primaryLight,
            color: C.primary, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <HomeOutlined />
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
            {v}
          </div>
        </div>
      ),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      width: 100,
      render: (v) => (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 11px", borderRadius: 20,
          background: "var(--background)", border: "1px solid " + C.border,
          fontSize: 12, fontWeight: 700, color: C.textSub,
        }}>
          <TeamOutlined style={{ fontSize: 10 }} />
          {v} beds
        </span>
      ),
    },
    {
      title: "Occupancy",
      key: "occupancy",
      width: 180,
      render: (_, r) => (
        <OccupancyBar
          occupied={r.students?.length || 0}
          capacity={Number(r.capacity) || 0}
        />
      ),
    },
    {
      title: "Assigned Students",
      key: "students",
      render: (_, r) => {
        const studs = r.students || [];
        if (!studs.length) return <span style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>No students assigned</span>;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {studs.map((s, i) => {
              const name = s.name || s.fullName || "?";
              return (
                <div key={s._id || i} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 10px 3px 4px", borderRadius: 20,
                  background: "var(--background)", border: "1px solid " + C.border,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
                    color: "#fff", fontSize: 8, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {getInitials(name)}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{name}</span>
                  {canManage && (
                    <button
                      onClick={() => handleUnassignStudent(r, s)}
                      title="Remove student"
                      style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: C.dangerLight, border: "none",
                        color: C.danger, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 900, padding: 0, flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Actions",
      width: 140,
      render: (_, r) => {
        const isFull = (r.students?.length || 0) >= Number(r.capacity || 0);
        return (
          <Space direction="vertical" size={5} style={{ width: "100%" }}>
            <Button
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => handleOpenAssignModal(r)}
              disabled={!canManage || isFull}
              style={{
                width: "100%", borderRadius: 7, fontWeight: 600,
                background: (!canManage || isFull) ? undefined : C.primary,
                borderColor: (!canManage || isFull) ? undefined : C.primary,
                color: (!canManage || isFull) ? undefined : "#fff",
                fontSize: 12,
              }}
            >
              Assign Student
            </Button>
            <div style={{ display: "flex", gap: 5 }}>
              <Button
                size="small" icon={<EditOutlined />} disabled={!canManage}
                onClick={() => handleEditRoom(r)}
                style={{
                  flex: 1, borderRadius: 7,
                  borderColor: C.primary, color: C.primary, background: C.primaryLighter,
                }}
              />
              <Button
                size="small" icon={<DeleteOutlined />} disabled={!canManage}
                onClick={() => handleDeleteRoom(r)}
                style={{
                  flex: 1, borderRadius: 7,
                  borderColor: C.danger, color: C.danger, background: C.dangerLight,
                }}
              />
            </div>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("hostel-tbl")}</style>

      <PageHeader
        title="Hostel Room Management"
        subtitle="Add rooms, monitor occupancy, and assign students to hostel beds"
        icon={<BankOutlined />}
        extra={
          <Space size={8}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchHostelRooms())}
              loading={loading}
              style={{ borderRadius: 9, borderColor: C.border, color: C.textSub }}
            >
              Refresh
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
              disabled={!canManage}
              style={{
                background: C.primary, borderColor: C.primary,
                color: "#fff", borderRadius: 10, fontWeight: 600,
              }}
            >
              Add Room
            </Button>
          </Space>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(160), margin: "20px 0 20px" }}>
        {[
          { icon: <HomeOutlined />,   label: "Total Rooms",       value: stats.totalRooms,    color: C.primary },
          { icon: <TeamOutlined />,   label: "Students Assigned", value: stats.totalOccupied,  color: C.warning },
          { icon: <BankOutlined />,   label: "Beds Available",    value: stats.totalAvailable, color: C.success },
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

      {/* Toolbar */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
      }}>
        <div style={{
          flex: "1 1 240px", maxWidth: 380,
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 10,
          background: C.surface, border: "1px solid " + C.border,
        }}>
          <SearchOutlined style={{ color: C.textMuted, fontSize: 14 }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search room or student name…"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 13, color: C.text, width: "100%",
            }}
          />
          {searchTerm && (
            <span
              onClick={() => setSearchTerm("")}
              style={{ cursor: "pointer", color: C.textMuted, fontSize: 16, lineHeight: 1 }}
            >
              ×
            </span>
          )}
        </div>
        <Select
          value={occupancyFilter}
          onChange={setOccupancyFilter}
          options={[
            { label: "All Rooms",        value: "all" },
            { label: "Available Rooms",  value: "available" },
            { label: "Full Rooms",       value: "full" },
          ]}
          style={{ width: 180 }}
          size="middle"
        />
        {searchTerm && (
          <span style={{
            padding: "4px 12px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight,
            fontSize: 12, fontWeight: 600,
          }}>
            {filteredRooms.length} result{filteredRooms.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Hostel Rooms</span>
          <span style={{
            fontSize: 12, padding: "2px 9px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight, fontWeight: 600,
          }}>
            {filteredRooms.length}
          </span>
        </div>
        <Table
          className="hostel-tbl"
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (t) => `${t} rooms` }}
          rowKey="_id"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No rooms found. Click 'Add Room' to get started." }}
        />
      </div>

      {/* Add / Edit Room Modal */}
      <Modal
        title={
          <Space>
            <HomeOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700 }}>
              {editingRoom ? "Edit Room" : "Add Room"}
            </span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeRoomModal}
        footer={[
          <Button key="cancel" onClick={closeRoomModal}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>
            Cancel
          </Button>,
          <Button key="save" onClick={() => form.submit()} loading={actionLoading}
            style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, color: "#fff", fontWeight: 600 }}>
            {editingRoom ? "Update" : "Add Room"}
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRoom} style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              label="Room Number"
              name="roomNumber"
              rules={[{ required: true, message: "Enter room number" }]}
            >
              <Input
                placeholder="e.g. H-101"
                prefix={<HomeOutlined style={{ color: C.textMuted, fontSize: 12 }} />}
              />
            </Form.Item>
            <Form.Item
              label="Capacity (beds)"
              name="capacity"
              rules={[{ required: true, message: "Enter capacity" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 4" addonAfter="beds" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Assign Student Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: C.accent }} />
            <span style={{ fontWeight: 700 }}>
              Assign Student
              {selectedRoom && (
                <span style={{
                  marginLeft: 8, fontSize: 13,
                  padding: "2px 10px", borderRadius: 20,
                  background: C.primaryLighter, color: C.primary,
                  border: "1px solid " + C.primaryLight,
                }}>
                  Room {selectedRoom.roomNumber}
                </span>
              )}
            </span>
          </Space>
        }
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); setSelectedRoom(null); assignForm.resetFields(); }}
        footer={[
          <Button key="cancel"
            onClick={() => { setAssignModalOpen(false); setSelectedRoom(null); assignForm.resetFields(); }}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>
            Cancel
          </Button>,
          <Button key="assign" onClick={() => assignForm.submit()} loading={actionLoading}
            style={{ borderRadius: 8, background: C.accent, borderColor: C.accent, color: "#fff", fontWeight: 600 }}>
            Assign
          </Button>,
        ]}
        destroyOnClose
      >
        {selectedRoom && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: C.primaryLighter, border: "1px solid " + C.primaryLight,
            display: "flex", gap: 14,
          }}>
            <div>
              <div style={{ fontSize: 12, color: C.textSub }}>Available beds</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>
                {Math.max(Number(selectedRoom.capacity || 0) - (selectedRoom.students?.length || 0), 0)}
                <span style={{ fontSize: 12, fontWeight: 500, color: C.textSub }}> / {selectedRoom.capacity}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSub }}>Currently assigned</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
                {selectedRoom.students?.length || 0}
              </div>
            </div>
          </div>
        )}
        <Form form={assignForm} layout="vertical" onFinish={handleAssignStudent} style={{ marginTop: 4 }}>
          <Form.Item
            label="Select Student"
            name="studentId"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search student…"
              options={studentOptions}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HostelManagement;

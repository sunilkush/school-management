import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Form, Modal, Select, Space, Table, Tag, message } from "antd";
import {
  UserAddOutlined, UserDeleteOutlined, ReloadOutlined,
  TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, HomeOutlined,
} from "@ant-design/icons";
import { assignHostelStudent, fetchHostelRooms, unassignHostelStudent } from "../../../features/hostelSlice";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../../styles/pageStyles";

// Shared design tokens (frontend/src/index.css) — replaces a local hardcoded
// hex palette that never adapted to dark mode.
const C = {
  primary: "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  accent: "var(--accent)",
  warning: "var(--warning)", warningLight: "var(--warning-light)",
  success: "var(--success)", successLight: "var(--success-light)",
  danger: "var(--danger)", dangerLight: "var(--danger-light)",
  border: "var(--border)", text: "var(--text)", textSub: "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface: "var(--surface)",
};

const studentName = (s) => s?.user?.name || s?.name || s?.fullName || "Unnamed Student";
const studentEmail = (s) => s?.user?.email || s?.email || "";

/**
 * Student-centric counterpart to HostelManagement.jsx (which is room-centric — a room and its
 * occupants). This page instead lists every student and whether they have a hostel room, which
 * HostelManagement's per-room table doesn't surface (an unallocated student is invisible there
 * unless you scan every room). Room.students entries carry a real studentId (User ref) once
 * assigned through either page, so allocation is resolved by id match, falling back to a name
 * match only for legacy entries assigned before that link existed.
 */
const HostelAllocations = () => {
  const dispatch = useDispatch();
  const { rooms = [], loading, actionLoading } = useSelector((s) => s.hostel);
  const { schoolStudents = [] } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || activeYear?._id;
  const userRole = user?.role?.name;
  const canManage = ["Super Admin", "School Admin", "Admin", "Principal", "Vice Principal", "Hostel Warden"].includes(userRole);

  const [assignTarget, setAssignTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignForm] = Form.useForm();

  useEffect(() => { dispatch(fetchHostelRooms()); }, [dispatch]);
  useEffect(() => {
    // This page's whole purpose is spotting students with no room, so — unlike the paginated
    // StudentList.jsx — it genuinely needs the full roster in memory at once, not a page at a
    // time. Still passes an explicit, documented cap instead of silently relying on the
    // backend's 500-record default; the Table below already paginates for display.
    if (schoolId) dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, limit: 2000 }));
  }, [dispatch, schoolId, academicYearId]);

  // For every student, find which room (if any) lists them — matched by the real User id when
  // the room entry has one (assignments made after HostelRoom.students gained a studentId link),
  // falling back to a name match for older assignments that only ever stored a name snapshot.
  // Either way we keep the matching entry's own subdocument _id, which is what
  // DELETE /rooms/:id/students/:id actually keys off (not the student's real User._id).
  const allocationRows = useMemo(() => {
    return (schoolStudents || []).map((s) => {
      const userId = s?.user?._id ? String(s.user._id) : null;
      const name = studentName(s).toLowerCase();
      let match = null;
      for (const room of rooms) {
        const found = (room.students || []).find((rs) =>
          userId && rs.studentId ? String(rs.studentId) === userId : (rs.name || "").toLowerCase() === name
        );
        if (found) { match = { room, entry: found }; break; }
      }
      return {
        key: s._id,
        student: s,
        room: match?.room || null,
        entryId: match?.entry?._id || null,
      };
    });
  }, [schoolStudents, rooms]);

  const stats = useMemo(() => {
    const total = allocationRows.length;
    const allocated = allocationRows.filter((r) => r.room).length;
    return { total, allocated, unallocated: total - allocated };
  }, [allocationRows]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "allocated") return allocationRows.filter((r) => r.room);
    if (statusFilter === "unallocated") return allocationRows.filter((r) => !r.room);
    return allocationRows;
  }, [allocationRows, statusFilter]);

  const availableRooms = useMemo(
    () => rooms.filter((r) => (r.students?.length || 0) < Number(r.capacity || 0)),
    [rooms]
  );

  const openAssignModal = (row) => {
    setAssignTarget(row);
    assignForm.resetFields();
  };

  const handleAssign = async (values) => {
    if (!assignTarget) return;
    try {
      await dispatch(assignHostelStudent({
        id: values.roomId,
        studentId: assignTarget.student?.user?._id || assignTarget.student._id,
        studentName: studentName(assignTarget.student),
      })).unwrap();
      message.success("Student allocated to room");
      setAssignTarget(null);
      assignForm.resetFields();
    } catch (err) {
      message.error(err || "Unable to allocate student");
    }
  };

  const handleUnassign = (row) =>
    Modal.confirm({
      title: `Remove ${studentName(row.student)} from Room ${row.room.roomNumber}?`,
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(unassignHostelStudent({ roomId: row.room._id, studentId: row.entryId })).unwrap();
          message.success("Allocation removed");
        } catch (err) { message.error(err || "Unable to remove allocation"); }
      },
    });

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{studentName(r.student)}</div>
          {studentEmail(r.student) && (
            <div style={{ fontSize: 12, color: C.textMuted }}>{studentEmail(r.student)}</div>
          )}
        </div>
      ),
    },
    {
      title: "Class",
      key: "class",
      width: 160,
      render: (_, r) => {
        const cls = r.student?.schoolClass?.name;
        const sec = r.student?.section?.name;
        return cls ? <span style={{ fontSize: 13, color: C.textSub }}>{cls}{sec ? ` - ${sec}` : ""}</span> : <span style={{ color: C.textMuted }}>—</span>;
      },
    },
    {
      title: "Room",
      key: "room",
      width: 160,
      render: (_, r) =>
        r.room ? (
          <Tag color="blue" style={{ borderRadius: 20, fontWeight: 600 }}>
            <HomeOutlined style={{ marginRight: 4 }} />{r.room.roomNumber}
          </Tag>
        ) : (
          <Tag style={{ borderRadius: 20, background: C.warningLight, color: "var(--warning-hover)", border: "1px solid var(--warning-light)" }}>
            Not Assigned
          </Tag>
        ),
    },
    {
      title: "Actions",
      width: 160,
      render: (_, r) =>
        r.room ? (
          <Button
            size="small"
            danger
            icon={<UserDeleteOutlined />}
            disabled={!canManage}
            onClick={() => handleUnassign(r)}
            style={{ borderRadius: 7 }}
          >
            Remove
          </Button>
        ) : (
          <Button
            size="small"
            icon={<UserAddOutlined />}
            disabled={!canManage || availableRooms.length === 0}
            onClick={() => openAssignModal(r)}
            style={{ borderRadius: 7, background: C.primary, borderColor: C.primary, color: "#fff" }}
          >
            Allocate
          </Button>
        ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("allocations-tbl")}</style>

      <PageHeader
        title="Hostel Allocations"
        subtitle="See which students have a hostel room and allocate the rest"
        icon={<TeamOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchHostelRooms())}
            loading={loading}
            style={{ borderRadius: 9, borderColor: C.border, color: C.textSub }}
          >
            Refresh
          </Button>
        }
      />

      <div style={{ ...statGrid(160), margin: "20px 0 20px" }}>
        {[
          // Raw hex here (not C.primary/etc): feeds the shared iconWell() helper
          // (frontend/src/styles/pageStyles.js), which builds its background as
          // `${color}22` — breaks with a var() string.
          { icon: <TeamOutlined />, label: "Total Students", value: stats.total, color: "#2563EB" },
          { icon: <CheckCircleOutlined />, label: "Allocated", value: stats.allocated, color: "#22C55E" },
          { icon: <ClockCircleOutlined />, label: "Unallocated", value: stats.unallocated, color: "#F59E0B" },
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
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All Students", value: "all" },
            { label: "Allocated", value: "allocated" },
            { label: "Unallocated", value: "unallocated" },
          ]}
          style={{ width: 180 }}
        />
      </div>

      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <Table
          className="allocations-tbl"
          columns={columns}
          dataSource={filteredRows}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} students` }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No students found for this school." }}
        />
      </div>

      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: C.accent }} />
            <span style={{ fontWeight: 700 }}>
              Allocate {assignTarget ? studentName(assignTarget.student) : "Student"}
            </span>
          </Space>
        }
        open={Boolean(assignTarget)}
        onCancel={() => { setAssignTarget(null); assignForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setAssignTarget(null); assignForm.resetFields(); }} style={{ borderRadius: 8 }}>
            Cancel
          </Button>,
          <Button
            key="assign" onClick={() => assignForm.submit()} loading={actionLoading}
            style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, color: "#fff", fontWeight: 600 }}
          >
            Allocate
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item label="Room" name="roomId" rules={[{ required: true, message: "Select a room" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select a room with available beds"
              options={availableRooms.map((r) => ({
                value: r._id,
                label: `${r.roomNumber} (${(r.students?.length || 0)}/${r.capacity} beds)`,
              }))}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HostelAllocations;

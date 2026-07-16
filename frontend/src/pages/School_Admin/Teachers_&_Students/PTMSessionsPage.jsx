import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Checkbox, Col, DatePicker, Empty, Flex, Input,
  InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, TimePicker, Tooltip, Typography, message,
} from "antd";
import { CalendarOutlined, CheckOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import {
  createSession, getSessions, getSessionSlots, cancelSession, markAttendance,
} from "../../../features/ptmSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const SLOT_STATUS_COLOR = { Available: "default", Booked: "processing", Completed: "success", Cancelled: "error" };
const fmtTime = (v) => (v ? dayjs(v).format("hh:mm A") : "—");

export default function PTMSessionsPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { sessions = [], currentSession, sessionSlots = [], loading = false } = useSelector((s) => s.ptm || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Picker + create form ───────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dayjs().add(7, "day"));
  const [startTime, setStartTime] = useState(dayjs().hour(9).minute(0));
  const [endTime, setEndTime] = useState(dayjs().hour(13).minute(0));
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(10);
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);

  /* ── Slot grid modal ────────────────────────────────────── */
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [attended, setAttended] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(getClassData({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

  const refreshSessions = () => {
    dispatch(getSessions({ schoolClassId: selectedClass || undefined, sectionId: selectedSection || undefined }));
  };

  useEffect(() => {
    refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (viewingSessionId) dispatch(getSessionSlots(viewingSessionId));
  }, [viewingSessionId, dispatch]);

  const sectionOptions = useMemo(
    () => (allSections || []).map((s) => ({ value: s._id, label: s.name })),
    [allSections]
  );

  const handleCreateSession = async () => {
    if (!selectedClass || !selectedSection) return message.warning("Please select a class and section first.");
    if (!title.trim()) return message.warning("Please enter a session title.");

    const combinedStart = date.hour(startTime.hour()).minute(startTime.minute()).second(0);
    const combinedEnd = date.hour(endTime.hour()).minute(endTime.minute()).second(0);
    if (!combinedStart.isBefore(combinedEnd)) return message.warning("Start time must be before end time.");

    setCreating(true);
    const res = await dispatch(createSession({
      title, schoolClassId: selectedClass, sectionId: selectedSection,
      date: date.toISOString(), startTime: combinedStart.toISOString(), endTime: combinedEnd.toISOString(),
      slotDurationMinutes, location,
    }));
    setCreating(false);

    if (createSession.fulfilled.match(res)) {
      message.success(`Session created with ${res.payload.slots.length} slots`);
      setTitle("");
      setLocation("");
      refreshSessions();
    } else {
      message.error(res.payload || "Failed to create session");
    }
  };

  const handleCancelSession = async (id) => {
    const res = await dispatch(cancelSession(id));
    if (cancelSession.fulfilled.match(res)) message.success("Session cancelled");
    else message.error(res.payload || "Failed to cancel session");
  };

  const openAttendanceModal = (slot) => {
    setAttendanceTarget(slot);
    setAttended(true);
    setNotes("");
  };

  const confirmAttendance = async () => {
    setSavingAttendance(true);
    const res = await dispatch(markAttendance({ id: attendanceTarget._id, attended, notes }));
    setSavingAttendance(false);
    if (markAttendance.fulfilled.match(res)) {
      message.success("Attendance marked");
      setAttendanceTarget(null);
    } else {
      message.error(res.payload || "Failed to mark attendance");
    }
  };

  const sessionColumns = [
    { title: "Title", dataIndex: "title" },
    { title: "Class / Section", key: "class", render: (_, row) => [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(" - ") || "—" },
    { title: "Date", dataIndex: "date", render: (v) => dayjs(v).format("DD MMM YYYY") },
    { title: "Time", key: "time", render: (_, row) => `${fmtTime(row.startTime)} – ${fmtTime(row.endTime)}` },
    { title: "Location", dataIndex: "location", render: (v) => v || "—" },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "Scheduled" ? "processing" : v === "Completed" ? "success" : "error"}>{v}</Tag> },
    {
      title: "Actions", key: "actions", width: 150,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" onClick={() => setViewingSessionId(row._id)}>View Slots</Button>
          {row.status === "Scheduled" && (
            <Popconfirm title="Cancel this session?" onConfirm={() => handleCancelSession(row._id)}>
              <Button size="small" danger>Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const slotColumns = [
    { title: "Time", key: "time", render: (_, row) => `${fmtTime(row.startTime)} – ${fmtTime(row.endTime)}` },
    { title: "Student", dataIndex: "studentName", render: (v) => v || "—" },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={SLOT_STATUS_COLOR[v]}>{v}</Tag> },
    { title: "Attended", dataIndex: "attended", render: (v, row) => (row.status === "Completed" ? (v ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>) : "—") },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_, row) => (
        row.status === "Booked" ? (
          <Button size="small" icon={<CheckOutlined />} onClick={() => openAttendanceModal(row)}>Mark</Button>
        ) : "—"
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("ptm-tbl")}</style>

      <PageHeader
        title="Parent-Teacher Meetings"
        subtitle="Publish PTM slots for a class/section and manage bookings"
        icon={<CalendarOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert type="warning" showIcon message="Please select an active academic year to schedule PTM sessions." style={{ borderRadius: 12, marginBottom: 16 }} />
        )}

        {/* ── Create Session panel ─────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("#2563EB", 38)}><CalendarOutlined style={{ fontSize: 17 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Create PTM Session</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Bookable slots are auto-generated across the time window</Text>
            </div>
          </Flex>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="Select Class" style={{ width: "100%" }} value={selectedClass} onChange={setSelectedClass}
                options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))}
                showSearch optionFilterProp="label" disabled={!canFilter} size="large" />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="Select Section" style={{ width: "100%" }} value={selectedSection} onChange={setSelectedSection}
                options={sectionOptions} showSearch optionFilterProp="label" disabled={!selectedClass} size="large" />
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Input placeholder="Session Title (e.g. Quarterly PTM)" value={title} onChange={(e) => setTitle(e.target.value)} size="large" />
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col xs={24} sm={12} md={6}>
              <DatePicker style={{ width: "100%" }} value={date} onChange={setDate} size="large" />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <TimePicker style={{ width: "100%" }} format="hh:mm A" value={startTime} onChange={setStartTime} size="large" />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <TimePicker style={{ width: "100%" }} format="hh:mm A" value={endTime} onChange={setEndTime} size="large" />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <InputNumber style={{ width: "100%" }} min={5} addonAfter="min" value={slotDurationMinutes} onChange={setSlotDurationMinutes} size="large" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <Input placeholder="Location / Link" value={location} onChange={(e) => setLocation(e.target.value)} size="large" />
            </Col>
          </Row>

          <Row style={{ marginTop: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={handleCreateSession} size="large">
              Create Session
            </Button>
          </Row>
        </div>

        {/* ── Session list ──────────────────────────────────────── */}
        <div style={sectionPanel}>
          <Text strong style={{ fontSize: 14, marginBottom: 14, display: "block" }}>Sessions</Text>
          <Table
            className="ptm-tbl" rowKey="_id" columns={sessionColumns} dataSource={sessions} loading={loading}
            size="middle" scroll={{ x: 800 }} pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="No PTM sessions yet" style={{ padding: "40px 0" }} /> }}
          />
        </div>
      </div>

      {/* ── Slot Grid Modal ────────────────────────────────────── */}
      <Modal
        open={!!viewingSessionId}
        onCancel={() => setViewingSessionId(null)}
        footer={<Button onClick={() => setViewingSessionId(null)}>Close</Button>}
        width={720}
        title={currentSession ? `${currentSession.title} — Slots` : "Slots"}
      >
        <Table
          className="ptm-tbl" rowKey="_id" columns={slotColumns} dataSource={sessionSlots}
          size="small" pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No slots" style={{ padding: "20px 0" }} /> }}
        />
      </Modal>

      {/* ── Mark Attendance Modal ──────────────────────────────── */}
      <Modal
        open={!!attendanceTarget}
        onCancel={() => setAttendanceTarget(null)}
        onOk={confirmAttendance}
        confirmLoading={savingAttendance}
        okText="Save"
        title={attendanceTarget ? `Mark Attendance — ${attendanceTarget.studentName}` : ""}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Paragraph style={{ fontSize: 13, marginBottom: 0 }}>
            {attendanceTarget && `${fmtTime(attendanceTarget.startTime)} – ${fmtTime(attendanceTarget.endTime)}`}
          </Paragraph>
          <Checkbox checked={attended} onChange={(e) => setAttended(e.target.checked)}>Parent attended</Checkbox>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>MEETING NOTES</Text>
            <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Discussion points, follow-up actions..." />
          </div>
        </Space>
      </Modal>
    </>
  );
}

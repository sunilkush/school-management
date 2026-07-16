import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, DatePicker, Empty, Flex, Input, Modal,
  Popconfirm, Row, Segmented, Select, Space, Tabs, Table, Tag, Typography, message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, TrophyOutlined, UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../features/schoolClassSlice";
import { fetchSections } from "../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../features/studentSlice";
import { getEmployees } from "../../features/employeeSlice";
import {
  createTeam, getTeams, deleteTeam, addTeamMember, removeTeamMember,
  createEvent, getEvents, updateEvent,
  createAchievement, getAchievements, deleteAchievement,
} from "../../features/sportsSlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../styles/pageStyles.js";

const { Text } = Typography;
const { TextArea } = Input;

const CATEGORIES = ["Sport", "Cultural", "Club", "Other"];
const EVENT_TYPES = ["Match", "Tournament", "Competition", "Practice"];
const RESULTS = ["Win", "Loss", "Draw", "Pending"];
const LEVELS = ["School", "District", "State", "National", "International"];
const RESULT_COLOR = { Win: "success", Loss: "error", Draw: "warning", Pending: "default" };
const fmtDate = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function SportsPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const { employees = [] } = useSelector((s) => s.employee || {});
  const { teams = [], events = [], achievements = [], loading = false } = useSelector((s) => s.sports || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Shared class/section/student picker (for roster + achievements) ── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [pickerStudentId, setPickerStudentId] = useState(null);

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(getClassData({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass && selectedSection) {
      dispatch(fetchClassRollNumbers({ schoolId, academicYearId, schoolClassId: selectedClass, sectionId: selectedSection }));
    }
  }, [schoolId, academicYearId, selectedClass, selectedSection, dispatch]);

  useEffect(() => {
    dispatch(getEmployees({ isActive: true }));
    dispatch(getTeams());
    dispatch(getEvents());
    dispatch(getAchievements());
  }, [dispatch]);

  const sectionOptions = useMemo(() => (allSections || []).map((s) => ({ value: s._id, label: s.name })), [allSections]);
  const studentOptions = useMemo(
    () => (rollNumberList || []).map((s) => ({ value: s.studentId, label: `${s.studentName || "—"} (Roll ${s.rollNumber ?? "—"})` })),
    [rollNumberList]
  );
  const coachOptions = useMemo(
    () => employees.map((e) => ({ value: e.userId?._id, label: e.userId?.name || "—" })),
    [employees]
  );
  const teamOptions = useMemo(() => teams.map((t) => ({ value: t._id, label: t.name })), [teams]);

  /* ══════════════════════ Teams ══════════════════════ */
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", category: "Sport", sportType: "", coachId: null });
  const [savingTeam, setSavingTeam] = useState(false);
  const [rosterTeam, setRosterTeam] = useState(null);

  const openTeamModal = () => {
    setTeamForm({ name: "", category: "Sport", sportType: "", coachId: null });
    setTeamModalOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) return message.warning("Team name is required");
    setSavingTeam(true);
    const res = await dispatch(createTeam(teamForm));
    setSavingTeam(false);
    if (createTeam.fulfilled.match(res)) {
      message.success("Team created");
      setTeamModalOpen(false);
    } else {
      message.error(res.payload || "Failed to create team");
    }
  };

  const handleDeleteTeam = async (id) => {
    const res = await dispatch(deleteTeam(id));
    if (deleteTeam.fulfilled.match(res)) message.success("Team deleted");
    else message.error(res.payload || "Failed to delete team");
  };

  const handleAddMember = async () => {
    if (!pickerStudentId) return message.warning("Select a student to add");
    const res = await dispatch(addTeamMember({ id: rosterTeam._id, studentId: pickerStudentId }));
    if (addTeamMember.fulfilled.match(res)) {
      message.success("Member added");
      setRosterTeam(res.payload);
      setPickerStudentId(null);
    } else {
      message.error(res.payload || "Failed to add member");
    }
  };

  const handleRemoveMember = async (studentId) => {
    const res = await dispatch(removeTeamMember({ id: rosterTeam._id, studentId }));
    if (removeTeamMember.fulfilled.match(res)) {
      message.success("Member removed");
      setRosterTeam(res.payload);
    } else {
      message.error(res.payload || "Failed to remove member");
    }
  };

  const teamColumns = [
    { title: "Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category", width: 100 },
    { title: "Sport/Activity", dataIndex: "sportType", render: (v) => v || "—" },
    { title: "Coach", dataIndex: ["coachId", "name"], render: (v) => v || "—" },
    { title: "Members", key: "members", width: 90, render: (_, row) => row.members?.length || 0 },
    {
      title: "Actions", key: "actions", width: 140,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" onClick={() => setRosterTeam(row)}>Roster</Button>
          <Popconfirm title="Delete this team?" onConfirm={() => handleDeleteTeam(row._id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const teamsTab = (
    <div style={sectionPanel}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Text strong style={{ fontSize: 14 }}>Teams / Clubs</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openTeamModal}>Create Team</Button>
      </Flex>
      <Table
        className="sports-tbl" rowKey="_id" columns={teamColumns} dataSource={teams} loading={loading}
        size="middle" pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No teams yet" style={{ padding: "40px 0" }} /> }}
      />
    </div>
  );

  /* ══════════════════════ Events ══════════════════════ */
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: "", teamId: null, eventType: "Match", opponent: "", eventDate: dayjs(), venue: "", result: "Pending", scoreDetails: "", notes: "",
  });
  const [savingEvent, setSavingEvent] = useState(false);

  const openEventModal = (event = null) => {
    setEditingEvent(event);
    setEventForm(event
      ? { title: event.title, teamId: event.teamId?._id || event.teamId, eventType: event.eventType, opponent: event.opponent, eventDate: dayjs(event.eventDate), venue: event.venue, result: event.result, scoreDetails: event.scoreDetails, notes: event.notes }
      : { title: "", teamId: null, eventType: "Match", opponent: "", eventDate: dayjs(), venue: "", result: "Pending", scoreDetails: "", notes: "" });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) return message.warning("Event title is required");
    setSavingEvent(true);
    const payload = { ...eventForm, eventDate: eventForm.eventDate.toISOString() };
    const res = editingEvent
      ? await dispatch(updateEvent({ id: editingEvent._id, payload }))
      : await dispatch(createEvent(payload));
    setSavingEvent(false);
    const action = editingEvent ? updateEvent : createEvent;
    if (action.fulfilled.match(res)) {
      message.success(`Event ${editingEvent ? "updated" : "created"}`);
      setEventModalOpen(false);
    } else {
      message.error(res.payload || "Failed to save event");
    }
  };

  const eventColumns = [
    { title: "Title", dataIndex: "title" },
    { title: "Team", dataIndex: ["teamId", "name"], render: (v) => v || "—" },
    { title: "Type", dataIndex: "eventType", width: 110 },
    { title: "Opponent", dataIndex: "opponent", render: (v) => v || "—" },
    { title: "Date", dataIndex: "eventDate", render: (v) => fmtDate(v) },
    { title: "Result", dataIndex: "result", render: (v) => <Tag color={RESULT_COLOR[v]}>{v}</Tag> },
    { title: "Actions", key: "actions", width: 80, render: (_, row) => <Button size="small" icon={<EditOutlined />} onClick={() => openEventModal(row)} /> },
  ];

  const eventsTab = (
    <div style={sectionPanel}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Text strong style={{ fontSize: 14 }}>Matches / Events</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEventModal()}>Log Event</Button>
      </Flex>
      <Table
        className="sports-tbl" rowKey="_id" columns={eventColumns} dataSource={events} loading={loading}
        size="middle" scroll={{ x: 800 }} pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No events logged yet" style={{ padding: "40px 0" }} /> }}
      />
    </div>
  );

  /* ══════════════════════ Achievements ══════════════════════ */
  const [achModalOpen, setAchModalOpen] = useState(false);
  const [achHolderType, setAchHolderType] = useState("Student");
  const [achForm, setAchForm] = useState({
    studentId: null, teamId: null, title: "", level: "School", position: "", eventName: "", achievementDate: dayjs(), description: "",
  });
  const [savingAch, setSavingAch] = useState(false);

  const openAchModal = () => {
    setAchHolderType("Student");
    setAchForm({ studentId: null, teamId: null, title: "", level: "School", position: "", eventName: "", achievementDate: dayjs(), description: "" });
    setAchModalOpen(true);
  };

  const handleSaveAchievement = async () => {
    if (!achForm.title.trim()) return message.warning("Achievement title is required");
    if (achHolderType === "Student" && !achForm.studentId) return message.warning("Select a student");
    if (achHolderType === "Team" && !achForm.teamId) return message.warning("Select a team");

    setSavingAch(true);
    const res = await dispatch(createAchievement({
      ...achForm, holderType: achHolderType, achievementDate: achForm.achievementDate.toISOString(),
    }));
    setSavingAch(false);
    if (createAchievement.fulfilled.match(res)) {
      message.success("Achievement recorded");
      setAchModalOpen(false);
    } else {
      message.error(res.payload || "Failed to record achievement");
    }
  };

  const handleDeleteAchievement = async (id) => {
    const res = await dispatch(deleteAchievement(id));
    if (deleteAchievement.fulfilled.match(res)) message.success("Achievement deleted");
    else message.error(res.payload || "Failed to delete achievement");
  };

  const achColumns = [
    { title: "Holder", dataIndex: "holderName" },
    { title: "Type", dataIndex: "holderType", width: 90 },
    { title: "Title", dataIndex: "title" },
    { title: "Level", dataIndex: "level", width: 110, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Position", dataIndex: "position", render: (v) => v || "—" },
    { title: "Date", dataIndex: "achievementDate", render: (v) => fmtDate(v) },
    { title: "Actions", key: "actions", width: 70, render: (_, row) => (
      <Popconfirm title="Delete this achievement?" onConfirm={() => handleDeleteAchievement(row._id)}>
        <Button size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    ) },
  ];

  const achievementsTab = (
    <div style={sectionPanel}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Text strong style={{ fontSize: 14 }}>Achievements</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAchModal}>Record Achievement</Button>
      </Flex>
      <Table
        className="sports-tbl" rowKey="_id" columns={achColumns} dataSource={achievements} loading={loading}
        size="middle" scroll={{ x: 800 }} pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No achievements recorded yet" style={{ padding: "40px 0" }} /> }}
      />
    </div>
  );

  return (
    <>
      <style>{tableHeadCss("sports-tbl")}</style>

      <PageHeader
        title="Sports & Co-curricular"
        subtitle="Manage teams, log events, and track achievements"
        icon={<TrophyOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert type="warning" showIcon message="Please select an active academic year to use this module." style={{ borderRadius: 12, marginBottom: 16 }} />
        )}

        <Tabs
          defaultActiveKey="teams"
          items={[
            { key: "teams", label: "Teams", children: teamsTab },
            { key: "events", label: "Events", children: eventsTab },
            { key: "achievements", label: "Achievements", children: achievementsTab },
          ]}
        />
      </div>

      {/* ── Create Team Modal ─────────────────────────────────── */}
      <Modal open={teamModalOpen} onCancel={() => setTeamModalOpen(false)} onOk={handleSaveTeam} confirmLoading={savingTeam} okText="Create" title="Create Team">
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TEAM NAME</Text>
            <Input value={teamForm.name} onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. U-16 Football Team" />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>CATEGORY</Text>
              <Select style={{ width: "100%" }} value={teamForm.category} onChange={(v) => setTeamForm((f) => ({ ...f, category: v }))} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>SPORT / ACTIVITY</Text>
              <Input value={teamForm.sportType} onChange={(e) => setTeamForm((f) => ({ ...f, sportType: e.target.value }))} placeholder="e.g. Football" />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>COACH</Text>
            <Select style={{ width: "100%" }} value={teamForm.coachId} onChange={(v) => setTeamForm((f) => ({ ...f, coachId: v }))} options={coachOptions} showSearch optionFilterProp="label" allowClear />
          </div>
        </Space>
      </Modal>

      {/* ── Roster Modal ──────────────────────────────────────── */}
      <Modal open={!!rosterTeam} onCancel={() => setRosterTeam(null)} footer={<Button onClick={() => setRosterTeam(null)}>Close</Button>} width={640} title={rosterTeam ? `${rosterTeam.name} — Roster` : ""}>
        {rosterTeam && (
          <>
            <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
              <div style={iconWell("#2563EB", 34)}><UserOutlined /></div>
              <Text strong style={{ fontSize: 13 }}>Add Member</Text>
            </Flex>
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={7}>
                <Select placeholder="Class" style={{ width: "100%" }} value={selectedClass} onChange={setSelectedClass}
                  options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))} showSearch optionFilterProp="label" />
              </Col>
              <Col xs={24} sm={7}>
                <Select placeholder="Section" style={{ width: "100%" }} value={selectedSection} onChange={setSelectedSection}
                  options={sectionOptions} showSearch optionFilterProp="label" disabled={!selectedClass} />
              </Col>
              <Col xs={16} sm={7}>
                <Select placeholder="Student" style={{ width: "100%" }} value={pickerStudentId} onChange={setPickerStudentId}
                  options={studentOptions} showSearch optionFilterProp="label" disabled={!selectedSection} loading={rollLoading} />
              </Col>
              <Col xs={8} sm={3}>
                <Button type="primary" block onClick={handleAddMember}>Add</Button>
              </Col>
            </Row>

            <Table
              rowKey="studentId" size="small" pagination={false}
              dataSource={rosterTeam.members || []}
              columns={[
                { title: "Student", dataIndex: "studentName" },
                { title: "Position", dataIndex: "position", render: (v) => v || "—" },
                { title: "", key: "actions", width: 40, render: (_, row) => <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveMember(row.studentId)} /> },
              ]}
              locale={{ emptyText: <Empty description="No members yet" style={{ padding: "16px 0" }} /> }}
            />
          </>
        )}
      </Modal>

      {/* ── Event Modal ───────────────────────────────────────── */}
      <Modal open={eventModalOpen} onCancel={() => setEventModalOpen(false)} onOk={handleSaveEvent} confirmLoading={savingEvent} okText="Save" title={editingEvent ? "Edit Event" : "Log New Event"}>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TITLE</Text>
            <Input value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TEAM</Text>
              <Select style={{ width: "100%" }} value={eventForm.teamId} onChange={(v) => setEventForm((f) => ({ ...f, teamId: v }))} options={teamOptions} allowClear showSearch optionFilterProp="label" />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TYPE</Text>
              <Select style={{ width: "100%" }} value={eventForm.eventType} onChange={(v) => setEventForm((f) => ({ ...f, eventType: v }))} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>OPPONENT</Text>
              <Input value={eventForm.opponent} onChange={(e) => setEventForm((f) => ({ ...f, opponent: e.target.value }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>DATE</Text>
              <DatePicker style={{ width: "100%" }} value={eventForm.eventDate} onChange={(d) => setEventForm((f) => ({ ...f, eventDate: d }))} />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>VENUE</Text>
            <Input value={eventForm.venue} onChange={(e) => setEventForm((f) => ({ ...f, venue: e.target.value }))} />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>RESULT</Text>
              <Select style={{ width: "100%" }} value={eventForm.result} onChange={(v) => setEventForm((f) => ({ ...f, result: v }))} options={RESULTS.map((r) => ({ value: r, label: r }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>SCORE</Text>
              <Input value={eventForm.scoreDetails} onChange={(e) => setEventForm((f) => ({ ...f, scoreDetails: e.target.value }))} placeholder="e.g. 3-1" />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>NOTES</Text>
            <TextArea rows={2} value={eventForm.notes} onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </Space>
      </Modal>

      {/* ── Achievement Modal ─────────────────────────────────── */}
      <Modal open={achModalOpen} onCancel={() => setAchModalOpen(false)} onOk={handleSaveAchievement} confirmLoading={savingAch} okText="Record" title="Record Achievement">
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Segmented value={achHolderType} onChange={setAchHolderType} options={[{ label: "Student", value: "Student" }, { label: "Team", value: "Team" }]} />

          {achHolderType === "Student" ? (
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Select placeholder="Class" style={{ width: "100%" }} value={selectedClass} onChange={setSelectedClass}
                  options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))} showSearch optionFilterProp="label" />
              </Col>
              <Col span={8}>
                <Select placeholder="Section" style={{ width: "100%" }} value={selectedSection} onChange={setSelectedSection}
                  options={sectionOptions} showSearch optionFilterProp="label" disabled={!selectedClass} />
              </Col>
              <Col span={8}>
                <Select placeholder="Student" style={{ width: "100%" }} value={achForm.studentId} onChange={(v) => setAchForm((f) => ({ ...f, studentId: v }))}
                  options={studentOptions} showSearch optionFilterProp="label" disabled={!selectedSection} loading={rollLoading} />
              </Col>
            </Row>
          ) : (
            <Select placeholder="Select Team" style={{ width: "100%" }} value={achForm.teamId} onChange={(v) => setAchForm((f) => ({ ...f, teamId: v }))} options={teamOptions} showSearch optionFilterProp="label" />
          )}

          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TITLE</Text>
            <Input value={achForm.title} onChange={(e) => setAchForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. State Level Chess Championship" />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>LEVEL</Text>
              <Select style={{ width: "100%" }} value={achForm.level} onChange={(v) => setAchForm((f) => ({ ...f, level: v }))} options={LEVELS.map((l) => ({ value: l, label: l }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>POSITION</Text>
              <Input value={achForm.position} onChange={(e) => setAchForm((f) => ({ ...f, position: e.target.value }))} placeholder="e.g. 1st Place" />
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>EVENT NAME</Text>
              <Input value={achForm.eventName} onChange={(e) => setAchForm((f) => ({ ...f, eventName: e.target.value }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>DATE</Text>
              <DatePicker style={{ width: "100%" }} value={achForm.achievementDate} onChange={(d) => setAchForm((f) => ({ ...f, achievementDate: d }))} />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>DESCRIPTION</Text>
            <TextArea rows={2} value={achForm.description} onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </Space>
      </Modal>
    </>
  );
}

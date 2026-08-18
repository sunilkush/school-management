import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Checkbox, Col, DatePicker, Empty, Flex, Input,
  InputNumber, Modal, Row, Select, Space, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  ExclamationCircleOutlined, PlusOutlined, SafetyOutlined, UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../../features/studentSlice";
import {
  createIncident,
  getIncidents,
  updateIncident,
  getStudentSummary,
} from "../../../features/disciplineSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const CATEGORIES = ["Attendance", "Behavior", "Academic Integrity", "Property Damage", "Bullying", "Other"];
const SEVERITY_COLOR = { Minor: "gold", Moderate: "orange", Major: "red" };
const fmtDateTime = (v) => (v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : "—");

export default function DisciplinePage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const {
    incidents = [], loading: incidentsLoading = false, summary,
  } = useSelector((s) => s.discipline || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Picker ─────────────────────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentId, setStudentId] = useState(null);

  /* ── Report incident modal ─────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("Behavior");
  const [severity, setSeverity] = useState("Minor");
  const [description, setDescription] = useState("");
  const [demeritPoints, setDemeritPoints] = useState(0);
  const [actionTaken, setActionTaken] = useState("");
  const [witnesses, setWitnesses] = useState([]);
  const [parentMeetingRequired, setParentMeetingRequired] = useState(false);
  const [parentNotified, setParentNotified] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── Filters ────────────────────────────────────────────── */
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [searchText, setSearchText] = useState("");

  /* ── Edit / resolve modal ───────────────────────────────── */
  const [editingIncident, setEditingIncident] = useState(null);
  const [editStatus, setEditStatus] = useState("Open");
  const [editActionTaken, setEditActionTaken] = useState("");
  const [editResolutionNotes, setEditResolutionNotes] = useState("");
  const [editParentNotified, setEditParentNotified] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  /* ── Load classes / sections / students ───────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId) dispatch(getClassData({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass && selectedSection) {
      dispatch(fetchClassRollNumbers({ schoolId, academicYearId, schoolClassId: selectedClass, sectionId: selectedSection }));
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, selectedSection, dispatch]);

  useEffect(() => {
    if (studentId) {
      dispatch(getStudentSummary(studentId));
      setShowAllStudents(false);
    }
  }, [studentId, dispatch]);

  const sectionOptions = useMemo(
    () => (allSections || []).map((s) => ({ value: s._id, label: s.name })),
    [allSections]
  );
  const studentOptions = useMemo(
    () => (rollNumberList || []).map((s) => ({
      value: s.studentId,
      label: `${s.studentName || "—"} (Roll ${s.rollNumber ?? "—"})`,
    })),
    [rollNumberList]
  );

  /* ── Load incident list ─────────────────────────────────── */
  const refreshIncidents = () => {
    dispatch(getIncidents({
      studentId: !showAllStudents && studentId ? studentId : undefined,
      status: filterStatus || undefined,
      severity: filterSeverity || undefined,
      category: filterCategory || undefined,
      search: searchText || undefined,
      page: 1,
      limit: 50,
    }));
  };

  useEffect(() => {
    if (studentId || showAllStudents) refreshIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, showAllStudents, filterStatus, filterSeverity, filterCategory]);

  /* ── Report incident ────────────────────────────────────── */
  const resetForm = () => {
    setCategory("Behavior"); setSeverity("Minor"); setDescription(""); setDemeritPoints(0);
    setActionTaken(""); setWitnesses([]); setParentMeetingRequired(false); setParentNotified(false);
    setFollowUpDate(null);
  };

  const handleReport = async () => {
    if (!studentId) return message.warning("Please select a student first.");
    if (!description.trim()) return message.warning("Please describe the incident.");

    setSaving(true);
    const res = await dispatch(createIncident({
      studentId, category, severity, description,
      demeritPoints, actionTaken, witnesses,
      parentMeetingRequired, parentNotified,
      followUpDate: followUpDate ? followUpDate.toISOString() : undefined,
    }));
    setSaving(false);

    if (createIncident.fulfilled.match(res)) {
      message.success("Discipline incident recorded");
      setModalOpen(false);
      resetForm();
      refreshIncidents();
      dispatch(getStudentSummary(studentId));
    } else {
      message.error(res.payload || "Failed to record incident");
    }
  };

  /* ── Edit / resolve ─────────────────────────────────────── */
  const openEdit = (incident) => {
    setEditingIncident(incident);
    setEditStatus(incident.status);
    setEditActionTaken(incident.actionTaken || "");
    setEditResolutionNotes(incident.resolutionNotes || "");
    setEditParentNotified(incident.parentNotified);
  };

  const confirmEdit = async () => {
    setSavingEdit(true);
    const res = await dispatch(updateIncident({
      id: editingIncident._id,
      payload: {
        status: editStatus,
        actionTaken: editActionTaken,
        resolutionNotes: editResolutionNotes,
        parentNotified: editParentNotified,
      },
    }));
    setSavingEdit(false);
    if (updateIncident.fulfilled.match(res)) {
      message.success("Incident updated");
      setEditingIncident(null);
      if (studentId) dispatch(getStudentSummary(studentId));
    } else {
      message.error(res.payload || "Failed to update incident");
    }
  };

  const columns = [
    { title: "Date", dataIndex: "incidentDate", width: 150, render: (v) => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
    ...(showAllStudents ? [{
      title: "Student", dataIndex: "studentName",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{[row.className, row.sectionName].filter(Boolean).join(" - ")}</div>
        </div>
      ),
    }] : []),
    { title: "Category", dataIndex: "category", width: 130 },
    { title: "Description", dataIndex: "description", ellipsis: true },
    { title: "Severity", dataIndex: "severity", width: 100, render: (v) => <Tag color={SEVERITY_COLOR[v]}>{v}</Tag> },
    { title: "Demerits", dataIndex: "demeritPoints", width: 90, align: "center" },
    { title: "Status", dataIndex: "status", width: 100, render: (v) => <Tag color={v === "Open" ? "processing" : "success"}>{v}</Tag> },
    {
      title: "Actions", key: "actions", width: 90,
      render: (_, row) => (
        <Tooltip title="View / Update">
          <Button size="small" onClick={() => openEdit(row)}>Edit</Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("discipline-tbl")}</style>

      <PageHeader
        title="Discipline"
        subtitle="Student behavior incidents, demerit tracking, and follow-ups"
        icon={<SafetyOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert
            type="warning" showIcon
            message="Please select an active academic year to manage discipline records."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />
        )}

        {/* ── Student picker ─────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("var(--primary)", 38)}><UserOutlined style={{ fontSize: 17 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Select Student</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>View discipline history and report new incidents</Text>
            </div>
          </Flex>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Select Class" style={{ width: "100%" }}
                value={selectedClass} onChange={setSelectedClass}
                options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))}
                showSearch optionFilterProp="label" disabled={!canFilter} size="large"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Select Section" style={{ width: "100%" }}
                value={selectedSection} onChange={setSelectedSection}
                options={sectionOptions} showSearch optionFilterProp="label"
                disabled={!selectedClass} size="large"
              />
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Select
                placeholder="Select Student" style={{ width: "100%" }}
                value={studentId} onChange={setStudentId}
                options={studentOptions} showSearch optionFilterProp="label"
                disabled={!selectedSection} loading={rollLoading} size="large"
              />
            </Col>
          </Row>
        </div>

        {studentId && summary && (
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {[
              { label: "Total Incidents", value: summary.totalIncidents || 0, color: "var(--primary)" },
              { label: "Total Demerit Points", value: summary.totalDemeritPoints || 0, color: "var(--danger-hover)" },
              { label: "Open Cases", value: summary.openIncidents || 0, color: "var(--warning-hover)" },
            ].map((s) => (
              <Col xs={8} key={s.label}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border-muted)", borderTop: `4px solid ${s.color}`, borderRadius: 14, padding: "14px 18px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* ── Incident Log ─────────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10} style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {showAllStudents || !studentId ? "All Discipline Incidents" : "Incident Log"}
            </Text>
            <Space wrap>
              {studentId && (
                <Button size="small" onClick={() => setShowAllStudents((v) => !v)}>
                  {showAllStudents ? "Show Selected Student Only" : "View All Students"}
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} disabled={!studentId} onClick={() => setModalOpen(true)}>
                Report New Incident
              </Button>
            </Space>
          </Flex>

          <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by Status" allowClear style={{ width: "100%" }}
                value={filterStatus} onChange={setFilterStatus}
                options={[{ value: "Open", label: "Open" }, { value: "Resolved", label: "Resolved" }]}
              />
            </Col>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by Severity" allowClear style={{ width: "100%" }}
                value={filterSeverity} onChange={setFilterSeverity}
                options={["Minor", "Moderate", "Major"].map((s) => ({ value: s, label: s }))}
              />
            </Col>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by Category" allowClear style={{ width: "100%" }}
                value={filterCategory} onChange={setFilterCategory}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </Col>
            <Col xs={24} sm={24} md={9}>
              <Input.Search
                placeholder="Search by student name" value={searchText}
                onChange={(e) => setSearchText(e.target.value)} onSearch={refreshIncidents} allowClear
                disabled={!showAllStudents}
              />
            </Col>
          </Row>

          <Table
            className="discipline-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={incidents}
            loading={incidentsLoading}
            size="middle"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} incidents` }}
            locale={{
              emptyText: (
                <Empty
                  description={studentId || showAllStudents ? "No discipline incidents recorded" : "Select a student to view incidents"}
                  style={{ padding: "40px 0" }}
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ── Report Incident Modal ─────────────────────────────── */}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); resetForm(); }}
        onOk={handleReport}
        confirmLoading={saving}
        okText="Report Incident"
        title={<Space><ExclamationCircleOutlined style={{ color: "var(--danger-hover)" }} />Report Discipline Incident</Space>}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>CATEGORY</Text>
              <Select style={{ width: "100%" }} value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>SEVERITY</Text>
              <Select style={{ width: "100%" }} value={severity} onChange={setSeverity} options={["Minor", "Moderate", "Major"].map((s) => ({ value: s, label: s }))} />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>DESCRIPTION *</Text>
            <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>DEMERIT POINTS</Text>
              <InputNumber min={0} style={{ width: "100%" }} value={demeritPoints} onChange={setDemeritPoints} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>FOLLOW-UP DATE</Text>
              <DatePicker style={{ width: "100%" }} value={followUpDate} onChange={setFollowUpDate} />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>ACTION TAKEN</Text>
            <Input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="e.g. Verbal warning, Detention" />
          </div>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>WITNESSES</Text>
            <Select mode="tags" style={{ width: "100%" }} value={witnesses} onChange={setWitnesses} placeholder="Type and press enter" tokenSeparators={[","]} />
          </div>
          <Checkbox checked={parentMeetingRequired} onChange={(e) => setParentMeetingRequired(e.target.checked)}>
            Parent meeting required
          </Checkbox>
          <Checkbox checked={parentNotified} onChange={(e) => setParentNotified(e.target.checked)}>
            Parent has been notified
          </Checkbox>
        </Space>
      </Modal>

      {/* ── Edit / Resolve Modal ──────────────────────────────── */}
      <Modal
        open={!!editingIncident}
        onCancel={() => setEditingIncident(null)}
        onOk={confirmEdit}
        confirmLoading={savingEdit}
        okText="Save"
        title={`Update Incident — ${editingIncident ? fmtDateTime(editingIncident.incidentDate) : ""}`}
      >
        {editingIncident && (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Paragraph style={{ fontSize: 13, marginBottom: 0 }}><Text strong>Description:</Text> {editingIncident.description}</Paragraph>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>STATUS</Text>
              <Select
                style={{ width: "100%" }} value={editStatus} onChange={setEditStatus}
                options={[{ value: "Open", label: "Open" }, { value: "Resolved", label: "Resolved" }]}
              />
            </div>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>ACTION TAKEN</Text>
              <Input value={editActionTaken} onChange={(e) => setEditActionTaken(e.target.value)} />
            </div>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>RESOLUTION NOTES</Text>
              <TextArea rows={2} value={editResolutionNotes} onChange={(e) => setEditResolutionNotes(e.target.value)} />
            </div>
            <Checkbox checked={editParentNotified} onChange={(e) => setEditParentNotified(e.target.checked)}>
              Parent has been notified
            </Checkbox>
          </Space>
        )}
      </Modal>
    </>
  );
}

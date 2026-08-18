import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, Empty, Flex, Input, InputNumber, Modal,
  Popconfirm, Row, Select, Space, Switch, Table, Tag, Tooltip, Typography, message,
} from "antd";
import { EditOutlined, SolutionOutlined, PlusOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../../features/studentSlice";
import { markAsAlumni, getAlumni, updateAlumniProfile } from "../../../features/alumniSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text } = Typography;
const { TextArea } = Input;

const CURRENT_YEAR = new Date().getFullYear();

export default function AlumniPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const { alumni = [], loading = false } = useSelector((s) => s.alumni || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Mark-as-alumni picker ─────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [graduationYear, setGraduationYear] = useState(CURRENT_YEAR);
  const [marking, setMarking] = useState(false);

  /* ── Directory filters ─────────────────────────────────── */
  const [filterYear, setFilterYear] = useState(null);
  const [filterReachable, setFilterReachable] = useState(null);
  const [searchText, setSearchText] = useState("");

  /* ── Edit modal ─────────────────────────────────────────── */
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  /* ── Directory ──────────────────────────────────────────── */
  const refreshAlumni = () => {
    dispatch(getAlumni({
      graduationYear: filterYear || undefined,
      isReachable: filterReachable === null ? undefined : filterReachable,
      search: searchText || undefined,
      page: 1,
      limit: 50,
    }));
  };

  useEffect(() => {
    refreshAlumni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterReachable]);

  /* ── Mark as alumni ─────────────────────────────────────── */
  const handleMark = async () => {
    if (!studentId) return message.warning("Please select a student first.");
    setMarking(true);
    const res = await dispatch(markAsAlumni({ studentId, graduationYear }));
    setMarking(false);

    if (markAsAlumni.fulfilled.match(res)) {
      message.success(`${res.payload.fullName} marked as alumni`);
      setStudentId(null);
      refreshAlumni();
    } else {
      message.error(res.payload || "Failed to mark student as alumni");
    }
  };

  /* ── Edit profile ───────────────────────────────────────── */
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      currentOccupation: a.currentOccupation || "",
      currentEmployer: a.currentEmployer || "",
      higherEducation: a.higherEducation || { institution: "", course: "" },
      currentAddress: a.currentAddress || "",
      currentPhone: a.currentPhone || "",
      currentEmail: a.currentEmail || "",
      linkedInUrl: a.linkedInUrl || "",
      achievements: a.achievements || [],
      engagementNotes: a.engagementNotes || "",
      isReachable: a.isReachable,
    });
  };

  const confirmEdit = async () => {
    setSaving(true);
    const res = await dispatch(updateAlumniProfile({ id: editing._id, payload: form }));
    setSaving(false);
    if (updateAlumniProfile.fulfilled.match(res)) {
      message.success("Alumni profile updated");
      setEditing(null);
    } else {
      message.error(res.payload || "Failed to update alumni profile");
    }
  };

  const updateAchievement = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      achievements: f.achievements.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
    }));

  const columns = [
    {
      title: "Name", dataIndex: "fullName",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{[row.lastClassName, row.lastSectionName].filter(Boolean).join(" - ")}</div>
        </div>
      ),
    },
    { title: "Grad. Year", dataIndex: "graduationYear", width: 100 },
    {
      title: "Occupation / Employer", key: "occupation",
      render: (_, row) => (
        <span style={{ fontSize: 13 }}>
          {[row.currentOccupation, row.currentEmployer].filter(Boolean).join(" @ ") || "—"}
        </span>
      ),
    },
    {
      title: "Contact", key: "contact",
      render: (_, row) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {row.currentPhone || row.currentEmail || "—"}
        </span>
      ),
    },
    {
      title: "Reachable", dataIndex: "isReachable", width: 100,
      render: (v) => <Tag color={v ? "success" : "default"}>{v ? "Yes" : "No"}</Tag>,
    },
    {
      title: "Actions", key: "actions", width: 90,
      render: (_, row) => (
        <Tooltip title="Edit Profile">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("alumni-tbl")}</style>

      <PageHeader
        title="Alumni"
        subtitle="Mark graduating students as alumni and maintain the alumni directory"
        icon={<TeamOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert
            type="warning" showIcon
            message="Please select an active academic year to mark students as alumni."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />
        )}

        {/* ── Mark as Alumni panel ─────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("var(--primary)", 38)}><UserOutlined style={{ fontSize: 17 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Mark Student as Alumni</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>This is a one-way action — the student will move out of active class rolls</Text>
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
            <Col xs={24} sm={12} md={7}>
              <Select
                placeholder="Select Student" style={{ width: "100%" }}
                value={studentId} onChange={setStudentId}
                options={studentOptions} showSearch optionFilterProp="label"
                disabled={!selectedSection} loading={rollLoading} size="large"
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <InputNumber
                style={{ width: "100%" }} size="large" placeholder="Graduation Year"
                value={graduationYear} onChange={setGraduationYear} min={2000} max={CURRENT_YEAR + 1}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: 12 }}>
            <Col span={24}>
              <Popconfirm
                title="Mark as Alumni"
                description="This is irreversible. The student will be removed from active class rolls and a new alumni profile will be created."
                onConfirm={handleMark}
                okText="Yes, Mark as Alumni"
                cancelText="Cancel"
                disabled={!studentId}
              >
                <Button type="primary" icon={<SolutionOutlined />} loading={marking} disabled={!studentId} size="large">
                  Mark as Alumni
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </div>

        {/* ── Alumni Directory ─────────────────────────────────── */}
        <div style={sectionPanel}>
          <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Alumni Directory</Text>
          </Flex>

          <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
            <Col xs={24} sm={8} md={6}>
              <InputNumber
                style={{ width: "100%" }} placeholder="Filter by Graduation Year"
                value={filterYear} onChange={setFilterYear} min={2000} max={CURRENT_YEAR + 1}
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Reachable" allowClear style={{ width: "100%" }}
                value={filterReachable} onChange={setFilterReachable}
                options={[{ value: true, label: "Reachable" }, { value: false, label: "Unreachable" }]}
              />
            </Col>
            <Col xs={24} sm={8} md={12}>
              <Input.Search
                placeholder="Search by name or occupation" value={searchText}
                onChange={(e) => setSearchText(e.target.value)} onSearch={refreshAlumni} allowClear
              />
            </Col>
          </Row>

          <Table
            className="alumni-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={alumni}
            loading={loading}
            size="middle"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} alumni` }}
            locale={{ emptyText: <Empty description="No alumni records yet" style={{ padding: "40px 0" }} /> }}
          />
        </div>
      </div>

      {/* ── Edit Profile Modal ────────────────────────────────── */}
      <Modal
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={confirmEdit}
        confirmLoading={saving}
        okText="Save"
        width={640}
        title={editing ? `${editing.fullName} — Alumni Profile` : ""}
      >
        {editing && (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Row gutter={12}>
              <Col span={12}>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>OCCUPATION</Text>
                <Input value={form.currentOccupation} onChange={(e) => setForm((f) => ({ ...f, currentOccupation: e.target.value }))} />
              </Col>
              <Col span={12}>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>EMPLOYER</Text>
                <Input value={form.currentEmployer} onChange={(e) => setForm((f) => ({ ...f, currentEmployer: e.target.value }))} />
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>HIGHER EDUCATION — INSTITUTION</Text>
                <Input value={form.higherEducation?.institution} onChange={(e) => setForm((f) => ({ ...f, higherEducation: { ...f.higherEducation, institution: e.target.value } }))} />
              </Col>
              <Col span={12}>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>COURSE</Text>
                <Input value={form.higherEducation?.course} onChange={(e) => setForm((f) => ({ ...f, higherEducation: { ...f.higherEducation, course: e.target.value } }))} />
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>PHONE</Text>
                <Input value={form.currentPhone} onChange={(e) => setForm((f) => ({ ...f, currentPhone: e.target.value }))} />
              </Col>
              <Col span={12}>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>EMAIL</Text>
                <Input value={form.currentEmail} onChange={(e) => setForm((f) => ({ ...f, currentEmail: e.target.value }))} />
              </Col>
            </Row>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>ADDRESS</Text>
              <Input value={form.currentAddress} onChange={(e) => setForm((f) => ({ ...f, currentAddress: e.target.value }))} />
            </div>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>LINKEDIN URL</Text>
              <Input value={form.linkedInUrl} onChange={(e) => setForm((f) => ({ ...f, linkedInUrl: e.target.value }))} />
            </div>

            <div>
              <Flex align="center" justify="space-between">
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>ACHIEVEMENTS</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={() => setForm((f) => ({ ...f, achievements: [...(f.achievements || []), { title: "", description: "", year: CURRENT_YEAR }] }))}>
                  Add
                </Button>
              </Flex>
              {(form.achievements || []).map((a, idx) => (
                <Row gutter={[8, 8]} key={idx} style={{ marginTop: 8 }}>
                  <Col xs={8}><Input placeholder="Title" value={a.title} onChange={(e) => updateAchievement(idx, "title", e.target.value)} /></Col>
                  <Col xs={10}><Input placeholder="Description" value={a.description} onChange={(e) => updateAchievement(idx, "description", e.target.value)} /></Col>
                  <Col xs={6}><InputNumber style={{ width: "100%" }} placeholder="Year" value={a.year} onChange={(v) => updateAchievement(idx, "year", v)} /></Col>
                </Row>
              ))}
            </div>

            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>ENGAGEMENT NOTES</Text>
              <TextArea rows={2} value={form.engagementNotes} onChange={(e) => setForm((f) => ({ ...f, engagementNotes: e.target.value }))} />
            </div>

            <Flex align="center" gap={10}>
              <Switch checked={form.isReachable} onChange={(v) => setForm((f) => ({ ...f, isReachable: v }))} />
              <Text style={{ fontSize: 13 }}>Reachable</Text>
            </Flex>
          </Space>
        )}
      </Modal>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Checkbox, Col, DatePicker, Empty, Flex, Input,
  InputNumber, Modal, Row, Select, Space, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  CloseCircleOutlined, DeleteOutlined, MedicineBoxOutlined,
  PlusOutlined, SaveOutlined, UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../features/schoolClassSlice";
import { fetchSections } from "../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../features/studentSlice";
import {
  fetchHealthProfile,
  upsertHealthProfile,
  createHealthVisit,
  fetchHealthVisits,
  updateHealthVisit,
} from "../../features/healthRecordSlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../styles/pageStyles.js";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const SEVERITY_COLOR = { Minor: "gold", Moderate: "orange", Severe: "red" };
const fmtDateTime = (v) => (v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : "—");

export default function HealthRecordsPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const {
    profile, profileLoading = false,
    visits = [], loading: visitsLoading = false,
  } = useSelector((s) => s.healthRecords || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Picker ─────────────────────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentId, setStudentId] = useState(null);

  /* ── Profile form ───────────────────────────────────────── */
  const emptyProfile = {
    bloodGroup: "", height: null, weight: null,
    allergies: [], chronicConditions: [],
    medications: [], vaccinations: [],
    emergencyContact: { name: "", phone: "", relation: "" },
    doctorContact: { name: "", phone: "", clinic: "" },
    notes: "",
  };
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Visit modal ────────────────────────────────────────── */
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("Minor");
  const [treatmentGiven, setTreatmentGiven] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [referredToHospital, setReferredToHospital] = useState(false);
  const [referredTo, setReferredTo] = useState("");
  const [parentNotified, setParentNotified] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(null);
  const [savingVisit, setSavingVisit] = useState(false);

  /* ── Visit log filters ──────────────────────────────────── */
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [editingVisit, setEditingVisit] = useState(null);

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

  /* ── Load profile when a student is selected ─────────────── */
  useEffect(() => {
    if (studentId) {
      dispatch(fetchHealthProfile(studentId));
      setShowAllStudents(false);
    }
  }, [studentId, dispatch]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        bloodGroup: profile.bloodGroup || "",
        height: profile.height ?? null,
        weight: profile.weight ?? null,
        allergies: profile.allergies || [],
        chronicConditions: profile.chronicConditions || [],
        medications: profile.medications || [],
        vaccinations: profile.vaccinations || [],
        emergencyContact: profile.emergencyContact || { name: "", phone: "", relation: "" },
        doctorContact: profile.doctorContact || { name: "", phone: "", clinic: "" },
        notes: profile.notes || "",
      });
    } else {
      setProfileForm(emptyProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  /* ── Load visit log ─────────────────────────────────────── */
  const refreshVisits = () => {
    dispatch(fetchHealthVisits({
      studentId: !showAllStudents && studentId ? studentId : undefined,
      status: filterStatus || undefined,
      severity: filterSeverity || undefined,
      search: searchText || undefined,
      page: 1,
      limit: 50,
    }));
  };

  useEffect(() => {
    if (studentId || showAllStudents) refreshVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, showAllStudents, filterStatus, filterSeverity]);

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

  /* ── Profile save ───────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!studentId) return;
    setSavingProfile(true);
    const res = await dispatch(upsertHealthProfile({ studentId, payload: profileForm }));
    setSavingProfile(false);
    if (upsertHealthProfile.fulfilled.match(res)) {
      message.success("Health profile saved");
    } else {
      message.error(res.payload || "Failed to save health profile");
    }
  };

  const updateEmergencyContact = (field, value) =>
    setProfileForm((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, [field]: value } }));
  const updateDoctorContact = (field, value) =>
    setProfileForm((p) => ({ ...p, doctorContact: { ...p.doctorContact, [field]: value } }));

  const updateMedication = (idx, field, value) =>
    setProfileForm((p) => ({
      ...p,
      medications: p.medications.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  const updateVaccination = (idx, field, value) =>
    setProfileForm((p) => ({
      ...p,
      vaccinations: p.vaccinations.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    }));

  /* ── Record visit ───────────────────────────────────────── */
  const resetVisitForm = () => {
    setSymptoms(""); setSeverity("Minor"); setTreatmentGiven(""); setTemperature(null);
    setReferredToHospital(false); setReferredTo(""); setParentNotified(false); setFollowUpDate(null);
  };

  const handleRecordVisit = async () => {
    if (!studentId) return message.warning("Please select a student first.");
    if (!symptoms.trim()) return message.warning("Please describe the symptoms/reason for the visit.");

    setSavingVisit(true);
    const res = await dispatch(createHealthVisit({
      studentId, symptoms, severity, treatmentGiven,
      temperature: temperature ?? undefined,
      referredToHospital, referredTo: referredToHospital ? referredTo : undefined,
      parentNotified,
      followUpDate: followUpDate ? followUpDate.toISOString() : undefined,
    }));
    setSavingVisit(false);

    if (createHealthVisit.fulfilled.match(res)) {
      message.success("Health visit recorded");
      setVisitModalOpen(false);
      resetVisitForm();
      refreshVisits();
    } else {
      message.error(res.payload || "Failed to record health visit");
    }
  };

  /* ── Edit / resolve visit ───────────────────────────────── */
  const [editStatus, setEditStatus] = useState("Resolved");
  const [editTreatment, setEditTreatment] = useState("");
  const [editParentNotified, setEditParentNotified] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditVisit = (visit) => {
    setEditingVisit(visit);
    setEditStatus(visit.status);
    setEditTreatment(visit.treatmentGiven || "");
    setEditParentNotified(visit.parentNotified);
  };

  const confirmEditVisit = async () => {
    setSavingEdit(true);
    const res = await dispatch(updateHealthVisit({
      id: editingVisit._id,
      payload: { status: editStatus, treatmentGiven: editTreatment, parentNotified: editParentNotified },
    }));
    setSavingEdit(false);
    if (updateHealthVisit.fulfilled.match(res)) {
      message.success("Health visit updated");
      setEditingVisit(null);
    } else {
      message.error(res.payload || "Failed to update health visit");
    }
  };

  const columns = [
    { title: "Date", dataIndex: "visitDate", width: 150, render: (v) => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
    ...(showAllStudents ? [{
      title: "Student", dataIndex: "studentName",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{[row.className, row.sectionName].filter(Boolean).join(" - ")}</div>
        </div>
      ),
    }] : []),
    { title: "Symptoms", dataIndex: "symptoms", ellipsis: true },
    { title: "Severity", dataIndex: "severity", width: 100, render: (v) => <Tag color={SEVERITY_COLOR[v]}>{v}</Tag> },
    { title: "Status", dataIndex: "status", width: 100, render: (v) => <Tag color={v === "Open" ? "processing" : "success"}>{v}</Tag> },
    {
      title: "Parent Notified", dataIndex: "parentNotified", width: 110,
      render: (v) => (v ? <Tag color="success">Yes</Tag> : <Tag>No</Tag>),
    },
    {
      title: "Actions", key: "actions", width: 90,
      render: (_, row) => (
        <Tooltip title="View / Update">
          <Button size="small" onClick={() => openEditVisit(row)}>Edit</Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("health-tbl")}</style>

      <PageHeader
        title="Health Records"
        subtitle="Student health profiles and nurse/medical visit log"
        icon={<MedicineBoxOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert
            type="warning" showIcon
            message="Please select an active academic year to manage health records."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />
        )}

        {/* ── Student picker ─────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("var(--primary)", 38)}><UserOutlined style={{ fontSize: 17 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Select Student</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>View/edit a health profile and record visits</Text>
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

        {studentId && (
          <>
            {/* ── Health Profile ─────────────────────────────── */}
            <div style={{ ...sectionPanel, marginBottom: 16 }}>
              <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
                <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Health Profile</Text>
                <Button type="primary" icon={<SaveOutlined />} loading={savingProfile} onClick={handleSaveProfile}>
                  Save Profile
                </Button>
              </Flex>

              {profileLoading ? (
                <Text type="secondary">Loading profile…</Text>
              ) : (
                <>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={8}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>BLOOD GROUP</Text>
                      <Input value={profileForm.bloodGroup} onChange={(e) => setProfileForm((p) => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g. O+" />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>HEIGHT (cm)</Text>
                      <InputNumber style={{ width: "100%" }} value={profileForm.height} onChange={(v) => setProfileForm((p) => ({ ...p, height: v }))} />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>WEIGHT (kg)</Text>
                      <InputNumber style={{ width: "100%" }} value={profileForm.weight} onChange={(v) => setProfileForm((p) => ({ ...p, weight: v }))} />
                    </Col>
                  </Row>

                  <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                    <Col xs={24} sm={12}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>ALLERGIES</Text>
                      <Select
                        mode="tags" style={{ width: "100%" }} value={profileForm.allergies}
                        onChange={(v) => setProfileForm((p) => ({ ...p, allergies: v }))}
                        placeholder="Type and press enter" tokenSeparators={[","]}
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>CHRONIC CONDITIONS</Text>
                      <Select
                        mode="tags" style={{ width: "100%" }} value={profileForm.chronicConditions}
                        onChange={(v) => setProfileForm((p) => ({ ...p, chronicConditions: v }))}
                        placeholder="Type and press enter" tokenSeparators={[","]}
                      />
                    </Col>
                  </Row>

                  {/* Medications */}
                  <div style={{ marginTop: 16 }}>
                    <Flex align="center" justify="space-between">
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>MEDICATIONS</Text>
                      <Button size="small" icon={<PlusOutlined />} onClick={() => setProfileForm((p) => ({ ...p, medications: [...p.medications, { name: "", dosage: "", notes: "" }] }))}>
                        Add
                      </Button>
                    </Flex>
                    {profileForm.medications.map((m, idx) => (
                      <Row gutter={[8, 8]} key={idx} style={{ marginTop: 8 }}>
                        <Col xs={7}><Input placeholder="Name" value={m.name} onChange={(e) => updateMedication(idx, "name", e.target.value)} /></Col>
                        <Col xs={6}><Input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedication(idx, "dosage", e.target.value)} /></Col>
                        <Col xs={9}><Input placeholder="Notes" value={m.notes} onChange={(e) => updateMedication(idx, "notes", e.target.value)} /></Col>
                        <Col xs={2}>
                          <Button danger icon={<DeleteOutlined />} onClick={() => setProfileForm((p) => ({ ...p, medications: p.medications.filter((_, i) => i !== idx) }))} />
                        </Col>
                      </Row>
                    ))}
                  </div>

                  {/* Vaccinations */}
                  <div style={{ marginTop: 16 }}>
                    <Flex align="center" justify="space-between">
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>VACCINATIONS</Text>
                      <Button size="small" icon={<PlusOutlined />} onClick={() => setProfileForm((p) => ({ ...p, vaccinations: [...p.vaccinations, { name: "", date: null, nextDueDate: null }] }))}>
                        Add
                      </Button>
                    </Flex>
                    {profileForm.vaccinations.map((v, idx) => (
                      <Row gutter={[8, 8]} key={idx} style={{ marginTop: 8 }}>
                        <Col xs={8}><Input placeholder="Vaccine name" value={v.name} onChange={(e) => updateVaccination(idx, "name", e.target.value)} /></Col>
                        <Col xs={7}><DatePicker style={{ width: "100%" }} placeholder="Date given" value={v.date ? dayjs(v.date) : null} onChange={(d) => updateVaccination(idx, "date", d)} /></Col>
                        <Col xs={7}><DatePicker style={{ width: "100%" }} placeholder="Next due" value={v.nextDueDate ? dayjs(v.nextDueDate) : null} onChange={(d) => updateVaccination(idx, "nextDueDate", d)} /></Col>
                        <Col xs={2}>
                          <Button danger icon={<DeleteOutlined />} onClick={() => setProfileForm((p) => ({ ...p, vaccinations: p.vaccinations.filter((_, i) => i !== idx) }))} />
                        </Col>
                      </Row>
                    ))}
                  </div>

                  <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                    <Col xs={24} md={12}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>EMERGENCY CONTACT</Text>
                      <Row gutter={[6, 6]}>
                        <Col span={8}><Input placeholder="Name" value={profileForm.emergencyContact.name} onChange={(e) => updateEmergencyContact("name", e.target.value)} /></Col>
                        <Col span={8}><Input placeholder="Phone" value={profileForm.emergencyContact.phone} onChange={(e) => updateEmergencyContact("phone", e.target.value)} /></Col>
                        <Col span={8}><Input placeholder="Relation" value={profileForm.emergencyContact.relation} onChange={(e) => updateEmergencyContact("relation", e.target.value)} /></Col>
                      </Row>
                    </Col>
                    <Col xs={24} md={12}>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>DOCTOR / CLINIC CONTACT</Text>
                      <Row gutter={[6, 6]}>
                        <Col span={8}><Input placeholder="Doctor Name" value={profileForm.doctorContact.name} onChange={(e) => updateDoctorContact("name", e.target.value)} /></Col>
                        <Col span={8}><Input placeholder="Phone" value={profileForm.doctorContact.phone} onChange={(e) => updateDoctorContact("phone", e.target.value)} /></Col>
                        <Col span={8}><Input placeholder="Clinic" value={profileForm.doctorContact.clinic} onChange={(e) => updateDoctorContact("clinic", e.target.value)} /></Col>
                      </Row>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>NOTES</Text>
                    <TextArea rows={2} value={profileForm.notes} onChange={(e) => setProfileForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Visit Log ────────────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10} style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {showAllStudents || !studentId ? "All Health Visits" : "Visit Log"}
            </Text>
            <Space wrap>
              {studentId && (
                <Button size="small" onClick={() => setShowAllStudents((v) => !v)}>
                  {showAllStudents ? "Show Selected Student Only" : "View All Students"}
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} disabled={!studentId} onClick={() => setVisitModalOpen(true)}>
                Record New Visit
              </Button>
            </Space>
          </Flex>

          <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Status" allowClear style={{ width: "100%" }}
                value={filterStatus} onChange={setFilterStatus}
                options={[{ value: "Open", label: "Open" }, { value: "Resolved", label: "Resolved" }]}
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Severity" allowClear style={{ width: "100%" }}
                value={filterSeverity} onChange={setFilterSeverity}
                options={[{ value: "Minor", label: "Minor" }, { value: "Moderate", label: "Moderate" }, { value: "Severe", label: "Severe" }]}
              />
            </Col>
            <Col xs={24} sm={8} md={12}>
              <Input.Search
                placeholder="Search by student name" value={searchText}
                onChange={(e) => setSearchText(e.target.value)} onSearch={refreshVisits} allowClear
                disabled={!showAllStudents}
              />
            </Col>
          </Row>

          <Table
            className="health-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={visits}
            loading={visitsLoading}
            size="middle"
            scroll={{ x: 700 }}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} visits` }}
            locale={{
              emptyText: (
                <Empty
                  description={studentId || showAllStudents ? "No health visits recorded yet" : "Select a student to view visits"}
                  style={{ padding: "40px 0" }}
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ── Record Visit Modal ────────────────────────────────── */}
      <Modal
        open={visitModalOpen}
        onCancel={() => { setVisitModalOpen(false); resetVisitForm(); }}
        onOk={handleRecordVisit}
        confirmLoading={savingVisit}
        okText="Record Visit"
        title="Record New Health Visit"
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>SYMPTOMS / REASON *</Text>
            <TextArea rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. Fever, headache" />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>SEVERITY</Text>
              <Select
                style={{ width: "100%" }} value={severity} onChange={setSeverity}
                options={["Minor", "Moderate", "Severe"].map((s) => ({ value: s, label: s }))}
              />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TEMPERATURE (°F)</Text>
              <InputNumber style={{ width: "100%" }} value={temperature} onChange={setTemperature} />
            </Col>
          </Row>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TREATMENT GIVEN</Text>
            <TextArea rows={2} value={treatmentGiven} onChange={(e) => setTreatmentGiven(e.target.value)} />
          </div>
          <Checkbox checked={referredToHospital} onChange={(e) => setReferredToHospital(e.target.checked)}>
            Referred to hospital/doctor
          </Checkbox>
          {referredToHospital && (
            <Input placeholder="Referred to (hospital/doctor name)" value={referredTo} onChange={(e) => setReferredTo(e.target.value)} />
          )}
          <Checkbox checked={parentNotified} onChange={(e) => setParentNotified(e.target.checked)}>
            Parent has been notified
          </Checkbox>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>FOLLOW-UP DATE (optional)</Text>
            <DatePicker style={{ width: "100%" }} value={followUpDate} onChange={setFollowUpDate} />
          </div>
        </Space>
      </Modal>

      {/* ── Edit Visit Modal ─────────────────────────────────── */}
      <Modal
        open={!!editingVisit}
        onCancel={() => setEditingVisit(null)}
        onOk={confirmEditVisit}
        confirmLoading={savingEdit}
        okText="Save"
        title={`Update Visit — ${editingVisit ? fmtDateTime(editingVisit.visitDate) : ""}`}
      >
        {editingVisit && (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Paragraph style={{ fontSize: 13, marginBottom: 0 }}><Text strong>Symptoms:</Text> {editingVisit.symptoms}</Paragraph>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>STATUS</Text>
              <Select
                style={{ width: "100%" }} value={editStatus} onChange={setEditStatus}
                options={[{ value: "Open", label: "Open" }, { value: "Resolved", label: "Resolved" }]}
              />
            </div>
            <div>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>TREATMENT NOTES</Text>
              <TextArea rows={2} value={editTreatment} onChange={(e) => setEditTreatment(e.target.value)} />
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

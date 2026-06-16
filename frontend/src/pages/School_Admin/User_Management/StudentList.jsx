import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table, Modal, Input, Select, Button, Space, Tooltip, Tag, Badge,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, ExportOutlined, SearchOutlined,
  TeamOutlined, CheckCircleOutlined, BookOutlined, EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Cake } from "lucide-react";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import AdmissionForm from "../../../components/forms/AdmissionForm";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableContainer,
  tableHeadCss, avatarStyle, pill, emptyState, statCard, statLabel, statValue,
} from "../../../styles/pageStyles";

const bloodGroupColor = {
  "A+":  { bg: "#fef2f2", color: "#dc2626" },
  "A-":  { bg: "#fff7ed", color: "#c2410c" },
  "B+":  { bg: "#fef9ec", color: "#d97706" },
  "B-":  { bg: "#fefce8", color: "#ca8a04" },
  "AB+": { bg: "#eff6ff", color: "#2563eb" },
  "AB-": { bg: "#eef2ff", color: "#4338ca" },
  "O+":  { bg: "#f0fdf8", color: "#059669" },
  "O-":  { bg: "#f0fdf4", color: "#16a34a" },
};

const STAT_META = [
  { key: "total",   label: "Total Students", icon: <TeamOutlined />,        color: "#7c3aed" },
  { key: "active",  label: "Active",          icon: <CheckCircleOutlined />, color: "#10b981" },
  { key: "classes", label: "Classes",         icon: <BookOutlined />,        color: "#0284c7" },
  { key: "showing", label: "Showing",         icon: <EyeOutlined />,         color: "#f97316" },
];

const StudentList = () => {
  const dispatch = useDispatch();
  const { schoolStudents, loading } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear);

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [searchText, setSearchText]       = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || activeYear?._id;
  const isSchoolAdmin  = user?.role?.name === "School Admin";

  useEffect(() => {
    if (!isSchoolAdmin || !schoolId) return;
    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
  }, [dispatch, isSchoolAdmin, schoolId, academicYearId, isModalOpen]);

  const studentsArray = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (schoolStudents?.data) return schoolStudents.data;
    return [];
  }, [schoolStudents]);

  const formatted = useMemo(() =>
    studentsArray.map((s) => ({
      key: s._id,
      name:          s.user?.name          ?? "N/A",
      email:         s.user?.email         ?? "N/A",
      schoolClass:   s.schoolClass?.name   ?? "N/A",
      section:       s.section?.name       ?? "N/A",
      dateOfBirth:   s.student?.dateOfBirth
        ? new Date(s.student.dateOfBirth).toISOString().split("T")[0] : "N/A",
      mobileNumber:  s.mobileNumber        ?? "N/A",
      admissionDate: s.admissionDate
        ? new Date(s.admissionDate).toISOString().split("T")[0] : "N/A",
      bloodGroup:    s.student?.bloodGroup ?? "N/A",
      academicYear:  s.academicYear?.name  ?? "N/A",
      status:        s.status              ?? "Active",
    })),
    [studentsArray]
  );

  const classOptions = useMemo(() => {
    const cls = formatted.map((s) => s.schoolClass).filter(Boolean);
    return [{ value: "all", label: "All Classes" }, ...([...new Set(cls)].map((c) => ({ value: c, label: c })))];
  }, [formatted]);

  const sectionOptions = useMemo(() => {
    const secs = formatted
      .filter((s) => selectedClass === "all" || s.schoolClass === selectedClass)
      .map((s) => s.section).filter(Boolean);
    return [{ value: "all", label: "All Sections" }, ...([...new Set(secs)].map((s) => ({ value: s, label: s })))];
  }, [formatted, selectedClass]);

  const filtered = useMemo(() =>
    formatted.filter((s) => {
      const q = searchText.toLowerCase();
      return (
        (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
        (selectedClass   === "all" || s.schoolClass === selectedClass) &&
        (selectedSection === "all" || s.section     === selectedSection)
      );
    }),
    [formatted, searchText, selectedClass, selectedSection]
  );

  const stats = useMemo(() => ({
    total:   formatted.length,
    active:  formatted.filter((s) => s.status === "Active").length,
    classes: new Set(formatted.map((s) => s.schoolClass)).size,
    showing: filtered.length,
  }), [formatted, filtered]);

  const columns = [
    {
      title: "Student",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, r) => (
        <Space>
          <div style={avatarStyle(name, 38)}>{name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Class",
      dataIndex: "schoolClass",
      width: 110,
      render: (v) => <span style={pill("#7c3aed")}>{v}</span>,
    },
    {
      title: "Section",
      dataIndex: "section",
      width: 90,
      render: (v) => <span style={pill("#059669")}>{v}</span>,
    },
    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      width: 110,
      render: (bg) => {
        const s = bloodGroupColor[bg];
        if (!s) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        return <span style={pill(s.color, s.bg)}>{bg}</span>;
      },
    },
    {
      title: "Date of Birth",
      dataIndex: "dateOfBirth",
      width: 140,
      render: (d) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
          <Cake size={13} /> {d}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "mobileNumber",
      width: 130,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span>,
    },
    {
      title: "Admission",
      dataIndex: "admissionDate",
      width: 120,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v}</span>,
    },
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      width: 130,
      render: (v) => <span style={pill("#f97316")}>{v}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => {
        const isActive  = s === "Active";
        const isPending = s === "Pending";
        const color = isActive ? "#15803d" : isPending ? "#92400e" : "#991b1b";
        const dot   = isActive ? "#22c55e" : isPending ? "#f59e0b" : "#ef4444";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, boxShadow: `0 0 0 2px ${dot}30` }} />
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{s}</span>
          </div>
        );
      },
    },
  ];

  if (!isSchoolAdmin) {
    return (
      <div style={{ ...pageWrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          textAlign: "center", padding: "56px 32px", background: "var(--surface)",
          borderRadius: 20, border: "1px solid var(--border-muted)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}>
          <LockOutlined style={{ fontSize: 44, color: "var(--text-muted)", marginBottom: 16, display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>Access Restricted</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>You don't have permission to view this page.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{tableHeadCss("stu-table")}</style>

      <PageHeader
        title="Students"
        subtitle={`${selectedAcademicYear?.name ?? "Current"} Academic Year · ${user?.school?.name ?? "School"}`}
        icon={<TeamOutlined />}
        extra={
          <Space size={8}>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }))}
              />
            </Tooltip>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add Student
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          width={860}
          centered
          destroyOnClose
          title={
            <Space>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: "var(--primary-light)", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>🎓</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>New Student Admission</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Fill in the details below</div>
              </div>
            </Space>
          }
        >
          <AdmissionForm onClose={() => setIsModalOpen(false)} />
        </Modal>

        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            {/* KPI Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {STAT_META.map(({ key, label, icon, color }) => (
                <div key={key} style={statCard({ color })}>
                  <div>
                    <div style={statLabel(color)}>{label}</div>
                    <div style={statValue(color)}>{stats[key]}</div>
                  </div>
                  <div style={{ fontSize: 24, color, opacity: 0.6 }}>{icon}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Students
              </span>
              <div style={{ flex: 1 }} />
              <Input.Search
                placeholder="Search by name or email…"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 240 }}
              />
              <Select
                value={selectedClass}
                options={classOptions}
                onChange={(v) => { setSelectedClass(v); setSelectedSection("all"); }}
                style={{ width: 140 }}
              />
              <Select
                value={selectedSection}
                options={sectionOptions}
                onChange={(v) => setSelectedSection(v)}
                disabled={selectedClass === "all"}
                style={{ width: 130 }}
              />
            </div>
          </div>

          {/* Table / Empty */}
          {!loading && filtered.length === 0 ? (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={emptyState}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  {searchText || selectedClass !== "all" ? "No students match your filters" : "No students enrolled yet"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {searchText || selectedClass !== "all"
                    ? "Try adjusting your search or filter"
                    : 'Click "Add Student" to enroll the first student'}
                </div>
              </div>
            </div>
          ) : (
            <div className="stu-table" style={{ ...tableContainer, borderRadius: 0, border: "none", borderTop: "1px solid var(--border-muted)" }}>
              <Table
                loading={loading}
                columns={columns}
                dataSource={filtered}
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showSizeChanger: true,
                  showTotal: (total, range) => (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{range[0]}–{range[1]} of {total} students</span>
                  ),
                }}
                scroll={{ x: 1000 }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentList;

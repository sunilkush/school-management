import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Modal, Spin } from "antd";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import AdmissionForm from "../../../components/forms/AdmissionForm";

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

const AVATAR_COLORS = [
  { bg: "#ede9fe", color: "#7c6ff7" },
  { bg: "#f0fdf8", color: "#1d9e75" },
  { bg: "#fef9ec", color: "#e69020" },
  { bg: "#fce7f3", color: "#db2777" },
  { bg: "#e0f2fe", color: "#0284c7" },
];

const getAvatarColor = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const StudentList = () => {
  const dispatch = useDispatch();
  const { schoolStudents, loading } = useSelector((state) => state.students);
  const { user } = useSelector((state) => state.auth);
  const { selectedAcademicYear, activeYear } = useSelector((state) => state.academicYear);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || activeYear?._id;
  const isSchoolAdmin = user?.role?.name === "School Admin";

  useEffect(() => {
    if (!isSchoolAdmin || !schoolId) return;
    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
  }, [dispatch, isSchoolAdmin, schoolId, academicYearId, isModalOpen]);

  const studentsArray = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (schoolStudents?.data) return schoolStudents.data;
    return [];
  }, [schoolStudents]);

  const formattedStudents = useMemo(() =>
    studentsArray.map((stu) => ({
      key: stu._id,
      name: stu.user?.name ?? "N/A",
      email: stu.user?.email ?? "N/A",
      schoolClass: stu.schoolClass?.name ?? "N/A",
      section: stu.section?.name ?? "N/A",
      dateOfBirth: stu.student?.dateOfBirth
        ? new Date(stu.student.dateOfBirth).toISOString().split("T")[0]
        : "N/A",
      mobileNumber: stu.mobileNumber ?? "N/A",
      admissionDate: stu.admissionDate
        ? new Date(stu.admissionDate).toISOString().split("T")[0]
        : "N/A",
      bloodGroup: stu.student?.bloodGroup ?? "N/A",
      academicYear: stu.academicYear?.name ?? "N/A",
      status: stu.status ?? "Active",
    })),
    [studentsArray]
  );

  const classOptions = useMemo(() => {
    const classes = formattedStudents.map((s) => s.schoolClass).filter(Boolean);
    return ["all", ...new Set(classes)];
  }, [formattedStudents]);

  const sectionOptions = useMemo(() => {
    const sections = formattedStudents
      .filter((s) => selectedClass === "all" || s.schoolClass === selectedClass)
      .map((s) => s.section)
      .filter(Boolean);
    return ["all", ...new Set(sections)];
  }, [formattedStudents, selectedClass]);

  const filteredStudents = useMemo(() =>
    formattedStudents.filter((stu) => {
      const matchSearch =
        stu.name.toLowerCase().includes(searchText.toLowerCase()) ||
        stu.email.toLowerCase().includes(searchText.toLowerCase());
      const matchClass = selectedClass === "all" || stu.schoolClass === selectedClass;
      const matchSection = selectedSection === "all" || stu.section === selectedSection;
      return matchSearch && matchClass && matchSection;
    }),
    [formattedStudents, searchText, selectedClass, selectedSection]
  );

  const stats = useMemo(() => ({
    total: formattedStudents.length,
    active: formattedStudents.filter((s) => s.status === "Active").length,
    classes: new Set(formattedStudents.map((s) => s.schoolClass)).size,
    showing: filteredStudents.length,
  }), [formattedStudents, filteredStudents]);

  const columns = [
    {
      title: "Student",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => {
        const { bg, color } = getAvatarColor(name);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: bg, color, fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13 }}>{name}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{record.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Class",
      dataIndex: "schoolClass",
      width: 90,
      render: (cls) => (
        <span style={{ display: "inline-block", padding: "2px 10px", background: "#f0eeff", color: "#7c6ff7", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          {cls}
        </span>
      ),
    },
    {
      title: "Section",
      dataIndex: "section",
      width: 90,
      render: (sec) => (
        <span style={{ display: "inline-block", padding: "2px 10px", background: "#f0fdf8", color: "#1d9e75", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          {sec}
        </span>
      ),
    },
    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      width: 110,
      render: (bg) => {
        const style = bloodGroupColor[bg];
        if (!style) return <span style={{ color: "#ccc" }}>—</span>;
        return (
          <span style={{ display: "inline-block", padding: "2px 10px", background: style.bg, color: style.color, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {bg}
          </span>
        );
      },
    },
    {
      title: "Date of Birth",
      dataIndex: "dateOfBirth",
      width: 120,
      render: (dob) => <span style={{ fontSize: 12, color: "#666" }}>📅 {dob}</span>,
    },
    {
      title: "Phone",
      dataIndex: "mobileNumber",
      width: 130,
      render: (phone) => <span style={{ fontSize: 12, color: "#666" }}>{phone}</span>,
    },
    {
      title: "Admission",
      dataIndex: "admissionDate",
      width: 120,
      render: (date) => <span style={{ fontSize: 12, color: "#666" }}>{date}</span>,
    },
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      width: 130,
      render: (year) => (
        <span style={{ display: "inline-block", padding: "2px 10px", background: "#fef9ec", color: "#e69020", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          {year}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (status) => {
        const isActive = status === "Active";
        const isPending = status === "Pending";
        const statusColor = isActive ? "#1d9e75" : isPending ? "#e69020" : "#e24b4a";
        const statusBg   = isActive ? "#d4f0e8"  : isPending ? "#fef0c7" : "#fce8e8";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, boxShadow: `0 0 0 2px ${statusBg}` }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{status}</span>
          </div>
        );
      },
    },
  ];

  if (!isSchoolAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)",
        padding: "32px 16px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", padding: "56px 32px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(124,111,247,0.1)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Access Restricted</div>
          <div style={{ fontSize: 14, color: "#aaa" }}>You don't have permission to view this page.</div>
        </div>
      </div>
    );
  }

  if (!user) return <Spin size="large" fullscreen />;

  return (
    <div style={{
      minHeight: "100vh",
     // background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)",
      padding: "0",
     // fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .stu-table .ant-table { background: transparent !important; }
        .stu-table .ant-table-thead > tr > th {
          background: #f8f7ff !important;
          color: #aaa !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          border-bottom: 1px solid #ede9fe !important;
          padding: 12px 16px !important;
        }
        .stu-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f5f3ff !important;
          padding: 13px 16px !important;
        }
        .stu-table .ant-table-tbody > tr:hover > td { background: #faf8ff !important; }
        .stu-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .stu-table .ant-pagination-item-active { border-color: #7c6ff7 !important; }
        .stu-table .ant-pagination-item-active a { color: #7c6ff7 !important; }
        .stu-table .ant-table-column-sorter-up.active svg,
        .stu-table .ant-table-column-sorter-down.active svg { color: #7c6ff7 !important; }

        .stu-search {
          height: 40px;
          border-radius: 10px !important;
          border: 1.5px solid #e8e4ff !important;
          background: #fdfcff !important;
          font-size: 13px !important;
          padding: 0 12px 0 38px !important;
          outline: none; color: #1a1a2e;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 220px;
        }
        .stu-search:focus {
          border-color: #7c6ff7 !important;
          box-shadow: 0 0 0 3px rgba(124,111,247,0.1) !important;
        }
        .stu-search::placeholder { color: #ccc; }
        .stu-search-wrap { position: relative; }
        .stu-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #c5bef5; font-size: 14px; pointer-events: none; }

        .stu-filter {
          height: 40px;
          border-radius: 10px !important;
          border: 1.5px solid #e8e4ff !important;
          background: #fdfcff !important;
          font-size: 13px !important;
          padding: 0 10px !important;
          outline: none; color: #1a1a2e; cursor: pointer;
          min-width: 130px;
        }
        .stu-filter:focus { border-color: #7c6ff7 !important; }
        .stu-filter:disabled { opacity: 0.5; cursor: not-allowed; }

        .stu-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 40px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: none; transition: all 0.2s;
        }
        .stu-btn.ghost {
          background: #f0eeff; color: #7c6ff7;
          border: 1.5px solid #ddd8ff;
        }
        .stu-btn.ghost:hover { background: #e4dfff; }
        .stu-btn.primary {
          background: linear-gradient(135deg, #7c6ff7 0%, #5a50c9 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(124,111,247,0.35);
        }
        .stu-btn.primary:hover {
          box-shadow: 0 6px 20px rgba(124,111,247,0.45);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Add Student Modal */}
      <Modal
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        width={860}
        centered
        destroyOnClose
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f0eeff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>New Student Admission</div>
              <div style={{ fontSize: 12, color: "#aaa", fontWeight: 400 }}>Fill in the details below</div>
            </div>
          </div>
        }
        styles={{ header: { borderBottom: "1px solid #f0eeff", paddingBottom: 14 } }}
      >
        <AdmissionForm onClose={() => setIsModalOpen(false)} />
      </Modal>

      <div style={{
        background: "#fff", borderRadius: 20,
        boxShadow: "0 8px 40px rgba(124,111,247,0.1), 0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden", width:"100%", margin: "0 auto",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #7c6ff7 0%, #5a50c9 100%)",
          padding: "28px 36px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ position: "absolute", bottom: -50, right: 80, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                School Management
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                Students
              </h1>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                {selectedAcademicYear?.name ?? "Current"} Academic Year · {user?.school?.name ?? "School"}
              </p>
            </div>
            <button className="stu-btn primary" style={{ background: "rgba(255,255,255,0.2)", boxShadow: "none", border: "1.5px solid rgba(255,255,255,0.3)" }} onClick={() => setIsModalOpen(true)}>
              + Add Student
            </button>
          </div>
        </div>

        <div style={{ padding: "28px 36px" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            {[
              { label: "Total Students", value: stats.total,   icon: "👥", color: "#7c6ff7", bg: "#f0eeff" },
              { label: "Active",         value: stats.active,  icon: "✅", color: "#1d9e75", bg: "#f0fdf8" },
              { label: "Classes",        value: stats.classes, icon: "📚", color: "#0284c7", bg: "#e0f2fe" },
              { label: "Showing",        value: stats.showing, icon: "👁", color: "#e69020", bg: "#fef9ec" },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: "16px 20px", background: stat.bg, borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: stat.color, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                </div>
                <div style={{ fontSize: 28, opacity: 0.7 }}>{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b0a8f5", textTransform: "uppercase", letterSpacing: "0.12em", marginRight: 4 }}>
              All Students
            </div>
            <div style={{ flex: 1 }} />

            <div className="stu-search-wrap">
              <span className="stu-search-icon">🔍</span>
              <input
                className="stu-search"
                placeholder="Search by name or email…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <select
              className="stu-filter"
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection("all"); }}
            >
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>{cls === "all" ? "All Classes" : cls}</option>
              ))}
            </select>

            <select
              className="stu-filter"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={selectedClass === "all"}
            >
              {sectionOptions.map((sec) => (
                <option key={sec} value={sec}>{sec === "all" ? "All Sections" : sec}</option>
              ))}
            </select>

            <button className="stu-btn ghost" onClick={() => dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }))}>
              ↺ Refresh
            </button>

            <button className="stu-btn ghost">
              ↓ Export
            </button>
          </div>

          {/* Empty State */}
          {!loading && filteredStudents.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "56px 24px",
              border: "1.5px dashed #ddd8ff", borderRadius: 16,
              background: "#faf9ff",
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎓</div>
              <div style={{ fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
                {searchText || selectedClass !== "all" ? "No students match your filters" : "No students enrolled yet"}
              </div>
              <div style={{ fontSize: 13, color: "#c5bef5" }}>
                {searchText || selectedClass !== "all"
                  ? "Try adjusting your search or filter"
                  : "Click \"Add Student\" to enroll the first student"}
              </div>
            </div>
          ) : (
            <div className="stu-table" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #ede9fe" }}>
              <Table
                loading={loading}
                columns={columns}
                dataSource={filteredStudents}
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showSizeChanger: true,
                  showTotal: (total, range) => (
                    <span style={{ fontSize: 12, color: "#aaa" }}>{range[0]}–{range[1]} of {total} students</span>
                  ),
                }}
                scroll={{ x: 1000 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentList;
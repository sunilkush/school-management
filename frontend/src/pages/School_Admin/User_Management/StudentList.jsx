import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table, Modal, Input, Select, Button, Space, Tooltip, Tag, Badge,
  Popconfirm, DatePicker, Form, message,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, ExportOutlined, SearchOutlined,
  TeamOutlined, BookOutlined, EyeOutlined, UploadOutlined,
  LockOutlined, EditOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { Cake } from "lucide-react";
import dayjs from "dayjs";
import { fetchStudentsBySchoolId, updateStudent, deleteStudent } from "../../../features/studentSlice";
import { getClassData } from "../../../features/schoolClassSlice";
import AdmissionForm from "../../../components/forms/AdmissionForm";
import BulkImportStudentsSheet from "../../../components/forms/BulkImportStudentsSheet";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableContainer,
  tableHeadCss, avatarStyle, pill, emptyState, statCard, statLabel, statValue, statGrid,
} from "../../../styles/pageStyles";

const bloodGroupColor = {
  "A+":  { bg: "rgba(254,226,226,0.2)", color: "var(--danger)" },
  "A-":  { bg: "rgba(var(--warning-rgb), 0.08)", color: "#c2410c" },
  "B+":  { bg: "#fef9ec", color: "var(--warning)" },
  "B-":  { bg: "#fefce8", color: "#ca8a04" },
  "AB+": { bg: "rgba(219,234,254,0.2)", color: "var(--primary)" },
  "AB-": { bg: "#eef2ff", color: "#4338ca" },
  "O+":  { bg: "#f0fdf8", color: "var(--success)" },
  "O-":  { bg: "rgba(220,252,231,0.2)", color: "var(--success)" },
};

const STAT_META = [
  { key: "total",   label: "Total Students", icon: <TeamOutlined />,        color: "var(--accent)" },
  { key: "classes", label: "Classes",         icon: <BookOutlined />,        color: "var(--primary)" },
  { key: "showing", label: "On This Page",    icon: <EyeOutlined />,         color: "var(--warning)" },
];

const StudentList = () => {
  const dispatch = useDispatch();
  const { schoolStudents, schoolStudentsPagination, loading } = useSelector((s) => s.students);
  const { schoolClasses } = useSelector((s) => s.schoolClass);
  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear);

  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [searchInput, setSearchInput]     = useState("");
  const [searchText, setSearchText]       = useState("");
  const [selectedClassId, setSelectedClassId]     = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm] = Form.useForm();
  const [savingEdit, setSavingEdit] = useState(false);

  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || activeYear?._id;
  const canViewStudents = ["School Admin", "Principal", "Vice Principal"].includes(user?.role?.name);
  const canManageStudents = user?.role?.name === "School Admin";

  // Debounce free-text search before it drives a server request — otherwise every keystroke
  // fires a new query.
  useEffect(() => {
    const t = setTimeout(() => { setSearchText(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Class list is fetched independently of the (now paginated) student list, so the Class/Section
  // filter dropdowns always show every class in the school — not just whatever happens to be on
  // the current page of students.
  useEffect(() => {
    if (!canViewStudents || !schoolId || !academicYearId) return;
    dispatch(getClassData({ schoolId, academicYearId }));
  }, [dispatch, canViewStudents, schoolId, academicYearId]);

  useEffect(() => { setSelectedSectionId("all"); }, [selectedClassId]);
  useEffect(() => { setPage(1); }, [selectedClassId, selectedSectionId]);

  const refetchStudents = () => {
    if (!canViewStudents || !schoolId) return;
    dispatch(fetchStudentsBySchoolId({
      schoolId,
      academicYearId,
      schoolClassId: selectedClassId !== "all" ? selectedClassId : undefined,
      sectionId: selectedSectionId !== "all" ? selectedSectionId : undefined,
      search: searchText || undefined,
      page,
      limit: pageSize,
    }));
  };

  useEffect(refetchStudents, [dispatch, canViewStudents, schoolId, academicYearId, selectedClassId, selectedSectionId, searchText, page, pageSize, isModalOpen]);

  const studentsArray = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (schoolStudents?.data) return schoolStudents.data;
    return [];
  }, [schoolStudents]);

  const formatted = useMemo(() =>
    studentsArray.map((s) => ({
      key: s._id,
      studentId:     s.student?._id,
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
      address:       s.student?.address    ?? "",
      academicYear:  s.academicYear?.name  ?? "N/A",
      status:        s.status              ?? "Active",
    })),
    [studentsArray]
  );

  const classOptions = useMemo(() => [
    { value: "all", label: "All Classes" },
    ...schoolClasses.map((c) => ({ value: c._id, label: c.name })),
  ], [schoolClasses]);

  const sectionOptions = useMemo(() => {
    const cls = schoolClasses.find((c) => String(c._id) === String(selectedClassId));
    const secs = cls?.sections || [];
    return [{ value: "all", label: "All Sections" }, ...secs.map((s) => ({ value: s._id, label: s.name }))];
  }, [schoolClasses, selectedClassId]);

  // Search/class/section filtering now happens server-side (see the fetch effect above) — the
  // page only ever holds the current page's rows, so there's nothing left to filter client-side.
  const filtered = formatted;

  const stats = useMemo(() => ({
    total:   schoolStudentsPagination?.total ?? formatted.length,
    classes: schoolClasses.length,
    showing: formatted.length,
  }), [schoolStudentsPagination, formatted, schoolClasses]);

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
      render: (v) => <span style={pill("var(--accent)")}>{v}</span>,
    },
    {
      title: "Section",
      dataIndex: "section",
      width: 90,
      render: (v) => <span style={pill("var(--success)")}>{v}</span>,
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
      render: (v) => <span style={pill("var(--warning)")}>{v}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s) => {
        const isActive  = s === "Active";
        const isPending = s === "Pending";
        const color = isActive ? "var(--success-hover)" : isPending ? "var(--warning-hover)" : "#991b1b";
        const dot   = isActive ? "var(--success)" : isPending ? "var(--warning)" : "var(--danger)";
        const dotRing = isActive ? "rgba(var(--success-rgb), 0.19)" : isPending ? "rgba(var(--warning-rgb), 0.19)" : "rgba(var(--danger-rgb), 0.19)";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, boxShadow: `0 0 0 2px ${dotRing}` }} />
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{s}</span>
          </div>
        );
      },
    },
    ...(canManageStudents
      ? [{
          title: "Actions",
          key: "actions",
          width: 100,
          fixed: "right",
          render: (_, record) => (
            <Space size={4}>
              <Tooltip title="Edit">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete this student?"
                description="This action cannot be undone."
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDelete(record)}
              >
                <Tooltip title="Delete">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          ),
        }]
      : []),
  ];

  const openEditModal = (record) => {
    setEditingStudent(record);
    editForm.setFieldsValue({
      mobileNumber: record.mobileNumber !== "N/A" ? record.mobileNumber : "",
      bloodGroup: record.bloodGroup !== "N/A" ? record.bloodGroup : undefined,
      status: record.status,
      address: record.address,
      dateOfBirth: record.dateOfBirth !== "N/A" ? dayjs(record.dateOfBirth) : null,
    });
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    editForm.resetFields();
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingStudent?.studentId) {
        message.error("Missing student reference, cannot update");
        return;
      }
      setSavingEdit(true);
      await dispatch(
        updateStudent({
          id: editingStudent.studentId,
          academicYearId,
          mobileNumber: values.mobileNumber,
          status: values.status,
          otherInfo: {
            bloodGroup: values.bloodGroup,
            address: values.address,
            dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
          },
        })
      ).unwrap();
      message.success("Student updated successfully");
      closeEditModal();
      refetchStudents();
    } catch (error) {
      if (error?.errorFields) return; // form validation error, already shown inline
      message.error(typeof error === "string" ? error : "Failed to update student");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (record) => {
    if (!record?.studentId) {
      message.error("Missing student reference, cannot delete");
      return;
    }
    try {
      await dispatch(deleteStudent(record.studentId)).unwrap();
      message.success("Student deleted successfully");
      refetchStudents();
    } catch (error) {
      message.error(typeof error === "string" ? error : "Failed to delete student");
    }
  };

  if (!canViewStudents) {
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
                onClick={() => refetchStudents()}
              />
            </Tooltip>
            <Button icon={<ExportOutlined />}>Export</Button>
            {user?.role?.name === "School Admin" && (
              <>
                <Button icon={<UploadOutlined />} onClick={() => setIsBulkImportOpen(true)}>
                  Bulk Import
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                  Add Student
                </Button>
              </>
            )}
          </Space>
        }
      />

      <div style={pageWrapper}>
        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={() => setIsModalOpen(false)}
          width={900}
          centered
          destroyOnClose
          title={null}
          styles={{ body: { padding: 0 }, content: { borderRadius: 16, overflow: "hidden", padding: 0 } }}
          closeIcon={
            <span style={{
              position: "absolute", top: 14, right: 16, zIndex: 10,
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, cursor: "pointer", backdropFilter: "blur(4px)",
            }}>✕</span>
          }
        >
          <AdmissionForm onClose={() => setIsModalOpen(false)} />
        </Modal>

        <Modal
          open={isBulkImportOpen}
          title="Bulk Import Students"
          onCancel={() => setIsBulkImportOpen(false)}
          footer={null}
          width={800}
          destroyOnClose
        >
          <BulkImportStudentsSheet
            schoolId={schoolId}
            academicYearId={academicYearId}
            classOptions={schoolClasses}
            onSuccess={refetchStudents}
          />
        </Modal>

        <Modal
          open={!!editingStudent}
          title={`Edit Student — ${editingStudent?.name ?? ""}`}
          onCancel={closeEditModal}
          onOk={handleEditSubmit}
          confirmLoading={savingEdit}
          okText="Save Changes"
          destroyOnClose
        >
          <Form form={editForm} layout="vertical">
            <Form.Item name="mobileNumber" label="Mobile Number">
              <Input placeholder="Mobile number" />
            </Form.Item>
            <Form.Item name="bloodGroup" label="Blood Group">
              <Select
                allowClear
                placeholder="Select blood group"
                options={Object.keys(bloodGroupColor).map((bg) => ({ value: bg, label: bg }))}
              />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of Birth">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Pending", label: "Pending" },
                ]}
              />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} placeholder="Address" />
            </Form.Item>
          </Form>
        </Modal>

        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            {/* KPI Stats */}
            <div className="stat-grid" style={statGrid(180)}>
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
            <div className="page-toolbar" style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Students
              </span>
              <div style={{ flex: 1 }} />
              <Input.Search
                placeholder="Search by name or email…"
                allowClear
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: 240 }}
              />
              <Select
                value={selectedClassId}
                options={classOptions}
                onChange={(v) => setSelectedClassId(v)}
                style={{ width: 140 }}
              />
              <Select
                value={selectedSectionId}
                options={sectionOptions}
                onChange={(v) => setSelectedSectionId(v)}
                disabled={selectedClassId === "all"}
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
                  {searchText || selectedClassId !== "all" ? "No students match your filters" : "No students enrolled yet"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {searchText || selectedClassId !== "all"
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
                  current: page,
                  pageSize,
                  total: schoolStudentsPagination?.total ?? formatted.length,
                  size: "small",
                  showSizeChanger: true,
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                  showTotal: (total, range) => (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{range[0]}–{range[1]} of {total} students</span>
                  ),
                }}
                scroll={{ x: canManageStudents ? 1100 : 1000 }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentList;

import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Table,
  Button,
  Input,
  Popconfirm,
  message,
  Select,
  Card,
  Typography,
  Space,
  ConfigProvider,
  Tag,
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  BookOutlined,
  GlobalOutlined,
  BankOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import SubjectForm from "../../../../components/forms/SubjectForm.jsx";
import { useDispatch, useSelector } from "react-redux";
import { getAllSubjects, deleteSubject } from "../../../../features/subjectSlice.js";
import * as XLSX from "xlsx";


const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

/* ─── Status Badge ─── */
function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: isActive ? "#f6ffed" : "#fff2f0",
      color: isActive ? "#52c41a" : "#ff4d4f",
      border: `1px solid ${isActive ? "#b7eb8f" : "#ffa39e"}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#52c41a" : "#ff4d4f",
        display: "inline-block",
      }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, accentColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        borderTop: `3px solid ${accentColor}`,
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
        cursor: "default",
        flex: 1,
      }}
      bodyStyle={{ padding: "18px 20px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{
            fontSize: 26, fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            color: "#141414", letterSpacing: -0.5,
          }}>{value}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: accentColor,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* ─── Subject Name Cell ─── */
function SubjectCell({ name }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: "#f0eeff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <BookOutlined style={{ color: "#6c5ce7", fontSize: 13 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#141414" }}>{name}</span>
    </div>
  );
}

/* ─── Type Chip ─── */
function TypeChip({ type }) {
  if (!type) return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
  const map = {
    theory:    { bg: "#e3f2fd", color: "#0984e3", border: "#9ed4f5" },
    practical: { bg: "#fff8e1", color: "#e65100", border: "#fdd7a0" },
    both:      { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
  };
  const s = map[type?.toLowerCase()] || { bg: "#f5f5f5", color: "#595959", border: "#d9d9d9" };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600,
      textTransform: "capitalize",
    }}>
      {type}
    </span>
  );
}

/* ─── Category Chip ─── */
function CategoryChip({ category }) {
  if (!category) return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
  return (
    <span style={{
      background: "#e8f5e9", color: "#00897b",
      border: "1px solid #a5d6a7",
      borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600,
    }}>
      {category}
    </span>
  );
}

/* ─── Marks Cell ─── */
function MarksCell({ max, pass }) {
  if (max == null && pass == null) return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
  return (
    <div>
      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#141414" }}>{max ?? "—"}</span>
      <span style={{ color: "#bfbfbf", fontSize: 11, margin: "0 4px" }}>/</span>
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#52c41a", fontWeight: 600 }}>{pass ?? "—"}</span>
    </div>
  );
}

/* ─── Scope Badge ─── */
function ScopeBadge({ isGlobal, schoolName }) {
  if (isGlobal) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#e3f2fd", color: "#0984e3",
        border: "1px solid #9ed4f5",
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
      }}>
        <GlobalOutlined style={{ fontSize: 10 }} /> Global
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#f5f5f5", color: "#595959",
      border: "1px solid #d9d9d9",
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500,
    }}>
      <BankOutlined style={{ fontSize: 10 }} />
      {schoolName || "School"}
    </span>
  );
}

/* ─── Main Component ─── */
const SubjectsAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const dispatch = useDispatch();
  const { subjects = [], loading } = useSelector((state) => state.subject);
  const { schools = [] } = useSelector((state) => state.school);
  const { user } = useSelector((state) => state.auth);
 
  const schoolId = user?.school?._id || "";
  const role = user?.role?.name || "";
  const isSuperAdmin = role === "Super Admin";

  useEffect(() => {
  if (schoolId || isSuperAdmin) {
    dispatch(
      getAllSubjects({
        schoolId: isSuperAdmin ? selectedSchool : schoolId,
      })
    );
  }
}, [dispatch, schoolId, isSuperAdmin, selectedSchool]);

  /* ── Filtered Data ── */
  const roleFiltered = isSuperAdmin
    ? subjects
    : subjects.filter(
        (s) => s.isGlobal === true || String(s.schoolId?._id || s.schoolId) === String(schoolId)
      );

  const filtered = useMemo(() => {
    return roleFiltered.filter((s) => {
      const matchSearch =
        !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSchool =
        !selectedSchool ||
        String(s.schoolId?._id || s.schoolId) === String(selectedSchool);
      const matchStatus =
        statusFilter === "" ? true : statusFilter === "active" ? s.isActive : !s.isActive;
      const matchType =
        !typeFilter || s.type?.toLowerCase() === typeFilter.toLowerCase();
      return matchSearch && matchSchool && matchStatus && matchType;
    });
  }, [roleFiltered, searchTerm, selectedSchool, statusFilter, typeFilter]);

  /* ── Stats ── */
  const total = roleFiltered.length;
  const activeCount = roleFiltered.filter((s) => s.isActive).length;
  const globalCount = roleFiltered.filter((s) => s.isGlobal).length;
  const assignedCount = roleFiltered.filter((s) => s.teacherId?.name).length;

  /* ── Handlers ── */
  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

 const handleDelete = async (id) => {
  try {
    await dispatch(deleteSubject(id)).unwrap();
    message.success("Subject deleted successfully");
  } catch (err) {
    message.error(err || "Delete failed");
  }
};

  const handleExport = () => {
    const exportData = filtered.map((s) => ({
      "Subject Name": s.name,
      Category: s.category || "—",
      Type: s.type || "—",
      "Max Marks": s.maxMarks ?? "—",
      "Pass Marks": s.passMarks ?? "—",
      Teacher: s.teacherId?.name || "Not Assigned",
      School: s.schoolId?.name || (s.isGlobal ? "Global" : "—"),
      Status: s.isActive ? "Active" : "Inactive",
      "Created Type": s.isGlobal ? "Global" : "School",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subjects");
    XLSX.writeFile(wb, "Subjects_List.xlsx");
    message.success("Exported successfully");
  };

  /* ── Columns ── */
  const columns = [
    {
      title: "Subject",
      dataIndex: "name",
      width: 200,
      render: (name) => <SubjectCell name={name} />,
    },
    {
      title: "Category",
      dataIndex: "category",
      width: 130,
      render: (cat) => <CategoryChip category={cat} />,
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 110,
      render: (type) => <TypeChip type={type} />,
    },
    {
      title: "Marks (Max / Pass)",
      width: 140,
      render: (_, r) => <MarksCell max={r.maxMarks} pass={r.passMarks} />,
    },
    {
      title: "Teacher",
      dataIndex: ["teacherId", "name"],
      width: 150,
      render: (name) =>
        name ? (
          <span style={{ fontSize: 13, color: "#141414", fontWeight: 500 }}>{name}</span>
        ) : (
          <span style={{
            fontSize: 11, color: "#fa8c16",
            background: "#fff7e6", border: "1px solid #ffd591",
            borderRadius: 20, padding: "2px 9px", fontWeight: 500,
          }}>
            Unassigned
          </span>
        ),
    },
    {
      title: "Scope",
      width: 150,
      render: (_, r) => <ScopeBadge isGlobal={r.isGlobal} schoolName={r.schoolId?.name} />,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      width: 110,
      render: (isActive) => <StatusBadge isActive={isActive} />,
    },
    {
      title: "Actions",
      width: 130,
      align: "right",
      render: (_, record) => (
        <Space size={6}>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            style={{
              borderRadius: 8, fontWeight: 600, fontSize: 12,
              background: "#f0eeff", borderColor: "#d3cdf7", color: "#6c5ce7",
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Subject?"
            description={`Are you sure you want to delete this subject?`}
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              style={{
                borderRadius: 8, fontWeight: 600, fontSize: 12,
                background: "#fff2f0", borderColor: "#ffa39e", color: "#ff4d4f",
              }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6c5ce7",
          borderRadius: 12,
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        },
      }}
    >
      <Layout style={{ background: "#f5f6fa", minHeight: "100vh" }}>

        {/* ── Page Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
          padding: "20px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Subjects Management</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
              Manage subjects for your school or global context
            </div>
          </div>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              style={{
                borderRadius: 10, fontWeight: 600, height: 38,
                background: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            >
              Export Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "#6c5ce7", borderColor: "#6c5ce7",
                borderRadius: 10, fontWeight: 600, height: 38, paddingInline: 20,
              }}
            >
              Add New Subject
            </Button>
          </Space>
        </div>

        <Content style={{ padding: "20px 24px" }}>

          {/* ── Stats ── */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="Total Subjects"    value={total}         icon={<ReadOutlined />}         accentColor="#6c5ce7" />
            <StatCard label="Active Subjects"   value={activeCount}   icon={<CheckCircleOutlined />}  accentColor="#00b894" />
            <StatCard label="Global Subjects"   value={globalCount}   icon={<GlobalOutlined />}       accentColor="#0984e3" />
            <StatCard label="Teacher Assigned"  value={assignedCount} icon={<TeamOutlined />}         accentColor="#e17055" />
          </div>

          {/* ── Table Card ── */}
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Filter Bar */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap",
              gap: 10, padding: "16px 20px",
              borderBottom: "1px solid #f5f5f5",
            }}>
              <Space wrap>
                <Input
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Search subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 220, borderRadius: 10 }}
                  allowClear
                />
                {isSuperAdmin && (
                  <Select
                    placeholder="Filter by School"
                    allowClear
                    value={selectedSchool || undefined}
                    onChange={(v) => setSelectedSchool(v || "")}
                    style={{ width: 180, borderRadius: 10 }}
                    showSearch
                    optionFilterProp="children"
                    suffixIcon={<BankOutlined style={{ fontSize: 11 }} />}
                  >
                    {schools.map((s) => (
                      <Option key={s._id} value={s._id}>{s.name}</Option>
                    ))}
                  </Select>
                )}
                <Select
                  placeholder="All Types"
                  allowClear
                  value={typeFilter || undefined}
                  onChange={(v) => setTypeFilter(v ?? "")}
                  style={{ width: 140, borderRadius: 10 }}
                  suffixIcon={<FilterOutlined style={{ fontSize: 11 }} />}
                >
                  <Option value="theory">Theory</Option>
                  <Option value="practical">Practical</Option>
                  <Option value="both">Both</Option>
                </Select>
                <Select
                  placeholder="All Status"
                  allowClear
                  value={statusFilter || undefined}
                  onChange={(v) => setStatusFilter(v ?? "")}
                  style={{ width: 140, borderRadius: 10 }}
                  suffixIcon={<FilterOutlined style={{ fontSize: 11 }} />}
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> subjects
              </Text>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={filtered}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showSizeChanger: false,
                  style: { padding: "12px 20px" },
                }}
                onRow={(_, index) => ({
                  style: { background: index % 2 === 0 ? "#fff" : "#fafafa" },
                  onMouseEnter: (e) => (e.currentTarget.style.background = "#f0eeff22"),
                  onMouseLeave: (e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafafa"),
                })}
                style={{ borderRadius: 0 }}
                scroll={{ x: 1100 }}
              />
            </div>
          </Card>
        </Content>

        {/* ── Subject Form Modal ── */}
        <SubjectForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubject(null);
          }}
          editData={selectedSubject}
        />

      </Layout>
    </ConfigProvider>
  );
};

export default SubjectsAdmin;
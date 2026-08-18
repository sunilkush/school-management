import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Popconfirm,
  message,
  Select,
  Typography,
  Space,
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
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import { useDispatch, useSelector } from "react-redux";
import { getAllSubjects, deleteSubject } from "../../../features/subjectSlice.js";
import * as XLSX from "xlsx";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  toolbarRow,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";

const { Text } = Typography;
const { Option } = Select;

/* ─── Status Badge ─── */
function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: isActive ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)",
      color: isActive ? "var(--success)" : "var(--danger)",
      border: `1px solid ${isActive ? "rgba(220,252,231,0.5)" : "rgba(254,226,226,0.5)"}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "var(--success)" : "var(--danger)",
        display: "inline-block",
      }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, accentColor }) {
  return (
    <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
      <div style={iconWell(accentColor, 42)}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Subject Name Cell ─── */
function SubjectCell({ name }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: "rgba(20,184,166,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <BookOutlined style={{ color: "var(--accent)", fontSize: 13 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
    </div>
  );
}

/* ─── Type Chip ─── */
function TypeChip({ type }) {
  if (!type) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  const map = {
    theory:    { bg: "#e3f2fd", color: "#0984e3", border: "#9ed4f5" },
    practical: { bg: "#fff8e1", color: "#e65100", border: "#fdd7a0" },
    both:      { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
  };
  const s = map[type?.toLowerCase()] || { bg: "var(--surface-soft)", color: "var(--text-muted)", border: "var(--border-muted)" };
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
  if (!category) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
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
  if (max == null && pass == null) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  return (
    <div>
      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{max ?? "—"}</span>
      <span style={{ color: "var(--text-muted)", fontSize: 11, margin: "0 4px" }}>/</span>
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--success)", fontWeight: 600 }}>{pass ?? "—"}</span>
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
      background: "var(--surface-soft)", color: "var(--text-muted)",
      border: "1px solid var(--border-muted)",
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
          <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{name}</span>
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
              background: "rgba(20,184,166,0.2)", borderColor: "rgba(20,184,166,0.5)", color: "var(--accent)",
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
                background: "rgba(254,226,226,0.2)", borderColor: "rgba(254,226,226,0.5)", color: "var(--danger)",
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
    <div style={pageWrapper}>
      <PageHeader
        title="Subjects Management"
        subtitle="Manage subjects for your school or global context"
        icon={<ReadOutlined />}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Add New Subject
            </Button>
          </Space>
        }
      />

      {/* ── Stats ── */}
      <div style={{ ...statGrid(180), marginTop: 20 }}>
        <StatCard label="Total Subjects"    value={total}         icon={<ReadOutlined />}         accentColor="var(--accent)" />
        <StatCard label="Active Subjects"   value={activeCount}   icon={<CheckCircleOutlined />}  accentColor="#00b894" />
        <StatCard label="Global Subjects"   value={globalCount}   icon={<GlobalOutlined />}       accentColor="#0984e3" />
        <StatCard label="Teacher Assigned"  value={assignedCount} icon={<TeamOutlined />}         accentColor="#e17055" />
      </div>

      <style>{tableHeadCss("subjects-tbl")}</style>

      {/* ── Table Card ── */}
      <div style={{ ...sectionPanel, padding: 0 }}>
        {/* Filter Bar */}
        <div style={{
          ...toolbarRow,
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-muted)",
          marginBottom: 0,
        }}>
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            {isSuperAdmin && (
              <Select
                placeholder="Filter by School"
                allowClear
                value={selectedSchool || undefined}
                onChange={(v) => setSelectedSchool(v || "")}
                style={{ width: 180 }}
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
              style={{ width: 140 }}
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
              style={{ width: 140 }}
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
        <div className="subjects-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0, overflowX: "auto" }}>
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
            scroll={{ x: 1100 }}
          />
        </div>
      </div>

      {/* ── Subject Form Modal ── */}
      <SubjectForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
        }}
        editData={selectedSubject}
      />
    </div>
  );
};

export default SubjectsAdmin;

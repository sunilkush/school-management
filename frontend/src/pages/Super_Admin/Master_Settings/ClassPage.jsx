import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Button,
  Table,
  Modal,
  Select,
  Switch,
  Space,
  Empty,
  Tooltip,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  BookOutlined,
  CodeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createClass,
  fetchAllClasses,
  updateClass,
  deleteClass,
} from "../../../features/classSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  toolbarRow, tableContainer, tableHeadCss, modalTitle, avatarStyle,
} from "../../../styles/pageStyles";

const INIT = {
  name: "",
  code: "",
  description: "",
  status: "active",
  isActive: true,
  isGlobal: false,
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

export default function ClassPage() {
  const dispatch = useDispatch();
  const { classList = [], loading: classLoading } = useSelector((s) => s.class);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INIT);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState(INIT);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch]);

  const handleChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleEditChange = (field, value) =>
    setEditData((p) => ({ ...p, [field]: value }));

  const resetForm = () => setFormData(INIT);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      message.error("Class name is required");
      return;
    }

    setSaving(true);
    try {
      await dispatch(createClass(formData)).unwrap();
      await dispatch(fetchAllClasses());
      message.success("Class created successfully");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to create class");
    } finally {
      setSaving(false);
      resetForm();
      setOpen(false);
    }
  };

  const handleOpenEdit = (record) => {
    setEditingId(record._id);
    setEditData({
      name: record.name || "",
      code: record.code || "",
      description: record.description || "",
      status: record.status || "active",
      isActive: record.isActive ?? true,
      isGlobal: record.isGlobal ?? false,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editData.name?.trim()) {
      message.error("Class name is required");
      return;
    }
    setEditSaving(true);
    try {
      await dispatch(updateClass({ id: editingId, data: editData })).unwrap();
      message.success("Class updated successfully");
      setEditOpen(false);
      setEditingId(null);
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update class");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteClass(id)).unwrap();
      message.success("Class deleted successfully");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to delete class");
    }
  };

  const filteredClasses = useMemo(() => {
    return classList.filter((item) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        !keyword ||
        item?.name?.toLowerCase().includes(keyword) ||
        item?.code?.toLowerCase().includes(keyword);

      const matchStatus = !status || item.status === status;

      return matchSearch && matchStatus;
    });
  }, [classList, search, status]);

  const stats = useMemo(() => {
    const total = classList.length;
    const active = classList.filter((c) => c.status === "active").length;
    const inactive = total - active;
    const global = classList.filter((c) => c.isGlobal).length;

    return { total, active, inactive, global };
  }, [classList]);

  const columns = [
    {
      title: "Class",
      dataIndex: "name",
      render: (name, row) => (
        <Space>
          <div style={avatarStyle(name, 36)}>{name?.[0]?.toUpperCase() || "C"}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{name || "-"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.description || "No description"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      render: (code) => (
        <span style={{
          fontFamily: "monospace", background: "var(--surface-soft)",
          border: "1px solid var(--border-muted)", padding: "4px 10px",
          borderRadius: 999, color: "var(--primary)", fontSize: 12,
        }}>
          <CodeOutlined /> {code || "N/A"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => value === "active"
        ? <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>Active</span>
        : <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}>Inactive</span>,
    },
    {
      title: "Scope",
      dataIndex: "isGlobal",
      render: (value) => value
        ? <span style={pill("var(--primary)", "rgba(219,234,254,0.4)")}><GlobalOutlined /> Global</span>
        : <span style={pill("var(--text-muted)")}><HomeOutlined /> Local</span>,
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Edit class">
            <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenEdit(record)}>
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this class?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
            placement="topRight"
          >
            <Tooltip title="Delete class">
              <Button icon={<DeleteOutlined />} size="small" danger>Delete</Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Class Management"
        subtitle="Academic classes ko create, search aur manage karein"
        icon={<BookOutlined />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchAllClasses())}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add Class</Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<BookOutlined />} label="Total Classes" value={stats.total} color="var(--primary)" />
        <StatCard icon={<CheckCircleOutlined />} label="Active Classes" value={stats.active} color="var(--success)" />
        <StatCard icon={<CloseCircleOutlined />} label="Inactive Classes" value={stats.inactive} color="var(--danger)" />
        <StatCard icon={<GlobalOutlined />} label="Global Classes" value={stats.global} color="var(--accent)" />
      </div>

      <style>{tableHeadCss("class-page-tbl")}</style>

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <BookOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Class List</span>
          <span style={pill("var(--primary)")}>{filteredClasses.length}</span>
        </div>

        <div style={{ ...toolbarRow, marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by class name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Filter status"
            value={status || undefined}
            onChange={(v) => setStatus(v || "")}
            style={{ width: 160 }}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </div>

        <div className="class-page-tbl" style={tableContainer}>
          <Table
            columns={columns}
            dataSource={filteredClasses}
            loading={classLoading}
            rowKey="_id"
            scroll={{ x: 850 }}
            locale={{ emptyText: <Empty description="No classes found" /> }}
            pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 32] }}
          />
        </div>
      </div>

      {/* ── Create Modal ── */}
      <Modal
        title={modalTitle(<BookOutlined />, "Create New Class")}
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        width={620}
        destroyOnClose
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginTop: 16 }}>
          <div style={{ gridColumn: "span 1" }}>
            <span style={{ fontWeight: 600 }}>Class Name</span>
            <Input
              size="large"
              placeholder="e.g. Class 10"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 600 }}>Class Code</span>
            <Input
              size="large"
              placeholder="e.g. CLS-10"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ fontWeight: 600 }}>Description</span>
            <Input.TextArea
              placeholder="Short description about this class..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              style={{ marginTop: 6 }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 600 }}>Status</span>
            <Select
              size="large"
              style={{ width: "100%", marginTop: 6 }}
              value={formData.status}
              onChange={(v) => handleChange("status", v)}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          <div>
            <span style={{ fontWeight: 600 }}>Scope</span>
            <div style={{
              marginTop: 6, height: 40, border: "1px solid var(--border-muted)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 12px", background: "var(--surface-soft)",
            }}>
              <span style={{ color: "var(--text-muted)" }}>Make global</span>
              <Switch checked={formData.isGlobal} onChange={(v) => handleChange("isGlobal", v)} />
            </div>
          </div>
        </div>

        <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 22 }}>
          <Button onClick={() => { resetForm(); setOpen(false); }}>Cancel</Button>
          <Button icon={<ReloadOutlined />} onClick={resetForm}>Reset</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>Save Class</Button>
        </Space>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        title={modalTitle(<EditOutlined />, "Edit Class")}
        open={editOpen}
        footer={null}
        onCancel={() => { setEditOpen(false); setEditingId(null); }}
        width={620}
        destroyOnClose
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginTop: 16 }}>
          <div>
            <span style={{ fontWeight: 600 }}>Class Name</span>
            <Input
              size="large"
              placeholder="e.g. Class 10"
              value={editData.name}
              onChange={(e) => handleEditChange("name", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 600 }}>Class Code</span>
            <Input
              size="large"
              placeholder="e.g. CLS-10"
              value={editData.code}
              onChange={(e) => handleEditChange("code", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ fontWeight: 600 }}>Description</span>
            <Input.TextArea
              placeholder="Short description about this class..."
              value={editData.description}
              onChange={(e) => handleEditChange("description", e.target.value)}
              rows={3}
              style={{ marginTop: 6 }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 600 }}>Status</span>
            <Select
              size="large"
              style={{ width: "100%", marginTop: 6 }}
              value={editData.status}
              onChange={(v) => handleEditChange("status", v)}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          <div>
            <span style={{ fontWeight: 600 }}>Scope</span>
            <div style={{
              marginTop: 6, height: 40, border: "1px solid var(--border-muted)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 12px", background: "var(--surface-soft)",
            }}>
              <span style={{ color: "var(--text-muted)" }}>Make global</span>
              <Switch checked={editData.isGlobal} onChange={(v) => handleEditChange("isGlobal", v)} />
            </div>
          </div>
        </div>

        <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 22 }}>
          <Button onClick={() => { setEditOpen(false); setEditingId(null); }}>Cancel</Button>
          <Button type="primary" loading={editSaving} onClick={handleEditSave}>Update Class</Button>
        </Space>
      </Modal>
    </div>
  );
}

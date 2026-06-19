import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Spin,
  Empty,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../../../features/designationSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  toolbarRow,
  tableHeadCss,
  statGrid,
  statCard,
  statLabel,
  statValue,
  pill,
  iconWell,
  modalTitle,
} from "../../../styles/pageStyles";

const { Option } = Select;
const { TextArea } = Input;

/* ── Level badge colours ─────────────────────────────────────────── */
const LEVEL_STYLE = {
  Senior: { color: "#14B8A6", bg: "rgba(20,184,166,0.2)" },
  Mid: { color: "#2563EB", bg: "rgba(219,234,254,0.2)" },
  Junior: { color: "#22C55E", bg: "rgba(220,252,231,0.2)" },
};

function LevelBadge({ level }) {
  const style = LEVEL_STYLE[level] || { color: "#64748b", bg: "#f1f5f9" };
  return (
    <span style={pill(style.color, style.bg)}>
      {level || "—"}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "Active" || status === "active";
  return (
    <span style={pill(isActive ? "#22C55E" : "#EF4444", isActive ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)")}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isActive ? "#22C55E" : "#EF4444",
          display: "inline-block",
          marginRight: 5,
        }}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function DesignationCell({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={iconWell("var(--primary)", 32)}>
        <IdcardOutlined style={{ fontSize: 14 }} />
      </div>
      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{title}</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function Designations() {
  const dispatch = useDispatch();
  const { designations, loading, error } = useSelector((s) => s.designations);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  /* Fetch on mount */
  useEffect(() => {
    dispatch(fetchDesignations());
  }, [dispatch]);

  /* Show API errors */
  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  /* Filtered list */
  const filtered = useMemo(() => {
    const list = Array.isArray(designations) ? designations : [];
    return list.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q);
      const matchLevel = !levelFilter || d.level === levelFilter;
      const matchStatus =
        !statusFilter ||
        d.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchLevel && matchStatus;
    });
  }, [designations, search, levelFilter, statusFilter]);

  /* Stat counts */
  const total = Array.isArray(designations) ? designations.length : 0;
  const active = Array.isArray(designations)
    ? designations.filter((d) => d.status === "Active" || d.status === "active").length
    : 0;
  const inactive = total - active;
  const seniorCount = Array.isArray(designations)
    ? designations.filter((d) => d.level === "Senior").length
    : 0;

  /* ── Modal helpers ── */
  const openAdd = () => {
    setIsEdit(false);
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: "Active", level: "Mid" });
    setOpen(true);
  };

  const openEdit = (record) => {
    setIsEdit(true);
    setEditingId(record._id);
    form.setFieldsValue({
      title: record.title,
      level: record.level,
      description: record.description,
      status: record.status,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    form.resetFields();
  };

  /* ── Submit ── */
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await dispatch(updateDesignation({ id: editingId, data: values })).unwrap();
        message.success("Designation updated successfully");
      } else {
        await dispatch(createDesignation(values)).unwrap();
        message.success("Designation created successfully");
      }
      closeModal();
    } catch (err) {
      message.error(err || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteDesignation(id)).unwrap();
      message.success("Designation deleted");
    } catch (err) {
      message.error(err || "Failed to delete designation");
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: "#",
      width: 52,
      render: (_, __, i) => (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</span>
      ),
    },
    {
      title: "Designation",
      render: (_, record) => <DesignationCell title={record.title} />,
    },
    {
      title: "Level",
      dataIndex: "level",
      width: 110,
      render: (level) => <LevelBadge level={level} />,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v) =>
        v ? (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v}</span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: "Actions",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <button
            onClick={() => openEdit(record)}
            style={{
              background: "var(--primary-light)",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
            title="Edit"
          >
            <EditOutlined style={{ fontSize: 13 }} />
          </button>
          <Popconfirm
            title="Delete Designation"
            description="Are you sure you want to delete this designation?"
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <button
              style={{
                background: "rgba(254,226,226,0.2)",
                border: "none",
                borderRadius: 8,
                width: 30,
                height: 30,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EF4444",
              }}
              title="Delete"
            >
              <DeleteOutlined style={{ fontSize: 13 }} />
            </button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("desig-table")}</style>

      {/* Header */}
      <PageHeader
        title="Designations"
        subtitle="Manage job titles and seniority levels"
        icon={<IdcardOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAdd}
            style={{ fontWeight: 600, borderRadius: 10 }}
          >
            Add Designation
          </Button>
        }
      />

      {/* Stat cards */}
      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <div style={statCard({ color: "var(--primary)" })}>
          <div>
            <div style={statLabel("var(--primary)")}>Total</div>
            <div style={statValue("var(--primary)")}>{total}</div>
          </div>
          <UserOutlined style={{ fontSize: 26, color: "var(--primary)", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#22C55E" })}>
          <div>
            <div style={statLabel("#22C55E")}>Active</div>
            <div style={statValue("#22C55E")}>{active}</div>
          </div>
          <CheckCircleOutlined style={{ fontSize: 26, color: "#22C55E", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#EF4444" })}>
          <div>
            <div style={statLabel("#EF4444")}>Inactive</div>
            <div style={statValue("#EF4444")}>{inactive}</div>
          </div>
          <StopOutlined style={{ fontSize: 26, color: "#EF4444", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#14B8A6" })}>
          <div>
            <div style={statLabel("#14B8A6")}>Senior Level</div>
            <div style={statValue("#14B8A6")}>{seniorCount}</div>
          </div>
          <IdcardOutlined style={{ fontSize: 26, color: "#14B8A6", opacity: 0.4 }} />
        </div>
      </div>

      {/* Table card */}
      <div style={pageCard}>
        {/* Toolbar */}
        <div
          style={{
            ...toolbarRow,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-muted)",
            marginBottom: 0,
            justifyContent: "space-between",
          }}
        >
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search designations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="All Levels"
              allowClear
              value={levelFilter || undefined}
              onChange={(v) => setLevelFilter(v ?? "")}
              style={{ width: 140 }}
            >
              <Option value="Senior">Senior</Option>
              <Option value="Mid">Mid</Option>
              <Option value="Junior">Junior</Option>
            </Select>
            <Select
              placeholder="All Status"
              allowClear
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v ?? "")}
              style={{ width: 140 }}
            >
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Space>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Showing <strong>{filtered.length}</strong> of <strong>{total}</strong>
          </span>
        </div>

        {/* Table */}
        <Spin spinning={loading}>
          {!loading && filtered.length === 0 ? (
            <div style={{ padding: "48px 24px" }}>
              <Empty description="No designations found" />
            </div>
          ) : (
            <Table
              className="desig-table"
              rowKey="_id"
              columns={columns}
              dataSource={filtered}
              loading={false}
              scroll={{ x: "max-content" }}
              pagination={{
                pageSize: 10,
                size: "small",
                showSizeChanger: false,
                style: { padding: "12px 20px" },
              }}
            />
          )}
        </Spin>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        title={modalTitle(
          <IdcardOutlined />,
          isEdit ? "Update Designation" : "Add Designation",
          isEdit ? "Edit designation details" : "Create a new designation"
        )}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          style={{ marginTop: 16 }}
          initialValues={{ status: "Active", level: "Mid" }}
        >
          <Form.Item
            name="title"
            label="Designation Title"
            rules={[{ required: true, message: "Designation title is required" }]}
          >
            <Input placeholder="e.g. Principal, Teacher, Accountant" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: "Level is required" }]}
          >
            <Select placeholder="Select level">
              <Option value="Senior">Senior</Option>
              <Option value="Mid">Mid</Option>
              <Option value="Junior">Junior</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={3}
              placeholder="Brief description of the designation..."
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <Button onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ fontWeight: 600 }}
            >
              {isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

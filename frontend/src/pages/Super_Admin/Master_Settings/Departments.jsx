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
  ApartmentOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../features/departmentSlice";
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

/* ── Status badge ──────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const isActive = status === "Active" || status === "active";
  return (
    <span style={pill(isActive ? "var(--success)" : "var(--danger)", isActive ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)")}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isActive ? "var(--success)" : "var(--danger)",
          display: "inline-block",
          marginRight: 5,
        }}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ── Department name cell ──────────────────────────────────────────── */
function DeptCell({ name, code }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={iconWell("var(--primary)", 32)}>
        <ApartmentOutlined style={{ fontSize: 14 }} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{name}</div>
        {code && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{code}</div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
export default function Departments() {
  const dispatch = useDispatch();
  const { departments, loading, error } = useSelector((s) => s.departments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  /* Fetch on mount */
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  /* Show API errors */
  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  /* Derived / filtered list */
  const filtered = useMemo(() => {
    const list = Array.isArray(departments) ? departments : [];
    return list.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        d.head?.toLowerCase().includes(q);
      const matchStatus =
        !statusFilter ||
        d.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [departments, search, statusFilter]);

  /* Stat counts */
  const total = Array.isArray(departments) ? departments.length : 0;
  const active = Array.isArray(departments)
    ? departments.filter((d) => d.status === "Active" || d.status === "active").length
    : 0;
  const inactive = total - active;

  /* ── Modal helpers ── */
  const openAdd = () => {
    setIsEdit(false);
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: "Active" });
    setOpen(true);
  };

  const openEdit = (record) => {
    setIsEdit(true);
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      head: record.head,
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
        await dispatch(updateDepartment({ id: editingId, data: values })).unwrap();
        message.success("Department updated successfully");
      } else {
        await dispatch(createDepartment(values)).unwrap();
        message.success("Department created successfully");
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
      await dispatch(deleteDepartment(id)).unwrap();
      message.success("Department deleted");
    } catch (err) {
      message.error(err || "Failed to delete department");
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
      title: "Department",
      render: (_, record) => <DeptCell name={record.name} code={record.code} />,
    },
    {
      title: "Head",
      dataIndex: "head",
      render: (v) =>
        v ? (
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v}</span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
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
            title="Delete Department"
            description="Are you sure you want to delete this department?"
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
                color: "var(--danger)",
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
      <style>{tableHeadCss("dept-table")}</style>

      {/* Header */}
      <PageHeader
        title="Departments"
        subtitle="Manage all academic and administrative departments"
        icon={<ApartmentOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAdd}
            style={{ fontWeight: 600, borderRadius: 10 }}
          >
            Add Department
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
          <ApartmentOutlined style={{ fontSize: 26, color: "var(--primary)", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "var(--success)" })}>
          <div>
            <div style={statLabel("var(--success)")}>Active</div>
            <div style={statValue("var(--success)")}>{active}</div>
          </div>
          <CheckCircleOutlined style={{ fontSize: 26, color: "var(--success)", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "var(--danger)" })}>
          <div>
            <div style={statLabel("var(--danger)")}>Inactive</div>
            <div style={statValue("var(--danger)")}>{inactive}</div>
          </div>
          <StopOutlined style={{ fontSize: 26, color: "var(--danger)", opacity: 0.4 }} />
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
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
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
              <Empty description="No departments found" />
            </div>
          ) : (
            <Table
              className="dept-table"
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
          <ApartmentOutlined />,
          isEdit ? "Update Department" : "Add Department",
          isEdit ? "Edit department details" : "Create a new department"
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
          initialValues={{ status: "Active" }}
        >
          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: "Department name is required" }]}
          >
            <Input placeholder="e.g. Science, Mathematics" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Department Code"
          >
            <Input placeholder="e.g. SCI, MATH" style={{ textTransform: "uppercase" }} />
          </Form.Item>

          <Form.Item
            name="head"
            label="Department Head"
            rules={[{ required: true, message: "Head name is required" }]}
          >
            <Input placeholder="e.g. Mr. Sharma" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={3}
              placeholder="Brief description of the department..."
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

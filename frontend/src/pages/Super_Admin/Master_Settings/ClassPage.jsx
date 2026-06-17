import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Button,
  Table,
  Modal,
  Select,
  Switch,
  Tag,
  Typography,
  Card,
  Row,
  Col,
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

const { Title, Text } = Typography;

const INIT = {
  name: "",
  code: "",
  description: "",
  status: "active",
  isActive: true,
  isGlobal: false,
};

const css = `
.class-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #fdf2f8 100%);
}

.class-hero {
  background: #ffffffcc;
  backdrop-filter: blur(14px);
  border: 1px solid #e2e8f0;
  border-radius: 26px;
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.class-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
}

.metric-card {
  border-radius: 22px !important;
  box-shadow: 0 10px 30px rgba(15,23,42,0.06);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.table-card {
  border-radius: 24px !important;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.class-avatar {
  width: 36px;
  height: 36px;
  border-radius: 13px;
  background: #e0f2fe;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.code-pill {
  font-family: monospace;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 4px 10px;
  border-radius: 999px;
  color: #475569;
}

.class-modal .ant-modal-content {
  border-radius: 24px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .class-page {
    padding: 14px;
  }
}
`;

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
      title: "#",
      width: 70,
      render: (_, __, i) => (
        <Text type="secondary">{String(i + 1).padStart(2, "0")}</Text>
      ),
    },
    {
      title: "Class",
      dataIndex: "name",
      render: (name, row) => (
        <Space>
          <div className="class-avatar">{name?.[0]?.toUpperCase() || "C"}</div>
          <div>
            <Text strong>{name || "-"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.description || "No description"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      render: (code) => (
        <span className="code-pill">
          <CodeOutlined /> {code || "N/A"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) =>
        value === "active" ? (
          <Tag color="success" style={{ borderRadius: 999 }}>
            Active
          </Tag>
        ) : (
          <Tag color="error" style={{ borderRadius: 999 }}>
            Inactive
          </Tag>
        ),
    },
    {
      title: "Scope",
      dataIndex: "isGlobal",
      render: (value) =>
        value ? (
          <Tag icon={<GlobalOutlined />} color="blue" style={{ borderRadius: 999 }}>
            Global
          </Tag>
        ) : (
          <Tag icon={<HomeOutlined />} style={{ borderRadius: 999 }}>
            Local
          </Tag>
        ),
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Edit class">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenEdit(record)}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 12,
                background: "#e0e7ff",
                borderColor: "#c7d2fe",
                color: "#4f46e5",
              }}
            >
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
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Delete
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="class-page">
        <div className="class-hero">
          <Row gutter={[16, 16]} justify="space-between" align="middle">
            <Col xs={24} md={12}>
              <Space align="center">
                <div className="class-icon">
                  <BookOutlined />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    Class Management
                  </Title>
                  <Text type="secondary">
                    Academic classes ko create, search aur manage karein.
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchAllClasses())}>
                  Refresh
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                  Add Class
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="metric-card">
              <Space>
                <div className="metric-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                  <BookOutlined />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>{stats.total}</Title>
                  <Text type="secondary">Total Classes</Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="metric-card">
              <Space>
                <div className="metric-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                  <CheckCircleOutlined />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>{stats.active}</Title>
                  <Text type="secondary">Active Classes</Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="metric-card">
              <Space>
                <div className="metric-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <CloseCircleOutlined />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>{stats.inactive}</Title>
                  <Text type="secondary">Inactive Classes</Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="metric-card">
              <Space>
                <div className="metric-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                  <GlobalOutlined />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>{stats.global}</Title>
                  <Text type="secondary">Global Classes</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          className="table-card"
          title={
            <Space>
              <BookOutlined style={{ color: "#4f46e5" }} />
              <span>Class List</span>
              <Tag color="blue">{filteredClasses.length}</Tag>
            </Space>
          }
        >
          <Row gutter={[12, 12]} justify="space-between" style={{ marginBottom: 16 }}>
            <Col xs={24} md={14}>
              <Space wrap>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
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
              </Space>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={filteredClasses}
            loading={classLoading}
            rowKey="_id"
            scroll={{ x: 850 }}
            locale={{ emptyText: <Empty description="No classes found" /> }}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              pageSizeOptions: [8, 16, 32],
            }}
          />
        </Card>
      </div>

      {/* ── Create Modal ── */}
      <Modal
        title={
          <Space>
            <BookOutlined style={{ color: "#4f46e5" }} />
            <span>Create New Class</span>
          </Space>
        }
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        className="class-modal"
        width={620}
        destroyOnClose
      >
        <Row gutter={[14, 10]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Text strong>Class Name</Text>
            <Input
              size="large"
              placeholder="e.g. Class 10"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </Col>

          <Col xs={24} md={12}>
            <Text strong>Class Code</Text>
            <Input
              size="large"
              placeholder="e.g. CLS-10"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </Col>

          <Col xs={24}>
            <Text strong>Description</Text>
            <Input.TextArea
              placeholder="Short description about this class..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              style={{ marginTop: 6 }}
            />
          </Col>

          <Col xs={24} md={12}>
            <Text strong>Status</Text>
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
          </Col>

          <Col xs={24} md={12}>
            <Text strong>Scope</Text>
            <div
              style={{
                marginTop: 6,
                height: 40,
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                background: "#f8fafc",
              }}
            >
              <Text type="secondary">Make global</Text>
              <Switch
                checked={formData.isGlobal}
                onChange={(v) => handleChange("isGlobal", v)}
              />
            </div>
          </Col>
        </Row>

        <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 22 }}>
          <Button
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancel
          </Button>

          <Button icon={<ReloadOutlined />} onClick={resetForm}>
            Reset
          </Button>

          <Button type="primary" loading={saving} onClick={handleSave}>
            Save Class
          </Button>
        </Space>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: "#4f46e5" }} />
            <span>Edit Class</span>
          </Space>
        }
        open={editOpen}
        footer={null}
        onCancel={() => {
          setEditOpen(false);
          setEditingId(null);
        }}
        className="class-modal"
        width={620}
        destroyOnClose
      >
        <Row gutter={[14, 10]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Text strong>Class Name</Text>
            <Input
              size="large"
              placeholder="e.g. Class 10"
              value={editData.name}
              onChange={(e) => handleEditChange("name", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </Col>

          <Col xs={24} md={12}>
            <Text strong>Class Code</Text>
            <Input
              size="large"
              placeholder="e.g. CLS-10"
              value={editData.code}
              onChange={(e) => handleEditChange("code", e.target.value)}
              style={{ marginTop: 6 }}
            />
          </Col>

          <Col xs={24}>
            <Text strong>Description</Text>
            <Input.TextArea
              placeholder="Short description about this class..."
              value={editData.description}
              onChange={(e) => handleEditChange("description", e.target.value)}
              rows={3}
              style={{ marginTop: 6 }}
            />
          </Col>

          <Col xs={24} md={12}>
            <Text strong>Status</Text>
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
          </Col>

          <Col xs={24} md={12}>
            <Text strong>Scope</Text>
            <div
              style={{
                marginTop: 6,
                height: 40,
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                background: "#f8fafc",
              }}
            >
              <Text type="secondary">Make global</Text>
              <Switch
                checked={editData.isGlobal}
                onChange={(v) => handleEditChange("isGlobal", v)}
              />
            </div>
          </Col>
        </Row>

        <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 22 }}>
          <Button
            onClick={() => {
              setEditOpen(false);
              setEditingId(null);
            }}
          >
            Cancel
          </Button>

          <Button type="primary" loading={editSaving} onClick={handleEditSave}>
            Update Class
          </Button>
        </Space>
      </Modal>
    </>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Table,
  Button,
  Modal,
  Form,
  Switch,
  message,
  Space,
  Popconfirm,
  Tooltip,
  Empty,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined,
  SyncOutlined, ThunderboltOutlined, WarningOutlined,
} from "@ant-design/icons";
import apiClient from "../../../api/httpClient";

import { fetchSchools } from "../../../features/schoolSlice.js";
import {
  fetchFeeHeads,
  createFeeHead,
} from "../../../features/headSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, modalTitle,
} from "../../../styles/pageStyles";

const { Option } = Select;

const FEE_HEAD_TYPES = [
  "Admission Fee",
  "Tuition Fee",
  "Registration Fee",
  "Transport Fee",
  "Exam Fee",
  "Library Fee",
  "Computer Fee",
  "Hostel Fee",
  "Mess Fee",
  "Sports Fee",
  "Books Fee",
  "Uniform Fee",
  "Fine",
  "Late Fee Fine",
];

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const TYPE_LABEL = { recurring: "Recurring", "one-time": "One Time", penalty: "Penalty" };
const TYPE_COLOR = {
  recurring: ["#2563EB", "rgba(219,234,254,0.4)"],
  "one-time": ["#14B8A6", "rgba(20,184,166,0.15)"],
  penalty: ["#DC2626", "rgba(254,226,226,0.5)"],
};

const FeeCategories = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { schools } = useSelector((s) => s.school);
  const { feeHeads = [], loading } = useSelector((s) => s.feeHead);

  const [schoolId, setSchoolId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  /* ================= LOAD SCHOOLS ================= */
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  /* ================= LOAD FEE HEADS ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchFeeHeads({ schoolId }));
    }
  }, [schoolId, dispatch]);

  /* ================= SUBMIT (CREATE) ================= */
  const handleSubmit = async (values) => {
    if (!schoolId) {
      return message.warning("Please select school first");
    }

    try {
      setSubmitting(true);
      await dispatch(
        createFeeHead({
          schoolId,
          name: values.name,
          type: values.type,
          isEditable: values.isEditable,
        })
      ).unwrap();

      message.success("Fee Head Created Successfully");
      setOpenModal(false);
      form.resetFields();

      dispatch(fetchFeeHeads({ schoolId }));
    } catch (err) {
      message.error(err?.message || "Failed to create fee head");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= OPEN EDIT ================= */
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      name: record.name,
      type: record.type,
      isEditable: record.isEditable ?? true,
    });
    setEditModalOpen(true);
  };

  /* ================= SUBMIT (EDIT) ================= */
  const handleEditSubmit = async (values) => {
    if (!editingRecord?._id) return;
    try {
      setEditSubmitting(true);
      await apiClient.put(`/fee-heads/${editingRecord._id}`, {
        schoolId,
        name: values.name,
        type: values.type,
        isEditable: values.isEditable,
      });
      message.success("Fee Head Updated Successfully");
      setEditModalOpen(false);
      setEditingRecord(null);
      editForm.resetFields();
      dispatch(fetchFeeHeads({ schoolId }));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update fee head");
    } finally {
      setEditSubmitting(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await apiClient.delete(`/fee-heads/${id}`);
      message.success("Fee Head Deleted Successfully");
      dispatch(fetchFeeHeads({ schoolId }));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete fee head");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = feeHeads.length;
    const recurring = feeHeads.filter((f) => f.type === "recurring").length;
    const oneTime = feeHeads.filter((f) => f.type === "one-time").length;
    const penalty = feeHeads.filter((f) => f.type === "penalty").length;
    return { total, recurring, oneTime, penalty };
  }, [feeHeads]);

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Fee Head",
      dataIndex: "name",
      render: (name) => <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type) => {
        const [color, bg] = TYPE_COLOR[type] || ["var(--text-muted)", "var(--surface-soft)"];
        return <span style={pill(color, bg)}>{TYPE_LABEL[type] || type}</span>;
      },
    },
    {
      title: "Editable",
      render: (_, r) => r.isEditable
        ? <span style={pill("#15803D", "rgba(220,252,231,0.5)")}>Yes</span>
        : <span style={pill("#64748B", "rgba(241,245,249,0.6)")}>No</span>,
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Edit fee head">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this fee head?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
            placement="topRight"
          >
            <Tooltip title="Delete fee head">
              <Button size="small" danger loading={deletingId === record._id} icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ================= UI ================= */
  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Fee Categories"
        subtitle="Define fee heads schools can use when building fee structures"
        icon={<TagsOutlined />}
        extra={
          <Space wrap>
            <Select
              placeholder="Select School"
              value={schoolId}
              onChange={setSchoolId}
              style={{ width: 240 }}
              showSearch
              optionFilterProp="children"
            >
              {schools?.map((s) => (
                <Option key={s._id} value={s._id}>{s.name}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} disabled={!schoolId} onClick={() => setOpenModal(true)}>
              Add Fee Head
            </Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<TagsOutlined />} label="Total Fee Heads" value={stats.total} color="#2563EB" />
        <StatCard icon={<SyncOutlined />} label="Recurring" value={stats.recurring} color="#14B8A6" />
        <StatCard icon={<ThunderboltOutlined />} label="One Time" value={stats.oneTime} color="#F59E0B" />
        <StatCard icon={<WarningOutlined />} label="Penalty" value={stats.penalty} color="#DC2626" />
      </div>

      <style>{tableHeadCss("fee-categories-tbl")}</style>

      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <TagsOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Fee Heads</span>
          <span style={pill("var(--primary)")}>{feeHeads.length}</span>
        </div>

        <div className="fee-categories-tbl" style={tableContainer}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={feeHeads}
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    schoolId
                      ? "No fee heads found for this school"
                      : "Select a school to view fee heads"
                  }
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ================= CREATE MODAL ================= */}
      <Modal
        title={modalTitle(<PlusOutlined />, "Create Fee Head")}
        open={openModal}
        onCancel={() => {
          setOpenModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Create"
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ isEditable: true }}
        >
          <Form.Item
            name="name"
            label="Fee Head Name"
            rules={[{ required: true, message: "Select fee head" }]}
          >
            <Select placeholder="Select Fee Head">
              {FEE_HEAD_TYPES.map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Fee Type"
            rules={[{ required: true, message: "Select fee type" }]}
          >
            <Select placeholder="Select Type">
              <Option value="recurring">Recurring</Option>
              <Option value="one-time">One Time</Option>
              <Option value="penalty">Penalty</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isEditable" label="Is Editable?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= EDIT MODAL ================= */}
      <Modal
        title={modalTitle(<EditOutlined />, "Edit Fee Head")}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingRecord(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={editSubmitting}
        okText="Update"
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={handleEditSubmit}
          initialValues={{ isEditable: true }}
        >
          <Form.Item
            name="name"
            label="Fee Head Name"
            rules={[{ required: true, message: "Select fee head" }]}
          >
            <Select placeholder="Select Fee Head">
              {FEE_HEAD_TYPES.map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Fee Type"
            rules={[{ required: true, message: "Select fee type" }]}
          >
            <Select placeholder="Select Type">
              <Option value="recurring">Recurring</Option>
              <Option value="one-time">One Time</Option>
              <Option value="penalty">Penalty</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isEditable" label="Is Editable?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeeCategories;

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import apiClient from "../../../api/httpClient";

import { fetchSchools } from "../../../features/schoolSlice.js";
import {
  fetchFeeHeads,
  createFeeHead,
} from "../../../features/headSlice.js";

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

  /* ================= TABLE ================= */
  const columns = [
    { title: "Fee Head", dataIndex: "name" },
    { title: "Type", dataIndex: "type" },
    {
      title: "Editable",
      render: (_, r) => (r.isEditable ? "Yes" : "No"),
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Edit fee head">
            <Button
              size="small"
              icon={<Pencil size={13} />}
              onClick={() => handleOpenEdit(record)}
              style={{
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 12,
                background: "rgba(219,234,254,0.15)",
                borderColor: "rgba(219,234,254,0.4)",
                color: "#2563EB",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
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
              <Button
                size="small"
                danger
                loading={deletingId === record._id}
                icon={<Trash2 size={13} />}
                style={{
                  borderRadius: 7,
                  fontWeight: 600,
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
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

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-5 bg-gray-50">
      {/* ================= HEADER ================= */}
      <Card>
        <div className="flex gap-4 items-center">
          <Select
            placeholder="Select School"
            value={schoolId}
            onChange={setSchoolId}
            style={{ width: 260 }}
          >
            {schools?.map((s) => (
              <Option key={s._id} value={s._id}>
                {s.name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            disabled={!schoolId}
            onClick={() => setOpenModal(true)}
          >
            Add Fee Head
          </Button>
        </div>
      </Card>

      {/* ================= TABLE ================= */}
      <Card title="Fee Heads">
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
      </Card>

      {/* ================= CREATE MODAL ================= */}
      <Modal
        title="Create Fee Head"
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
                <Option key={t} value={t}>
                  {t}
                </Option>
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

          <Form.Item
            name="isEditable"
            label="Is Editable?"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= EDIT MODAL ================= */}
      <Modal
        title="Edit Fee Head"
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
                <Option key={t} value={t}>
                  {t}
                </Option>
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

          <Form.Item
            name="isEditable"
            label="Is Editable?"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeeCategories;

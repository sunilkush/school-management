import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table, Button, Modal, Form, Select, Switch, Popconfirm, Tag, message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import {
  fetchFeeHeads, createFeeHead, updateFeeHead, deleteFeeHead,
} from "../../../features/headSlice.js";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, tableHeadCss, pill } from "../../../styles/pageStyles";

const TABLE_CLS = "fee-cat-tbl";

const FEE_HEAD_TYPES = [
  "Admission Fee", "Tuition Fee", "Registration Fee", "Transport Fee",
  "Exam Fee", "Library Fee", "Computer Fee", "Hostel Fee", "Mess Fee",
  "Sports Fee", "Books Fee", "Uniform Fee", "Fine", "Late Fee Fine",
];

const TYPE_META = {
  recurring: { color: "var(--cyan)",   label: "Recurring" },
  "one-time": { color: "var(--accent)", label: "One-Time" },
  penalty:   { color: "var(--danger)", label: "Penalty"  },
};

const SchoolFeeCategories = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { feeHeads = [], loading } = useSelector((s) => s.feeHead);
  const { user }                   = useSelector((s) => s.auth);

  // School Admin always uses their own school — no picker shown
  const schoolId = user?.school?._id;

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit
  const [saving,     setSaving]     = useState(false);

  /* ── Load fee heads on mount ── */
  useEffect(() => {
    if (schoolId) dispatch(fetchFeeHeads({ schoolId }));
  }, [schoolId, dispatch]);

  /* ── Open create modal ── */
  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    form.setFieldsValue({ isEditable: true });
    setModalOpen(true);
  };

  /* ── Open edit modal ── */
  const openEdit = (record) => {
    setEditTarget(record);
    form.setFieldsValue({
      name:       record.name,
      type:       record.type,
      isEditable: record.isEditable,
    });
    setModalOpen(true);
  };

  /* ── Submit create / update ── */
  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields();
      if (!schoolId) return message.error("School not found. Please re-login.");
      setSaving(true);

      if (editTarget) {
        await dispatch(updateFeeHead({ id: editTarget._id, data: vals })).unwrap();
        message.success("Fee head updated");
      } else {
        await dispatch(createFeeHead({ schoolId, ...vals })).unwrap();
        message.success("Fee head created");
        dispatch(fetchFeeHeads({ schoolId }));
      }
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(typeof err === "string" ? err : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteFeeHead(id)).unwrap();
      message.success("Fee head deleted");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Delete failed");
    }
  };

  /* ── Columns ── */
  const columns = [
    {
      title:  "#",
      render: (_, __, i) => (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</span>
      ),
      width: 44,
    },
    {
      title:     "Fee Head",
      dataIndex: "name",
      render:    (v) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v || "—"}</span>
      ),
    },
    {
      title:  "Type",
      dataIndex: "type",
      width:  130,
      render: (v) => {
        const m = TYPE_META[v];
        return m ? (
          <span style={pill(m.color)}>{m.label}</span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        );
      },
    },
    {
      title:  "Editable",
      dataIndex: "isEditable",
      width:  90,
      align:  "center",
      render: (v) => (
        <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title:  "Actions",
      width:  110,
      align:  "center",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          />
          <Popconfirm
            title="Delete this fee head?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Fee Categories"
        subtitle="Manage fee heads for your school"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            disabled={!schoolId}
            style={{ background: "var(--primary)", borderColor: "var(--primary)" }}
          >
            Add Fee Head
          </Button>
        }
      />

      {/* ── Table ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <Table
          className={TABLE_CLS}
          rowKey="_id"
          columns={columns}
          dataSource={feeHeads}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: 560 }}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", color: "var(--text-muted)" }}>
                No fee heads yet. Click "Add Fee Head" to create one.
              </div>
            ),
          }}
        />
      </div>

      {/* ── Create / Edit modal ── */}
      <Modal
        open={modalOpen}
        title={
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            {editTarget ? "Edit Fee Head" : "Create Fee Head"}
          </span>
        }
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={saving}
        okButtonProps={{ style: { background: "var(--primary)", borderColor: "var(--primary)" } }}
        width={420}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Fee Head Name"
            rules={[{ required: true, message: "Please select a fee head" }]}
          >
            <Select placeholder="Select fee head type" showSearch>
              {FEE_HEAD_TYPES.map((t) => (
                <Select.Option key={t} value={t}>{t}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Fee Type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="recurring">Recurring (monthly/quarterly)</Select.Option>
              <Select.Option value="one-time">One-Time (annual/admission)</Select.Option>
              <Select.Option value="penalty">Penalty / Fine</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="isEditable" label="Editable at Structure Level?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolFeeCategories;

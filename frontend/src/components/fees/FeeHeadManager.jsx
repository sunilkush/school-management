import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Select, Switch, Popconfirm, Space, Tooltip, Empty, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined, SyncOutlined, ThunderboltOutlined, WarningOutlined } from "@ant-design/icons";

import { fetchFeeHeads, createFeeHead, updateFeeHead, deleteFeeHead } from "../../features/headSlice.js";
import { fetchSchools } from "../../features/schoolSlice.js";
import PageHeader from "../layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, statGrid, iconWell, pill, tableContainer, tableHeadCss, modalTitle } from "../../styles/pageStyles";

const FEE_HEAD_TYPES = [
  "Admission Fee", "Tuition Fee", "Registration Fee", "Transport Fee",
  "Exam Fee", "Library Fee", "Computer Fee", "Hostel Fee", "Mess Fee",
  "Sports Fee", "Books Fee", "Uniform Fee", "Fine", "Late Fee Fine",
];

const TYPE_LABEL = { recurring: "Recurring", "one-time": "One Time", penalty: "Penalty" };
const TYPE_COLOR = {
  recurring: ["var(--primary)", "rgba(219,234,254,0.4)"],
  "one-time": ["var(--accent)", "rgba(20,184,166,0.15)"],
  penalty: ["var(--danger-hover)", "rgba(254,226,226,0.5)"],
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

const FEE_HEAD_FORM_FIELDS = (
  <>
    <Form.Item name="name" label="Fee Head Name" rules={[{ required: true, message: "Please select a fee head" }]}>
      <Select placeholder="Select fee head type" showSearch>
        {FEE_HEAD_TYPES.map((t) => (
          <Select.Option key={t} value={t}>{t}</Select.Option>
        ))}
      </Select>
    </Form.Item>
    <Form.Item name="type" label="Fee Type" rules={[{ required: true, message: "Please select a type" }]}>
      <Select placeholder="Select type">
        <Select.Option value="recurring">Recurring (monthly/quarterly)</Select.Option>
        <Select.Option value="one-time">One-Time (annual/admission)</Select.Option>
        <Select.Option value="penalty">Penalty / Fine</Select.Option>
      </Select>
    </Form.Item>
    <Form.Item name="isEditable" label="Editable at Structure Level?" valuePropName="checked">
      <Switch />
    </Form.Item>
  </>
);

/**
 * Shared fee-head (category) manager. Previously implemented twice against the same
 * /fee-heads API — SchoolFeeCategories.jsx (School Admin, locked to own school) and
 * Super_Admin/Master_Settings/FeeCategories.jsx (Super Admin, school picker, and calling
 * apiClient directly instead of headSlice for update/delete). This version standardizes both
 * on headSlice and keeps only one implementation to maintain.
 *
 * @param {boolean} showSchoolPicker - true for Super Admin (pick any school), false for
 *   School Admin (locked to their own school via state.auth.user).
 */
const FeeHeadManager = ({ showSchoolPicker = false }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schools = [] } = useSelector((s) => s.school || {});
  const { feeHeads = [], loading } = useSelector((s) => s.feeHead || {});
  const { user } = useSelector((s) => s.auth || {});

  const ownSchoolId = user?.school?._id || user?.schoolId;
  const [pickedSchoolId, setPickedSchoolId] = useState(null);
  const schoolId = showSchoolPicker ? pickedSchoolId : ownSchoolId;

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (showSchoolPicker) dispatch(fetchSchools());
  }, [showSchoolPicker, dispatch]);

  useEffect(() => {
    if (schoolId) dispatch(fetchFeeHeads({ schoolId }));
  }, [schoolId, dispatch]);

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    form.setFieldsValue({ isEditable: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditTarget(record);
    form.setFieldsValue({ name: record.name, type: record.type, isEditable: record.isEditable });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields();
      if (!schoolId) return message.error(showSchoolPicker ? "Please select a school first" : "School not found. Please re-login.");
      setSaving(true);

      if (editTarget) {
        await dispatch(updateFeeHead({ id: editTarget._id, data: vals })).unwrap();
        message.success("Fee head updated");
      } else {
        await dispatch(createFeeHead({ schoolId, ...vals })).unwrap();
        message.success("Fee head created");
      }
      dispatch(fetchFeeHeads({ schoolId }));
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(typeof err === "string" ? err : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await dispatch(deleteFeeHead(id)).unwrap();
      message.success("Fee head deleted");
      dispatch(fetchFeeHeads({ schoolId }));
    } catch (err) {
      message.error(typeof err === "string" ? err : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => ({
    total: feeHeads.length,
    recurring: feeHeads.filter((f) => f.type === "recurring").length,
    oneTime: feeHeads.filter((f) => f.type === "one-time").length,
    penalty: feeHeads.filter((f) => f.type === "penalty").length,
  }), [feeHeads]);

  const columns = [
    {
      title: "Fee Head",
      dataIndex: "name",
      render: (name) => <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{name || "—"}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type) => {
        const [color, bg] = TYPE_COLOR[type] || ["var(--text-muted)", "var(--surface-soft)"];
        return <span style={pill(color, bg)}>{TYPE_LABEL[type] || type || "—"}</span>;
      },
    },
    {
      title: "Editable",
      render: (_, r) =>
        r.isEditable
          ? <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>Yes</span>
          : <span style={pill("var(--text-secondary)", "rgba(241,245,249,0.6)")}>No</span>,
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Edit fee head">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Edit</Button>
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
              <Button size="small" danger loading={deletingId === record._id} icon={<DeleteOutlined />}>Delete</Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("fee-categories-tbl")}</style>

      <PageHeader
        title="Fee Categories"
        subtitle={showSchoolPicker ? "Define fee heads schools can use when building fee structures" : "Manage fee heads for your school"}
        icon={<TagsOutlined />}
        extra={
          <Space wrap>
            {showSchoolPicker && (
              <Select
                placeholder="Select School"
                value={pickedSchoolId}
                onChange={setPickedSchoolId}
                style={{ width: 240 }}
                showSearch
                optionFilterProp="children"
              >
                {schools.map((s) => (
                  <Select.Option key={s._id} value={s._id}>{s.name}</Select.Option>
                ))}
              </Select>
            )}
            <Button type="primary" icon={<PlusOutlined />} disabled={!schoolId} onClick={openCreate}>
              Add Fee Head
            </Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20, marginBottom: 20 }}>
        <StatCard icon={<TagsOutlined />} label="Total Fee Heads" value={stats.total} color="var(--primary)" />
        <StatCard icon={<SyncOutlined />} label="Recurring" value={stats.recurring} color="var(--accent)" />
        <StatCard icon={<ThunderboltOutlined />} label="One Time" value={stats.oneTime} color="var(--warning)" />
        <StatCard icon={<WarningOutlined />} label="Penalty" value={stats.penalty} color="var(--danger-hover)" />
      </div>

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
                      ? "No fee heads found. Click \"Add Fee Head\" to create one."
                      : showSchoolPicker
                      ? "Select a school to view fee heads"
                      : "No fee heads yet"
                  }
                />
              ),
            }}
          />
        </div>
      </div>

      <Modal
        title={modalTitle(editTarget ? <EditOutlined /> : <PlusOutlined />, editTarget ? "Edit Fee Head" : "Create Fee Head")}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmit}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={saving}
      >
        <Form layout="vertical" form={form} style={{ marginTop: 16 }}>
          {FEE_HEAD_FORM_FIELDS}
        </Form>
      </Modal>
    </div>
  );
};

export default FeeHeadManager;

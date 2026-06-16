import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select, Table, Button, Modal, Form, InputNumber, message, Space, Tooltip, Popconfirm,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, DollarOutlined, EditOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchFeeHeads } from "../../../features/headSlice.js";
import { currentUser } from "../../../features/authSlice.js";
import {
  fetchFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
} from "../../../features/feeStructureSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableHeadCss, pill, iconWell,
} from "../../../styles/pageStyles";

const { Option } = Select;

const FREQ_STYLE = {
  monthly:   { color: "#7c3aed", bg: "#ede9fe" },
  quarterly: { color: "#0284c7", bg: "#e0f2fe" },
  yearly:    { color: "#059669", bg: "#d1fae5" },
};

const FeeStructure = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { feeHeads = [] } = useSelector((s) => s.feeHead);
  const { feeStructures, loading } = useSelector((s) => s.feeStructure);
  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const academicYearId = selectedAcademicYear?._id;
  const schoolId = user?.school?._id;

  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({ schoolClassId: undefined, academicYearId: undefined });

  const feeStructureQuery = useMemo(
    () => ({
      schoolId,
      ...(filters.schoolClassId ? { schoolClassId: filters.schoolClassId } : {}),
      ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
    }),
    [schoolId, filters.schoolClassId, filters.academicYearId]
  );

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchFeeHeads({ schoolId }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchFeeStructures(feeStructureQuery));
  }, [dispatch, schoolId, feeStructureQuery]);

  const handleSubmit = async (values) => {
    try {
      if (editingRecord?._id) {
        await dispatch(updateFeeStructure({ id: editingRecord._id, data: { ...values, schoolId, academicYearId } })).unwrap();
        message.success("Fee Structure Updated");
      } else {
        await dispatch(createFeeStructure({ ...values, schoolId, academicYearId })).unwrap();
        message.success("Fee Structure Created");
      }
      setOpen(false);
      setEditingRecord(null);
      form.resetFields();
      dispatch(fetchFeeStructures(feeStructureQuery));
    } catch (err) {
      message.error(err || "Duplicate fee structure already exists");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      schoolClassId: record.schoolClassId?._id,
      feeHeadId: record.feeHeadId?._id,
      amount: record.amount,
      frequency: record.frequency,
    });
    setOpen(true);
  };

  const handleDelete = async (record) => {
    try {
      await dispatch(deleteFeeStructure(record._id)).unwrap();
      message.success("Fee Structure Deleted");
      dispatch(fetchFeeStructures(feeStructureQuery));
    } catch (err) {
      message.error(err || "Failed to delete fee structure");
    }
  };

  const columns = [
    {
      title: "Class",
      render: (r) => r.schoolClassId?.name
        ? <span style={pill("#7c3aed", "#ede9fe")}>{r.schoolClassId.name}</span>
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Academic Year",
      render: (r) => <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.academicYearId?.name || "—"}</span>,
    },
    {
      title: "Fee Head",
      render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.feeHeadId?.name || "—"}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (value) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: "#059669" }}>
          ₹{Number(value || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      render: (v) => {
        if (!v) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        const s = FREQ_STYLE[v.toLowerCase()] || { color: "#64748b", bg: "#f1f5f9" };
        return <span style={pill(s.color, s.bg)}>{v.toUpperCase()}</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: "#f59e0b" }} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this fee structure?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("fee-table")}</style>

      <PageHeader
        title="Fee Structure"
        subtitle={`${selectedAcademicYear?.name ?? "Current Year"} · ${user?.school?.name ?? "School"}`}
        icon={<DollarOutlined />}
        extra={
          <Space size={8}>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchFeeStructures(feeStructureQuery))} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setOpen(true); }}>
              Add Fee Structure
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Fee Structures
              </span>
              <div style={{ flex: 1 }} />
              <Select
                allowClear
                style={{ minWidth: 200 }}
                placeholder="Filter by class"
                value={filters.schoolClassId}
                onChange={(value) => setFilters((prev) => ({ ...prev, schoolClassId: value }))}
              >
                {schoolClasses?.map((c) => (
                  <Option key={c._id} value={c._id}>{c.name}</Option>
                ))}
              </Select>
            </div>
          </div>

          <div className="fee-table" style={{ borderTop: "1px solid var(--border-muted)" }}>
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={feeStructures}
              loading={loading}
              pagination={{
                pageSize: 10,
                size: "small",
                showTotal: (total) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} records</span>,
              }}
              scroll={{ x: 700 }}
            />
          </div>
        </div>

        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={iconWell("var(--primary)", 34)}><DollarOutlined /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                  {editingRecord ? "Update Fee Structure" : "Create Fee Structure"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Fill in the details below</div>
              </div>
            </div>
          }
          open={open}
          onCancel={() => { setOpen(false); setEditingRecord(null); form.resetFields(); }}
          onOk={() => form.submit()}
          okText={editingRecord ? "Update" : "Save"}
          centered
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ marginTop: 8 }}>
            <Form.Item name="schoolClassId" label="Class" rules={[{ required: true }]}>
              <Select placeholder="Select Class">
                {schoolClasses?.map((c) => <Option key={c._id} value={c._id}>{c.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="feeHeadId" label="Fee Head" rules={[{ required: true }]}>
              <Select placeholder="Select Fee Head">
                {feeHeads?.map((f) => <Option key={f._id} value={f._id}>{f.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="Enter amount" prefix="₹" />
            </Form.Item>
            <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
              <Select placeholder="Select Frequency">
                <Option value="monthly">Monthly</Option>
                <Option value="quarterly">Quarterly</Option>
                <Option value="yearly">Yearly</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default FeeStructure;

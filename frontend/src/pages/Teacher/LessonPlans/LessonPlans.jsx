import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Form, Input, Select, Modal, Table, Tag, Space, Popconfirm, message, Empty, DatePicker,
} from "antd";
import { PlusOutlined, BookOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";
import { fetchAssignedClasses } from "../../../features/classSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, toolbarRow } from "../../../styles/pageStyles";

const STATUS_COLOR = { draft: "orange", approved: "green", completed: "blue" };

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const getId = (v) => (!v ? "" : typeof v === "object" ? v._id : v);

const LessonPlans = () => {
  const dispatch = useDispatch();
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((s) => s.class || {});

  useEffect(() => {
    if (selectedAcademicYear?._id) dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
  }, [dispatch, selectedAcademicYear?._id]);

  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form] = Form.useForm();

  const [selectedClassId, setSelectedClassId]             = useState("");
  const [selectedModalSectionId, setSelectedModalSectionId] = useState("");
  const [filterStatus, setFilterStatus]                   = useState(undefined);

  const teacherClassOptions = useMemo(() => {
    return classAssignTeacher.map((cls) => ({
      classId: String(getId(cls?._id)),
      className: cls?.className || cls?.name || `Class ${cls?.classNum || ""}`.trim() || "Class",
      sections: (cls?.sections || []).map((sec) => ({
        sectionId: String(getId(sec?.sectionId?._id || sec?.sectionId)),
        sectionName: sec?.sectionId?.name || sec?.name || "Section",
        subjects: (sec?.subjects || []).map((sub) => ({
          subjectId: String(getId(sub?.subjectId?._id || sub?.subjectId || sub?._id)),
          subjectName: sub?.subjectId?.name || sub?.name || sub?.subjectName || "",
        })),
      })),
      subjects: (cls?.subjects || []).map((sub) => ({
        subjectId: String(getId(sub?.subjectId?._id || sub?.subjectId || sub?._id)),
        subjectName: sub?.subjectId?.name || sub?.name || sub?.subjectName || "",
      })),
    }));
  }, [classAssignTeacher]);

  const selectedClass = useMemo(() => (
    selectedClassId ? teacherClassOptions.find((c) => String(c.classId) === String(selectedClassId)) || null : null
  ), [selectedClassId, teacherClassOptions]);

  const modalSectionOptions = useMemo(() => (
    (selectedClass?.sections || []).map((sec) => ({ value: sec.sectionId, label: sec.sectionName }))
  ), [selectedClass]);

  const subjectOptions = useMemo(() => {
    if (!selectedClass) return [];
    const map = new Map();
    const add = (sub) => {
      const id = String(sub?.subjectId || "");
      if (!id || map.has(id)) return;
      map.set(id, { value: id, label: sub?.subjectName || "" });
    };
    (selectedClass?.subjects || []).forEach(add);
    if (selectedModalSectionId) {
      const sec = (selectedClass?.sections || []).find((s) => String(s.sectionId) === String(selectedModalSectionId));
      (sec?.subjects || []).forEach(add);
    } else {
      (selectedClass?.sections || []).forEach((s) => (s?.subjects || []).forEach(add));
    }
    return Array.from(map.values());
  }, [selectedClass, selectedModalSectionId]);

  const fetchPlans = useCallback(async () => {
    if (!selectedAcademicYear?._id) return;
    setLoading(true);
    try {
      const params = { academicYearId: selectedAcademicYear._id };
      if (filterStatus) params.status = filterStatus;
      const res = await apiClient.get("/lesson-plans", { params });
      setPlans(res.data?.data?.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load lesson plans");
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear?._id, filterStatus]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const resetModal = () => {
    form.resetFields();
    setSelectedClassId("");
    setSelectedModalSectionId("");
    setEditTarget(null);
    setOpen(false);
  };

  const openEdit = (rec) => {
    setEditTarget(rec);
    setSelectedClassId(String(getId(rec.schoolClassId?._id || rec.schoolClassId)));
    form.setFieldsValue({
      schoolClassId: String(getId(rec.schoolClassId?._id || rec.schoolClassId)),
      subjectId:     String(getId(rec.subjectId?._id    || rec.subjectId)),
      title:        rec.title,
      objectives:   rec.objectives,
      content:      rec.content,
      assessment:   rec.assessment,
      plannedDate:  rec.plannedDate ? dayjs(rec.plannedDate) : null,
      duration:     rec.duration,
      status:       rec.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        ...values,
        academicYearId: selectedAcademicYear._id,
        plannedDate: values.plannedDate?.toISOString(),
      };
      if (editTarget) {
        await apiClient.put(`/lesson-plans/${editTarget._id}`, payload);
        message.success("Lesson plan updated.");
      } else {
        await apiClient.post("/lesson-plans", payload);
        message.success("Lesson plan created.");
      }
      resetModal();
      fetchPlans();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/lesson-plans/${id}`);
      message.success("Deleted.");
      setPlans((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete.");
    }
  };

  const stats = useMemo(() => ({
    total:     plans.length,
    draft:     plans.filter((p) => p.status === "draft").length,
    approved:  plans.filter((p) => p.status === "approved").length,
    completed: plans.filter((p) => p.status === "completed").length,
  }), [plans]);

  const columns = [
    { title: "Title", dataIndex: "title", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: "Subject", dataIndex: "subjectId", render: (v) => v?.name || "—" },
    { title: "Class", dataIndex: "schoolClassId", render: (v) => v?.name || "—" },
    {
      title: "Planned Date",
      dataIndex: "plannedDate",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    { title: "Duration", dataIndex: "duration", render: (v) => `${v || 45} min` },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{String(v || "—").toUpperCase()}</Tag>,
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this lesson plan?" onConfirm={() => handleDelete(r._id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Lesson Plans"
        subtitle="Plan and track your lessons for each subject and class"
        icon={<BookOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} disabled={!teacherClassOptions.length}>
            Create Plan
          </Button>
        }
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<BookOutlined />} label="Total"     value={stats.total}     color="#14B8A6" />
        <StatCard icon={<BookOutlined />} label="Draft"     value={stats.draft}     color="#F59E0B" />
        <StatCard icon={<BookOutlined />} label="Approved"  value={stats.approved}  color="#22C55E" />
        <StatCard icon={<BookOutlined />} label="Completed" value={stats.completed} color="#0891b2" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <div style={toolbarRow}>
          <Select
            placeholder="Filter by Status" style={{ width: 180 }} allowClear
            value={filterStatus} onChange={setFilterStatus}
            options={[
              { value: "draft",     label: "Draft" },
              { value: "approved",  label: "Approved" },
              { value: "completed", label: "Completed" },
            ]}
          />
        </div>

        <Table
          columns={columns} dataSource={plans} rowKey="_id"
          loading={loading || classLoading} pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No lesson plans created yet" /> }}
        />
      </div>

      <Modal
        title={editTarget ? "Edit Lesson Plan" : "Create Lesson Plan"}
        open={open} onCancel={resetModal} footer={null} destroyOnClose width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Class" name="schoolClassId" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select class" loading={classLoading}
              onChange={(v) => { setSelectedClassId(v); setSelectedModalSectionId(""); form.setFieldsValue({ subjectId: undefined }); }}
              options={teacherClassOptions.map((c) => ({ value: c.classId, label: c.className }))}
              showSearch optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Section (optional)" name="sectionId">
            <Select
              placeholder="All sections" allowClear disabled={!selectedClassId}
              options={modalSectionOptions}
              onChange={(v) => setSelectedModalSectionId(v || "")}
            />
          </Form.Item>
          <Form.Item label="Subject" name="subjectId" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select subject" disabled={!selectedClassId}
              options={subjectOptions} showSearch optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Lesson title" />
          </Form.Item>
          <Space style={{ width: "100%" }} size={12}>
            <Form.Item label="Planned Date" name="plannedDate" rules={[{ required: true, message: "Required" }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Duration (min)" name="duration" initialValue={45} style={{ width: 140 }}>
              <Input type="number" min={10} max={300} />
            </Form.Item>
          </Space>
          <Form.Item label="Learning Objectives" name="objectives">
            <Input.TextArea rows={2} placeholder="What students will learn..." />
          </Form.Item>
          <Form.Item label="Lesson Content" name="content">
            <Input.TextArea rows={3} placeholder="Topics, activities, discussion points..." />
          </Form.Item>
          <Form.Item label="Assessment" name="assessment">
            <Input.TextArea rows={2} placeholder="How will students be assessed..." />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="draft">
            <Select options={[
              { value: "draft",     label: "Draft" },
              { value: "approved",  label: "Approved" },
              { value: "completed", label: "Completed" },
            ]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>
            {editTarget ? "Update Plan" : "Create Plan"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default LessonPlans;

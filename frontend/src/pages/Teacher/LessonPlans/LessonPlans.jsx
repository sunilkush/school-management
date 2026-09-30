import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Form, Input, Select, Modal, Table, Tag, Space, Popconfirm, message, Empty, DatePicker,
} from "antd";
import { PlusOutlined, BookOutlined, EditOutlined, DeleteOutlined, SendOutlined, CheckOutlined, RollbackOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";
import { fetchAssignedClasses } from "../../../features/classSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { LESSON_STATUS } from "../../../utils/lessonPlanStatus";


const Chip = ({ label, value, active, onClick }) => (
  <button type="button" onClick={onClick} style={{
    border: `1px solid ${active ? "var(--primary)" : "var(--border-muted)"}`, background: active ? "var(--primary-light)" : "var(--surface)",
    borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "pointer", color: "var(--text-secondary)",
  }}>
    <b style={{ color: "var(--text-primary)", marginRight: 4 }}>{value}</b>{label}
  </button>
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
      // The table pages the list itself; without a limit the API stopped at 20 plans.
      const params = { academicYearId: selectedAcademicYear._id, limit: 1000 };
      const res = await apiClient.get("/lesson-plans", { params });
      setPlans(res.data?.data?.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load lesson plans");
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear?._id]);

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
    });
    setOpen(true);
  };

  // submit: true sends it for review; otherwise it keeps its status (a new plan is a draft).
  const handleSave = async (submit = false) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        ...values,
        academicYearId: selectedAcademicYear._id,
        // A calendar day: toISOString() moved it to the day before in IST.
        plannedDate: values.plannedDate?.format("YYYY-MM-DD"),
        ...(submit ? { status: "submitted" } : {}),
      };
      if (editTarget) {
        await apiClient.put(`/lesson-plans/${editTarget._id}`, payload);
        message.success(submit ? "Sent for review." : "Lesson plan updated.");
      } else {
        await apiClient.post("/lesson-plans", payload);
        message.success(submit ? "Created and sent for review." : "Saved as draft.");
      }
      resetModal();
      fetchPlans();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const moveTo = async (rec, status, done) => {
    try {
      await apiClient.put(`/lesson-plans/${rec._id}`, { status });
      message.success(done);
      fetchPlans();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not update the plan.");
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

  const counts = useMemo(() => {
    const c = { all: plans.length };
    Object.keys(LESSON_STATUS).forEach((k) => { c[k] = plans.filter((p) => p.status === k).length; });
    return c;
  }, [plans]);
  const shown = filterStatus ? plans.filter((p) => p.status === filterStatus) : plans;
  const editable = (r) => ["draft", "returned", "submitted"].includes(r?.status);

  const columns = [
    { title: "Title", dataIndex: "title", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: "Subject", dataIndex: "subjectId", render: (v) => v?.name || "—" },
    { title: "Class", render: (_, r) => `${r.schoolClassId?.name || "—"}${r.sectionId?.name ? `-${r.sectionId.name}` : ""}` },
    {
      title: "Planned Date",
      dataIndex: "plannedDate",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    { title: "Duration", dataIndex: "duration", render: (v) => `${v || 45} min` },
    {
      title: "Status",
      dataIndex: "status",
      render: (v, r) => (
        <div style={{ maxWidth: 260 }}>
          <Tag color={LESSON_STATUS[v]?.color || "default"}>{LESSON_STATUS[v]?.label || v}</Tag>
          {r.reviewComment ? (
            <div style={{ fontSize: 11, marginTop: 2, color: v === "returned" ? "var(--danger)" : "var(--text-muted)" }}>
              {r.reviewedBy?.name ? `${r.reviewedBy.name}: ` : ""}{r.reviewComment}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space size={4} wrap>
          {["draft", "returned"].includes(r.status) && (
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => moveTo(r, "submitted", "Sent for review.")}>Submit</Button>
          )}
          {r.status === "submitted" && (
            <Button size="small" icon={<RollbackOutlined />} onClick={() => moveTo(r, "draft", "Withdrawn to draft.")}>Withdraw</Button>
          )}
          {r.status === "approved" && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => moveTo(r, "completed", "Marked as taught.")}>Mark completed</Button>
          )}
          {editable(r) && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />}
          {["draft", "returned"].includes(r.status) && (
            <Popconfirm title="Delete this lesson plan?" onConfirm={() => handleDelete(r._id)} okText="Delete" okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
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

      <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <Chip label="All" value={counts.all} active={!filterStatus} onClick={() => setFilterStatus(undefined)} />
          {Object.entries(LESSON_STATUS).map(([k, cfg]) => (
            <Chip key={k} label={cfg.label} value={counts[k]} active={filterStatus === k} onClick={() => setFilterStatus(k)} />
          ))}
        </div>

        <Table
          size="small" scroll={{ x: "max-content" }}
          columns={columns} dataSource={shown} rowKey="_id"
          loading={loading || classLoading} pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description="No lesson plans created yet" /> }}
        />
      </div>

      <Modal
        title={editTarget ? "Edit Lesson Plan" : "Create Lesson Plan"}
        open={open} onCancel={resetModal} footer={null} destroyOnClose width={600}
      >
        {editTarget?.status === "returned" && editTarget.reviewComment && (
          <div style={{ border: "1px solid var(--danger)", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 12 }}>
            <b>Returned{editTarget.reviewedBy?.name ? ` by ${editTarget.reviewedBy.name}` : ""}:</b> {editTarget.reviewComment}
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={() => handleSave(false)}>
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
          <Space className="u-full" size={12}>
            <Form.Item label="Planned Date" name="plannedDate" rules={[{ required: true, message: "Required" }]} className="u-grow">
              <DatePicker className="u-full" />
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
          <div style={{ display: "flex", gap: 8 }}>
            <Button htmlType="submit" block loading={saving}>
              {editTarget ? "Save changes" : "Save as draft"}
            </Button>
            {(!editTarget || ["draft", "returned"].includes(editTarget.status)) && (
              <Button type="primary" block icon={<SendOutlined />} loading={saving} onClick={() => handleSave(true)}>
                {editTarget ? "Save & submit for review" : "Submit for review"}
              </Button>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LessonPlans;

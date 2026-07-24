import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Form, Input, Select, Modal, Table, Tag, Space, Popconfirm, message, Empty, Upload,
} from "antd";
import {
  PlusOutlined, BookOutlined, UploadOutlined, EditOutlined, DeleteOutlined, LinkOutlined,
} from "@ant-design/icons";
import apiClient from "../../../api/httpClient";
import { fetchAssignedClasses } from "../../../features/classSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, toolbarRow } from "../../../styles/pageStyles";

const TYPE_OPTIONS = [
  { value: "notes",          label: "Notes" },
  { value: "book",           label: "Book / PDF" },
  { value: "video",          label: "Video Link" },
  { value: "assignment",     label: "Assignment Sheet" },
  { value: "question_paper", label: "Question Paper" },
  { value: "other",          label: "Other" },
];

const TYPE_COLOR = {
  notes: "blue", book: "purple", video: "cyan", assignment: "orange", question_paper: "red", other: "default",
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const SubjectResources = () => {
  const dispatch = useDispatch();
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { classAssignTeacher = [] } = useSelector((s) => s.class || {});

  useEffect(() => {
    if (selectedAcademicYear?._id) dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
  }, [dispatch, selectedAcademicYear?._id]);

  const [materials, setMaterials]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form] = Form.useForm();

  const [filterClass, setFilterClass]   = useState(undefined);
  const [filterSubject, setFilterSubject] = useState(undefined);
  const [filterType, setFilterType]     = useState(undefined);

  const [selectedClassId, setSelectedClassId]         = useState("");
  const [selectedModalSectionId, setSelectedModalSectionId] = useState("");

  const getId = (v) => (!v ? "" : typeof v === "object" ? v._id : v);

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

  const allSubjects = useMemo(() => {
    const map = new Map();
    teacherClassOptions.forEach((cls) => {
      (cls.subjects || []).forEach((sub) => {
        if (sub.subjectId && !map.has(sub.subjectId)) map.set(sub.subjectId, { value: sub.subjectId, label: sub.subjectName });
      });
      (cls.sections || []).forEach((sec) => {
        (sec.subjects || []).forEach((sub) => {
          if (sub.subjectId && !map.has(sub.subjectId)) map.set(sub.subjectId, { value: sub.subjectId, label: sub.subjectName });
        });
      });
    });
    return Array.from(map.values());
  }, [teacherClassOptions]);

  const fetchMaterials = useCallback(async () => {
    if (!selectedAcademicYear?._id) return;
    setLoading(true);
    try {
      const params = { academicYearId: selectedAcademicYear._id };
      if (filterClass)   params.schoolClassId = filterClass;
      if (filterSubject) params.subjectId     = filterSubject;
      if (filterType)    params.type          = filterType;
      const res = await apiClient.get("/study-materials", { params });
      setMaterials(res.data?.data?.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear?._id, filterClass, filterSubject, filterType]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

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
      subjectId: String(getId(rec.subjectId?._id || rec.subjectId)),
      title: rec.title,
      description: rec.description,
      type: rec.type,
      externalLink: rec.externalLink,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("academicYearId", selectedAcademicYear._id);
      Object.entries(values).forEach(([k, v]) => {
        if (k !== "file" && v !== undefined && v !== null) formData.append(k, v);
      });
      if (values.file?.fileList?.[0]?.originFileObj) {
        formData.append("file", values.file.fileList[0].originFileObj);
      }

      if (editTarget) {
        await apiClient.put(`/study-materials/${editTarget._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        message.success("Material updated.");
      } else {
        await apiClient.post("/study-materials", formData, { headers: { "Content-Type": "multipart/form-data" } });
        message.success("Material uploaded.");
      }
      resetModal();
      fetchMaterials();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/study-materials/${id}`);
      message.success("Deleted.");
      fetchMaterials();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete.");
    }
  };

  const stats = useMemo(() => ({
    total:   materials.length,
    notes:   materials.filter((m) => m.type === "notes").length,
    videos:  materials.filter((m) => m.type === "video").length,
    books:   materials.filter((m) => m.type === "book").length,
  }), [materials]);

  const columns = [
    { title: "Title", dataIndex: "title", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: "Subject", dataIndex: "subjectId", render: (v) => v?.name || "—" },
    { title: "Class", dataIndex: "schoolClassId", render: (v) => v?.name || "—" },
    {
      title: "Type",
      dataIndex: "type",
      render: (v) => <Tag color={TYPE_COLOR[v] || "default"}>{TYPE_OPTIONS.find((t) => t.value === v)?.label || v}</Tag>,
    },
    {
      title: "File / Link",
      render: (_, r) => {
        if (r.fileUrl) return <Button type="link" size="small" href={r.fileUrl} target="_blank" icon={<BookOutlined />}>Download</Button>;
        if (r.externalLink) return <Button type="link" size="small" href={r.externalLink} target="_blank" icon={<LinkOutlined />}>Open Link</Button>;
        return <span style={{ color: "var(--text-muted)" }}>No file</span>;
      },
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this material?" onConfirm={() => handleDelete(r._id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Subject Resources"
        subtitle="Upload and manage study materials for your classes"
        icon={<BookOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Upload Material
          </Button>
        }
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<BookOutlined />} label="Total"  value={stats.total}  color="#14B8A6" />
        <StatCard icon={<BookOutlined />} label="Notes"  value={stats.notes}  color="#0891b2" />
        <StatCard icon={<BookOutlined />} label="Videos" value={stats.videos} color="#22C55E" />
        <StatCard icon={<BookOutlined />} label="Books"  value={stats.books}  color="#F59E0B" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <div style={toolbarRow}>
          <Select
            placeholder="Filter by Class" style={{ width: 160 }} allowClear value={filterClass}
            onChange={setFilterClass}
            options={teacherClassOptions.map((c) => ({ value: c.classId, label: c.className }))}
          />
          <Select
            placeholder="Filter by Subject" style={{ width: 160 }} allowClear value={filterSubject}
            onChange={setFilterSubject} options={allSubjects}
          />
          <Select
            placeholder="Filter by Type" style={{ width: 160 }} allowClear value={filterType}
            onChange={setFilterType} options={TYPE_OPTIONS}
          />
        </div>

        <Table
          columns={columns} dataSource={materials} rowKey="_id"
          loading={loading} pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No study materials uploaded yet" /> }}
        />
      </div>

      <Modal
        title={editTarget ? "Edit Study Material" : "Upload Study Material"}
        open={open} onCancel={resetModal} footer={null} destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Class" name="schoolClassId" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select class"
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
            <Input placeholder="Material title" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
          <Form.Item label="Type" name="type" initialValue="notes">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label="Upload File (PDF, Doc, etc.)" name="file">
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp4">
              <Button icon={<UploadOutlined />}>Choose File</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Or External Link" name="externalLink">
            <Input prefix={<LinkOutlined />} placeholder="https://..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>
            {editTarget ? "Update Material" : "Upload Material"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectResources;

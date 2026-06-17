import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Typography,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  DatePicker,
  Empty,
  List,
  message,
  Popconfirm,
  InputNumber,
} from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAssignedClasses } from "../../../features/classSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  toolbarRow,
} from "../../../styles/pageStyles";

const { Text } = Typography;

const statusColors = { active: "green", overdue: "red" };

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const getId = (value) => (!value ? "" : typeof value === "object" ? value._id : value);

const Assignments = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [gradeForm] = Form.useForm();

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((state) => state.class || {});

  const [searchText, setSearchText]       = useState("");
  const [selectedClassKey, setSelectedClassKey] = useState(undefined);
  const [selectedSectionName, setSelectedSectionName] = useState(undefined);

  const [open, setOpen]                         = useState(false);
  const [editTarget, setEditTarget]             = useState(null);
  const [saving, setSaving]                     = useState(false);
  const [assignments, setAssignments]           = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [submissionsOpen, setSubmissionsOpen]     = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions]             = useState([]);

  const [gradeOpen, setGradeOpen]               = useState(false);
  const [gradingTarget, setGradingTarget]       = useState(null);
  const [gradeSaving, setGradeSaving]           = useState(false);

  const [selectedClassId, setSelectedClassId]         = useState("");
  const [selectedModalSectionId, setSelectedModalSectionId] = useState("");

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
  }, [dispatch, selectedAcademicYear?._id]);

  const mapAssignmentRecord = useCallback((item) => ({
    _id: item?._id,
    title: item?.title || "Assignment",
    description: item?.description || "",
    classId: String(getId(item?.schoolClassId?._id || item?.schoolClassId)),
    class: item?.schoolClassId?.className || item?.schoolClassId?.name || `Class ${item?.schoolClassId?.classNum || ""}`.trim() || "Class",
    section: item?.sectionId?.name || "All Sections",
    subject: item?.subjectId?.name || "Subject",
    subjectId: String(getId(item?.subjectId?._id || item?.subjectId)),
    sectionId: String(getId(item?.sectionId?._id || item?.sectionId)),
    schoolClassId: String(getId(item?.schoolClassId?._id || item?.schoolClassId)),
    dueDate: item?.dueDate,
    status: dayjs(item?.dueDate).isBefore(dayjs(), "day") ? "overdue" : "active",
    createdBy: user?.name || "Teacher",
  }), [user?.name]);

  const fetchAssignments = useCallback(async () => {
    if (!selectedAcademicYear?._id) return;
    try {
      setAssignmentsLoading(true);
      const response = await apiClient.get("/student-portal/teacher/homework", {
        params: { academicYearId: selectedAcademicYear._id },
      });
      const records = response.data?.data || [];
      const withCounts = await Promise.all(
        records.map(async (record) => {
          try {
            const subRes = await apiClient.get(`/student-portal/teacher/homework/${record._id}/submissions`);
            return { ...mapAssignmentRecord(record), submissionCount: (subRes.data?.data || []).length };
          } catch {
            return { ...mapAssignmentRecord(record), submissionCount: 0 };
          }
        })
      );
      setAssignments(withCounts);
    } catch (error) {
      message.error(error?.response?.data?.message || "Unable to load assignments");
    } finally {
      setAssignmentsLoading(false);
    }
  }, [mapAssignmentRecord, selectedAcademicYear?._id]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const teacherClassOptions = useMemo(() => {
    return classAssignTeacher.map((cls) => ({
      classId: String(getId(cls?._id)),
      className: cls?.className || cls?.name || cls?.schoolClassName || `Class ${cls?.classNum || ""}`.trim() || "Class",
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

  const sectionOptions = useMemo(() => {
    const found = teacherClassOptions.find((item) => item.classId === selectedClassKey);
    return found?.sections || [];
  }, [teacherClassOptions, selectedClassKey]);

  const selectedClass = useMemo(() => (
    selectedClassId ? teacherClassOptions.find((c) => String(c.classId) === String(selectedClassId)) || null : null
  ), [selectedClassId, teacherClassOptions]);

  const modalSectionOptions = useMemo(() => (
    (selectedClass?.sections || []).map((sec) => ({ value: sec.sectionId, label: sec.sectionName }))
  ), [selectedClass]);

  const subjectOptions = useMemo(() => {
    if (!selectedClass) return [];
    const subjectMap = new Map();
    const addSubject = (sub) => {
      const id = String(sub?.subjectId || "");
      const name = sub?.subjectName || "";
      if (!id || !name || subjectMap.has(id)) return;
      subjectMap.set(id, { value: id, label: name });
    };
    (selectedClass?.subjects || []).forEach(addSubject);
    if (selectedModalSectionId) {
      const sec = (selectedClass?.sections || []).find((s) => String(s.sectionId) === String(selectedModalSectionId));
      (sec?.subjects || []).forEach(addSubject);
    } else {
      (selectedClass?.sections || []).forEach((s) => (s?.subjects || []).forEach(addSubject));
    }
    return Array.from(subjectMap.values());
  }, [selectedClass, selectedModalSectionId]);

  const filteredAssignments = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return assignments.filter((item) => {
      const matchSearch = !keyword || item.title.toLowerCase().includes(keyword) || item.subject.toLowerCase().includes(keyword);
      const matchClass = !selectedClassKey || item.classId === selectedClassKey;
      const matchSection = !selectedSectionName || item.section === selectedSectionName;
      return matchSearch && matchClass && matchSection;
    });
  }, [assignments, searchText, selectedClassKey, selectedSectionName]);

  const stats = useMemo(() => ({
    total: assignments.length,
    active: assignments.filter((a) => a.status === "active").length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  }), [assignments]);

  const resetModal = () => {
    form.resetFields();
    setSelectedClassId("");
    setSelectedModalSectionId("");
    setEditTarget(null);
    setOpen(false);
  };

  const openEdit = (rec) => {
    setEditTarget(rec);
    form.setFieldsValue({
      title: rec.title,
      description: rec.description,
      schoolClassId: rec.schoolClassId,
      sectionId: rec.sectionId,
      subject: rec.subjectId,
      dueDate: rec.dueDate ? dayjs(rec.dueDate) : null,
    });
    setSelectedClassId(rec.schoolClassId);
    setSelectedModalSectionId(rec.sectionId);
    setOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const due = dayjs(values.dueDate);
    const payload = {
      academicYearId: selectedAcademicYear?._id,
      title: values.title,
      description: values.description,
      schoolClassId: values.schoolClassId,
      sectionId: values.sectionId,
      subjectId: values.subject,
      dueDate: due.toISOString(),
    };

    setSaving(true);
    try {
      if (editTarget) {
        const res = await apiClient.put(`/student-portal/teacher/homework/${editTarget._id}`, payload);
        const updated = mapAssignmentRecord(res.data?.data);
        setAssignments((prev) => prev.map((a) => (a._id === updated._id ? { ...a, ...updated } : a)));
        message.success("Assignment updated.");
      } else {
        const classInfo = teacherClassOptions.find((c) => c.classId === values.schoolClassId);
        const sectionInfo = (classInfo?.sections || []).find((s) => s.sectionId === values.sectionId);
        const res = await apiClient.post("/student-portal/teacher/homework", payload);
        const created = {
          ...mapAssignmentRecord(res.data?.data),
          class: classInfo?.className || "",
          section: sectionInfo?.sectionName || "",
          status: due.isBefore(dayjs(), "day") ? "overdue" : "active",
          submissionCount: 0,
        };
        setAssignments((prev) => [created, ...prev]);
        message.success("Assignment created.");
      }
      resetModal();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rec) => {
    try {
      await apiClient.delete(`/student-portal/teacher/homework/${rec._id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== rec._id));
      message.success("Assignment deleted.");
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete.");
    }
  };

  const fetchSubmissions = useCallback(async () => {
    if (!selectedAssignment?._id) return;
    try {
      setSubmissionsLoading(true);
      const res = await apiClient.get(`/student-portal/teacher/homework/${selectedAssignment._id}/submissions`);
      setSubmissions(res.data?.data || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Unable to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  }, [selectedAssignment?._id]);

  useEffect(() => { if (submissionsOpen) fetchSubmissions(); }, [fetchSubmissions, submissionsOpen]);

  const openGrade = (submission) => {
    setGradingTarget(submission);
    gradeForm.setFieldsValue({ grade: submission.grade ?? undefined, feedback: submission.feedback || "" });
    setGradeOpen(true);
  };

  const handleGrade = async () => {
    const values = await gradeForm.validateFields();
    setGradeSaving(true);
    try {
      const res = await apiClient.put(
        `/student-portal/teacher/homework/submissions/${gradingTarget._id}/grade`,
        values
      );
      const updated = res.data?.data ?? res.data;
      setSubmissions((prev) => prev.map((s) => (s._id === gradingTarget._id ? { ...s, ...updated } : s)));
      message.success("Grade saved.");
      setGradeOpen(false);
      setGradingTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save grade.");
    } finally {
      setGradeSaving(false);
    }
  };

  const columns = [
    {
      title: "Assignment",
      dataIndex: "title",
      render: (val, rec) => (
        <Space direction="vertical" size={0}>
          <Text strong>{val}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>By {rec.createdBy}</Text>
        </Space>
      ),
    },
    {
      title: "Class",
      render: (_, rec) => <Tag color="blue">{rec.class} - {rec.section}</Tag>,
    },
    { title: "Subject", dataIndex: "subject" },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (val) => dayjs(val).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (val) => <Tag color={statusColors[val] || "default"}>{String(val || "").toUpperCase()}</Tag>,
    },
    {
      title: "Submissions",
      render: (_, rec) => (
        <Button type="link" onClick={() => { setSelectedAssignment(rec); setSubmissionsOpen(true); }}>
          {rec.submissionCount || 0} View
        </Button>
      ),
    },
    {
      title: "Actions",
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)} />
          <Popconfirm title="Delete this assignment?" onConfirm={() => handleDelete(rec)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Assignments"
        subtitle="Create and manage assignments for your classes"
        icon={<FileTextOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} disabled={!teacherClassOptions.length}>
            Create Assignment
          </Button>
        }
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<FileTextOutlined />} label="Total"   value={stats.total}   color="#7c3aed" />
        <StatCard icon={<FileTextOutlined />} label="Active"  value={stats.active}  color="#059669" />
        <StatCard icon={<FileTextOutlined />} label="Overdue" value={stats.overdue} color="#dc2626" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <div style={toolbarRow}>
          <Select
            placeholder="Class" style={{ width: 140 }} allowClear value={selectedClassKey}
            onChange={(v) => { setSelectedClassKey(v); setSelectedSectionName(undefined); }}
            options={teacherClassOptions.map((c) => ({ value: c.classId, label: c.className }))}
          />
          <Select
            placeholder="Section" style={{ width: 140 }} allowClear value={selectedSectionName}
            onChange={setSelectedSectionName} disabled={!selectedClassKey}
            options={sectionOptions.map((s) => ({ value: s.sectionName, label: s.sectionName }))}
          />
          <Input
            placeholder="Search assignment" prefix={<SearchOutlined />} style={{ width: 220 }}
            value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear
          />
        </div>

        <Table
          columns={columns} dataSource={filteredAssignments} rowKey="_id"
          loading={classLoading || assignmentsLoading} pagination={{ pageSize: 8 }}
          locale={{ emptyText: <Empty description={teacherClassOptions.length ? "No assignments yet" : "No classes assigned"} /> }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={editTarget ? "Edit Assignment" : "Create Assignment"}
        open={open} onCancel={resetModal} footer={null} destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Assignment title" />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true, message: "Required" }]}>
            <Input.TextArea rows={3} placeholder="Description" />
          </Form.Item>
          <Form.Item label="Class" name="schoolClassId" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select class" loading={classLoading}
              onChange={(v) => { setSelectedClassId(v); setSelectedModalSectionId(""); form.setFieldsValue({ sectionId: undefined, subject: undefined }); }}
              options={teacherClassOptions.map((c) => ({ value: c.classId, label: c.className }))}
              showSearch optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Section" name="sectionId" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder={selectedClassId ? "Select section" : "Select class first"}
              disabled={!selectedClassId} options={modalSectionOptions}
              onChange={(v) => { setSelectedModalSectionId(v); form.setFieldsValue({ subject: undefined }); }}
              showSearch optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Subject" name="subject" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder={selectedClassId ? "Select subject" : "Select class first"}
              disabled={!selectedClassId} options={subjectOptions} showSearch optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="Due Date" name="dueDate" rules={[{ required: true, message: "Required" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>
            {editTarget ? "Update Assignment" : "Create Assignment"}
          </Button>
        </Form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        title={`Submissions${selectedAssignment?.title ? ` — ${selectedAssignment.title}` : ""}`}
        open={submissionsOpen}
        onCancel={() => { setSubmissionsOpen(false); setSubmissions([]); setSelectedAssignment(null); }}
        footer={null} width={600}
      >
        <List
          loading={submissionsLoading} dataSource={submissions}
          locale={{ emptyText: "No submissions yet" }}
          renderItem={(item) => {
            const enrollment = item?.studentEnrollmentId || {};
            const studentUser = enrollment?.studentId?.userId || {};
            return (
              <List.Item
                actions={[
                  <Button key="grade" size="small" icon={<StarOutlined />} onClick={() => openGrade(item)}>
                    {item.grade !== null && item.grade !== undefined ? `Grade: ${item.grade}` : "Grade"}
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0} style={{ flex: 1 }}>
                  <Text strong>{studentUser?.name || "Student"}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Reg: {enrollment?.registrationNumber || "—"} | {enrollment?.sectionId?.name || "—"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Submitted: {item?.submittedAt ? dayjs(item.submittedAt).format("DD MMM YYYY, hh:mm A") : "—"}
                  </Text>
                  {item.grade !== null && item.grade !== undefined && (
                    <Space size={4}>
                      <Tag color="blue">Grade: {item.grade}</Tag>
                      {item.feedback && <Text type="secondary" style={{ fontSize: 12 }}>{item.feedback}</Text>}
                    </Space>
                  )}
                  {!!item?.attachments?.length && (
                    <Space wrap size={4} style={{ marginTop: 4 }}>
                      {item.attachments.map((att, idx) => {
                        const url = typeof att === "string" ? att : att?.url;
                        const name = (typeof att === "object" && att?.name) || `File ${idx + 1}`;
                        if (!url) return null;
                        return (
                          <Button key={idx} size="small" type="link" href={url} target="_blank" rel="noreferrer">{name}</Button>
                        );
                      })}
                    </Space>
                  )}
                </Space>
              </List.Item>
            );
          }}
        />
      </Modal>

      {/* Grade Modal */}
      <Modal
        title="Grade Submission"
        open={gradeOpen} onCancel={() => { setGradeOpen(false); setGradingTarget(null); }}
        footer={null} destroyOnClose
      >
        <Form form={gradeForm} layout="vertical" onFinish={handleGrade}>
          <Form.Item label="Grade (0–100)" name="grade" rules={[{ required: true, message: "Required" }]}>
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Feedback" name="feedback">
            <Input.TextArea rows={3} placeholder="Optional feedback for the student" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={gradeSaving}>Save Grade</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Assignments;

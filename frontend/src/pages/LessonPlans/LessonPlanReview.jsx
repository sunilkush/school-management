import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Empty, Input, Modal, Segmented, Select, Space, Table, Tag, message } from "antd";
import { AuditOutlined, CheckOutlined, RollbackOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../api/httpClient";
import PageHeader from "../../components/layout/PageHeader";
import { LESSON_STATUS } from "../../utils/lessonPlanStatus";

/**
 * Teachers' lesson plans for review. A submitted plan is approved, or returned to its teacher with
 * what to change (PATCH /lesson-plans/:id/review). Open a row to read the plan itself.
 * Used by School Admin, Principal, Vice Principal and Subject Coordinator.
 */
const Block = ({ label, text }) => (text ? (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
    <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{text}</div>
  </div>
) : null);

const LessonPlanReview = () => {
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { user } = useSelector((s) => s.auth || {});
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("submitted");
  const [teacher, setTeacher] = useState(undefined);
  const [returning, setReturning] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!selectedAcademicYear?._id) return;
    setLoading(true);
    try {
      const res = await apiClient.get("/lesson-plans", { params: { academicYearId: selectedAcademicYear._id, limit: 2000 } });
      setPlans(res.data?.data?.items || []);
    } catch (e) {
      message.error(e?.response?.data?.message || "Could not load lesson plans");
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear?._id]);
  useEffect(() => { load(); }, [load]);

  const review = async (plan, decision, note = "") => {
    setBusy(true);
    try {
      await apiClient.patch(`/lesson-plans/${plan._id}/review`, { decision, comment: note });
      message.success(decision === "approve" ? "Approved" : "Returned to the teacher");
      setReturning(null);
      setComment("");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Could not save the review");
    } finally {
      setBusy(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: plans.length };
    Object.keys(LESSON_STATUS).forEach((k) => { c[k] = plans.filter((p) => p.status === k).length; });
    return c;
  }, [plans]);
  const teacherOptions = useMemo(() => {
    const m = new Map();
    plans.forEach((p) => p.teacherId?._id && m.set(p.teacherId._id, p.teacherId.name));
    return [...m.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [plans]);
  const shown = plans.filter((p) => (status === "all" || p.status === status) && (!teacher || p.teacherId?._id === teacher));
  const mine = (p) => String(p.teacherId?._id) === String(user?._id);

  const columns = [
    { title: "Teacher", render: (_, r) => <span className="u-strong">{r.teacherId?.name || "—"}</span> },
    { title: "Lesson", dataIndex: "title" },
    { title: "Class", render: (_, r) => `${r.schoolClassId?.name || "—"}${r.sectionId?.name ? `-${r.sectionId.name}` : ""}` },
    { title: "Subject", render: (_, r) => r.subjectId?.name || "—" },
    { title: "Planned", dataIndex: "plannedDate", render: (v) => (v ? dayjs(v).format("DD MMM") : "—") },
    {
      title: "Status", dataIndex: "status",
      render: (v, r) => (
        <div style={{ maxWidth: 240 }}>
          <Tag color={LESSON_STATUS[v]?.color}>{LESSON_STATUS[v]?.label || v}</Tag>
          {r.reviewComment ? <div className="u-muted" style={{ fontSize: 11 }}>{r.reviewedBy?.name ? `${r.reviewedBy.name}: ` : ""}{r.reviewComment}</div> : null}
        </div>
      ),
    },
    {
      title: "",
      render: (_, r) => (r.status === "submitted" && !mine(r) ? (
        <Space size={4}>
          <Button size="small" type="primary" icon={<CheckOutlined />} loading={busy} onClick={() => review(r, "approve")}>Approve</Button>
          <Button size="small" danger icon={<RollbackOutlined />} onClick={() => { setReturning(r); setComment(""); }}>Return</Button>
        </Space>
      ) : null),
    },
  ];

  return (
    <div className="page-wrapper">
      <PageHeader title="Lesson Plan Review" subtitle="Approve teachers' lesson plans, or send them back with what to change" icon={<AuditOutlined />} />

      <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, justifyContent: "space-between" }}>
          <Segmented
            size="small" value={status} onChange={setStatus}
            options={[
              { value: "submitted", label: `To review ${counts.submitted}` },
              { value: "returned", label: `Returned ${counts.returned}` },
              { value: "approved", label: `Approved ${counts.approved}` },
              { value: "completed", label: `Completed ${counts.completed}` },
              { value: "all", label: `All ${counts.all}` },
            ]}
          />
          <Select size="small" allowClear placeholder="All teachers" style={{ width: 200 }} options={teacherOptions}
            value={teacher} onChange={setTeacher} showSearch optionFilterProp="label" />
        </div>
        <Table
          size="small" rowKey="_id" loading={loading} columns={columns} dataSource={shown} scroll={{ x: "max-content" }}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          expandable={{
            expandedRowRender: (r) => (
              <div style={{ padding: "4px 8px" }}>
                <Block label="Learning objectives" text={r.objectives} />
                <Block label="Lesson content" text={r.content} />
                <Block label="Assessment" text={r.assessment} />
                <div className="u-muted" style={{ fontSize: 12 }}>{r.duration || 45} min{r.submittedAt ? ` · submitted ${dayjs(r.submittedAt).format("DD MMM, hh:mm A")}` : ""}</div>
              </div>
            ),
          }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={status === "submitted" ? "Nothing waiting for review" : "No lesson plans"} /> }}
        />
      </div>

      <Modal
        open={Boolean(returning)} title={`Return “${returning?.title || ""}”`} okText="Return to teacher"
        okButtonProps={{ danger: true, disabled: !comment.trim(), loading: busy }}
        onOk={() => review(returning, "return", comment)} onCancel={() => setReturning(null)} destroyOnClose
      >
        <div className="u-muted" style={{ fontSize: 12, marginBottom: 6 }}>Tell {returning?.teacherId?.name || "the teacher"} what to change. They will see this on their Lesson Plans page.</div>
        <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Add an activity for the second half and a short quiz at the end" />
      </Modal>
    </div>
  );
};

export default LessonPlanReview;

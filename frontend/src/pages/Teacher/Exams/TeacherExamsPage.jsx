import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Empty, Input, InputNumber, Popconfirm, Segmented, Select, Spin, Table, Tag, Tooltip, message,
} from "antd";
import { CheckCircleOutlined, LockOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import { GraduationCap } from "lucide-react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { enterMarksBulk, submitFinalMarks } from "../../../features/examSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader.jsx";

/**
 * Marks entry for the exams this teacher may mark: ones they created, and ones in a subject they
 * teach (or a section they are class teacher of). Data: GET /exams/markable and
 * GET /exams/:id/marks-sheet (students with the marks already saved).
 *
 * The old screen listed every exam in the school (only the first 20), built its student list from
 * the whole class, started every student at 0 instead of their saved mark, and saving then wrote
 * those zeros over real marks. An exam set by the office also refused to save for its subject
 * teacher.
 */
const examWhen = (d) => {
  if (!d) return { label: "No date", color: "default" };
  if (dayjs(d).isBefore(dayjs(), "day")) return { label: "Done", color: "green" };
  if (dayjs(d).isSame(dayjs(), "day")) return { label: "Today", color: "blue" };
  return { label: "Upcoming", color: "orange" };
};

const Stat = ({ label, value, color = "var(--text-primary)" }) => (
  <div style={{ border: "1px solid var(--border-muted)", borderRadius: 10, padding: "6px 12px", background: "var(--surface)" }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
  </div>
);

const TeacherExamsPage = () => {
  const dispatch = useDispatch();
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const academicYearId = selectedAcademicYear?._id;

  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examId, setExamId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [sheetError, setSheetError] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [entered, setEntered] = useState({}); // studentId -> number | null (edits not yet saved)
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const loadExams = useCallback(async () => {
    if (!academicYearId) return;
    setExamsLoading(true);
    try {
      const res = await apiClient.get("/exams/markable", { params: { academicYearId } });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setExams(list);
      setExamId((cur) => (cur && list.some((e) => e._id === cur) ? cur : list[0]?._id || null));
    } catch (e) {
      message.error(e?.response?.data?.message || "Could not load exams");
    } finally {
      setExamsLoading(false);
    }
  }, [academicYearId]);
  useEffect(() => { loadExams(); }, [loadExams]);

  const loadSheet = useCallback(async () => {
    if (!examId) { setSheet(null); return; }
    setSheetLoading(true);
    setSheetError("");
    try {
      const res = await apiClient.get(`/exams/${examId}/marks-sheet`);
      setSheet(res?.data?.data || null);
      setEntered({});
    } catch (e) {
      setSheet(null);
      setSheetError(e?.response?.data?.message || "Could not load the students for this exam");
    } finally {
      setSheetLoading(false);
    }
  }, [examId]);
  useEffect(() => { loadSheet(); }, [loadSheet]);

  const exam = exams.find((e) => e._id === examId);
  const total = sheet?.totalMarks || exam?.totalMarks || 100;
  const passing = sheet?.passingMarks ?? exam?.passingMarks ?? 0;

  const rows = useMemo(() => (sheet?.students || []).map((s) => ({
    ...s,
    value: Object.prototype.hasOwnProperty.call(entered, s.studentId) ? entered[s.studentId] : s.obtainedMarks,
    changed: Object.prototype.hasOwnProperty.call(entered, s.studentId),
  })), [sheet, entered]);

  const stats = useMemo(() => {
    const marked = rows.filter((r) => r.value != null);
    const passed = marked.filter((r) => r.value >= passing).length;
    return {
      students: rows.length,
      marked: marked.length,
      passed,
      failed: marked.length - passed,
      avg: marked.length ? Math.round((marked.reduce((a, r) => a + Number(r.value), 0) / marked.length) * 10) / 10 : null,
      finalized: rows.filter((r) => r.isFinalSubmitted).length,
    };
  }, [rows, passing]);

  const visible = rows.filter((r) => {
    const kw = search.trim().toLowerCase();
    if (kw && !`${r.studentName} ${r.rollNumber ?? ""}`.toLowerCase().includes(kw)) return false;
    if (filter === "pending") return r.value == null;
    if (filter === "pass") return r.value != null && r.value >= passing;
    if (filter === "fail") return r.value != null && r.value < passing;
    return true;
  });

  const changedCount = Object.keys(entered).length;

  // Saves only what was typed on this screen; students left blank are not touched.
  const save = async () => {
    const marks = rows
      .filter((r) => r.changed && r.value != null && !r.isFinalSubmitted)
      .map((r) => ({ studentId: r.studentId, obtainedMarks: r.value, totalMarks: total, passingMarks: passing }));
    if (!marks.length) { message.info("Nothing new to save"); return false; }
    setSaving(true);
    try {
      await dispatch(enterMarksBulk({ examId, marks })).unwrap();
      message.success(`Saved marks for ${marks.length} student(s)`);
      await loadSheet();
      return true;
    } catch (e) {
      message.error(typeof e === "string" ? e : "Could not save marks");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submitFinal = async () => {
    if (changedCount && !(await save())) return;
    setSaving(true);
    try {
      await dispatch(submitFinalMarks({
        examId,
        schoolClassId: exam?.schoolClassId?._id || exam?.schoolClassId,
        sectionId: exam?.sectionId?._id || exam?.sectionId || undefined,
      })).unwrap();
      message.success("Marks submitted as final");
      await loadSheet();
    } catch (e) {
      message.error(typeof e === "string" ? e : "Could not submit");
    } finally {
      setSaving(false);
    }
  };

  const examOptions = exams.map((e) => ({
    value: e._id,
    label: `${e.title || "Untitled"} · ${e.subjectId?.name || "Subject"} · ${e.schoolClassId?.name || "Class"}${e.sectionId?.name ? `-${e.sectionId.name}` : ""} · ${e.examDate ? dayjs(e.examDate).format("DD MMM") : "no date"}`,
  }));

  const columns = [
    { title: "#", dataIndex: "rollNumber", width: 56, render: (v) => <span className="u-muted">{v ?? "—"}</span> },
    { title: "Student", dataIndex: "studentName", render: (v) => <span className="u-strong">{v}</span> },
    { title: "Section", dataIndex: "sectionName", width: 80, render: (v) => v || "—" },
    {
      title: `Marks (of ${total})`, width: 150,
      render: (_, r) => r.isFinalSubmitted ? (
        <span><b>{r.value}</b> <LockOutlined className="u-muted" /></span>
      ) : (
        <InputNumber
          size="small" min={0} max={total} value={r.value} placeholder="—"
          onChange={(v) => setEntered((p) => ({ ...p, [r.studentId]: v ?? null }))}
          style={{ width: 96, borderColor: r.changed ? "var(--warning)" : undefined }}
        />
      ),
    },
    {
      title: "Result", width: 90,
      render: (_, r) => r.value == null
        ? <span className="u-muted" style={{ fontSize: 12 }}>Pending</span>
        : <Tag color={r.value >= passing ? "green" : "red"}>{r.value >= passing ? "PASS" : "FAIL"}</Tag>,
    },
  ];

  const when = examWhen(exam?.examDate);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Exam & Marks Entry"
        subtitle={selectedAcademicYear?.name ? `Exams you can mark · ${selectedAcademicYear.name}` : "Select an academic year"}
        icon={<GraduationCap size={20} />}
        extra={<Tooltip title="Refresh"><Button icon={<ReloadOutlined />} onClick={() => { loadExams(); loadSheet(); }} /></Tooltip>}
      />

      <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Select
            showSearch optionFilterProp="label" style={{ flex: "1 1 320px" }}
            placeholder="Choose an exam…" options={examOptions} value={examId} onChange={setExamId}
            loading={examsLoading} notFoundContent={examsLoading ? <Spin size="small" /> : "No exams you can mark"}
          />
          {exam && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <Tag color={when.color}>{when.label}</Tag>
              <Tag>{exam.examType || "Exam"}</Tag>
              <Tag color="purple">Total {total} · Pass {passing}</Tag>
              {sheet && !sheet.wholeClass && <Tag color="blue">Your sections only</Tag>}
            </div>
          )}
        </div>
      </div>

      {!examsLoading && !exams.length && academicYearId && (
        <Empty style={{ marginTop: 24 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No exams to mark: you have not created any, and none is set in a subject you teach." />
      )}

      {sheetError && <Alert type="warning" showIcon message={sheetError} style={{ marginTop: 12 }} />}

      {sheet && (
        <div className="section-panel" style={{ marginTop: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Stat label="Students" value={stats.students} />
              <Stat label="Marked" value={`${stats.marked}/${stats.students}`} color={stats.marked === stats.students ? "var(--success)" : "var(--warning)"} />
              <Stat label="Average" value={stats.avg == null ? "—" : stats.avg} />
              <Stat label="Pass / Fail" value={`${stats.passed} / ${stats.failed}`} />
              {stats.finalized > 0 && <Stat label="Final" value={stats.finalized} color="var(--purple)" />}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!changedCount} onClick={save}>
                Save{changedCount ? ` (${changedCount})` : ""}
              </Button>
              <Popconfirm
                title="Submit these marks as final?"
                description="Final marks cannot be changed from this screen."
                okText="Submit final" onConfirm={submitFinal}
              >
                <Button icon={<CheckCircleOutlined />} disabled={saving || !stats.marked}>Submit Final</Button>
              </Popconfirm>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Input size="small" allowClear placeholder="Search student or roll no." prefix={<SearchOutlined className="u-muted" />}
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <Segmented size="small" value={filter} onChange={setFilter}
              options={[{ label: "All", value: "all" }, { label: "Not marked", value: "pending" }, { label: "Pass", value: "pass" }, { label: "Fail", value: "fail" }]} />
          </div>

          <Spin spinning={sheetLoading}>
            <Table
              size="small" rowKey="studentId" columns={columns} dataSource={visible}
              pagination={{ pageSize: 40, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: 520 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={rows.length ? "No students match" : "No students enrolled for this exam"} /> }}
            />
          </Spin>
        </div>
      )}
    </div>
  );
};

export default TeacherExamsPage;

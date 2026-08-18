import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Input, InputNumber, Select, Table, Tag,
  Tooltip, Upload, message, Segmented, Progress, Spin,
} from "antd";
import {
  SearchOutlined, UploadOutlined, SaveOutlined,
  CheckCircleOutlined, ReloadOutlined,
} from "@ant-design/icons";
import {
  GraduationCap, BookOpen, Users, TrendingUp, Trophy, AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { enterMarksBulk, getExams, submitFinalMarks } from "../../../features/examSlice";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState,
} from "../../../styles/pageStyles.js";

/* ── Status helpers ───────────────────────────────────────────────── */
const examStatus = (examDate) => {
  if (!examDate) return { label: "No Date", color: "var(--text-secondary)", bg: "var(--surface-soft)" };
  const d = dayjs(examDate);
  if (d.isBefore(dayjs(), "day")) return { label: "Completed", color: "var(--success)", bg: "rgba(var(--success-rgb),0.08)" };
  if (d.isSame(dayjs(), "day"))   return { label: "Today",     color: "var(--info)", bg: "rgba(59,130,246,0.08)" };
  return                                 { label: "Upcoming",  color: "var(--warning)", bg: "rgba(var(--warning-rgb),0.08)" };
};

/* ── Mini stat box ────────────────────────────────────────────────── */
const Stat = ({ icon: Icon, label, value, color }) => (
  <div style={statCard({ color, bg: "var(--surface)", accentBar: color })}>
    <div>
      <div style={statLabel(color)}>{label}</div>
      <div style={statValue(color)}>{value ?? "—"}</div>
    </div>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={20} color={color} strokeWidth={1.8} />
    </div>
  </div>
);

/* ── Main page ────────────────────────────────────────────────────── */
const TeacherExamsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading }  = useSelector((s) => s.exams  || {});
  const { schoolStudents = [] }  = useSelector((s) => s.students || {});
  const { user = {} }            = useSelector((s) => s.auth    || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [rows,           setRows]           = useState([]);
  const [searchText,     setSearchText]     = useState("");
  const [examFilter,     setExamFilter]     = useState("all");
  const [saving,         setSaving]         = useState(false);
  const [submitting,     setSubmitting]     = useState(false);

  const selectedExam = useMemo(
    () => exams.find((e) => e._id === selectedExamId),
    [exams, selectedExamId]
  );
  const schoolId      = user?.schoolId?._id || user?.schoolId || user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;
  const status        = examStatus(selectedExam?.examDate);

  /* ── Fetch exams on mount ── */
  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }));
  }, [dispatch]);

  /* ── Auto-select first exam ── */
  useEffect(() => {
    if (!selectedExamId && exams.length) setSelectedExamId(exams[0]._id);
  }, [exams, selectedExamId]);

  /* ── Fetch students when exam changes ── */
  useEffect(() => {
    const classId = selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId;
    if (!selectedExamId || !classId || !schoolId || !academicYearId) { setRows([]); return; }
    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId, schoolClassId: classId, limit: 200 }));
  }, [dispatch, selectedExamId, selectedExam, schoolId, academicYearId]);

  /* ── Build rows when students load ── */
  useEffect(() => {
    if (!selectedExamId) return;
    const classId = selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId;
    if (!schoolStudents.length || !classId) { setRows([]); return; }
    const matched = schoolStudents.filter((s) => {
      const cid = s?.schoolClassId?._id || s?.schoolClass?._id ||
        s?.schoolClassId || s?.studentInfo?.schoolClassId || s?.enrollment?.schoolClassId;
      return `${cid || ""}` === `${classId}`;
    });
    setRows(matched.map((s, i) => ({
      studentId:    s?.student?._id || s?.studentInfo?._id || s?.studentId || s?._id,
      studentName:  s?.user?.name   || s?.userDetails?.name || s?.studentName || `Student ${i + 1}`,
      sectionId:    s?.section?._id || s?.sectionDetails?._id,
      obtainedMarks: 0,
      totalMarks:   selectedExam?.totalMarks   || 100,
      passingMarks: selectedExam?.passingMarks || 33,
    })));
  }, [selectedExamId, selectedExam, schoolStudents]);

  const onMarkChange = (studentId, value) =>
    setRows((prev) => prev.map((r) => r.studentId === studentId ? { ...r, obtainedMarks: value ?? 0 } : r));

  /* ── Save bulk ── */
  const saveBulk = async () => {
    if (!selectedExamId) { message.error("Select an exam first"); return false; }
    const payload = rows.filter((r) => r.studentId).map((r) => ({
      ...r,
      schoolClassId: selectedExam?.schoolClassId?._id || selectedExam?.schoolClassId,
      sectionId:     r.sectionId || selectedExam?.sectionId?._id || selectedExam?.sectionId,
    }));
    if (!payload.length) { message.warning("No students found for this class"); return false; }
    setSaving(true);
    try {
      await dispatch(enterMarksBulk({ examId: selectedExamId, marks: payload })).unwrap();
      message.success("Marks saved successfully");
      return true;
    } catch (err) {
      message.error(err || "Failed to save marks"); return false;
    } finally { setSaving(false); }
  };

  /* ── Submit final ── */
  const submitFinal = async () => {
    if (!selectedExam) return false;
    setSubmitting(true);
    try {
      await dispatch(submitFinalMarks({
        examId:       selectedExam._id,
        schoolClassId: selectedExam.schoolClassId?._id || selectedExam.schoolClassId,
        sectionId:    selectedExam.sectionId?._id     || selectedExam.sectionId,
      })).unwrap();
      message.success("Final marks submitted");
      return true;
    } catch (err) {
      message.error(err || "Failed to submit"); return false;
    } finally { setSubmitting(false); }
  };

  const saveAndSubmit = async () => {
    const saved = await saveBulk();
    if (saved) await submitFinal();
  };

  /* ── Upload JSON ── */
  const uploadProps = {
    accept: ".json",
    showUploadList: false,
    beforeUpload: async (file) => {
      try {
        const parsed = JSON.parse(await file.text());
        if (Array.isArray(parsed)) { setRows(parsed); message.success("Bulk marks loaded"); }
        else message.error("Expected JSON array");
      } catch { message.error("Invalid JSON file"); }
      return false;
    },
  };

  /* ── Stats ── */
  const summary = useMemo(() => {
    if (!rows.length) return null;
    const passCount = rows.filter((r) => r.obtainedMarks >= r.passingMarks).length;
    const avg       = Math.round(rows.reduce((s, r) => s + Number(r.obtainedMarks || 0), 0) / rows.length);
    return { total: rows.length, passCount, failCount: rows.length - passCount,
      avg, passPercent: rows.length ? Math.round((passCount / rows.length) * 100) : 0 };
  }, [rows]);

  /* ── Filtered rows ── */
  const visibleRows = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !kw || `${r.studentName} ${r.studentId}`.toLowerCase().includes(kw);
      const matchFilter = examFilter === "all" || (r.obtainedMarks >= r.passingMarks ? "pass" : "fail") === examFilter;
      return matchSearch && matchFilter;
    });
  }, [rows, searchText, examFilter]);

  /* ── Exam dropdown options ── */
  const examOptions = useMemo(() =>
    exams.map((e) => ({
      value: e._id,
      label: `${e?.title || "Untitled"} · ${e?.schoolClassId?.name || "Class"} · ${e?.examDate ? dayjs(e.examDate).format("DD MMM YYYY") : "No date"}`,
    })), [exams]);

  /* ── Table columns ── */
  const columns = [
    {
      title: "Student",
      dataIndex: "studentName",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(var(--purple-rgb),0.09)", color: "var(--purple)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>{(name || "S")[0].toUpperCase()}</div>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{name}</span>
        </div>
      ),
    },
    {
      title: "Total", dataIndex: "totalMarks", width: 80,
      render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v}</span>,
    },
    {
      title: "Passing", dataIndex: "passingMarks", width: 90,
      render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v}</span>,
    },
    {
      title: "Obtained", width: 150,
      render: (_, r) => (
        <InputNumber
          min={0} max={r.totalMarks} value={r.obtainedMarks}
          onChange={(v) => onMarkChange(r.studentId, v)}
          style={{ width: 110, borderRadius: 8 }}
        />
      ),
    },
    {
      title: "Status", width: 100, align: "center",
      render: (_, r) => {
        const pass = r.obtainedMarks >= r.passingMarks;
        return (
          <span style={pill(pass ? "var(--success)" : "var(--danger)", pass ? "rgba(var(--success-rgb),0.09)" : "rgba(var(--danger-rgb),0.09)")}>
            {pass ? "PASS" : "FAIL"}
          </span>
        );
      },
    },
    {
      title: "Progress", width: 120,
      render: (_, r) => {
        const pct = Math.min(100, Math.round((r.obtainedMarks / (r.totalMarks || 1)) * 100));
        const color = pct >= 60 ? "var(--success)" : pct >= 33 ? "var(--warning)" : "var(--danger)";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 6, background: "var(--border-muted)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", width: 30 }}>{pct}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("exam-table")}</style>

      <PageHeader
        title="Exam & Marks Entry"
        subtitle={selectedAcademicYear?.name ? `Academic Year: ${selectedAcademicYear.name}` : "Select an academic year"}
        icon={<GraduationCap size={20} />}
        extra={
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }))} />
          </Tooltip>
        }
      />

      {/* ── Exam Selector ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
        }}>
          Select Exam
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Spin spinning={loading} size="small">
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                placeholder="Choose an exam to enter marks…"
                options={examOptions}
                value={selectedExamId}
                onChange={setSelectedExamId}
                size="large"
              />
            </Spin>
          </div>

          {/* Selected exam detail pill */}
          {selectedExam && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              background: "var(--surface-soft)", border: "1px solid var(--border-muted)",
              borderRadius: 12, padding: "10px 16px",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  {selectedExam?.subjectId?.name || "Subject N/A"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {selectedExam?.examType || "Exam"} ·{" "}
                  {selectedExam?.examDate ? dayjs(selectedExam.examDate).format("DD MMM YYYY") : "No date"}
                </div>
              </div>
              <span style={pill(status.color, status.bg)}>{status.label}</span>
              <span style={pill("var(--purple)", "rgba(var(--purple-rgb),0.08)")}>
                Total: {selectedExam?.totalMarks || 100} · Pass: {selectedExam?.passingMarks || 33}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats (only when rows loaded) ── */}
      {summary && (
        <div style={statGrid(150)}>
          <Stat icon={Users}       label="Total Students" value={summary.total}       color="var(--purple)" />
          <Stat icon={TrendingUp}  label="Class Average"  value={`${summary.avg}/${selectedExam?.totalMarks || 100}`} color="var(--info)" />
          <Stat icon={Trophy}      label="Passed"         value={summary.passCount}   color="var(--success)" />
          <Stat icon={AlertCircle} label="Failed"         value={summary.failCount}   color="var(--danger)" />
        </div>
      )}

      {/* ── Marks Table ── */}
      {selectedExamId && (
        <div style={sectionPanel}>
          {/* Toolbar */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Input
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search student…"
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                style={{ width: 220, borderRadius: 9 }}
              />
              <Segmented
                value={examFilter}
                onChange={setExamFilter}
                options={[
                  { label: "All",  value: "all"  },
                  { label: "Pass", value: "pass" },
                  { label: "Fail", value: "fail" },
                ]}
              />
              {summary && (
                <Tooltip title={`${summary.passPercent}% passed`}>
                  <Progress type="circle" size={40} percent={summary.passPercent}
                    strokeColor="var(--success)"
                    format={(p) => <span style={{ fontSize: 10, fontWeight: 700 }}>{p}%</span>}
                  />
                </Tooltip>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} size="small">Bulk JSON</Button>
              </Upload>
              <Button
                size="small"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={saveBulk}
                style={{ background: "var(--purple)", borderColor: "var(--purple)", color: "#fff" }}
              >
                Save Marks
              </Button>
              <Button
                size="small"
                loading={submitting}
                onClick={submitFinal}
              >
                Submit Final
              </Button>
              <Button
                size="small"
                type="dashed"
                loading={saving || submitting}
                onClick={saveAndSubmit}
                icon={<CheckCircleOutlined />}
              >
                Save & Submit
              </Button>
            </div>
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                No Students Found
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Select an exam with an assigned class to see students.
              </div>
            </div>
          ) : (
            <Table
              className="exam-table"
              rowKey={(r, i) => `${r.studentId || "r"}-${i}`}
              dataSource={visibleRows}
              columns={columns}
              pagination={{ pageSize: 20, showSizeChanger: false, size: "small" }}
              size="small"
              scroll={{ x: 700 }}
              locale={{ emptyText: "No students match the current filter" }}
            />
          )}
        </div>
      )}

      {/* ── No exam selected empty state ── */}
      {!selectedExamId && !loading && (
        <div style={emptyState}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            No Exams Found
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            No exams have been assigned to you yet. Contact your school admin.
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamsPage;

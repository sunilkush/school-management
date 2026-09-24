import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Empty, Input, Modal, Popconfirm, Segmented, Select, Skeleton,
  Space, Switch, Tag, Tooltip, message,
} from "antd";
import {
  DeleteOutlined, DownOutlined, EditOutlined, PlusOutlined, ReloadOutlined,
  RightOutlined, SearchOutlined, UploadOutlined,
} from "@ant-design/icons";
import { BookOpen } from "lucide-react";

import { getQuestions, deleteQuestion, toggleQuestionStatus } from "../../../features/questionSlice";
import { fetchAssignedClasses } from "../../../features/classSlice";
import { fetchAllAcademicYears } from "../../../features/academicYearSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import { getClassData } from "../../../features/schoolClassSlice";
import apiClient from "../../../api/httpClient";

import CreateQuestion from "./CreateQuestion";
import BulkUploadQuestions from "./BulkUploadQuestions";
import PageHeader from "../../../components/layout/PageHeader";
import { modalTitle, pill } from "../../../styles/pageStyles";

/**
 * Question Bank — pick a class and a subject, and every question filed under it is on one screen,
 * grouped by chapter, with the answer one click away.
 *
 * The old page put six dropdowns in a row (school, year, class, subject, chapter, search) above a
 * dense table, so you had to make five choices before seeing anything and there was no way to tell
 * which class or subject actually had questions. The chips below carry their own counts, so the
 * gaps are visible before you click.
 */

const QUESTION_LIMIT = 1000;

const TYPE_STYLE = {
  mcq_single: { label: "MCQ", color: "var(--primary)", bg: "var(--primary-light)" },
  mcq_multi: { label: "MCQ · multi", color: "var(--purple)", bg: "rgba(var(--purple-rgb),0.12)" },
  true_false: { label: "True / False", color: "var(--accent-hover)", bg: "var(--accent-light)" },
  fill_blank: { label: "Fill in the blank", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  match: { label: "Match", color: "var(--danger-hover)", bg: "var(--danger-light)" },
};
const DIFF_STYLE = {
  easy: { color: "var(--success-hover)", bg: "var(--success-light)" },
  medium: { color: "var(--warning-hover)", bg: "var(--warning-light)" },
  hard: { color: "var(--danger-hover)", bg: "var(--danger-light)" },
};

const classNumber = (name = "") => Number(String(name).match(/\d+/)?.[0]) || 99;
const titleCase = (s = "") => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const idOf = (v) => (!v ? "" : typeof v === "object" ? String(v._id || "") : String(v));
const errorText = (e, fallback) => e?.response?.data?.message || fallback;

const label = (text) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
    {text}
  </div>
);

const typePill = (t) => {
  const s = TYPE_STYLE[t] || { label: t, color: "var(--text-secondary)", bg: "var(--surface-soft)" };
  return <span style={{ ...pill(s.color, s.bg), fontSize: 11 }}>{s.label}</span>;
};
const diffPill = (d) => {
  const s = DIFF_STYLE[String(d || "").toLowerCase()] || { color: "var(--text-secondary)", bg: "var(--surface-soft)" };
  return <span style={{ ...pill(s.color, s.bg), fontSize: 11, textTransform: "capitalize" }}>{d || "—"}</span>;
};

/* ─────────────────── one question, with its answer underneath ─────────────────── */
const QuestionRow = ({ question: q, index, open, onToggleOpen, onEdit, onDelete, onToggleActive, selected, onSelect }) => {
  const options = Array.isArray(q.options) ? q.options : [];
  const answers = (Array.isArray(q.correctAnswers) ? q.correctAnswers : []).map(String);
  const isCorrect = (opt, i) => answers.includes(String(opt?.key ?? "")) || answers.includes(String(opt?.text ?? "")) || answers.includes(String(i));

  return (
    <div style={{ borderTop: index === 0 ? "none" : "1px solid var(--border-muted)", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(q._id)}
          aria-label={`Select question ${index + 1}`}
          style={{ marginTop: 6, cursor: "pointer" }}
        />
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggleOpen}
          style={{
            flex: 1, display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
            background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, width: 22, flexShrink: 0 }}>
            {open ? <DownOutlined /> : <RightOutlined />}
          </span>
          <span className="u-grow-min">
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.45 }}>
              {q.statement || "—"}
            </span>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, alignItems: "center" }}>
              {typePill(q.questionType)}
              {diffPill(q.difficulty)}
              <span style={{ ...pill("var(--success-hover)", "var(--success-light)"), fontSize: 11 }}>
                {q.marks ?? 0} mark{(q.marks ?? 0) === 1 ? "" : "s"}
                {q.negativeMarks > 0 ? ` · −${q.negativeMarks}` : ""}
              </span>
              {q.chapterId?.name && <Tag color="blue" className="u-m-0">{q.chapterId.name}</Tag>}
              {q.isActive === false && <Tag className="u-m-0">Hidden</Tag>}
            </span>
          </span>
        </button>

        <Space size={2}>
          <Tooltip title={q.isActive === false ? "Hidden from exams — turn on to use it" : "In use — turn off to hide it"}>
            <Switch size="small" checked={q.isActive !== false} onChange={() => onToggleActive(q._id)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(q)} />
          </Tooltip>
          <Popconfirm
            title="Delete this question?"
            description="It is removed for good."
            okText="Delete"
            okType="danger"
            onConfirm={() => onDelete(q._id)}
          >
            <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      </div>

      {open && (
        <div style={{ margin: "10px 0 4px 42px", padding: "12px 14px", background: "var(--surface-soft)", borderRadius: 10 }}>
          {options.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              {options.map((opt, i) => (
                <div
                  key={opt?.key ?? i}
                  style={{
                    fontSize: 13,
                    color: isCorrect(opt, i) ? "var(--success-hover)" : "var(--text-secondary)",
                    fontWeight: isCorrect(opt, i) ? 700 : 500,
                  }}
                >
                  <span style={{ opacity: 0.7, marginRight: 8 }}>{opt?.key ?? String.fromCharCode(65 + i)}.</span>
                  {opt?.text || "—"}
                  {isCorrect(opt, i) && <span style={{ marginLeft: 8, fontSize: 11 }}>✓ correct</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)", marginRight: 8 }}>Answer:</span>
              <span style={{ color: "var(--success-hover)", fontWeight: 700 }}>{answers.join(", ") || "—"}</span>
            </div>
          )}
          {q.explanation && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)", marginRight: 6 }}>Why:</span>{q.explanation}
            </div>
          )}
          {Array.isArray(q.tags) && q.tags.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {q.tags.map((t) => <Tag key={t} className="u-m-0">{t}</Tag>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────── page ────────────────────────────────── */
const QuestionBank = () => {
  const dispatch = useDispatch();

  const { questions = [], pagination, loading } = useSelector((s) => s.questions || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((s) => s.class || {});
  const { schoolClasses = [], loading: schoolClassLoading } = useSelector((s) => s.schoolClass || {});
  const { schools = [] } = useSelector((s) => s.school || {});
  const { academicYears = [], selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { user } = useSelector((s) => s.auth || {});

  const ownSchoolId = user?.schoolId?._id || user?.schoolId || user?.school?._id;
  const roleName = (user?.role?.name || user?.roleId?.name || "").toLowerCase();
  const isSuperAdmin = roleName === "super admin";

  /* Super Admin belongs to no single school, so it picks one; every other role uses its own. */
  const [selectedSchool, setSelectedSchool] = useState("");
  const schoolId = isSuperAdmin ? selectedSchool : ownSchoolId;
  const classList = isSuperAdmin ? schoolClasses : classAssignTeacher;

  const [ayId, setAyId] = useState(() => selectedAcademicYear?._id || "");
  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [chapterId, setChapterId] = useState("all");   // "all" | "none" | a chapter id
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState(null);            // null | "add" | "edit" | "bulk"
  const [editQuestion, setEditQuestion] = useState(null);
  const [chapterOpts, setChapterOpts] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);

  /* Super Admin: the school list feeds the picker in the header */
  useEffect(() => {
    if (isSuperAdmin && !schools.length) dispatch(fetchSchools());
  }, [dispatch, isSuperAdmin, schools.length]);

  useEffect(() => {
    if (!isSuperAdmin && selectedAcademicYear?._id && !ayId) setAyId(selectedAcademicYear._id);
  }, [isSuperAdmin, selectedAcademicYear?._id, ayId]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllAcademicYears(schoolId));
    if (isSuperAdmin) {
      setAyId("");
      setClassId(null); setSubjectId(null); setChapterId("all");
    }
  }, [dispatch, schoolId, isSuperAdmin]);

  /* The academic year decides which classes exist */
  useEffect(() => {
    if (!ayId) return;
    if (isSuperAdmin) {
      if (!schoolId) return;
      dispatch(getClassData({ schoolId, academicYearId: ayId }));
    } else {
      dispatch(fetchAssignedClasses({ academicYearId: ayId }));
    }
    setClassId(null); setSubjectId(null); setChapterId("all");
  }, [dispatch, ayId, isSuperAdmin, schoolId]);

  const reload = useCallback(() => {
    if (schoolId) dispatch(getQuestions({ schoolId, limit: QUESTION_LIMIT }));
  }, [dispatch, schoolId]);

  useEffect(() => { reload(); }, [reload]);

  /* Chapters of the chosen class + subject, used both as a filter and on the new-question form */
  useEffect(() => {
    if (!classId || !subjectId) { setChapterOpts([]); return; }
    let cancelled = false;
    setChapterLoading(true);
    // Active chapters only: a deleted chapter is kept (questions still point at it) but must not
    // be offered for new ones.
    apiClient.get("/chapters", { params: { schoolClassId: classId, subjectId, isActive: "true", limit: 500 } })
      .then((r) => { if (!cancelled) setChapterOpts(r?.data?.data || []); })
      .catch(() => { if (!cancelled) setChapterOpts([]); })
      .finally(() => { if (!cancelled) setChapterLoading(false); });
    return () => { cancelled = true; };
  }, [classId, subjectId]);

  /**
   * What this user is allowed to see: class id → the subjects they hold in it.
   *
   * A Super Admin sees the whole school. A teacher only gets the classes they are assigned to, and
   * within each one only the subjects they teach — the assigned-classes endpoint already narrows
   * the list that way (a class teacher gets the whole section, a subject teacher only their own),
   * so the page must not widen it again from whatever the questions happen to mention.
   */
  const allowed = useMemo(() => {
    if (isSuperAdmin) return null;
    const map = new Map();
    classList.forEach((c) => {
      const id = String(c?._id || '');
      if (!id) return;
      const subs = new Set();
      [...(c?.subjects || []), ...(c?.sections || []).flatMap((s) => s?.subjects || [])]
        .forEach((s) => { const sid = idOf(s?.subjectId || s?._id); if (sid) subs.add(sid); });
      map.set(id, subs);
    });
    return map;
  }, [isSuperAdmin, classList]);

  const canSee = useCallback((q) => {
    if (!allowed) return true;
    const subs = allowed.get(idOf(q.schoolClassId));
    if (!subs) return false;
    return subs.size === 0 || subs.has(idOf(q.subjectId));
  }, [allowed]);

  /* ── classes, with how many questions each one has ── */
  const classes = useMemo(() => {
    const counts = new Map();
    questions.forEach((q) => {
      if (!canSee(q)) return;
      const k = idOf(q.schoolClassId);
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return [...classList]
      .filter((c) => c?._id)
      .sort((a, b) => classNumber(a?.name) - classNumber(b?.name))
      .map((c) => ({ id: String(c._id), name: c.name, raw: c, questions: counts.get(String(c._id)) || 0 }));
  }, [classList, questions, canSee]);

  const currentClass = useMemo(
    () => classes.find((c) => c.id === String(classId)) || null,
    [classes, classId],
  );

  /* ── subjects of that class, with their counts ── */
  const subjects = useMemo(() => {
    if (!currentClass) return [];
    const map = new Map();
    const add = (s) => {
      const id = idOf(s?.subjectId || s?._id);
      const name = s?.subjectId?.name || s?.name || "";
      if (id && name && !map.has(id)) map.set(id, { id, name, questions: 0 });
    };
    (currentClass.raw?.subjects || []).forEach(add);
    (currentClass.raw?.sections || []).forEach((sec) => (sec?.subjects || []).forEach(add));
    questions.forEach((q) => {
      if (idOf(q.schoolClassId) !== currentClass.id) return;
      const sid = idOf(q.subjectId);
      // A question can sit under a subject the class no longer lists. Show it to whoever runs the
      // school; do not use it to hand a teacher a subject they were never given.
      if (!map.has(sid) && sid && isSuperAdmin) map.set(sid, { id: sid, name: q.subjectId?.name || "Other", questions: 0 });
      if (map.has(sid)) map.get(sid).questions += 1;
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [currentClass, questions, isSuperAdmin]);

  /* ── the questions of the chosen class + subject ── */
  const subjectQuestions = useMemo(() => {
    if (!classId || !subjectId) return [];
    return questions.filter((q) => idOf(q.schoolClassId) === String(classId)
      && idOf(q.subjectId) === String(subjectId)
      && canSee(q));
  }, [questions, classId, subjectId, canSee]);

  /* ── chapter chips: every chapter of the subject plus whatever the questions point at ── */
  const chapters = useMemo(() => {
    const counts = new Map();
    let unfiled = 0;
    subjectQuestions.forEach((q) => {
      const cid = idOf(q.chapterId);
      if (!cid) unfiled += 1;
      else counts.set(cid, (counts.get(cid) || 0) + 1);
    });
    const known = chapterOpts.map((ch) => ({
      id: String(ch._id),
      name: ch.chapterNo ? `${ch.chapterNo}. ${ch.name}` : ch.name,
      no: ch.chapterNo ?? 999,
      questions: counts.get(String(ch._id)) || 0,
    }));
    subjectQuestions.forEach((q) => {
      const cid = idOf(q.chapterId);
      if (cid && !known.some((k) => k.id === cid)) {
        known.push({ id: cid, name: q.chapterId?.name || "Chapter", no: 999, questions: counts.get(cid) || 0 });
      }
    });
    known.sort((a, b) => a.no - b.no);
    return { known, unfiled };
  }, [chapterOpts, subjectQuestions]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subjectQuestions.filter((q) => {
      if (chapterId === "none" && idOf(q.chapterId)) return false;
      if (chapterId !== "all" && chapterId !== "none" && idOf(q.chapterId) !== chapterId) return false;
      if (term && !String(q.statement || "").toLowerCase().includes(term)
        && !(q.tags || []).some((t) => String(t).toLowerCase().includes(term))) return false;
      return true;
    });
  }, [subjectQuestions, chapterId, search]);

  const totalMarks = shown.reduce((n, q) => n + (Number(q.marks) || 0), 0);
  const hiddenCount = shown.filter((q) => q.isActive === false).length;

  /* how many exist in total, so a truncated load is admitted rather than hidden */
  const loadedAll = !pagination?.total || pagination.total <= questions.length;

  /* ── actions ── */
  const handleDelete = useCallback(async (id) => {
    try {
      await dispatch(deleteQuestion(id)).unwrap();
    } catch (e) {
      message.error(errorText(e, "Could not delete the question"));
    }
  }, [dispatch]);

  const handleToggleActive = useCallback((id) => { dispatch(toggleQuestionStatus(id)); }, [dispatch]);

  const deleteSelected = () => {
    Modal.confirm({
      title: `Delete ${selectedIds.length} question${selectedIds.length === 1 ? "" : "s"}?`,
      content: "They are removed for good.",
      okText: "Delete",
      okType: "danger",
      centered: true,
      onOk: async () => {
        await Promise.all(selectedIds.map((id) => dispatch(deleteQuestion(id))));
        setSelectedIds([]);
      },
    });
  };

  const toggleSelect = (id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const closeModal = () => { setModal(null); setEditQuestion(null); };
  const afterSave = () => { closeModal(); reload(); };

  /* A new question starts in the class, subject and chapter already on screen. */
  const prefill = useMemo(() => {
    if (!classId || !subjectId) return null;
    return {
      schoolClassId: classId,
      subjectId,
      chapterId: chapterId !== "all" && chapterId !== "none" ? chapterId : undefined,
      difficulty: "medium",
      marks: 1,
      negativeMarks: 0,
      isActive: true,
    };
  }, [classId, subjectId, chapterId]);

  const canAdd = Boolean(schoolId && ayId);
  const subjectName = subjects.find((s) => s.id === String(subjectId))?.name || "";
  // The form needs the year chosen here, not the one in the header — they are not the same thing.
  const currentYear = useMemo(
    () => academicYears.find((y) => String(y._id) === String(ayId)) || null,
    [academicYears, ayId],
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Question Bank"
        subtitle="Pick a class and a subject — every question filed under it is on one screen"
        icon={<BookOpen size={20} />}
        extra={
          <Space size={8} wrap>
            {isSuperAdmin && (
              <Select
                style={{ minWidth: 200 }}
                placeholder="School"
                showSearch
                optionFilterProp="label"
                value={selectedSchool || undefined}
                onChange={(v) => setSelectedSchool(v || "")}
                options={schools.map((s) => ({ value: s._id, label: s.name }))}
              />
            )}
            <Select
              style={{ minWidth: 150 }}
              placeholder="Academic year"
              disabled={!schoolId}
              value={ayId || undefined}
              onChange={(v) => setAyId(v || "")}
              options={academicYears.map((ay) => ({ value: ay._id, label: ay.name }))}
            />
            <Tooltip title="Reload">
              <Button icon={<ReloadOutlined />} onClick={reload} disabled={!schoolId} />
            </Tooltip>
            <Button icon={<UploadOutlined />} disabled={!canAdd} onClick={() => setModal("bulk")}>
              Upload a file
            </Button>
          </Space>
        }
      />

      {isSuperAdmin && !selectedSchool ? (
        <div className="section-panel">
          <Empty description="Questions belong to a school — choose one at the top to begin" />
        </div>
      ) : !ayId ? (
        <div className="section-panel">
          <Empty description="Choose an academic year at the top — classes belong to one" />
        </div>
      ) : (
        <>
          {/* ── Step 1 & 2: class and subject ── */}
          <div className="section-panel">
            {label("Class")}
            {(isSuperAdmin ? schoolClassLoading : classLoading) && !classes.length ? (
              <Skeleton.Button active size="small" style={{ width: 320 }} />
            ) : classes.length ? (
              <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                <Segmented
                  value={classId}
                  onChange={(v) => { setClassId(v); setSubjectId(null); setChapterId("all"); setSearch(""); setOpenQuestion(null); }}
                  options={classes.map((c) => ({
                    value: c.id,
                    label: (
                      <span>
                        {titleCase(c.name)}{" "}
                        <span style={{ opacity: 0.6 }}>{c.questions}</span>
                      </span>
                    ),
                  }))}
                />
              </div>
            ) : (
              <div className="u-meta-md">This year has no classes yet.</div>
            )}

            <div style={{ height: 16 }} />
            {label("Subject")}
            {!classId ? (
              <div className="u-meta-md">Pick a class first.</div>
            ) : subjects.length ? (
              <div className="u-row-wrap">
                {subjects.map((s) => (
                  <Tag.CheckableTag
                    key={s.id}
                    checked={String(subjectId) === s.id}
                    onChange={() => { setSubjectId(s.id); setChapterId("all"); setSearch(""); setOpenQuestion(null); }}
                    style={{ padding: "5px 12px", borderRadius: 99, fontSize: 13 }}
                  >
                    {titleCase(s.name)} <span style={{ opacity: 0.7 }}>{s.questions}</span>
                  </Tag.CheckableTag>
                ))}
              </div>
            ) : (
              <div className="u-meta-md">This class has no subjects yet.</div>
            )}
          </div>

          {/* ── Step 3: the questions ── */}
          {!subjectId ? (
            <div className="section-panel"><Empty description="Pick a subject to see its questions" /></div>
          ) : (
            <div className="section-panel">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
                    {titleCase(subjectName)}{" "}
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>· {titleCase(currentClass?.name || "")}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                    {shown.length} question{shown.length === 1 ? "" : "s"} · {totalMarks} mark{totalMarks === 1 ? "" : "s"}
                    {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
                  </div>
                </div>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Search questions"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ maxWidth: 280 }}
                />
                <Button type="primary" icon={<PlusOutlined />} disabled={!canAdd} onClick={() => setModal("add")}>
                  Add question
                </Button>
              </div>

              {/* chapter filter */}
              {chapterLoading ? (
                <Skeleton.Button active size="small" style={{ width: 280, marginBottom: 12 }} />
              ) : (chapters.known.length > 0 || chapters.unfiled > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <Tag.CheckableTag
                    checked={chapterId === "all"}
                    onChange={() => setChapterId("all")}
                    style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12 }}
                  >
                    All chapters <span style={{ opacity: 0.7 }}>{subjectQuestions.length}</span>
                  </Tag.CheckableTag>
                  {chapters.known.map((ch) => (
                    <Tag.CheckableTag
                      key={ch.id}
                      checked={chapterId === ch.id}
                      onChange={() => setChapterId(ch.id)}
                      style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12 }}
                    >
                      {ch.name} <span style={{ opacity: 0.7 }}>{ch.questions}</span>
                    </Tag.CheckableTag>
                  ))}
                  {chapters.unfiled > 0 && (
                    <Tag.CheckableTag
                      checked={chapterId === "none"}
                      onChange={() => setChapterId("none")}
                      style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12 }}
                    >
                      No chapter <span style={{ opacity: 0.7 }}>{chapters.unfiled}</span>
                    </Tag.CheckableTag>
                  )}
                </div>
              )}

              {selectedIds.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
                  padding: "8px 12px", borderRadius: 8,
                  background: "var(--danger-light)", border: "1px solid rgba(var(--danger-rgb),0.19)",
                }}>
                  <span style={{ fontWeight: 600, color: "var(--danger-hover)", fontSize: 13 }}>
                    {selectedIds.length} selected
                  </span>
                  <Button danger size="small" icon={<DeleteOutlined />} onClick={deleteSelected}>Delete</Button>
                  <Button size="small" onClick={() => setSelectedIds([])}>Cancel</Button>
                </div>
              )}

              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : shown.length === 0 ? (
                <Empty
                  description={
                    search || chapterId !== "all"
                      ? "Nothing matches — clear the search or pick another chapter"
                      : "No questions here yet"
                  }
                >
                  <Button type="primary" icon={<PlusOutlined />} disabled={!canAdd} onClick={() => setModal("add")}>
                    Add the first one
                  </Button>
                </Empty>
              ) : (
                <div>
                  {shown.map((q, i) => (
                    <QuestionRow
                      key={q._id}
                      question={q}
                      index={i}
                      open={openQuestion === q._id}
                      onToggleOpen={() => setOpenQuestion(openQuestion === q._id ? null : q._id)}
                      onEdit={(row) => { setEditQuestion(row); setModal("edit"); }}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                      selected={selectedIds.includes(q._id)}
                      onSelect={toggleSelect}
                    />
                  ))}
                </div>
              )}

              {!loadedAll && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  Showing the {questions.length} most recent of {pagination.total} questions in this school.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── add / edit ── */}
      <Modal
        open={modal === "add" || modal === "edit"}
        footer={null}
        width={780}
        destroyOnClose
        centered
        title={modalTitle(
          modal === "edit" ? <EditOutlined /> : <PlusOutlined />,
          modal === "edit" ? "Edit question" : "New question",
          modal === "edit"
            ? "Change what this question asks or how it is marked"
            : `${titleCase(currentClass?.name || "")}${subjectName ? ` · ${titleCase(subjectName)}` : ""}`,
        )}
        onCancel={closeModal}
        styles={{ body: { padding: 20, maxHeight: "80vh", overflowY: "auto" } }}
      >
        <CreateQuestion
          initialData={modal === "edit" ? editQuestion : prefill}
          onSuccess={afterSave}
          schoolId={isSuperAdmin ? selectedSchool : undefined}
          academicYear={currentYear}
        />
      </Modal>

      {/* ── bulk upload ── */}
      <Modal
        open={modal === "bulk"}
        footer={null}
        width={720}
        destroyOnClose
        centered
        title={modalTitle(<UploadOutlined />, "Upload questions", "Add many at once from a spreadsheet")}
        onCancel={closeModal}
        styles={{ body: { padding: 20 } }}
      >
        <BulkUploadQuestions
          onSuccess={afterSave}
          schoolId={isSuperAdmin ? selectedSchool : undefined}
          academicYearId={ayId || undefined}
          classOptions={isSuperAdmin ? schoolClasses : undefined}
        />
      </Modal>
    </div>
  );
};

export default QuestionBank;

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Select, Input, Tag, Drawer, Popconfirm,
  Space, Empty, Spin, Table, Tooltip, Switch, Modal,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  UploadOutlined, ReloadOutlined, SearchOutlined, FilterOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import { BookOpen, BarChart3, CheckSquare, AlignLeft } from "lucide-react";
import { useLocation } from "react-router-dom";

import { getQuestions, deleteQuestion, toggleQuestionStatus } from "../../../features/questionSlice";
import { fetchAssignedClasses } from "../../../features/classSlice";
import { fetchAllAcademicYears } from "../../../features/academicYearSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import { getClassData } from "../../../features/schoolClassSlice";
import apiClient from "../../../api/httpClient";

import CreateQuestion from "./CreateQuestion";
import BulkUploadQuestions from "./BulkUploadQuestions";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, tableHeadCss, statGrid,
  statCard, statLabel, statValue, toolbarRow, iconWell, pill,
} from "../../../styles/pageStyles";

/* ── colour helpers ────────────────────────────────────────────── */
const TYPE_STYLE = {
  mcq_single: { label: "MCQ·Single",   color: "#2563EB", bg: "#DBEAFE" },
  mcq_multi:  { label: "MCQ·Multi",    color: "#7C3AED", bg: "#EDE9FE" },
  true_false: { label: "True/False",   color: "#0D9488", bg: "#CCFBF1" },
  fill_blank: { label: "Fill Blank",   color: "#D97706", bg: "#FEF3C7" },
  match:      { label: "Match",        color: "#B91C1C", bg: "#FEE2E2" },
};
const DIFF_STYLE = {
  easy:   { color: "#15803D", bg: "#DCFCE7" },
  medium: { color: "#B45309", bg: "#FEF3C7" },
  hard:   { color: "#DC2626", bg: "#FEE2E2" },
};
const typePill  = (t) => { const s = TYPE_STYLE[t] || { label: t, color: "#64748B", bg: "#F1F5F9" }; return <span style={{ ...pill(s.color, s.bg), fontSize: 11 }}>{s.label}</span>; };
const diffPill  = (d) => { const s = DIFF_STYLE[(d||"").toLowerCase()] || { color: "#64748B", bg: "#F1F5F9" }; return <span style={{ ...pill(s.color, s.bg), fontSize: 11, textTransform: "capitalize" }}>{d || "—"}</span>; };

/* ── QuestionPreviewDrawer ─────────────────────────────────────── */
const QuestionPreviewDrawer = ({ question: q, open, onClose }) => {
  if (!q) return null;
  const typeStyle = TYPE_STYLE[q.questionType] || { label: q.questionType, color: "#64748B", bg: "#F1F5F9" };
  const diffStyle = DIFF_STYLE[(q.difficulty || "").toLowerCase()] || { color: "#64748B", bg: "#F1F5F9" };

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{children}</div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...iconWell("#2563EB", 32), borderRadius: 9 }}><EyeOutlined /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Question Preview</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
              {q.schoolClassId?.name || "—"} &nbsp;·&nbsp; {q.subjectId?.name || "—"}
            </div>
          </div>
        </div>
      }
      width={520}
      styles={{ body: { padding: 20 } }}
    >
      {/* Type & Difficulty badges */}
      <Space style={{ marginBottom: 16 }}>
        <span style={{ ...pill(typeStyle.color, typeStyle.bg) }}>{typeStyle.label}</span>
        <span style={{ ...pill(diffStyle.color, diffStyle.bg), textTransform: "capitalize" }}>{q.difficulty || "—"}</span>
        <span style={{ ...pill("#15803D", "#DCFCE7") }}>+{q.marks ?? 0} marks</span>
        {(q.negativeMarks > 0) && <span style={{ ...pill("#DC2626", "#FEE2E2") }}>−{q.negativeMarks}</span>}
        {q.isActive
          ? <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
          : <Tag color="red"   icon={<CloseCircleOutlined />}>Inactive</Tag>
        }
      </Space>

      {/* Statement */}
      <div style={{
        ...pageCard, padding: 16, marginBottom: 16,
        fontSize: 15, fontWeight: 500, lineHeight: 1.6,
        color: "var(--text-primary)",
      }}>
        {q.statement || "No statement"}
      </div>

      <Field label="Class · Subject · Chapter">
        {[q.schoolClassId?.name, q.subjectId?.name, q.chapterId?.name || q.topic]
          .filter(Boolean).join(" → ") || "—"}
      </Field>

      {/* Options */}
      {Array.isArray(q.options) && q.options.length > 0 && (
        <Field label={`Options (${q.options.length})`}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {q.options.map((opt, i) => {
              const isCorrect = (q.correctAnswers || []).includes(opt.key);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 10,
                  background: isCorrect ? "#DCFCE7" : "var(--surface-soft)",
                  border: `1px solid ${isCorrect ? "#22C55E44" : "var(--border-muted)"}`,
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: isCorrect ? "#22C55E" : "var(--border)",
                    color: isCorrect ? "#fff" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 12,
                  }}>
                    {opt.key}
                  </span>
                  <span style={{ fontSize: 13, color: isCorrect ? "#15803D" : "var(--text-primary)", fontWeight: isCorrect ? 600 : 400 }}>
                    {opt.text}
                  </span>
                  {isCorrect && <CheckCircleOutlined style={{ color: "#22C55E", marginLeft: "auto" }} />}
                </div>
              );
            })}
          </Space>
        </Field>
      )}

      {/* Correct Answers (non-MCQ) */}
      {(!Array.isArray(q.options) || !q.options.length) && Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0 && (
        <Field label="Correct Answers">
          <Space wrap>
            {q.correctAnswers.map((a, i) => (
              <Tag key={i} color="green">{a}</Tag>
            ))}
          </Space>
        </Field>
      )}

      {/* Tags */}
      {Array.isArray(q.tags) && q.tags.length > 0 && (
        <Field label="Tags">
          <Space wrap>{q.tags.map((t) => <Tag key={t}>{t}</Tag>)}</Space>
        </Field>
      )}
    </Drawer>
  );
};

/* ════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const QuestionBank = () => {
  const dispatch  = useDispatch();
  const location  = useLocation();

  const { questions = [], loading }         = useSelector((s) => s.questions || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((s) => s.class || {});
  const { schoolClasses = [], loading: schoolClassLoading } = useSelector((s) => s.schoolClass || {});
  const { schools = [] }                    = useSelector((s) => s.school || {});
  const { academicYears = [], selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { user }                            = useSelector((s) => s.auth || {});

  const schoolId = user?.schoolId?._id || user?.schoolId || user?.school?._id;
  const userRoleName = (user?.role?.name || user?.roleId?.name || "").toLowerCase();
  const isSuperAdmin = userRoleName === "super admin";

  // Super Admin isn't tied to one school, so it doesn't have its own schoolId — it picks one via
  // the School filter below. Everything downstream (classes, subjects, questions, AYs) keys off
  // this instead of the plain `schoolId` so normal (single-school) users are completely unaffected.
  const [selectedSchool, setSelectedSchool] = useState("");
  const effectiveSchoolId = isSuperAdmin ? selectedSchool : schoolId;
  const classListForFilters = isSuperAdmin ? schoolClasses : classAssignTeacher;

  /* ── UI state ── */
  const [modal,          setModal]          = useState(null);   // null | "add" | "edit" | "bulk"
  const [editQuestion,   setEditQuestion]   = useState(null);
  const [previewQ,       setPreviewQ]       = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  /* ── Filters ── */
  const [filterAyId, setFilterAyId] = useState(() => selectedAcademicYear?._id || "");
  const [classId,    setClassId]    = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [chapterId,  setChapterId]  = useState("");
  const [search,     setSearch]     = useState("");
  const [searchInput,setSearchInput]= useState("");

  /* ── Chapters ── */
  const [chapterOpts,    setChapterOpts]    = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);

  /* ── Pagination ── */
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(20);

  /* ── Super Admin: load the school list once (School filter options) ── */
  useEffect(() => {
    if (isSuperAdmin && !schools.length) {
      dispatch(fetchSchools());
    }
  }, [dispatch, isSuperAdmin, schools.length]);

  /* ── Sync filterAyId with global AY on first load (non-Super-Admin only — Super Admin picks
     a school first, and its AY list depends on that choice) ── */
  useEffect(() => {
    if (!isSuperAdmin && selectedAcademicYear?._id && !filterAyId) {
      setFilterAyId(selectedAcademicYear._id);
    }
  }, [isSuperAdmin, selectedAcademicYear?._id]);

  /* ── Fetch AY list whenever the effective school changes ── */
  useEffect(() => {
    if (!effectiveSchoolId) return;
    dispatch(fetchAllAcademicYears(effectiveSchoolId));
    if (isSuperAdmin) {
      // Switching schools invalidates whatever AY/class/subject/chapter was picked for the old one.
      setFilterAyId("");
      setClassId(""); setSubjectId(""); setChapterId("");
    }
  }, [dispatch, effectiveSchoolId, isSuperAdmin]);

  /* ── Load classes by selected AY filter ── */
  useEffect(() => {
    if (!filterAyId) return;
    if (isSuperAdmin) {
      if (!effectiveSchoolId) return;
      dispatch(getClassData({ schoolId: effectiveSchoolId, academicYearId: filterAyId }));
    } else {
      dispatch(fetchAssignedClasses({ academicYearId: filterAyId }));
    }
    setClassId("");
    setSubjectId("");
    setChapterId("");
  }, [dispatch, filterAyId, isSuperAdmin, effectiveSchoolId]);

  /* ── Load questions ── */
  useEffect(() => {
    if (!effectiveSchoolId) return;
    dispatch(getQuestions({ schoolId: effectiveSchoolId, limit: 500 }));
  }, [dispatch, effectiveSchoolId]);

  /* ── Search debounce ── */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Load chapters on class+subject change ── */
  useEffect(() => {
    if (!classId || !subjectId) { setChapterOpts([]); return; }
    setChapterLoading(true);
    apiClient.get("/chapters", { params: { schoolClassId: classId, subjectId, limit: 500 } })
      .then((r) => setChapterOpts(
        (r?.data?.data || []).map((ch) => ({
          value: ch._id,
          label: ch.chapterNo ? `${ch.chapterNo}. ${ch.name}` : ch.name,
        }))
      ))
      .catch(() => setChapterOpts([]))
      .finally(() => setChapterLoading(false));
  }, [classId, subjectId]);

  /* ── Helper: get id from populated or plain value ── */
  const getId = (v) => (!v ? "" : typeof v === "object" ? v._id : v);

  /* ── Permission map: only show questions for assigned classes (Teacher/etc.). Super Admin isn't
     restricted to "assigned" classes — classListForFilters is already every class in the selected
     school, and subjectsByClass is deliberately left empty per class below (schoolClasses' subject
     entries carry no `.subjectId` wrapper), which the filter below reads as "no subject restriction". ── */
  const permissionMap = useMemo(() => {
    const classIds = new Set();
    const subjectsByClass = new Map();
    classListForFilters.forEach((cls) => {
      const cId = String(getId(cls?._id) || "");
      if (!cId) return;
      classIds.add(cId);
      const subs = new Set();
      [...(cls?.subjects || []), ...(cls?.sections || []).flatMap((s) => s?.subjects || [])].forEach((sub) => {
        const sId = String(getId(sub?.subjectId) || "");
        if (sId) subs.add(sId);
      });
      subjectsByClass.set(cId, subs);
    });
    return { classIds, subjectsByClass };
  }, [classListForFilters]);

  /* ── Subject options for selected class ── */
  const selectedClassObj = useMemo(() =>
    classListForFilters.find((c) => String(getId(c?._id)) === String(classId)) || null,
    [classListForFilters, classId]
  );
  const subjectOptions = useMemo(() => {
    if (!selectedClassObj) return [];
    const map = new Map();
    const addSub = (s) => {
      const id   = String(getId(s?.subjectId || s?._id) || "");
      const name = s?.subjectId?.name || s?.name || "";
      if (id && name && !map.has(id)) map.set(id, { value: id, label: name });
    };
    (selectedClassObj?.subjects || []).forEach(addSub);
    (selectedClassObj?.sections || []).forEach((sec) => (sec?.subjects || []).forEach(addSub));
    return Array.from(map.values());
  }, [selectedClassObj]);

  /* ── Filtered questions (client-side) ── */
  const filteredQuestions = useMemo(() => {
    const q = search.toLowerCase();
    return questions.filter((item) => {
      const qClassId   = String(getId(item.schoolClassId) || "");
      const qSubjectId = String(getId(item.subjectId)     || "");
      const qChapterId = String(getId(item.chapterId)     || "");
      if (!permissionMap.classIds.has(qClassId)) return false;
      const allowedSubs = permissionMap.subjectsByClass.get(qClassId);
      if (allowedSubs?.size && !allowedSubs.has(qSubjectId)) return false;
      if (classId   && qClassId   !== String(classId))   return false;
      if (subjectId && qSubjectId !== String(subjectId)) return false;
      if (chapterId && qChapterId !== String(chapterId)) return false;
      if (q && !item.statement?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [questions, classId, subjectId, chapterId, search, permissionMap]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:  filteredQuestions.length,
    mcq:    filteredQuestions.filter((q) => q.questionType?.startsWith("mcq")).length,
    tf:     filteredQuestions.filter((q) => q.questionType === "true_false").length,
    fill:   filteredQuestions.filter((q) => q.questionType === "fill_blank").length,
  }), [filteredQuestions]);

  /* ── Handlers ── */
  const handleEdit = (record) => {
    setEditQuestion(record);
    setModal("edit");
  };

  const handleDelete = useCallback((id) => {
    dispatch(deleteQuestion(id));
  }, [dispatch]);

  const handleBulkDelete = () => {
    Modal.confirm({
      title: `${selectedRowKeys.length} questions delete karein?`,
      content: "Yeh action undo nahi ho sakta.",
      okText: "Delete",
      okType: "danger",
      centered: true,
      onOk: () => {
        selectedRowKeys.forEach((id) => dispatch(deleteQuestion(id)));
        setSelectedRowKeys([]);
      },
    });
  };

  const handleToggle = useCallback((id) => {
    dispatch(toggleQuestionStatus(id));
  }, [dispatch]);

  const closeModal = () => {
    setModal(null);
    setEditQuestion(null);
  };

  const handleSuccess = () => {
    closeModal();
    dispatch(getQuestions({ schoolId, limit: 500 }));
  };

  const clearFilters = () => {
    setClassId(""); setSubjectId(""); setChapterId(""); setSearchInput(""); setSearch("");
  };

  const activeFilters = [classId, subjectId, chapterId, search].filter(Boolean).length;

  /* ── Table columns ── */
  const columns = [
    {
      title: "#",
      key:   "idx",
      width: 52,
      render: (_, __, i) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
          {(page - 1) * pageSize + i + 1}
        </span>
      ),
    },
    {
      title:     "Question",
      dataIndex: "statement",
      key:       "statement",
      ellipsis:  true,
      render:    (text, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13, lineHeight: 1.4, marginBottom: 4 }}>
            {text || "—"}
          </div>
          <Space size={4} wrap>
            {typePill(r.questionType)}
            {diffPill(r.difficulty)}
            {r.chapterId?.name && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.chapterId.name}</span>}
          </Space>
        </div>
      ),
    },
    {
      title:  "Class",
      key:    "class",
      width:  110,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.schoolClassId?.name || "—"}</div>
          <div style={{ color: "var(--text-muted)" }}>{r.subjectId?.name || "—"}</div>
        </div>
      ),
    },
    {
      title:  "Marks",
      key:    "marks",
      width:  80,
      align:  "center",
      render: (_, r) => (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>+{r.marks ?? 0}</div>
          {r.negativeMarks > 0 && <div style={{ fontSize: 11, color: "#DC2626" }}>−{r.negativeMarks}</div>}
        </div>
      ),
    },
    {
      title:  "Status",
      key:    "status",
      width:  80,
      align:  "center",
      render: (_, r) => (
        <Tooltip title={r.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}>
          <Switch
            size="small"
            checked={!!r.isActive}
            onChange={() => handleToggle(r._id)}
          />
        </Tooltip>
      ),
    },
    {
      title:  "Actions",
      key:    "actions",
      width:  110,
      align:  "right",
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Preview">
            <Button
              type="text" size="small" icon={<EyeOutlined />}
              style={{ color: "var(--primary)" }}
              onClick={() => setPreviewQ(r)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text" size="small" icon={<EditOutlined />}
              style={{ color: "#D97706" }}
              onClick={() => handleEdit(r)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete karein?"
            description="Yeh question permanently delete ho jaayega."
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            onConfirm={() => handleDelete(r._id)}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statMeta = [
    { label: "Total Questions",  value: stats.total, color: "#2563EB", icon: <BookOpen size={18} /> },
    { label: "MCQ",              value: stats.mcq,   color: "#7C3AED", icon: <CheckSquare size={18} /> },
    { label: "True / False",     value: stats.tf,    color: "#0D9488", icon: <CheckSquare size={18} /> },
    { label: "Fill in the Blank",value: stats.fill,  color: "#D97706", icon: <AlignLeft size={18} /> },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("qb-table")}</style>

      <PageHeader
        title="Question Bank"
        subtitle="Questions manage, filter aur organize karein — class, subject, chapter ke hisab se."
        icon={<BookOpen size={20} />}
        extra={
          <Space size={8}>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={() => effectiveSchoolId && dispatch(getQuestions({ schoolId: effectiveSchoolId, limit: 500 }))} />
            </Tooltip>
            <Button
              icon={<UploadOutlined />}
              disabled={isSuperAdmin && !selectedSchool}
              onClick={() => setModal("bulk")}
            >
              Bulk Upload
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={isSuperAdmin && !selectedSchool}
              onClick={() => setModal("add")}
            >
              Add Question
            </Button>
          </Space>
        }
      />

      <div style={{ marginTop: 20 }}>
        {isSuperAdmin && !selectedSchool && (
          <div style={{ ...pageCard, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Question Bank school-specific hai — pehle neeche <strong>School</strong> select karein.
            </span>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{ ...statGrid(170), marginBottom: 20 }}>
          {statMeta.map((s) => (
            <div key={s.label} style={statCard({ color: s.color })}>
              <div>
                <div style={statLabel(s.color)}>{s.label}</div>
                <div style={statValue(s.color)}>{s.value}</div>
              </div>
              <span style={{ fontSize: 28, color: s.color, opacity: 0.55 }}>{s.icon}</span>
            </div>
          ))}
        </div>

        {/* ── Filter toolbar ── */}
        <div style={{ ...pageCard, padding: 16, marginBottom: 16 }}>
          <div style={{ ...toolbarRow, marginBottom: 10 }}>
            {isSuperAdmin && (
              <Select
                placeholder="School"
                showSearch
                optionFilterProp="children"
                value={selectedSchool || undefined}
                style={{ minWidth: 180 }}
                onChange={(v) => setSelectedSchool(v || "")}
              >
                {schools.map((sc) => (
                  <Select.Option key={sc._id} value={sc._id}>{sc.name}</Select.Option>
                ))}
              </Select>
            )}

            <Select
              placeholder="Academic Year"
              showSearch
              optionFilterProp="children"
              disabled={isSuperAdmin && !selectedSchool}
              value={filterAyId || undefined}
              style={{ minWidth: 160 }}
              onChange={(v) => { setFilterAyId(v || ""); }}
            >
              {academicYears.map((ay) => (
                <Select.Option key={ay._id} value={ay._id}>{ay.name}</Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Class"
              allowClear
              showSearch
              optionFilterProp="children"
              loading={isSuperAdmin ? schoolClassLoading : classLoading}
              disabled={isSuperAdmin && !selectedSchool}
              value={classId || undefined}
              style={{ minWidth: 130 }}
              onChange={(v) => { setClassId(v || ""); setSubjectId(""); setChapterId(""); }}
            >
              {classListForFilters.map((c) => (
                <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Subject"
              allowClear
              showSearch
              optionFilterProp="children"
              disabled={!classId}
              value={subjectId || undefined}
              style={{ minWidth: 140 }}
              onChange={(v) => { setSubjectId(v || ""); setChapterId(""); }}
            >
              {subjectOptions.map((s) => (
                <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Chapter"
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!subjectId}
              loading={chapterLoading}
              value={chapterId || undefined}
              style={{ minWidth: 160 }}
              options={chapterOpts}
              onChange={(v) => setChapterId(v || "")}
            />

            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Question search karein..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ minWidth: 200, flex: 1 }}
            />

            {activeFilters > 0 && (
              <Button icon={<FilterOutlined />} onClick={clearFilters}>
                Clear ({activeFilters})
              </Button>
            )}
          </div>

          {/* Bulk delete bar */}
          {selectedRowKeys.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 12px", borderRadius: 8,
              background: "#FEE2E2", border: "1px solid #DC262630",
            }}>
              <span style={{ fontWeight: 600, color: "#DC2626", fontSize: 13 }}>
                {selectedRowKeys.length} questions selected
              </span>
              <Button danger size="small" icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                Delete Selected
              </Button>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>Cancel</Button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div style={pageCard}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>Questions</span>
              <span style={{
                marginLeft: 10, fontSize: 11, fontWeight: 600,
                background: "#DBEAFE", color: "#1D4ED8",
                padding: "2px 8px", borderRadius: 99,
              }}>
                {filteredQuestions.length} records
              </span>
              {selectedAcademicYear?.name && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 600,
                  background: "#EDE9FE", color: "#6D28D9",
                  padding: "2px 8px", borderRadius: 99,
                }}>
                  {selectedAcademicYear.name}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <Spin size="large" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <Empty
                description={<span style={{ color: "var(--text-muted)" }}>
                  {activeFilters ? "Filter clear karein ya naye questions add karein" : "Koi question nahi mila"}
                </span>}
              >
                <Space>
                  {activeFilters > 0 && <Button onClick={clearFilters}>Filters Clear Karein</Button>}
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal("add")}>
                    Add Question
                  </Button>
                </Space>
              </Empty>
            </div>
          ) : (
            <Table
              className="qb-table"
              rowKey="_id"
              dataSource={filteredQuestions}
              columns={columns}
              loading={loading}
              scroll={{ x: 700 }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                preserveSelectedRowKeys: true,
              }}
              pagination={{
                current:    page,
                pageSize,
                total:      filteredQuestions.length,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal:  (total, range) => (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {range[0]}–{range[1]} of {total} questions
                  </span>
                ),
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              }}
              style={{ background: "transparent" }}
            />
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modal === "add" || modal === "edit"}
        footer={null}
        width={780}
        destroyOnClose
        centered
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...iconWell(modal === "edit" ? "#D97706" : "#2563EB", 32), borderRadius: 9 }}>
              {modal === "edit" ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {modal === "edit" ? "Question Edit Karein" : "Naya Question Add Karein"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                {modal === "edit" ? "Existing question update karein" : "Question bank mein naya question add karein"}
              </div>
            </div>
          </div>
        }
        onCancel={closeModal}
        styles={{ body: { padding: 20, maxHeight: "80vh", overflowY: "auto" } }}
      >
        <CreateQuestion
          initialData={modal === "edit" ? editQuestion : null}
          onSuccess={handleSuccess}
          schoolId={isSuperAdmin ? selectedSchool : undefined}
        />
      </Modal>

      {/* ── Bulk Upload Modal ── */}
      <Modal
        open={modal === "bulk"}
        footer={null}
        width={720}
        destroyOnClose
        centered
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...iconWell("#7C3AED", 32), borderRadius: 9 }}><UploadOutlined /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Bulk Upload Questions</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Excel file se multiple questions ek saath add karein</div>
            </div>
          </div>
        }
        onCancel={closeModal}
        styles={{ body: { padding: 20 } }}
      >
        <BulkUploadQuestions
          onSuccess={handleSuccess}
          schoolId={isSuperAdmin ? selectedSchool : undefined}
          classOptions={isSuperAdmin ? schoolClasses : undefined}
        />
      </Modal>

      {/* ── Preview Drawer ── */}
      <QuestionPreviewDrawer
        question={previewQ}
        open={!!previewQ}
        onClose={() => setPreviewQ(null)}
      />
    </div>
  );
};

export default QuestionBank;

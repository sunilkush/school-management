import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Segmented, Select, Skeleton, Tag, Tooltip, message,
} from "antd";
import {
  BookOutlined, DeleteOutlined, DownOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, RightOutlined,
  SearchOutlined, CheckOutlined, CloseOutlined,
} from "@ant-design/icons";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { modalTitle, pill } from "../../../styles/pageStyles";

/**
 * Chapters & Topics — pick a board, a class and a subject; everything for that subject is on one
 * screen: its chapters (with the textbook each comes from and its PDF), each chapter's topics, and
 * the textbook chapters that still need a title.
 *
 * The old page loaded the first 500 chapters of every board at once into a four-level tree, which
 * with ~15,000 chapters meant most of them — including every imported NCERT chapter — never appeared.
 * This loads one class at a time, so everything in it is always shown.
 */

const STORE_KEY = "chaptersTopics.selection";
const readSelection = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
};
const saveSelection = (value) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch { /* per-viewer convenience only */ }
};
const classNumber = (name = "") => Number(String(name).match(/\d+/)?.[0]) || 99;
const titleCase = (s = "") => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const errorText = (e, fallback) => e?.response?.data?.message || fallback;

const label = (text) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
    {text}
  </div>
);

/* ───────────────────────── Topics under one chapter ───────────────────────── */
const TopicList = ({ chapter, topics, onChanged }) => {
  const active = topics.filter((t) => t.isActive !== false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // { id, name }

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      // Deleted topics keep their numbers (the unique index counts them), so number after all of them.
      const topicNo = Math.max(0, ...topics.map((t) => t.topicNo || 0)) + 1;
      await apiClient.post("/topics", { name, topicNo, chapterId: chapter._id, isGlobal: true });
      setNewName("");
      onChanged();
    } catch (e) {
      message.error(errorText(e, "Could not add the topic"));
    } finally {
      setSaving(false);
    }
  };

  const rename = async () => {
    const name = editing?.name?.trim();
    if (!name) return;
    try {
      await apiClient.patch(`/topics/${editing.id}`, { name });
      setEditing(null);
      onChanged();
    } catch (e) {
      message.error(errorText(e, "Could not rename the topic"));
    }
  };

  const remove = async (id) => {
    try {
      await apiClient.delete(`/topics/${id}`);
      onChanged();
    } catch (e) {
      message.error(errorText(e, "Could not delete the topic"));
    }
  };

  return (
    <div style={{ padding: "4px 0 12px 52px" }}>
      {active.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0 8px" }}>No topics yet.</div>
      )}
      {active.map((t) => (
        <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 22 }}>{t.topicNo}.</span>
          {editing?.id === t._id ? (
            <>
              <Input
                size="small"
                autoFocus
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onPressEnter={rename}
                style={{ maxWidth: 360 }}
              />
              <Button size="small" type="text" icon={<CheckOutlined />} onClick={rename} aria-label="Save topic" />
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setEditing(null)} aria-label="Cancel" />
            </>
          ) : (
            <>
              <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>{t.name}</span>
              <Tooltip title="Rename topic">
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => setEditing({ id: t._id, name: t.name })} />
              </Tooltip>
              <Popconfirm title="Delete this topic?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => remove(t._id)}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="Delete topic" />
              </Popconfirm>
            </>
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 6, maxWidth: 460 }}>
        <Input
          size="small"
          placeholder="New topic name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={add}
        />
        <Button size="small" icon={<PlusOutlined />} onClick={add} loading={saving} disabled={!newName.trim()}>
          Add topic
        </Button>
      </div>
    </div>
  );
};

/* ───────────────────────── Page ───────────────────────── */
const ChaptersTopics = () => {
  const saved = useMemo(readSelection, []);
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState(saved.boardId || null);
  const [boardClasses, setBoardClasses] = useState([]);
  const [boardClassId, setBoardClassId] = useState(saved.boardClassId || null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(saved.subjectId || null);

  const [chapters, setChapters] = useState([]);   // every chapter of the class, all subjects
  const [books, setBooks] = useState([]);         // the class's textbooks, with their chapters
  const [topics, setTopics] = useState([]);       // topics of the selected subject's chapters
  const [loadingClass, setLoadingClass] = useState(false);

  const [search, setSearch] = useState("");
  const [openChapter, setOpenChapter] = useState(null);
  const [modal, setModal] = useState(null);       // { mode: "add" | "edit", chapter? }
  const [savingChapter, setSavingChapter] = useState(false);
  const [namingDrafts, setNamingDrafts] = useState({});
  const [form] = Form.useForm();

  /* ── Reference data ── */
  useEffect(() => {
    apiClient.get("/boards").then((r) => {
      const list = r.data?.data?.boards || [];
      setBoards(list);
      setBoardId((current) => {
        if (current && list.some((b) => b._id === current)) return current;
        return (list.find((b) => /^cbse$/i.test(b.code)) || list[0])?._id || null;
      });
    }).catch((e) => message.error(errorText(e, "Could not load boards")));
    apiClient.get("/subjects/all", { params: { limit: 1000 } })
      .then((r) => setAllSubjects(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!boardId) return;
    apiClient.get("/board-classes", { params: { boardId } }).then((r) => {
      const list = (Array.isArray(r.data?.data) ? r.data.data : [])
        .sort((a, b) => classNumber(a.classId?.name || a.name) - classNumber(b.classId?.name || b.name));
      setBoardClasses(list);
      setBoardClassId((current) => (list.some((c) => c._id === current) ? current : list[0]?._id || null));
    }).catch((e) => message.error(errorText(e, "Could not load classes")));
  }, [boardId]);

  /* ── Everything for one class ── */
  const loadClass = useCallback(async () => {
    if (!boardClassId) return;
    setLoadingClass(true);
    try {
      const [ch, tb] = await Promise.all([
        apiClient.get("/chapters", { params: { boardClassId } }),
        apiClient.get("/textbooks", { params: { boardClassId, withChapters: "true" } }),
      ]);
      setChapters(Array.isArray(ch.data?.data) ? ch.data.data : []);
      setBooks(Array.isArray(tb.data?.data) ? tb.data.data : []);
    } catch (e) {
      message.error(errorText(e, "Could not load this class"));
    } finally {
      setLoadingClass(false);
    }
  }, [boardClassId]);

  useEffect(() => { loadClass(); setOpenChapter(null); setSearch(""); }, [loadClass]);

  /* ── Subjects of this class: ones with chapters or books, plus any picked to start one ── */
  const activeChapters = useMemo(() => chapters.filter((c) => c.isActive !== false), [chapters]);
  const classSubjects = useMemo(() => {
    const map = new Map();
    const bump = (s, key) => {
      if (!s?._id) return;
      if (!map.has(s._id)) map.set(s._id, { id: s._id, name: s.name, chapters: 0, unnamed: 0 });
      map.get(s._id)[key]++;
    };
    activeChapters.forEach((c) => bump(c.subject || c.subjectId, "chapters"));
    books.forEach((b) => (b.chapters || []).forEach((e) => { if (!e.nameVerified) bump(b.subjectId, "unnamed"); }));
    books.forEach((b) => { if (b.subjectId?._id && !map.has(b.subjectId._id)) map.set(b.subjectId._id, { id: b.subjectId._id, name: b.subjectId.name, chapters: 0, unnamed: 0 }); });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeChapters, books]);

  useEffect(() => {
    if (loadingClass) return;
    if (subjectId && (classSubjects.some((s) => s.id === subjectId) || allSubjects.some((s) => s._id === subjectId))) return;
    setSubjectId(classSubjects[0]?.id || null);
  }, [classSubjects, loadingClass]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveSelection({ boardId, boardClassId, subjectId }); }, [boardId, boardClassId, subjectId]);

  const subjectName = useMemo(
    () => classSubjects.find((s) => s.id === subjectId)?.name || allSubjects.find((s) => s._id === subjectId)?.name || "",
    [classSubjects, allSubjects, subjectId]
  );
  const className = boardClasses.find((c) => c._id === boardClassId)?.classId?.name || boardClasses.find((c) => c._id === boardClassId)?.name || "";

  /* ── The selected subject ── */
  const sameSubject = (c) => String(c.subject?._id || c.subjectId?._id || c.subjectId) === String(subjectId);
  const subjectChapters = useMemo(() => chapters.filter(sameSubject), [chapters, subjectId]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownChapters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjectChapters
      .filter((c) => c.isActive !== false)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || topics.some((t) => String(t.chapterId?._id || t.chapterId) === String(c._id) && t.isActive !== false && t.name.toLowerCase().includes(q)))
      .sort((a, b) => a.chapterNo - b.chapterNo);
  }, [subjectChapters, search, topics]);
  const subjectBooks = useMemo(() => books.filter((b) => String(b.subjectId?._id) === String(subjectId)), [books, subjectId]);
  const bookById = useMemo(() => new Map(books.map((b) => [String(b._id), b])), [books]);
  const unnamed = useMemo(
    () => subjectBooks.flatMap((b) => (b.chapters || []).filter((e) => !e.nameVerified).map((e) => ({ book: b, entry: e }))),
    [subjectBooks]
  );

  const loadTopics = useCallback(async () => {
    const ids = subjectChapters.map((c) => c._id);
    if (!ids.length) { setTopics([]); return; }
    try {
      const r = await apiClient.get("/topics", { params: { chapterIds: ids.slice(0, 300).join(",") } });
      setTopics(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch { setTopics([]); }
  }, [subjectChapters]);
  useEffect(() => { loadTopics(); }, [loadTopics]);

  const topicsOf = (chapterId) => topics.filter((t) => String(t.chapterId?._id || t.chapterId) === String(chapterId));

  /* ── Chapter add / edit / delete ── */
  const usedNumbers = (exceptId) =>
    new Set(subjectChapters.filter((c) => c._id !== exceptId && c.chapterNo < 1000).map((c) => c.chapterNo));

  const openAdd = () => {
    const next = Math.max(0, ...subjectChapters.filter((c) => c.chapterNo < 1000).map((c) => c.chapterNo)) + 1;
    form.setFieldsValue({ chapterNo: next, name: "", description: "" });
    setModal({ mode: "add" });
  };
  const openEdit = (chapter) => {
    form.setFieldsValue({ chapterNo: chapter.chapterNo, name: chapter.name, description: chapter.description || "" });
    setModal({ mode: "edit", chapter });
  };

  const saveChapter = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // the form is already showing what is wrong
    }
    setSavingChapter(true);
    try {
      if (modal.mode === "add") {
        await apiClient.post("/chapters", {
          name: values.name.trim(), chapterNo: values.chapterNo, description: values.description?.trim() || undefined,
          boardClassId, subjectId, isGlobal: true,
        });
        message.success("Chapter added");
      } else {
        await apiClient.patch(`/chapters/${modal.chapter._id}`, {
          name: values.name.trim(), chapterNo: values.chapterNo, description: values.description?.trim() || "",
        });
        message.success("Chapter updated");
      }
      setModal(null);
      await loadClass();
    } catch (e) {
      message.error(errorText(e, "Could not save the chapter"));
    } finally {
      setSavingChapter(false);
    }
  };

  const deleteChapter = async (chapter) => {
    try {
      await apiClient.delete(`/chapters/${chapter._id}`);
      message.success("Chapter deleted");
      await loadClass();
    } catch (e) {
      message.error(errorText(e, "Could not delete the chapter"));
    }
  };

  /* ── Naming a textbook chapter ── */
  const nameEntry = async (book, entry) => {
    const key = `${book._id}:${entry.bookChapterNo}`;
    const name = (namingDrafts[key] || "").trim();
    if (name.length < 2) return message.warning("Type the chapter name first");
    try {
      await apiClient.patch(`/textbooks/${book._id}/chapters/${entry.bookChapterNo}`, { name });
      setNamingDrafts((d) => { const next = { ...d }; delete next[key]; return next; });
      message.success(`Saved — "${name}" is now a chapter of ${titleCase(subjectName)}`);
      await loadClass();
    } catch (e) {
      message.error(errorText(e, "Could not save the name"));
    }
  };

  const withPdf = shownChapters.filter((c) => c.pdfUrl).length;
  const topicCount = topics.filter((t) => t.isActive !== false && shownChapters.some((c) => String(c._id) === String(t.chapterId?._id || t.chapterId))).length;
  const otherSubjects = allSubjects.filter((s) => !classSubjects.some((c) => c.id === s._id));

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Chapters & Topics"
        subtitle="Choose a class and a subject — its chapters, textbook PDFs and topics are all on one screen"
        icon={<BookOutlined />}
        extra={
          <Select
            style={{ minWidth: 260 }}
            showSearch
            optionFilterProp="label"
            value={boardId}
            onChange={(v) => { setBoardId(v); setBoardClassId(null); setSubjectId(null); }}
            options={boards.map((b) => ({ value: b._id, label: `${b.code ? `${b.code} — ` : ""}${titleCase(b.name)}` }))}
            placeholder="Board"
          />
        }
      />

      {/* ── Step 1 & 2: class and subject ── */}
      <div className="section-panel">
        {label("Class")}
        {boardClasses.length ? (
          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <Segmented
              value={boardClassId}
              onChange={(v) => { setBoardClassId(v); setSubjectId(null); }}
              options={boardClasses.map((c) => ({ value: c._id, label: titleCase(c.classId?.name || c.name) }))}
            />
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>This board has no classes yet.</div>
        )}

        <div style={{ height: 16 }} />
        {label("Subject")}
        {loadingClass ? (
          <Skeleton.Button active size="small" style={{ width: 320 }} />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {classSubjects.map((s) => (
              <Tag.CheckableTag
                key={s.id}
                checked={subjectId === s.id}
                onChange={() => { setSubjectId(s.id); setOpenChapter(null); setSearch(""); }}
                style={{ padding: "5px 12px", borderRadius: 99, fontSize: 13 }}
              >
                {titleCase(s.name)} <span style={{ opacity: 0.7 }}>{s.chapters}</span>
                {s.unnamed > 0 && <span style={{ marginLeft: 6, color: "var(--warning)" }}>• {s.unnamed} to name</span>}
              </Tag.CheckableTag>
            ))}
            <Select
              size="small"
              style={{ minWidth: 200 }}
              placeholder="+ Another subject"
              showSearch
              optionFilterProp="label"
              value={null}
              onChange={(v) => { setSubjectId(v); setOpenChapter(null); }}
              options={otherSubjects.map((s) => ({ value: s._id, label: titleCase(s.name) }))}
            />
          </div>
        )}
      </div>

      {/* ── Step 3: the subject ── */}
      {!subjectId ? (
        <div className="section-panel"><Empty description="Pick a subject to see its chapters" /></div>
      ) : (
        <div className="section-panel">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: "1 1 220px" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
                {titleCase(subjectName)} <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>· {titleCase(className)}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                {shownChapters.length} chapter{shownChapters.length === 1 ? "" : "s"} · {withPdf} with PDF · {topicCount} topic{topicCount === 1 ? "" : "s"}
              </div>
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search chapters or topics"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 280 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add chapter</Button>
          </div>

          <div style={{ marginTop: 12 }}>
            {loadingClass ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : !shownChapters.length ? (
              <Empty
                style={{ margin: "24px 0" }}
                description={search ? "Nothing matches your search" : "No chapters yet — add the first one"}
              />
            ) : (
              shownChapters.map((ch) => {
                const open = openChapter === ch._id;
                const book = ch.textbookId ? bookById.get(String(ch.textbookId)) : null;
                const chTopics = topicsOf(ch._id);
                const activeTopicCount = chTopics.filter((t) => t.isActive !== false).length;
                // When the search hit a topic rather than the chapter's own name, say which one —
                // otherwise the chapter looks like it matched for no reason.
                const q = search.trim().toLowerCase();
                const topicHits = q && !ch.name.toLowerCase().includes(q)
                  ? chTopics.filter((t) => t.isActive !== false && t.name.toLowerCase().includes(q))
                  : [];
                return (
                  <div key={ch._id} style={{ borderBottom: "1px solid var(--border-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setOpenChapter(open ? null : ch._id)}
                        style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 260px", minWidth: 0, background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}
                        aria-expanded={open}
                      >
                        <span style={{ color: "var(--text-muted)", width: 14 }}>{open ? <DownOutlined /> : <RightOutlined />}</span>
                        <span style={{ ...pill("var(--primary)"), minWidth: 34, textAlign: "center" }}>{ch.chapterNo}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{ch.name}</span>
                      </button>
                      {book && (
                        <Tooltip title={`Chapter ${ch.bookChapterNo} of ${book.title}`}>
                          <Tag color="blue" style={{ margin: 0 }}>{book.title} · {ch.bookChapterNo}</Tag>
                        </Tooltip>
                      )}
                      {ch.pdfUrl && (
                        <Button size="small" icon={<FilePdfOutlined />} href={ch.pdfUrl} target="_blank" rel="noopener noreferrer">PDF</Button>
                      )}
                      <Button size="small" type={open ? "default" : "text"} onClick={() => setOpenChapter(open ? null : ch._id)}>
                        {activeTopicCount} topic{activeTopicCount === 1 ? "" : "s"}
                      </Button>
                      <Tooltip title="Edit chapter">
                        <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(ch)} />
                      </Tooltip>
                      <Popconfirm
                        title="Delete this chapter?"
                        description="Questions already filed under it keep working."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteChapter(ch)}
                      >
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="Delete chapter" />
                      </Popconfirm>
                    </div>
                    {topicHits.length > 0 && !open && (
                      <div style={{ padding: "0 4px 10px 64px", fontSize: 12, color: "var(--text-muted)" }}>
                        Matching topic: {topicHits.map((t) => t.name).join(", ")}
                      </div>
                    )}
                    {open && <TopicList chapter={ch} topics={chTopics} onChanged={loadTopics} />}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Textbook chapters still waiting for a title ── */}
          {unnamed.length > 0 && !loadingClass && (
            <div style={{ marginTop: 20, border: "1px dashed var(--warning)", borderRadius: 14, padding: 16, background: "color-mix(in srgb, var(--warning) 6%, transparent)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                {unnamed.length} textbook chapter{unnamed.length === 1 ? "" : "s"} need a name
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 12px" }}>
                Their titles could not be read from the book. Open the PDF, type the chapter's name and save —
                it joins the chapter list above, with its PDF.
              </div>
              {unnamed.map(({ book, entry }) => {
                const key = `${book._id}:${entry.bookChapterNo}`;
                return (
                  <div key={key} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "6px 0" }}>
                    <span style={{ minWidth: 190, fontSize: 13, color: "var(--text-secondary)" }}>
                      {book.title} · chapter {entry.bookChapterNo}
                    </span>
                    <Button size="small" icon={<FilePdfOutlined />} href={entry.pdfUrl} target="_blank" rel="noopener noreferrer">Open PDF</Button>
                    <Input
                      size="small"
                      placeholder="Chapter name"
                      value={namingDrafts[key] || ""}
                      onChange={(e) => setNamingDrafts((d) => ({ ...d, [key]: e.target.value }))}
                      onPressEnter={() => nameEntry(book, entry)}
                      style={{ flex: "1 1 220px", maxWidth: 380 }}
                    />
                    <Button size="small" type="primary" onClick={() => nameEntry(book, entry)} disabled={!(namingDrafts[key] || "").trim()}>
                      Save
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Add / edit chapter ── */}
      <Modal
        open={!!modal}
        title={modalTitle(modal?.mode === "edit" ? <EditOutlined /> : <PlusOutlined />, modal?.mode === "edit" ? "Edit chapter" : "Add chapter", `${titleCase(subjectName)} · ${titleCase(className)}`)}
        okText={modal?.mode === "edit" ? "Save" : "Add chapter"}
        onOk={saveChapter}
        confirmLoading={savingChapter}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12 }}>
            <Form.Item
              name="chapterNo"
              label="No."
              rules={[
                { required: true, message: "Required" },
                {
                  validator: (_, v) => (usedNumbers(modal?.chapter?._id).has(v)
                    ? Promise.reject(new Error("Already used"))
                    : Promise.resolve()),
                },
              ]}
            >
              <InputNumber min={1} max={999} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="name" label="Chapter name" rules={[{ required: true, whitespace: true, message: "Enter the chapter name" }]}>
              <Input autoFocus placeholder="e.g. Chemical Reactions and Equations" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChaptersTopics;

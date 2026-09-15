import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, Segmented, Skeleton, Tag, Tooltip } from "antd";
import { BookOutlined, DownloadOutlined, FilePdfOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import apiClient from "../../api/httpClient";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, pill, sectionPanel } from "../../styles/pageStyles";

/**
 * Textbooks class-wise and subject-wise, every chapter opening as its official PDF.
 *
 * The files are NCERT's own, opened from ncert.nic.in — nothing is copied into this system (see
 * backend/src/models/Textbook.model.js). A new tab rather than an embedded viewer: the publisher's
 * site does not allow its PDFs to be framed, and a phone opens a PDF better in its own viewer.
 */

const CLASS_KEY = "textbooks.classNo";
const readClass = () => {
  try {
    const v = Number(localStorage.getItem(CLASS_KEY));
    return v >= 1 && v <= 12 ? v : null;
  } catch {
    return null;
  }
};

const BookCard = ({ book }) => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: false, error: null, chapters: null });

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || state.chapters) return;
    setState({ loading: true, error: null, chapters: null });
    try {
      const res = await apiClient.get(`/textbooks/${book._id}`);
      setState({ loading: false, error: null, chapters: res.data?.data?.chapters || [] });
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Could not load chapters", chapters: null });
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-muted)", borderRadius: 14, background: "var(--surface)", overflow: "hidden" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)", fontSize: 18,
        }}>
          <BookOutlined />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{book.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {book.chapterCount} chapter{book.chapterCount === 1 ? "" : "s"} · {book.publisher || "NCERT"}
            {book.medium && book.medium !== "English" ? ` · ${book.medium}` : ""}
          </div>
        </div>
        {book.bookUrl && (
          <Tooltip title="The whole book as one ZIP of PDFs">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              href={book.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Full book
            </Button>
          </Tooltip>
        )}
        <RightOutlined style={{ color: "var(--text-muted)", transition: "transform .2s", transform: open ? "rotate(90deg)" : "none" }} />
      </div>

      {open && (
        <div style={{ borderTop: "1px solid var(--border-muted)", padding: "8px 16px 14px" }}>
          {state.loading ? (
            <Skeleton active paragraph={{ rows: 3 }} title={false} />
          ) : state.error ? (
            <div style={{ color: "var(--danger)", fontSize: 13 }}>{state.error}</div>
          ) : !state.chapters?.length ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No chapters listed for this book.</div>
          ) : (
            state.chapters.map((ch) => (
              <div key={ch._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px dashed var(--border-muted)" }}>
                <span style={{ ...pill("var(--primary)"), minWidth: 34, textAlign: "center" }}>{ch.bookChapterNo ?? ch.chapterNo}</span>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>{ch.name}</span>
                {ch.pdfUrl ? (
                  <Button size="small" type="link" icon={<FilePdfOutlined />} href={ch.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Open PDF
                  </Button>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No PDF</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const TextbooksPage = () => {
  const [classNo, setClassNo] = useState(() => readClass() || 10);
  const [subjectId, setSubjectId] = useState(null);
  const [state, setState] = useState({ loading: true, error: null, books: [] });

  const load = async (cls) => {
    setState({ loading: true, error: null, books: [] });
    try {
      const res = await apiClient.get("/textbooks", { params: { classNo: cls } });
      setState({ loading: false, error: null, books: Array.isArray(res.data?.data) ? res.data.data : [] });
    } catch (e) {
      setState({ loading: false, error: e.response?.data?.message || "Could not load textbooks", books: [] });
    }
  };

  useEffect(() => {
    load(classNo);
    setSubjectId(null);
    try { localStorage.setItem(CLASS_KEY, String(classNo)); } catch { /* per-viewer convenience only */ }
  }, [classNo]);

  // Subjects are whatever this class actually has books for — class-wise, not one fixed list.
  const subjects = useMemo(() => {
    const map = new Map();
    for (const b of state.books) {
      const id = b.subjectId?._id;
      if (!id) continue;
      if (!map.has(id)) map.set(id, { id, name: b.subjectId.name, count: 0 });
      map.get(id).count++;
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [state.books]);

  const shown = subjectId ? state.books.filter((b) => b.subjectId?._id === subjectId) : state.books;
  const bySubject = useMemo(() => {
    const groups = new Map();
    for (const b of shown) {
      const key = b.subjectId?.name || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(b);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [shown]);

  const titleCase = (s = "") => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Textbooks"
        subtitle="NCERT books class-wise and subject-wise — open any chapter as a PDF"
        icon={<BookOutlined />}
        extra={<Button icon={<ReloadOutlined />} onClick={() => load(classNo)} loading={state.loading}>Refresh</Button>}
      />

      <div style={sectionPanel}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Class</div>
        <div style={{ overflowX: "auto" }}>
          <Segmented
            value={classNo}
            onChange={setClassNo}
            options={Array.from({ length: 12 }, (_, i) => ({ label: `Class ${i + 1}`, value: i + 1 }))}
          />
        </div>

        {subjects.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 8px" }}>Subject</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Tag.CheckableTag checked={!subjectId} onChange={() => setSubjectId(null)} style={{ padding: "4px 12px", borderRadius: 99 }}>
                All ({state.books.length})
              </Tag.CheckableTag>
              {subjects.map((s) => (
                <Tag.CheckableTag
                  key={s.id}
                  checked={subjectId === s.id}
                  onChange={() => setSubjectId(subjectId === s.id ? null : s.id)}
                  style={{ padding: "4px 12px", borderRadius: 99 }}
                >
                  {titleCase(s.name)} ({s.count})
                </Tag.CheckableTag>
              ))}
            </div>
          </>
        )}
      </div>

      {state.loading ? (
        <div style={sectionPanel}><Skeleton active paragraph={{ rows: 6 }} /></div>
      ) : state.error ? (
        <div style={{ ...sectionPanel, color: "var(--danger)" }}>
          {state.error} — <Button type="link" style={{ padding: 0 }} onClick={() => load(classNo)}>try again</Button>
        </div>
      ) : !state.books.length ? (
        <div style={sectionPanel}><Empty description={`No textbooks for Class ${classNo} yet`} /></div>
      ) : (
        bySubject.map(([subject, books]) => (
          <div key={subject} style={sectionPanel}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", marginBottom: 12 }}>{titleCase(subject)}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {books.map((b) => <BookCard key={b._id} book={b} />)}
            </div>
          </div>
        ))
      )}

      <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: "8px 0 24px" }}>
        Books and PDFs © NCERT, opened from ncert.nic.in.
      </div>
    </div>
  );
};

export default TextbooksPage;

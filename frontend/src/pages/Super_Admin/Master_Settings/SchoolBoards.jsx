import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Checkbox, Empty, Form, Input, Modal, Segmented, Select, Skeleton, Switch, Tooltip, message,
} from "antd";
import {
  ApartmentOutlined, DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined, SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  createBoard, getBoards, updateBoard, deleteBoard,
  assignSchoolBoards, getSchoolBoards, removeSchoolBoard,
} from "../../../features/boardSlice.js";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { getBoardClass } from "../../../features/boardClassSlice.js";
import { currentUser } from "../../../features/authSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import { modalTitle, pill } from "../../../styles/pageStyles";

/**
 * Exam boards — the list of boards, and which schools follow which.
 *
 * It used to be a five-page table of thirty-six short rows, with a "Schools Covered" figure that
 * was really just the number of schools in the system, and an Active tick box that was wired to a
 * <div> instead of to the form, so a board's status could not be changed at all. Boards are cards
 * now, each with the number of classes it runs and a switch that works, and assigning a board to a
 * school shows what that school already has before anything is changed.
 */

const titleCase = (s = "") => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const idOf = (v) => (!v ? "" : typeof v === "object" ? String(v._id || "") : String(v));
const errorText = (e, fallback) => (typeof e === "string" ? e : e?.message || e?.response?.data?.message) || fallback;

const label = (text) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
    {text}
  </div>
);

/* ─────────────── assigning boards to one school ─────────────── */
const AssignPanel = ({ open, onClose, schools, boards }) => {
  const dispatch = useDispatch();
  const [schoolId, setSchoolId] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [before, setBefore] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) { setSchoolId(null); setChosen([]); setBefore([]); }
  }, [open]);

  /* What the school follows today — shown before anything is changed. */
  useEffect(() => {
    if (!schoolId) { setChosen([]); setBefore([]); return; }
    let cancelled = false;
    setLoading(true);
    dispatch(getSchoolBoards(schoolId))
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        const ids = (res?.data || []).map((row) => idOf(row.boardId)).filter(Boolean);
        setBefore(ids);
        setChosen(ids);
      })
      .catch(() => { if (!cancelled) { setBefore([]); setChosen([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [schoolId, dispatch]);

  const added = chosen.filter((id) => !before.includes(id));
  const removed = before.filter((id) => !chosen.includes(id));

  const save = async () => {
    if (!schoolId || (!added.length && !removed.length)) return;
    setSaving(true);
    const failures = [];
    // The endpoints take one board at a time, so a changed list is applied board by board.
    for (const boardId of added) {
      try { await dispatch(assignSchoolBoards({ schoolId, boardId })).unwrap(); }
      catch (e) { failures.push(`add ${boards.find((b) => idOf(b._id) === boardId)?.name}: ${errorText(e, "failed")}`); }
    }
    for (const boardId of removed) {
      try { await dispatch(removeSchoolBoard({ schoolId, boardId })).unwrap(); }
      catch (e) { failures.push(`remove ${boards.find((b) => idOf(b._id) === boardId)?.name}: ${errorText(e, "failed")}`); }
    }
    setSaving(false);
    if (failures.length) message.error(failures.join(" · "));
    else {
      message.success(`${schools.find((s) => idOf(s._id) === schoolId)?.name} now follows ${chosen.length} board${chosen.length === 1 ? "" : "s"}`);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={620}
      destroyOnClose
      centered
      title={modalTitle(<LinkOutlined />, "Boards a school follows", "Tick the boards, untick the ones it no longer uses")}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          disabled={!schoolId || (!added.length && !removed.length)}
          onClick={save}
        >
          {added.length || removed.length
            ? `Save ${[added.length && `${added.length} added`, removed.length && `${removed.length} removed`].filter(Boolean).join(", ")}`
            : "Nothing to save"}
        </Button>,
      ]}
    >
      <Select
        style={{ width: "100%", marginBottom: 16 }}
        showSearch
        optionFilterProp="label"
        placeholder="Which school?"
        value={schoolId || undefined}
        onChange={setSchoolId}
        options={schools.map((s) => ({ value: idOf(s._id), label: s.name }))}
      />

      {!schoolId ? (
        <Empty description="Pick a school to see the boards it follows" />
      ) : loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <Checkbox.Group
            value={chosen}
            onChange={setChosen}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, width: "100%" }}
          >
            {boards.map((b) => (
              <Checkbox key={b._id} value={idOf(b._id)} style={{ marginInlineStart: 0 }}>
                {titleCase(b.name)}
                {b.code && <span style={{ color: "var(--text-muted)", fontSize: 11, marginLeft: 6 }}>{b.code}</span>}
                {before.includes(idOf(b._id)) && (
                  <span style={{ color: "var(--success-hover)", fontSize: 11, marginLeft: 6 }}>· in use</span>
                )}
              </Checkbox>
            ))}
          </Checkbox.Group>
          {removed.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--danger-hover)" }}>
              Unticking a board only stops the school from following it — nothing already filed under it is deleted.
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

/* ─────────────────────────────── page ─────────────────────────────── */
const SchoolBoards = () => {
  const dispatch = useDispatch();
  const boardsState = useSelector((s) => s.boards || {});
  const loading = boardsState?.loading || false;
  const { user } = useSelector((s) => s.auth || {});
  const { schools = [] } = useSelector((s) => s.school || {});
  const { boardClass = [] } = useSelector((s) => s.boardClass || {});

  const [editing, setEditing] = useState(null);      // null | {} | board
  const [assignOpen, setAssignOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState("all");
  const [form] = Form.useForm();

  const createdByRole = user?.role?.name || null;

  useEffect(() => {
    dispatch(currentUser());
    dispatch(getBoards());
    dispatch(fetchSchools());
    dispatch(getBoardClass({}));
  }, [dispatch]);

  // The boards slice has been seen holding either the array itself or { boards: [...] }.
  const boards = useMemo(() => {
    const raw = boardsState?.boards?.boards || boardsState?.boards || [];
    return Array.isArray(raw) ? raw : [];
  }, [boardsState]);

  /* how many classes each board runs — the thing a board is actually for */
  const classCount = useMemo(() => {
    const counts = new Map();
    boardClass.forEach((row) => {
      const id = idOf(row.boardId);
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [boardClass]);

  const activeCount = boards.filter((b) => b.isActive).length;

  const shown = useMemo(() => boards.filter((b) => {
    if (show === "active" && !b.isActive) return false;
    if (show === "inactive" && b.isActive) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return [b.name, b.code, b.description].some((v) => String(v || "").toLowerCase().includes(term));
  }), [boards, show, search]);

  const openAdd = () => {
    setEditing({});
    form.setFieldsValue({ name: "", code: "", description: "", isActive: true, createdByRole });
  };
  const openEdit = (board) => {
    setEditing(board);
    form.setFieldsValue({
      name: board.name,
      code: board.code,
      description: board.description,
      isActive: board.isActive !== false,
      createdByRole: board.createdByRole || createdByRole,
    });
  };

  const save = async (values) => {
    try {
      if (editing?._id) await dispatch(updateBoard({ id: editing._id, boardData: values })).unwrap();
      else await dispatch(createBoard(values)).unwrap();
      message.success(editing?._id ? "Board updated" : `${values.name} added`);
      setEditing(null);
      dispatch(getBoards());
    } catch (e) {
      message.error(errorText(e, "Could not save the board"));
    }
  };

  /* The status switch sits on the card, so it takes one click instead of opening a form. */
  const toggleActive = useCallback(async (board) => {
    try {
      await dispatch(updateBoard({ id: board._id, boardData: { isActive: !board.isActive } })).unwrap();
      dispatch(getBoards());
    } catch (e) {
      message.error(errorText(e, "Could not change the status"));
    }
  }, [dispatch]);

  const remove = (board) => {
    const classes = classCount.get(idOf(board._id)) || 0;
    Modal.confirm({
      title: `Delete ${board.name}?`,
      content: classes
        ? `${classes} class${classes === 1 ? "" : "es"} are set up under this board. Deleting it does not delete them, but they will have no board to belong to.`
        : "This cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await dispatch(deleteBoard(board._id)).unwrap();
          message.success(`${board.name} deleted`);
          dispatch(getBoards());
        } catch (e) {
          message.error(errorText(e, "Could not delete the board"));
        }
      },
    });
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Exam Boards"
        subtitle="The boards schools can follow, and the classes each one runs"
        icon={<ApartmentOutlined />}
        extra={
          <>
            <Button icon={<LinkOutlined />} onClick={() => setAssignOpen(true)} style={{ marginRight: 8 }}>
              Assign to a school
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add board</Button>
          </>
        }
      />

      <div className="section-panel">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
              {boards.length} board{boards.length === 1 ? "" : "s"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {activeCount} active · {boards.length - activeCount} retired
            </div>
          </div>
          <Segmented
            value={show}
            onChange={setShow}
            options={[
              { value: "all", label: `All ${boards.length}` },
              { value: "active", label: `Active ${activeCount}` },
              { value: "inactive", label: `Retired ${boards.length - activeCount}` },
            ]}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search a board"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>

        {loading && !boards.length ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : shown.length === 0 ? (
          <Empty description={boards.length ? "Nothing matches" : "No boards yet"}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add the first one</Button>
          </Empty>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 12 }}>
            {shown.map((board) => {
              const classes = classCount.get(idOf(board._id)) || 0;
              const on = board.isActive !== false;
              return (
                <div
                  key={board._id}
                  style={{
                    padding: "14px 16px", borderRadius: 12,
                    border: `1px solid ${on ? "var(--border-muted)" : "rgba(var(--danger-rgb),0.25)"}`,
                    background: on ? "transparent" : "var(--danger-light)",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        {titleCase(board.name)}
                      </div>
                      {board.code && (
                        <span style={{ ...pill("var(--accent)", "rgba(20,184,166,0.12)"), fontFamily: "monospace", fontSize: 11, marginTop: 4, display: "inline-block" }}>
                          {board.code}
                        </span>
                      )}
                    </div>
                    <Tooltip title={on ? "Schools can follow it — switch off to retire it" : "Retired — switch on to offer it again"}>
                      <Switch size="small" checked={on} onChange={() => toggleActive(board)} />
                    </Tooltip>
                  </div>

                  {board.description && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>{board.description}</div>
                  )}

                  <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, paddingTop: 6 }}>
                    <span style={{ fontSize: 12, color: classes ? "var(--text-secondary)" : "var(--warning-hover)" }}>
                      {classes ? `${classes} class${classes === 1 ? "" : "es"}` : "no classes yet"}
                    </span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                      <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(board)} />
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(board)} />
                      </Tooltip>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section-panel">
        {label("What a board is for")}
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          A board holds the classes it runs — set those up under <strong>Academics → Board Classes</strong> — and a
          school follows one or more boards, which is what <strong>Assign to a school</strong> above does.
        </div>
      </div>

      {/* ── add / edit ── */}
      <Modal
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        okText={editing?._id ? "Save changes" : "Add board"}
        destroyOnClose
        centered
        title={modalTitle(
          editing?._id ? <EditOutlined /> : <PlusOutlined />,
          editing?._id ? "Edit board" : "New board",
          editing?._id ? editing.name : "Its name, its short code, and whether schools can follow it",
        )}
      >
        <Form form={form} layout="vertical" onFinish={save} style={{ marginTop: 16 }} requiredMark={false}>
          <Form.Item name="createdByRole" hidden><Input /></Form.Item>

          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Give the board a name" }]}
          >
            <Input placeholder="Central Board of Secondary Education" autoFocus />
          </Form.Item>

          <Form.Item
            label="Short code"
            name="code"
            tooltip="What it is called in lists and on report cards"
          >
            <Input placeholder="CBSE" style={{ fontFamily: "monospace", letterSpacing: 1 }} />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Anything worth knowing about this board" rows={3} />
          </Form.Item>

          {/* Bound straight to the field — the old form put a plain <div> between the two, so the
              tick never reached the form and a board's status could not be changed. */}
          <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>Schools can follow this board</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <AssignPanel
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        schools={schools}
        boards={boards}
      />
    </div>
  );
};

export default SchoolBoards;

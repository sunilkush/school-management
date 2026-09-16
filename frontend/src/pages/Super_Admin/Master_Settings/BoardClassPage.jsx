import { useEffect, useMemo, useState } from "react";
import {
  Button, Checkbox, Empty, Input, Popconfirm, Segmented, Select, Skeleton, Switch, Tooltip, message,
} from "antd";
import {
  ApartmentOutlined, DeleteOutlined, PlusOutlined, SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  createBoardClass, getBoardClass, updateBoardClass, deleteBoardClass,
} from "../../../features/boardClassSlice.js";
import { getBoards } from "../../../features/boardSlice.js";
import { fetchAllClasses } from "../../../features/classSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";

/**
 * Board Classes — which classes each exam board runs.
 *
 * There are about 480 of these pairs, and the page used to list all of them in one table, ten rows
 * at a time, repeating the board's name down every row: 48 pages to read to answer "does this
 * board have Class 9 yet?". Now one board is on screen at a time, its classes are cards you can
 * switch on or off, and the classes it does not have yet are ticked and added together.
 */

const STORE_KEY = "boardClasses.board";
const readBoard = () => { try { return localStorage.getItem(STORE_KEY) || null; } catch { return null; } };
const saveBoard = (id) => { try { if (id) localStorage.setItem(STORE_KEY, id); } catch { /* a convenience only */ } };

const classNumber = (name = "") => Number(String(name).match(/\d+/)?.[0]) || 99;
const titleCase = (s = "") => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const idOf = (v) => (!v ? "" : typeof v === "object" ? String(v._id || "") : String(v));
const errorText = (e, fallback) => (typeof e === "string" ? e : e?.response?.data?.message) || fallback;

const label = (text) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
    {text}
  </div>
);

export default function BoardClassPage() {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector((state) => state.boardClass);
  const boardsState = useSelector((state) => state.boards || {});
  const { classList = [] } = useSelector((state) => state.class || {});

  const [boardId, setBoardId] = useState(readBoard);
  const [show, setShow] = useState("all");      // all | active | inactive
  const [search, setSearch] = useState("");
  const [toAdd, setToAdd] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => { dispatch(getBoards()); dispatch(fetchAllClasses()); }, [dispatch]);
  useEffect(() => { dispatch(getBoardClass({})); }, [dispatch]);

  // The boards slice has been seen holding either the array itself or { boards: [...] }.
  const boardList = useMemo(() => {
    const raw = boardsState?.boards?.boards || boardsState?.boards || [];
    return Array.isArray(raw) ? raw : [];
  }, [boardsState]);

  /* every board with the classes it runs, so the gaps show before you pick one */
  const byBoard = useMemo(() => {
    const map = new Map();
    boardClass.forEach((row) => {
      const id = idOf(row.boardId);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(row);
    });
    return map;
  }, [boardClass]);

  useEffect(() => {
    if (!boardId && boardList.length) {
      const cbse = boardList.find((b) => /cbse/i.test(b.code || b.name || ""));
      setBoardId(String((cbse || boardList[0])._id));
    }
  }, [boardId, boardList]);
  useEffect(() => { saveBoard(boardId); setToAdd([]); }, [boardId]);

  const board = boardList.find((b) => String(b._id) === String(boardId)) || null;
  const rows = useMemo(() => {
    const list = (byBoard.get(String(boardId)) || []).slice();
    return list.sort((a, b) => classNumber(a.name) - classNumber(b.name));
  }, [byBoard, boardId]);

  const shown = useMemo(() => rows.filter((r) => {
    if (show === "active" && r.status !== "active") return false;
    if (show === "inactive" && r.status === "active") return false;
    if (search && !String(r.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rows, show, search]);

  /* the classes this board does not run yet */
  const missing = useMemo(() => {
    const taken = new Set(rows.map((r) => idOf(r.classId)));
    return classList
      .filter((c) => c?._id && !taken.has(String(c._id)))
      .sort((a, b) => classNumber(a.name) - classNumber(b.name));
  }, [classList, rows]);

  const activeCount = rows.filter((r) => r.status === "active").length;

  const toggleStatus = async (record) => {
    const status = record.status === "active" ? "inactive" : "active";
    try {
      await dispatch(updateBoardClass({ id: record._id, data: { status } })).unwrap();
      dispatch(getBoardClass({}));
    } catch (e) {
      message.error(errorText(e, "Could not change the status"));
    }
  };

  const remove = async (record) => {
    try {
      await dispatch(deleteBoardClass(record._id)).unwrap();
      message.success(`${record.name} removed from ${board?.name || "this board"}`);
      dispatch(getBoardClass({}));
    } catch (e) {
      message.error(errorText(e, "Could not remove the class"));
    }
  };

  const addChosen = async () => {
    if (!boardId || !toAdd.length) return;
    setAdding(true);
    // The endpoint takes one pair at a time, so a whole board is filled in one pass of small calls.
    const failures = [];
    for (const classId of toAdd) {
      try {
        await dispatch(createBoardClass({ boardId, classId, status: "active" })).unwrap();
      } catch {
        failures.push(classList.find((c) => String(c._id) === String(classId))?.name || classId);
      }
    }
    setAdding(false);
    setToAdd([]);
    dispatch(getBoardClass({}));
    if (failures.length) message.error(`Could not add: ${failures.join(", ")}`);
    else message.success(`Added ${toAdd.length} class${toAdd.length === 1 ? "" : "es"} to ${board?.name}`);
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Board Classes"
        subtitle="Which classes each exam board runs"
        icon={<ApartmentOutlined />}
        extra={
          <Select
            style={{ minWidth: 280 }}
            showSearch
            optionFilterProp="label"
            value={boardId || undefined}
            onChange={(v) => setBoardId(v)}
            placeholder="Board"
            options={boardList.map((b) => ({
              value: String(b._id),
              label: `${b.code ? `${b.code} — ` : ""}${titleCase(b.name)}  ·  ${(byBoard.get(String(b._id)) || []).length} classes`,
            }))}
          />
        }
      />

      {!board ? (
        <div style={sectionPanel}><Empty description="Pick a board to see the classes it runs" /></div>
      ) : (
        <>
          <div style={sectionPanel}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
                  {titleCase(board.name)}
                  {board.code && <span style={{ color: "var(--text-muted)", fontWeight: 600 }}> · {board.code}</span>}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {rows.length} class{rows.length === 1 ? "" : "es"} · {activeCount} active
                  {missing.length > 0 && ` · ${missing.length} not added yet`}
                </div>
              </div>
              <Segmented
                value={show}
                onChange={setShow}
                options={[
                  { value: "all", label: `All ${rows.length}` },
                  { value: "active", label: `Active ${activeCount}` },
                  { value: "inactive", label: `Inactive ${rows.length - activeCount}` },
                ]}
              />
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search a class"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 220 }}
              />
            </div>

            {loading && !rows.length ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : shown.length === 0 ? (
              <Empty description={rows.length ? "Nothing matches" : "This board has no classes yet — add some below"} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
                {shown.map((row) => {
                  const on = row.status === "active";
                  return (
                    <div
                      key={row._id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10,
                        border: `1px solid ${on ? "var(--border-muted)" : "rgba(var(--danger-rgb),0.25)"}`,
                        background: on ? "transparent" : "var(--danger-light)",
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {titleCase(row.name)}
                        {!on && <span style={{ display: "block", fontSize: 11, color: "var(--danger-hover)", fontWeight: 500 }}>Inactive</span>}
                      </span>
                      <Tooltip title={on ? "In use — switch off to retire it" : "Retired — switch on to use it"}>
                        <Switch size="small" checked={on} onChange={() => toggleStatus(row)} />
                      </Tooltip>
                      <Popconfirm
                        title={`Remove ${row.name} from ${board.name}?`}
                        description="Anything already filed under it keeps pointing at it."
                        okText="Remove"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => remove(row)}
                      >
                        <Tooltip title="Remove"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
                      </Popconfirm>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── what this board is missing ── */}
          <div style={sectionPanel}>
            {label(`Not added to ${board.name} yet`)}
            {missing.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                This board already runs every class on the list.
              </div>
            ) : (
              <>
                <Checkbox.Group
                  value={toAdd}
                  onChange={setToAdd}
                  style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                >
                  {missing.map((c) => (
                    <Checkbox key={c._id} value={String(c._id)} style={{ marginInlineStart: 0 }}>
                      {titleCase(c.name)}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={!toAdd.length}
                    loading={adding}
                    onClick={addChosen}
                  >
                    {toAdd.length ? `Add ${toAdd.length} to ${board.name}` : "Add to this board"}
                  </Button>
                  {toAdd.length > 0 && <Button onClick={() => setToAdd([])}>Clear</Button>}
                  <Button type="link" onClick={() => setToAdd(missing.map((c) => String(c._id)))}>
                    Select all
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ── how the other boards stand ── */}
          <div style={sectionPanel}>
            {label("Every board")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {boardList.map((b) => {
                const list = byBoard.get(String(b._id)) || [];
                const active = list.filter((r) => r.status === "active").length;
                const current = String(b._id) === String(boardId);
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => setBoardId(String(b._id))}
                    style={{
                      textAlign: "left", cursor: "pointer",
                      padding: "9px 12px", borderRadius: 10,
                      border: `1px solid ${current ? "var(--primary)" : "var(--border-muted)"}`,
                      background: current ? "var(--primary-light)" : "transparent",
                      color: "inherit", font: "inherit",
                    }}
                  >
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {titleCase(b.name)}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: list.length ? "var(--text-muted)" : "var(--warning-hover)" }}>
                      {list.length ? `${list.length} classes · ${active} active` : "no classes yet"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

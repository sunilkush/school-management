import React, { useEffect, useMemo, useState } from "react";
import { Select, Button, Popconfirm, message, Skeleton, Typography } from "antd";
import {
  ApartmentOutlined,
  PlusOutlined,
  CheckCircleFilled,
  MinusCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  getBoards, assignSchoolBoards, getSchoolBoards, removeSchoolBoard,
} from "../../../features/boardSlice";

const { Option } = Select;
const { Text } = Typography;

const C = { primary: "#7c3aed", success: "#10b981", warning: "#f59e0b", danger: "#ef4444" };

/* ─── helpers ────────────────────────────────────────────────── */
const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value?.data?.boards)) return value.data.boards;
    if (Array.isArray(value?.data?.schoolBoards)) return value.data.schoolBoards;
    if ("success" in value) return [];
  }
  return [];
};

const safeText = (value, fallback = "—") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return fallback;
};

const safeErrorMessage = (err, fallback = "Something went wrong") => {
  if (typeof err === "string") return err;
  if (typeof err?.message === "string") return err.message;
  if (typeof err?.response?.data?.message === "string") return err.response.data.message;
  if (typeof err?.payload?.message === "string") return err.payload.message;
  return fallback;
};

/* ════════════════════════════════════════════════════════════════
   SchoolBoard
════════════════════════════════════════════════════════════════ */
const SchoolBoard = ({ next }) => {
  const dispatch = useDispatch();

  const boardState = useSelector((state) => state.boards || {});
  const user       = useSelector((state) => state.auth?.user || {});

  const boards       = useMemo(() => normalizeToArray(boardState?.boards),       [boardState?.boards]);
  const schoolBoards = useMemo(() => normalizeToArray(boardState?.schoolBoards), [boardState?.schoolBoards]);

  const loading   = Boolean(boardState?.loading);
  const schoolId  = user?.school?._id || user?.schoolId || null;

  const [selectedBoard, setSelectedBoard] = useState(undefined);
  const [hovered,       setHovered]       = useState(null);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    dispatch(getBoards());
    if (schoolId) dispatch(getSchoolBoards(schoolId));
  }, [dispatch, schoolId]);

  const handleSave = async () => {
    if (schoolBoards.length > 0) {
      message.warning("A school can have only one board");
      return;
    }
    if (!selectedBoard) { message.warning("Select a board first"); return; }
    try {
      setSaving(true);
      await dispatch(assignSchoolBoards({ schoolId, boardId: selectedBoard })).unwrap();
      message.success("Board assigned successfully");
      setSelectedBoard(undefined);
      dispatch(getSchoolBoards(schoolId));
    } catch (err) {
      message.error(safeErrorMessage(err, "Failed to assign board"));
    } finally { setSaving(false); }
  };

  const handleUnassign = async (boardId) => {
    if (!schoolId || !boardId) return;
    try {
      setSaving(true);
      await dispatch(removeSchoolBoard({ schoolId, boardId })).unwrap();
      message.success("Board unassigned successfully");
      dispatch(getSchoolBoards(schoolId));
      dispatch(getBoards());
    } catch (err) {
      message.error(safeErrorMessage(err, "Failed to unassign board"));
    } finally { setSaving(false); }
  };

  const assignedIds = new Set(
    schoolBoards.map((item) => item?.boardId?._id || item?.boardId).filter(Boolean)
  );

  const hasAssignedBoard = schoolBoards.length > 0;
  const availableBoards  = hasAssignedBoard
    ? []
    : boards.filter((board) => !assignedIds.has(board?._id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Assign form ─────────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "rgba(6,182,212,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ApartmentOutlined style={{ fontSize: 12, color: "#06b6d4" }} />
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block" }}>
              Assign Examination Board
            </Text>
            <Text type="secondary" style={{ fontSize: 11.5 }}>Choose a board to link with this school</Text>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Select
            placeholder="Select a board…"
            style={{ flex: 1, borderRadius: 8 }}
            value={selectedBoard}
            onChange={setSelectedBoard}
            allowClear showSearch
            loading={loading}
            optionFilterProp="children"
            notFoundContent={
              <span style={{ fontSize: 12, color: "var(--text-muted)", padding: 8, display: "block" }}>
                {availableBoards.length === 0 ? "All boards already assigned" : "No board found"}
              </span>
            }
            disabled={hasAssignedBoard}
          >
            {availableBoards.map((board) => (
              <Option key={board?._id} value={board?._id}>
                {safeText(board?.name, "Unnamed Board")}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!selectedBoard || hasAssignedBoard}
            style={{ borderRadius: 8, height: 32, fontWeight: 600 }}
          >
            Assign
          </Button>
        </div>

        {hasAssignedBoard && (
          <div style={{
            marginTop: 10, fontSize: 12, color: C.warning,
            background: "rgba(245,158,11,0.08)", padding: "8px 12px", borderRadius: 8,
          }}>
            This school already has a board assigned. Only one board is allowed.
          </div>
        )}
      </div>

      {/* ── Assigned boards list ─────────────────────────────────── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Assigned Boards</Text>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.primary,
            background: "rgba(124,58,237,0.1)", padding: "2px 10px", borderRadius: 99,
          }}>
            {schoolBoards.length}
          </span>
        </div>

        {/* Desktop table */}
        <div className="board-dt">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ background: "var(--surface-soft)" }}>
                  {["Board", "Primary", "Status", "Action"].map((h) => (
                    <th key={h} style={{
                      padding: "9px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && schoolBoards.length === 0 ? (
                  [1, 2].map((i) => (
                    <tr key={i}>
                      <td colSpan={4} style={{ padding: "12px 16px" }}>
                        <Skeleton active title={false} paragraph={{ rows: 1 }} />
                      </td>
                    </tr>
                  ))
                ) : schoolBoards.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 40, textAlign: "center" }}>
                      <ApartmentOutlined style={{ fontSize: 28, color: "var(--text-muted)", display: "block", margin: "0 auto 8px" }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>No boards assigned yet.</Text>
                    </td>
                  </tr>
                ) : (
                  schoolBoards.map((item, i) => (
                    <tr
                      key={item?._id || i}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: hovered === i ? "rgba(124,58,237,0.03)" : "transparent",
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "rgba(6,182,212,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <ApartmentOutlined style={{ fontSize: 14, color: "#06b6d4" }} />
                          </div>
                          <Text style={{ fontWeight: 600, color: "var(--text)" }}>
                            {safeText(item?.boardId?.name || item?.name)}
                          </Text>
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        {item?.isPrimary ? (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: C.primary,
                            background: "rgba(124,58,237,0.1)", padding: "2px 8px", borderRadius: 99,
                          }}>Primary</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        {item?.isActive ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 600, color: C.success,
                            background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 99,
                          }}>
                            <CheckCircleFilled style={{ fontSize: 9 }} /> Active
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11, color: C.warning,
                            background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: 99,
                          }}>
                            <MinusCircleOutlined style={{ fontSize: 9 }} /> Inactive
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <Popconfirm
                          title="Unassign this board?"
                          description="This board will be removed from this school."
                          okText="Unassign" cancelText="Cancel"
                          onConfirm={() => handleUnassign(item?.boardId?._id || item?.boardId)}
                        >
                          <Button
                            danger size="small" loading={saving}
                            icon={<DeleteOutlined />}
                            style={{ borderRadius: 6, fontSize: 12, fontWeight: 500 }}
                          >
                            Remove
                          </Button>
                        </Popconfirm>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="board-mb">
          {loading && schoolBoards.length === 0 ? (
            [1, 2].map((i) => (
              <div key={i} style={{ padding: 14 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))
          ) : schoolBoards.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <Text type="secondary">No boards assigned yet.</Text>
            </div>
          ) : (
            schoolBoards.map((item, i) => (
              <div key={item?._id || i} style={{
                padding: 14, borderBottom: "1px solid var(--border)",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: "rgba(6,182,212,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ApartmentOutlined style={{ fontSize: 13, color: "#06b6d4" }} />
                  </div>
                  <Text style={{ fontWeight: 600, color: "var(--text)" }}>
                    {safeText(item?.boardId?.name || item?.name)}
                  </Text>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {item?.isPrimary && (
                      <span style={{ fontSize: 11, color: C.primary, background: "rgba(124,58,237,0.1)", padding: "2px 8px", borderRadius: 99 }}>
                        Primary
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: item?.isActive ? C.success : C.warning }}>
                      {item?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <Popconfirm
                    title="Unassign this board?"
                    description="This board will be removed from this school."
                    okText="Unassign" cancelText="Cancel"
                    onConfirm={() => handleUnassign(item?.boardId?._id || item?.boardId)}
                  >
                    <Button danger size="small" loading={saving} style={{ borderRadius: 8, fontWeight: 600 }}>
                      Unassign
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Next step button ────────────────────────────────────── */}
      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="class-gradient-btn"
            onClick={next}
            disabled={!schoolBoards.length}
            style={{ opacity: !schoolBoards.length ? 0.45 : 1 }}
          >
            Next: Classes →
          </button>
        </div>
      )}

      <style>{`
        .board-mb { display: none; }
        .board-dt { display: block; }
        @media (max-width: 768px) {
          .board-dt { display: none; }
          .board-mb { display: block; }
        }
      `}</style>
    </div>
  );
};

export default SchoolBoard;

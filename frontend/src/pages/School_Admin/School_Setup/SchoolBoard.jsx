import React, { useEffect, useMemo, useState } from "react";
import { Select, Button, Popconfirm, message, Skeleton } from "antd";
import {
  ApartmentOutlined,
  PlusOutlined,
  CheckCircleFilled,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  getBoards,
  assignSchoolBoards,
  getSchoolBoards,
   removeSchoolBoard,
} from "../../../features/boardSlice";
import { useTheme } from "../../../context/ThemeContext";

const { Option } = Select;

const tokens = (isDark) => ({
  cardBg: isDark ? "#141414" : "#ffffff",
  innerBg: isDark ? "#0f0f0f" : "#f8faff",
  border: isDark ? "#1f1f1f" : "#f0f0f0",
  rowHover: isDark ? "#1a1a1a" : "#f8faff",
  textPri: isDark ? "#e8e8e8" : "#111827",
  textSec: isDark ? "#6b7280" : "#9ca3af",
  accent: "#1677ff",
  accentBg: isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success: "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  warning: "#ea580c",
  warnBg: isDark ? "rgba(234,88,12,0.08)" : "rgba(234,88,12,0.06)",
  thBg: isDark ? "#0f0f0f" : "#f9fafb",
  thBorder: isDark ? "#1f1f1f" : "#f0f0f0",
});

const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value?.data?.boards)) return value.data.boards;
    if (Array.isArray(value?.data?.schoolBoards)) return value.data.schoolBoards;

    // success:false + data:null
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

const SchoolBoard = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const boardState = useSelector((state) => state.boards || {});
  const user = useSelector((state) => state.auth?.user || {});

  const boardsRaw = boardState?.boards;
  const schoolBoardsRaw = boardState?.schoolBoards;

  const boards = useMemo(() => normalizeToArray(boardsRaw), [boardsRaw]);
  const schoolBoards = useMemo(() => normalizeToArray(schoolBoardsRaw), [schoolBoardsRaw]);

  const loading = Boolean(boardState?.loading);
  const schoolId = user?.school?._id || user?.schoolId || null;

  const [selectedBoard, setSelectedBoard] = useState(undefined);
  const [hovered, setHovered] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getBoards());
    if (schoolId) {
      dispatch(getSchoolBoards(schoolId));
    }
  }, [dispatch, schoolId]);

  const handleSave = async () => {
     if (schoolBoards.length > 0) {
      message.warning("A school can have only one board");
      return;
    }

    if (!selectedBoard) {
      message.warning("Select a board first");
      return;
    }

    try {
      setSaving(true);
      await dispatch(assignSchoolBoards({ schoolId, boardId: selectedBoard })).unwrap();
      message.success("Board assigned successfully");
      setSelectedBoard(undefined);
      dispatch(getSchoolBoards(schoolId));
    } catch (err) {
      message.error(safeErrorMessage(err, "Failed to assign board"));
    } finally {
      setSaving(false);
    }
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
    } finally {
      setSaving(false);
    }
  };

  const assignedIds = new Set(
    schoolBoards
      .map((item) => item?.boardId?._id || item?.boardId)
      .filter(Boolean)
  );

 const hasAssignedBoard = schoolBoards.length > 0;
  const availableBoards = hasAssignedBoard
    ? []
    : boards.filter((board) => !assignedIds.has(board?._id));

  const emptyMessage = "No boards assigned yet.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          background: t.innerBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: t.accentBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ApartmentOutlined style={{ fontSize: 12, color: t.accent }} />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri }}>
              Assign Examination Board
            </div>
            <div style={{ fontSize: 11.5, color: t.textSec }}>
              Choose a board to link with this school
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Select
            placeholder="Select a board…"
            style={{ flex: 1, borderRadius: 8 }}
            value={selectedBoard}
            onChange={setSelectedBoard}
            allowClear
            showSearch
            loading={loading}
            optionFilterProp="children"
            notFoundContent={
              <span
                style={{
                  fontSize: 12,
                  color: t.textSec,
                  padding: 8,
                  display: "block",
                }}
              >
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
          <div style={{ marginTop: 10, fontSize: 12, color: t.warning }}>
            This school already has a board assigned. Only one board is allowed.
          </div>
        )}
      </div>

      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${t.thBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>
            Assigned Boards
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: t.accent,
              background: t.accentBg,
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            {schoolBoards.length}
          </span>
        </div>

        <div className="board-table-desktop">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ background: t.thBg }}>
                  {["Board", "Primary", "Status", "Action"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textSec,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderBottom: `1px solid ${t.thBorder}`,
                        whiteSpace: "nowrap",
                      }}
                    >
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
                   <td colSpan={4} style={{ padding: 32, textAlign: "center" }}>
                      <span style={{ color: t.textSec, fontSize: 13 }}>{emptyMessage}</span>
                    </td>
                  </tr>
                ) : (
                  schoolBoards.map((item, i) => {
                    const isHov = hovered === i;

                    return (
                      <tr
                        key={item?._id || i}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          background: isHov ? t.rowHover : "transparent",
                          borderBottom: `1px solid ${t.thBorder}`,
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: t.accentBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ApartmentOutlined style={{ fontSize: 13, color: t.accent }} />
                            </div>
                            <span style={{ fontWeight: 600, color: t.textPri }}>
                              {safeText(item?.boardId?.name || item?.name)}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {item?.isPrimary ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: t.accent,
                                background: t.accentBg,
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              Primary
                            </span>
                          ) : (
                            <span style={{ color: t.textSec }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {item?.isActive ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                fontWeight: 600,
                                color: t.success,
                                background: t.successBg,
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              <CheckCircleFilled style={{ fontSize: 9 }} />
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                color: t.warning,
                                background: t.warnBg,
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              <MinusCircleOutlined style={{ fontSize: 9 }} />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Popconfirm
                            title="Unassign this board?"
                            description="This board will be removed from this school."
                            okText="Unassign"
                            cancelText="Cancel"
                            onConfirm={() =>
                              handleUnassign(item?.boardId?._id || item?.boardId)
                            }
                          >
                            <Button
                              danger
                              size="small"
                              loading={saving}
                               style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                color: t.warning,
                                background: t.warnBg,
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              Remove
                            </Button>
                          </Popconfirm>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="board-table-mobile">
          {loading && schoolBoards.length === 0 ? (
            [1, 2].map((i) => (
              <div key={i} style={{ padding: 14 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))
          ) : schoolBoards.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <span style={{ color: t.textSec }}>{emptyMessage}</span>
            </div>
          ) : (
            schoolBoards.map((item, i) => (
              <div
                key={item?._id || i}
                style={{
                  padding: 14,
                  borderBottom: `1px solid ${t.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: t.accentBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ApartmentOutlined style={{ fontSize: 12, color: t.accent }} />
                  </div>
                  <span style={{ fontWeight: 600, color: t.textPri }}>
                    {safeText(item?.boardId?.name || item?.name)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {item?.isPrimary ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: t.accent,
                        background: t.accentBg,
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}
                    >
                      Primary
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: t.textSec }}>—</span>
                  )}

                  {item?.isActive ? (
                    <span style={{ fontSize: 11, color: t.success }}>Active</span>
                  ) : (
                    <span style={{ fontSize: 11, color: t.warning }}>Inactive</span>
                  )}
                </div>
                <div>
                  <Popconfirm
                    title="Unassign this board?"
                    description="This board will be removed from this school."
                    okText="Unassign"
                    cancelText="Cancel"
                    onConfirm={() => handleUnassign(item?.boardId?._id || item?.boardId)}
                  >
                    <Button
                      danger
                      size="small"
                      loading={saving}
                      style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                      Unassign
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ))
          )}
        </div>

        <style>{`
          .board-table-mobile { display: none; }
          @media (max-width: 768px) {
            .board-table-desktop { display: none; }
            .board-table-mobile { display: block; }
          }
          @media (min-width: 769px) {
            .board-table-desktop { display: block; }
            .board-table-mobile { display: none; }
          }
        `}</style>
      </div>

      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            onClick={next}
            disabled={!schoolBoards.length}
            style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
          >
            Next: Classes →
          </Button>
        </div>
      )}
    </div>
  );
};

export default SchoolBoard;
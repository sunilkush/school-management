import React, { useEffect, useState } from "react";
import { Select, Button, message, Typography, Skeleton } from "antd";
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
} from "../../../features/boardSlice";
import { useTheme } from "../../../context/ThemeContext";

const { Text } = Typography;
const { Option } = Select;

const tokens = (isDark) => ({
  cardBg:    isDark ? "#141414" : "#ffffff",
  innerBg:   isDark ? "#0f0f0f" : "#f8faff",
  border:    isDark ? "#1f1f1f" : "#f0f0f0",
  rowHover:  isDark ? "#1a1a1a" : "#f8faff",
  textPri:   isDark ? "#e8e8e8" : "#111827",
  textSec:   isDark ? "#6b7280" : "#9ca3af",
  accent:    "#1677ff",
  accentBg:  isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success:   "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  warning:   "#ea580c",
  warnBg:    isDark ? "rgba(234,88,12,0.08)" : "rgba(234,88,12,0.06)",
  thBg:      isDark ? "#0f0f0f" : "#f9fafb",
  thBorder:  isDark ? "#1f1f1f" : "#f0f0f0",
});

const SchoolBoard = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const { boards = [], schoolBoards = [], loading } =
    useSelector((state) => state.boards);
  const user     = useSelector((state) => state.auth.user);
  const schoolId = user?.school?._id;

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getBoards());
    if (schoolId) dispatch(getSchoolBoards(schoolId));
  }, [dispatch, schoolId]);

  const handleSave = async () => {
    if (!selectedBoard) return message.warning("Select a board first");
    setSaving(true);
    try {
      await dispatch(assignSchoolBoards({ schoolId, boardId: selectedBoard })).unwrap();
      message.success("Board assigned successfully");
      setSelectedBoard(null);
      dispatch(getSchoolBoards(schoolId));
    } catch (err) {
      message.error("Failed to assign board",err.message || "");
    } finally {
      setSaving(false);
    }
  };

  // Filter out already-assigned boards
  const assignedIds = new Set(schoolBoards.map((b) => b.boardId?._id));
  const available   = boards.filter((b) => !assignedIds.has(b._id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Assign form ── */}
      <div style={{
        background: t.innerBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: t.accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ApartmentOutlined style={{ fontSize: 12, color: t.accent }} />
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: t.textPri, display: "block" }}>
              Assign Examination Board
            </Text>
            <Text style={{ fontSize: 11.5, color: t.textSec }}>
              Choose a board to link with this school
            </Text>
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
            notFoundContent={
              <Text style={{ fontSize: 12, color: t.textSec, padding: 8, display: "block" }}>
                All boards already assigned
              </Text>
            }
          >
            {available.map((board) => (
              <Option key={board._id} value={board._id}>
                {board.name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!selectedBoard}
            style={{ borderRadius: 8, height: 32, fontWeight: 600 }}
          >
            Assign
          </Button>
        </div>
      </div>

      {/* ── Assigned boards list ── */}
      <div style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${t.thBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>
            Assigned Boards
          </Text>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: t.accent, background: t.accentBg,
            padding: "2px 8px", borderRadius: 99,
          }}>
            {schoolBoards.length}
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.thBg }}>
              {["Board", "Primary", "Status"].map((h) => (
                <th key={h} style={{
                  padding: "9px 16px", textAlign: "left",
                  fontSize: 11, fontWeight: 600, color: t.textSec,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  borderBottom: `1px solid ${t.thBorder}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !schoolBoards.length
              ? [1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={3} style={{ padding: "12px 16px" }}>
                      <Skeleton active title={false} paragraph={{ rows: 1, width: ["80%"] }} />
                    </td>
                  </tr>
                ))
              : schoolBoards.length === 0
              ? (
                <tr>
                  <td colSpan={3} style={{ padding: 32, textAlign: "center" }}>
                    <Text style={{ color: t.textSec, fontSize: 12 }}>
                      No boards assigned yet.
                    </Text>
                  </td>
                </tr>
              )
              : schoolBoards.map((item, i) => {
                  const isHov = hovered === i;
                  return (
                    <tr
                      key={item._id}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: isHov ? t.rowHover : "transparent",
                        borderBottom: `1px solid ${t.thBorder}`,
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: t.accentBg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <ApartmentOutlined style={{ fontSize: 13, color: t.accent }} />
                          </div>
                          <Text style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>
                            {item.boardId?.name || "—"}
                          </Text>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {item.isPrimary
                          ? <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: t.accent, background: t.accentBg,
                              padding: "2px 8px", borderRadius: 99,
                            }}>Primary</span>
                          : <Text style={{ fontSize: 12, color: t.textSec }}>—</Text>
                        }
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {item.isActive
                          ? <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              fontSize: 11, fontWeight: 600,
                              color: t.success, background: t.successBg,
                              padding: "2px 8px", borderRadius: 99,
                            }}>
                              <CheckCircleFilled style={{ fontSize: 9 }} /> Active
                            </span>
                          : <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              fontSize: 11, color: t.warning, background: t.warnBg,
                              padding: "2px 8px", borderRadius: 99,
                            }}>
                              <MinusCircleOutlined style={{ fontSize: 9 }} /> Inactive
                            </span>
                        }
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
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
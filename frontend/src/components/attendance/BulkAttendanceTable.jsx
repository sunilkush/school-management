import React from "react";
import { Select, TimePicker } from "antd";
import { LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import StatusTag from "./StatusTag";

const C = {
  success: "var(--success)", warning: "var(--warning)", border: "var(--border)",
  text: "var(--text)", textSub: "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface: "var(--background)",
};

const statusOptions = ["present", "absent", "late", "halfday", "leave"].map((s) => ({
  label: s.charAt(0).toUpperCase() + s.slice(1),
  value: s,
}));

const TIME_STATUSES = new Set(["present", "late"]);

/*
  Props:
    rows            — [{ userId, name, email, status }]
    draftMap        — { [userId]: status }
    onStatusChange  — (userId, status) => void
    loading         — bool
    showTimes       — bool (optional, default false — for teacher/staff only)
    checkIns        — { [userId]: dayjs | null }
    checkOuts       — { [userId]: dayjs | null }
    onCheckInChange  — (userId, dayjsValue | null) => void
    onCheckOutChange — (userId, dayjsValue | null) => void
*/
const BulkAttendanceTable = ({
  rows, draftMap, onStatusChange, loading,
  showTimes = false,
  checkIns = {}, checkOuts = {},
  onCheckInChange, onCheckOutChange,
}) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: C.surface }}>
            {["#", "User", "Current Status", "Mark Status", ...(showTimes ? ["Check-In", "Check-Out"] : [])].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
                  color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em",
                  borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={showTimes ? 7 : 5}
                style={{ padding: "30px 0", textAlign: "center", color: C.textMuted, fontSize: 13 }}
              >
                {loading ? "Loading…" : "No records found"}
              </td>
            </tr>
          ) : rows.map((record, idx) => {
            const effectiveStatus = draftMap[record.userId] || record.status || "present";
            const showTime = showTimes && TIME_STATUSES.has(effectiveStatus);
            return (
              <tr
                key={record.userId}
                style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* # */}
                <td style={{ padding: "10px 14px", color: C.textMuted, fontSize: 12, fontWeight: 600, width: 40 }}>
                  {idx + 1}
                </td>

                {/* User */}
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                    {record.name || record.email || String(record.userId).slice(-6)}
                  </div>
                  {record.email && record.name && (
                    <div style={{ fontSize: 11, color: C.textMuted }}>{record.email}</div>
                  )}
                </td>

                {/* Current Status */}
                <td style={{ padding: "10px 14px", width: 120 }}>
                  <StatusTag status={record.status} />
                </td>

                {/* Mark Status */}
                <td style={{ padding: "10px 14px", width: 170 }}>
                  <Select
                    size="small"
                    style={{ width: 155 }}
                    options={statusOptions}
                    value={effectiveStatus}
                    onChange={(value) => onStatusChange(record.userId, value)}
                    dropdownStyle={{ fontSize: 12 }}
                  />
                </td>

                {/* Check-In (only if showTimes) */}
                {showTimes && (
                  <td style={{ padding: "10px 14px", width: 120 }}>
                    {showTime ? (
                      <TimePicker
                        size="small"
                        format="hh:mm A"
                        use12Hours
                        placeholder="In"
                        style={{ width: 105 }}
                        value={checkIns[record.userId] || null}
                        onChange={(v) => onCheckInChange?.(record.userId, v)}
                        suffixIcon={<LoginOutlined style={{ color: C.success, fontSize: 11 }} />}
                      />
                    ) : (
                      <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                    )}
                  </td>
                )}

                {/* Check-Out (only if showTimes) */}
                {showTimes && (
                  <td style={{ padding: "10px 14px", width: 120 }}>
                    {showTime ? (
                      <TimePicker
                        size="small"
                        format="hh:mm A"
                        use12Hours
                        placeholder="Out"
                        style={{ width: 105 }}
                        value={checkOuts[record.userId] || null}
                        onChange={(v) => onCheckOutChange?.(record.userId, v)}
                        suffixIcon={<LogoutOutlined style={{ color: "var(--danger)", fontSize: 11 }} />}
                      />
                    ) : (
                      <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BulkAttendanceTable;

import React from "react";
import { Button, Empty, Table, Tooltip } from "antd";
import {
  CalendarOutlined, DeleteOutlined, EditOutlined,
  PlusOutlined, HomeOutlined,
} from "@ant-design/icons";
import { buildGrid, dayLabel, DAYS, getName } from "./timetableUi";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  success: "#22C55E", successLight: "#DCFCE7",
  danger: "#EF4444",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF",
};

const TYPE_PALETTE = {
  regular:      { color: C.primary,  bg: C.primaryLighter, border: C.primaryLight },
  activity:     { color: "#7C3AED",  bg: "#F5F3FF",         border: "#DDD6FE" },
  substitution: { color: C.warning,  bg: C.warningLight,    border: "#FDE68A" },
  break:        { color: "#F97316",  bg: "#FFF7ED",         border: "#FED7AA" },
  lunch:        { color: C.accent,   bg: C.accentLight,     border: "#99F6E4" },
  assembly:     { color: "#0EA5E9",  bg: "#F0F9FF",         border: "#BAE6FD" },
};

const TimetableCell = ({ entry, readOnly, showClass, onAdd, onEdit, onDelete }) => {
  if (!entry) {
    return readOnly ? (
      <span style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>Free</span>
    ) : (
      <Button
        size="small" icon={<PlusOutlined />} onClick={onAdd}
        style={{
          borderRadius: 8, borderColor: C.primaryLight,
          color: C.primary, background: C.primaryLighter,
          fontSize: 12, fontWeight: 600, height: 28,
        }}
      >
        Add
      </Button>
    );
  }

  const isNonTeaching = ["break", "lunch", "assembly"].includes(entry.type);
  const pal = TYPE_PALETTE[entry.type] || TYPE_PALETTE.regular;
  const subjectName = isNonTeaching ? entry.type : getName(entry.subjectId, "Subject");
  const teacherName = getName(entry.teacherId, "");
  const roomName    = getName(entry.roomId, "");

  return (
    <div style={{
      borderRadius: 10, padding: "9px 11px",
      background: pal.bg,
      border: `1.5px solid ${pal.border}`,
      minWidth: 120,
    }}>
      {/* Subject / type label */}
      <div style={{
        fontSize: 12, fontWeight: 800, color: pal.color,
        textTransform: isNonTeaching ? "capitalize" : "none",
        marginBottom: isNonTeaching ? 0 : 5, letterSpacing: "-0.01em",
      }}>
        {subjectName}
      </div>

      {!isNonTeaching && (
        <>
          {teacherName && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: pal.color, color: "#fff",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {teacherName.charAt(0).toUpperCase()}
              </div>
              <span style={{
                fontSize: 11, color: C.textSub, fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110,
              }}>
                {teacherName}
              </span>
            </div>
          )}

          {roomName && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10, color: C.textMuted, fontWeight: 500,
            }}>
              <HomeOutlined style={{ fontSize: 9 }} />
              {roomName}
            </div>
          )}

          {showClass && (
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
              {getName(entry.schoolClassId, "Class")} – {getName(entry.sectionId, "Sec")}
            </div>
          )}
        </>
      )}

      {isNonTeaching && entry.note && (
        <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{entry.note}</div>
      )}

      {!readOnly && (
        <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
          <Tooltip title="Edit">
            <Button
              size="small" icon={<EditOutlined />} onClick={onEdit}
              style={{
                borderRadius: 6, padding: "0 6px", height: 22, fontSize: 11,
                borderColor: pal.border, color: pal.color, background: C.surface,
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small" icon={<DeleteOutlined />} onClick={onDelete}
              style={{
                borderRadius: 6, padding: "0 6px", height: 22, fontSize: 11,
                borderColor: "#FECACA", color: C.danger, background: "#FEF2F2",
              }}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default function TimetableGrid({
  timeSlots = [],
  entries   = [],
  readOnly  = false,
  showClass = false,
  onAdd,
  onEdit,
  onDelete,
}) {
  const grid  = buildGrid(entries);
  const today = DAYS[new Date().getDay() - 1];

  if (!timeSlots.length)
    return <Empty description="Create time slots to start building the timetable" />;

  const columns = [
    {
      title: (
        <span style={{ fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Time Slot
        </span>
      ),
      dataIndex: "slot",
      fixed: "left",
      width: 160,
      render: (slot) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{slot.name}</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
            padding: "2px 9px", borderRadius: 20,
            background: "#F8FAFC", border: "1px solid " + C.border,
            fontSize: 11, color: C.textSub, fontWeight: 500,
          }}>
            {slot.startTime} – {slot.endTime}
          </div>
        </div>
      ),
    },
    ...DAYS.map((day) => {
      const isToday = today === day;
      return {
        title: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "4px 0" }}>
            <span style={{
              fontWeight: 700, fontSize: 13,
              color: isToday ? C.primary : C.text,
            }}>
              {dayLabel(day)}
            </span>
            {isToday && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: C.primary,
                background: C.primaryLighter, borderRadius: 10,
                padding: "1px 9px", border: "1px solid " + C.primaryLight,
              }}>
                Today
              </span>
            )}
          </div>
        ),
        dataIndex: day,
        className: isToday ? "tt-today-col" : "",
        render: (_, row) => (
          <TimetableCell
            entry={grid[row.slot._id]?.[day]}
            readOnly={readOnly}
            showClass={showClass}
            onAdd={() => onAdd?.({ dayOfWeek: day, timeSlotId: row.slot._id })}
            onEdit={() => onEdit?.(grid[row.slot._id]?.[day])}
            onDelete={() => onDelete?.(grid[row.slot._id]?.[day])}
          />
        ),
      };
    }),
  ];

  return (
    <>
      <style>{`
        .tt-today-col { background: ${C.primaryLighter} !important; }
        .ant-table-row:hover .tt-today-col { background: ${C.primaryLight} !important; }
        .ant-table-bordered .ant-table-cell { border-color: ${C.border} !important; }
      `}</style>
      <Table
        rowKey={(row) => row.slot._id}
        columns={columns}
        dataSource={timeSlots.map((slot) => ({ slot }))}
        pagination={false}
        scroll={{ x: 1100 }}
        bordered
        size="middle"
        style={{ borderRadius: 10, overflow: "hidden" }}
      />
    </>
  );
}

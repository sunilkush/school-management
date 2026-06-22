import React, { useState, useMemo } from "react";
import { Button, InputNumber, Select, Table, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  FileTextOutlined, PrinterOutlined, TeamOutlined, HomeOutlined,
  NumberOutlined, SearchOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import { getExams, getSeatPlan } from "../../../features/examSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../../styles/pageStyles";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  success: "#22C55E", successLight: "#DCFCE7",
  purple: "#7C3AED", purpleLight: "#F5F3FF",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF",
};

const ROOM_COLORS = [
  { color: C.primary,  bg: C.primaryLighter, border: C.primaryLight },
  { color: C.accent,   bg: C.accentLight,     border: "#99F6E4" },
  { color: C.purple,   bg: C.purpleLight,     border: "#DDD6FE" },
  { color: "#F97316",  bg: "#FFF7ED",         border: "#FED7AA" },
  { color: C.success,  bg: C.successLight,    border: "#86EFAC" },
  { color: "#0EA5E9",  bg: "#F0F9FF",         border: "#BAE6FD" },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const SeatPlanPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const [examId, setExamId]       = useState();
  const [capacity, setCapacity]   = useState(30);
  const [data, setData]           = useState({ seatPlan: [] });
  const [generating, setGenerating] = useState(false);

  const effectiveAcademicYear = React.useMemo(() => {
    if (selectedAcademicYear?._id) return selectedAcademicYear;
  }, [selectedAcademicYear]);

  React.useEffect(() => {
    if (!effectiveAcademicYear?._id) return;
    dispatch(getExams({
      schoolId: effectiveAcademicYear.schoolId,
      academicYearId: effectiveAcademicYear._id,
      limit: 100,
    }));
  }, [dispatch, effectiveAcademicYear]);

  const loadSeatPlan = async () => {
    if (!examId) return message.warning("Please select an exam first");
    setGenerating(true);
    const res = await dispatch(getSeatPlan({ examId, roomCapacity: capacity }));
    setGenerating(false);
    if (res.meta.requestStatus === "rejected") {
      return message.error(res.payload || "Unable to generate seat plan");
    }
    setData(res.payload || { seatPlan: [] });
  };

  const seats = data.seatPlan || [];
  const rooms = useMemo(() => [...new Set(seats.map((s) => s.roomNumber))].sort(), [seats]);
  const roomColorMap = useMemo(
    () => Object.fromEntries(rooms.map((r, i) => [r, ROOM_COLORS[i % ROOM_COLORS.length]])),
    [rooms],
  );
  const selectedExam = exams.find((e) => e._id === examId);

  /* ── Print handler ── */
  const handlePrint = () => {
    if (!seats.length) return;
    const grouped = rooms.map((room) => ({
      room,
      seats: seats.filter((s) => s.roomNumber === room).sort((a, b) => a.seatNumber - b.seatNumber),
    }));
    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Seat Plan — ${selectedExam?.title || "Exam"}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 24px; color: #0F172A; }
        .header { margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 800; color: #2563EB; margin: 0 0 4px; }
        .subtitle { font-size: 13px; color: #64748B; }
        .room { margin-bottom: 28px; break-inside: avoid; }
        .room-title {
          font-size: 14px; font-weight: 700; color: #2563EB;
          background: #EFF6FF; border: 1px solid #DBEAFE;
          border-radius: 8px; padding: 7px 14px; margin-bottom: 10px;
          display: inline-block;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th {
          background: #F8FAFC; color: #64748B;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 8px 12px; border-bottom: 2px solid #E2E8F0; text-align: left;
        }
        td { padding: 9px 12px; border-bottom: 1px solid #F1F5F9; }
        tr:last-child td { border-bottom: none; }
        .seat-num {
          display: inline-block; padding: 2px 10px; border-radius: 20px;
          background: #EFF6FF; color: #2563EB; font-weight: 700; font-size: 12px;
        }
        @media print { body { padding: 10px; } }
      </style>
    </head><body>
      <div class="header">
        <h1>Seat Plan</h1>
        <div class="subtitle">${selectedExam?.title || "Exam"} &nbsp;·&nbsp; Room Capacity: ${capacity} seats</div>
      </div>
      ${grouped.map(({ room, seats }) => `
        <div class="room">
          <div class="room-title">Room ${room} &nbsp;·&nbsp; ${seats.length} student${seats.length !== 1 ? "s" : ""}</div>
          <table>
            <thead>
              <tr><th>Seat #</th><th>Student Name</th><th>Roll Number</th></tr>
            </thead>
            <tbody>
              ${seats.map((s) => `
                <tr>
                  <td><span class="seat-num">${s.seatNumber}</span></td>
                  <td>${s.studentName}</td>
                  <td>${s.rollNumber}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`).join("")}
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return message.error("Allow popups to print");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  /* ── Table columns ── */
  const columns = [
    {
      title: "Seat",
      dataIndex: "seatNumber",
      width: 80,
      sorter: (a, b) => a.seatNumber - b.seatNumber,
      render: (v) => (
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: C.primaryLighter, color: C.primary,
          fontSize: 13, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {v}
        </div>
      ),
    },
    {
      title: "Student",
      dataIndex: "studentName",
      sorter: (a, b) => (a.studentName || "").localeCompare(b.studentName || ""),
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            color: "#fff", fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: "-0.02em",
          }}>
            {getInitials(v || "?")}
          </div>
          <span style={{ fontWeight: 600, color: C.text }}>{v}</span>
        </div>
      ),
    },
    {
      title: "Roll No.",
      dataIndex: "rollNumber",
      render: (v) => (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 12px", borderRadius: 20,
          background: "#F8FAFC", border: "1px solid " + C.border,
          fontSize: 12, fontWeight: 700, color: C.textSub,
        }}>
          <NumberOutlined style={{ fontSize: 10 }} />
          {v}
        </span>
      ),
    },
    {
      title: "Room",
      dataIndex: "roomNumber",
      filters: rooms.map((r) => ({ text: `Room ${r}`, value: r })),
      onFilter: (value, record) => record.roomNumber === value,
      render: (v) => {
        const col = roomColorMap[v] || ROOM_COLORS[0];
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 12px", borderRadius: 20,
            background: col.bg, color: col.color,
            fontSize: 12, fontWeight: 700,
            border: `1px solid ${col.border}`,
          }}>
            <HomeOutlined style={{ fontSize: 10 }} />
            Room {v}
          </span>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("sp-tbl")}</style>

      <PageHeader
        title="Seat Plan"
        subtitle="Auto-generate room-wise seating arrangements for exam students"
        icon={<FileTextOutlined />}
        extra={
          seats.length > 0 && (
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{
                borderRadius: 9, borderColor: C.accent,
                color: C.accent, fontWeight: 600,
              }}
            >
              Print Seat Plan
            </Button>
          )
        }
      />

      {/* ── Configuration panel ── */}
      <div style={{ ...sectionPanel, margin: "20px 0 16px" }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
        }}>
          Configuration
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Exam selector */}
          <div style={{ flex: "1 1 260px", maxWidth: 420 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Exam
            </div>
            <Select
              value={examId}
              onChange={setExamId}
              placeholder="Search and select exam…"
              style={{ width: "100%" }}
              size="large"
              showSearch
              optionFilterProp="label"
              options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
              suffixIcon={<SearchOutlined style={{ color: C.textMuted }} />}
            />
          </div>

          {/* Capacity */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Room Capacity
            </div>
            <InputNumber
              min={1} max={200}
              value={capacity}
              onChange={setCapacity}
              size="large"
              style={{ width: 150 }}
              addonAfter="seats"
            />
          </div>

          {/* Generate button */}
          <Button
            icon={<ThunderboltOutlined />}
            onClick={loadSeatPlan}
            loading={generating || loading}
            disabled={!examId}
            size="large"
            style={{
              background: examId ? C.primary : undefined,
              borderColor: examId ? C.primary : undefined,
              color: examId ? "#fff" : undefined,
              borderRadius: 10, fontWeight: 700,
              paddingLeft: 22, paddingRight: 22,
            }}
          >
            Generate Seat Plan
          </Button>
        </div>

        {/* Active selection chips */}
        {(selectedExam || seats.length > 0) && (
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedExam && (
              <span style={{
                padding: "4px 12px", borderRadius: 20,
                background: C.primaryLighter, color: C.primary,
                border: "1px solid " + C.primaryLight,
                fontSize: 12, fontWeight: 600,
              }}>
                {selectedExam.title}
              </span>
            )}
            <span style={{
              padding: "4px 12px", borderRadius: 20,
              background: "#F8FAFC", color: C.textSub,
              border: "1px solid " + C.border,
              fontSize: 12, fontWeight: 600,
            }}>
              {capacity} seats / room
            </span>
            {seats.length > 0 && (
              <span style={{
                padding: "4px 12px", borderRadius: 20,
                background: C.successLight, color: "#15803D",
                border: "1px solid #86EFAC",
                fontSize: 12, fontWeight: 600,
              }}>
                {seats.length} students seated
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Stats (shown after generation) ── */}
      {seats.length > 0 && (
        <div style={{ ...statGrid(160), marginBottom: 16 }}>
          {[
            { icon: <TeamOutlined />,   label: "Total Students", value: seats.length,      color: C.primary },
            { icon: <HomeOutlined />,   label: "Rooms Used",     value: rooms.length,       color: C.accent },
            { icon: <NumberOutlined />, label: "Max Per Room",   value: capacity,            color: C.purple },
          ].map((s) => (
            <div key={s.label} style={{
              background: C.surface, borderRadius: 14,
              border: "1px solid " + C.border,
              padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div style={iconWell(s.color, 42)}>{s.icon}</div>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: s.color,
                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2,
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Seat assignments table ── */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Seat Assignments</span>
            {seats.length > 0 && (
              <span style={{
                fontSize: 12, padding: "2px 9px", borderRadius: 20,
                background: C.primaryLighter, color: C.primary,
                border: "1px solid " + C.primaryLight, fontWeight: 600,
              }}>
                {seats.length}
              </span>
            )}
          </div>

          {/* Room legend chips */}
          {rooms.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {rooms.map((r) => {
                const col = roomColorMap[r] || ROOM_COLORS[0];
                const cnt = seats.filter((s) => s.roomNumber === r).length;
                return (
                  <span key={r} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 20,
                    background: col.bg, color: col.color,
                    border: `1px solid ${col.border}`,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    <HomeOutlined style={{ fontSize: 9 }} />
                    Room {r} · {cnt}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <Table
          className="sp-tbl"
          rowKey={(r) => `${r.studentId || r.rollNumber}-${r.seatNumber}`}
          dataSource={seats}
          loading={loading || generating}
          columns={columns}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `${total} students`,
          }}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <FileTextOutlined style={{ fontSize: 40, color: C.textMuted, marginBottom: 12, display: "block" }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                  No seat plan generated yet
                </div>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  Select an exam and click "Generate Seat Plan" to begin
                </div>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default SeatPlanPage;

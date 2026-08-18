import React, { useEffect, useRef, useState } from "react";
import { ClockCircleOutlined } from "@ant-design/icons";

const pad = (n) => String(n).padStart(2, "0");

const formatTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/* ─────────────────────────────────────────────────────
   Props
     initialSeconds – total remaining seconds (calculated
                      from startedAt so resuming works)
     onTimeUp       – called when countdown hits 0
     inline         – render as compact inline pill (used
                      inside sticky header); defaults to
                      false (floating fixed card)
───────────────────────────────────────────────────── */
const ExamTimer = ({ initialSeconds = 1800, onTimeUp, inline = false }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current?.();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const isWarning  = timeLeft <= 300;   // < 5 min – amber
  const isDanger   = timeLeft <= 60;    // < 1 min – red pulse

  const color = isDanger ? "var(--danger-hover)" : isWarning ? "var(--warning-hover)" : "var(--success-hover)";
  const bg    = isDanger ? "var(--danger-light)" : isWarning ? "var(--warning-light)" : "var(--success-light)";

  /* ── Inline (header) variant ── */
  if (inline) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: bg, color, borderRadius: 99,
        padding: "4px 12px", fontWeight: 700, fontSize: 14,
        animation: isDanger ? "pulse 1s infinite" : undefined,
      }}>
        <ClockCircleOutlined style={{ fontSize: 14 }} />
        {formatTime(timeLeft)}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  /* ── Floating (fixed) variant ── */
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 1000,
      background: "var(--surface)", border: `2px solid ${color}`,
      borderRadius: 14, padding: "10px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 8,
      animation: isDanger ? "pulse 1s infinite" : undefined,
    }}>
      <ClockCircleOutlined style={{ color, fontSize: 18 }} />
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Time Left
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>
          {formatTime(timeLeft)}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default ExamTimer;

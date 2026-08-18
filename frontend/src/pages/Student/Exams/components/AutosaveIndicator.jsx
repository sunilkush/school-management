import React from "react";
import { Spin } from "antd";
import { CheckCircleOutlined, EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const CONFIG = {
  saving: { icon: null,                      color: "var(--warning-hover)", text: "Saving…",          bg: "var(--warning-light)" },
  saved:  { icon: <CheckCircleOutlined />,    color: "var(--success-hover)", text: "Saved",            bg: "var(--success-light)" },
  error:  { icon: <ExclamationCircleOutlined />, color: "var(--danger-hover)", text: "Save failed", bg: "var(--danger-light)" },
  idle:   { icon: <EditOutlined />,           color: "var(--text-secondary)", text: "All changes saved", bg: "transparent" },
};

const AutosaveIndicator = ({ status = "idle" }) => {
  const cfg = CONFIG[status] || CONFIG.idle;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 12, fontWeight: 600, color: cfg.color,
      background: cfg.bg, padding: cfg.bg === "transparent" ? 0 : "3px 10px",
      borderRadius: 99, transition: "all 0.2s",
    }}>
      {status === "saving" ? <Spin size="small" /> : cfg.icon}
      {cfg.text}
    </div>
  );
};

export default AutosaveIndicator;

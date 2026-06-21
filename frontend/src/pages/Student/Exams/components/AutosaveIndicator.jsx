import React from "react";
import { Spin } from "antd";
import { CheckCircleOutlined, EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const CONFIG = {
  saving: { icon: null,                      color: "#B45309", text: "Saving…",          bg: "#FEF3C7" },
  saved:  { icon: <CheckCircleOutlined />,    color: "#15803D", text: "Saved",            bg: "#DCFCE7" },
  error:  { icon: <ExclamationCircleOutlined />, color: "#DC2626", text: "Save failed", bg: "#FEE2E2" },
  idle:   { icon: <EditOutlined />,           color: "#64748B", text: "All changes saved", bg: "transparent" },
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

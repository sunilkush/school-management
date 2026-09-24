import React from "react";
import { CheckCircleFilled, CloseCircleOutlined } from "@ant-design/icons";
import { PASSWORD_MESSAGE, PASSWORD_RULES } from "../../utils/passwordPolicy";

/**
 * Shown while the password box is focused (and kept on screen while what is typed still fails),
 * so the rules are visible at the moment they are being typed against rather than only as an
 * error after the fact.
 */
const PasswordRequirements = ({ value = "", open = true, style }) => {
  if (!open) return null;

  return (
    <div
      style={{
        marginTop: 6,
        padding: "8px 10px",
        borderRadius: 8,
        background: "var(--surface-soft)",
        border: "1px solid var(--border)",
        ...style,
      }}
    >
      <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--text-muted)", marginBottom: 6 }}>
        {PASSWORD_MESSAGE}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 3 }}>
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(value);
          return (
            <li
              key={rule.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: passed ? 600 : 400,
                color: passed ? "var(--success)" : "var(--text-muted)",
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              {passed ? (
                <CheckCircleFilled style={{ fontSize: 12 }} />
              ) : (
                <CloseCircleOutlined style={{ fontSize: 12, opacity: 0.45 }} />
              )}
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordRequirements;

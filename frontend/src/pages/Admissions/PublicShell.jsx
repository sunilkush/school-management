import { Link } from "react-router-dom";
import { Typography } from "antd";

const { Title, Text } = Typography;

/**
 * Layout for the unauthenticated admission pages. These render outside the dashboard shell
 * (no sidebar, no header, no auth), so they carry their own centred card. Colours come from the
 * index.css variables so the page still follows the app's theme, dark mode included.
 */
export default function PublicShell({ title, subtitle, wide = false, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "clamp(16px, 4vw, 48px) 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: wide ? 780 : 480 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, letterSpacing: "-0.02em" }}>
            {title}
          </Title>
          {subtitle && (
            <Text type="secondary" style={{ fontSize: 15 }}>
              {subtitle}
            </Text>
          )}
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 22,
            boxShadow: "var(--shadow-soft)",
            padding: "clamp(20px, 4vw, 32px)",
          }}
        >
          {children}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
          <Link to="/admissions">Apply</Link>
          <Text type="secondary" style={{ margin: "0 10px" }}>
            ·
          </Text>
          <Link to="/admissions/track">Track application</Link>
          <Text type="secondary" style={{ margin: "0 10px" }}>
            ·
          </Text>
          <Link to="/login">School login</Link>
        </div>
      </div>
    </div>
  );
}

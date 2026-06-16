import React from "react";
import { Breadcrumb, Typography, Space } from "antd";
import { Link, useLocation } from "react-router-dom";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

/**
 * PageHeader — standardised page header used by every dashboard page.
 *
 * Props:
 *  title       string   — page title (required)
 *  subtitle    string   — optional description below title
 *  extra       ReactNode — right-side actions (buttons, selects, etc.)
 *  breadcrumbs Array<{ label, path? }> — if omitted, auto-generated from URL
 *  icon        ReactNode — icon shown next to the title
 *  compact     boolean  — reduced vertical padding (for nested pages)
 */
const PageHeader = ({
  title,
  subtitle,
  extra,
  breadcrumbs,
  icon,
  compact = false,
}) => {
  const location = useLocation();

  /* Auto-generate breadcrumbs from pathname when not provided */
  const autoCrumbs = React.useMemo(() => {
    const segments = location.pathname
      .replace(/^\/dashboard\//, "")
      .split("/")
      .filter(Boolean);

    return segments.map((seg, i) => {
      const label = seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const path = "/dashboard/" + segments.slice(0, i + 1).join("/");
      return { label, path: i < segments.length - 1 ? path : undefined };
    });
  }, [location.pathname]);

  const crumbs = breadcrumbs ?? autoCrumbs;

  /* Build Ant Design breadcrumb items */
  const breadcrumbItems = [
    {
      key: "home",
      title: (
        <Link to="/dashboard" style={{ color: "var(--text-muted)" }}>
          <HomeOutlined style={{ fontSize: 13 }} />
        </Link>
      ),
    },
    ...crumbs.map((c) => ({
      key: c.label,
      title: c.path ? (
        <Link to={c.path} style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {c.label}
        </Link>
      ) : (
        <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
          {c.label}
        </span>
      ),
    })),
  ];

  return (
    <div
      style={{
        padding: compact ? "16px 24px 12px" : "24px 24px 20px",
        borderBottom: "1px solid var(--border-muted)",
        background: "var(--surface-header)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {/* Left: breadcrumb + title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <Breadcrumb
          items={breadcrumbItems}
          separator={<RightOutlined style={{ fontSize: 10, color: "var(--text-muted)" }} />}
          style={{ marginBottom: compact ? 6 : 10 }}
        />

        <Space align="center" size={10} style={{ flexWrap: "wrap" }}>
          {icon && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--primary-light)",
                color: "var(--primary)",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <div>
            <Title
              level={4}
              style={{
                margin: 0,
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: compact ? 16 : 20,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Title>
            {subtitle && (
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  display: "block",
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </div>
        </Space>
      </div>

      {/* Right: extra actions */}
      {extra && (
        <Space wrap size={8} style={{ flexShrink: 0, alignSelf: "center" }}>
          {extra}
        </Space>
      )}
    </div>
  );
};

export default PageHeader;

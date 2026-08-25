import React, { useState } from "react";
import {
  Row, Col, Typography, Space, Button, Input, Select, Card, Tag, Badge,
  Alert, Spin, Skeleton, Avatar, Progress, Table, Tabs, Timeline, Divider,
  Tooltip, Switch, Breadcrumb, Pagination, Segmented, Rate, Statistic,
  Form, Checkbox, Radio, Slider, Upload, ColorPicker,
} from "antd";
import {
  HomeOutlined, UserOutlined, BellOutlined, SearchOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InfoCircleOutlined, UploadOutlined, EyeOutlined,
  DownloadOutlined, ArrowRightOutlined, StarOutlined, HeartOutlined,
  LockOutlined, MailOutlined, ThunderboltOutlined, CrownOutlined,
  BookOutlined, TeamOutlined, CalendarOutlined,
  SafetyCertificateOutlined, DashboardOutlined, SettingOutlined,
  GlobalOutlined, LinkOutlined, CopyOutlined, ReloadOutlined,
  FileTextOutlined, BankOutlined, RightOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../components/icons/RupeeIcon";
import {
  GraduationCap, Users, BookOpen, Calendar, Bell, Settings,
  TrendingUp, Award, CheckCircle, XCircle, Clock, AlertTriangle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { CATEGORICAL_COLORS } from "../utils/colorPalette";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/* ─── Section wrapper ─────────────────────────────────────────────── */
const Section = ({ id, title, children }) => (
  <div id={id} style={{ marginBottom: 64, scrollMarginTop: 80 }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 12, marginBottom: 32,
    }}>
      <div style={{
        width: 4, height: 32, borderRadius: 2,
        background: "linear-gradient(180deg, var(--accent), var(--cyan))",
      }} />
      <Title level={2} style={{ margin: 0, color: "var(--text-primary)", fontWeight: 800 }}>
        {title}
      </Title>
    </div>
    {children}
  </div>
);

/* ─── Showcase box (label + content) ─────────────────────────────── */
const Demo = ({ label, children, bg = "var(--surface)", pad = 24 }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <Text style={{
        display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8,
      }}>
        {label}
      </Text>
    )}
    <div style={{
      background: bg, borderRadius: 12,
      border: "1px solid var(--border-muted)", padding: pad,
    }}>
      {children}
    </div>
  </div>
);

/* ─── Color swatch ────────────────────────────────────────────────── */
const Swatch = ({ name, value, light }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{
      height: 64, borderRadius: 10, background: value,
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }} />
    <Text strong style={{ fontSize: 12, color: "var(--text-primary)" }}>{name}</Text>
    <Text style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{value}</Text>
    {light && (
      <Text style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{light}</Text>
    )}
  </div>
);

/* ─── Token row ────────────────────────────────────────────────────── */
const TokenRow = ({ name, value, desc }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 16, padding: "10px 0",
    borderBottom: "1px solid var(--border-muted)",
  }}>
    <code style={{
      flex: "0 0 220px", fontSize: 12, background: "var(--surface-soft)",
      padding: "2px 8px", borderRadius: 6, color: "var(--accent)",
    }}>
      {name}
    </code>
    <code style={{ flex: "0 0 160px", fontSize: 12, color: "var(--text-muted)" }}>{value}</code>
    <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>{desc}</Text>
  </div>
);

/* ─── Nav items for sticky TOC ────────────────────────────────────── */
const NAV = [
  { id: "colors",     label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing",    label: "Spacing & Radius" },
  { id: "buttons",    label: "Buttons" },
  { id: "inputs",     label: "Inputs & Forms" },
  { id: "cards",      label: "Cards" },
  { id: "tags",       label: "Tags & Badges" },
  { id: "alerts",     label: "Alerts & Feedback" },
  { id: "tables",     label: "Tables" },
  { id: "status",     label: "Status Patterns" },
  { id: "skeletons",  label: "Loading States" },
  { id: "icons",      label: "Icons" },
  { id: "navigation", label: "Navigation" },
  { id: "data",       label: "Data Display" },
];

/* ─── Role badge colours ──────────────────────────────────────────── */
const ROLE_COLORS = {
  "Super Admin":    { bg: "#faf5ff", color: "#6d28d9", border: "#ddd6fe" },
  "School Admin":   { bg: "rgba(219,234,254,0.2)", color: "#1d4ed8", border: "rgba(219,234,254,0.4)" },
  "Principal":      { bg: "rgba(220,252,231,0.15)", color: "#15803d", border: "#bbf7d0" },
  "Teacher":        { bg: "rgba(254,243,199,0.25)", color: "#c2410c", border: "#fed7aa" },
  "Student":        { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  "Parent":         { bg: "#fdf4ff", color: "#a21caf", border: "#f0abfc" },
  "Accountant":     { bg: "#fefce8", color: "#a16207", border: "#fde68a" },
  "Librarian":      { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};

/* ══════════════════════════════════════════════════════════════════ */
const StyleGuide = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("colors");

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* Table demo data */
  const tableData = [
    { key: 1, name: "Aryan Sharma", class: "10-A", roll: "S001", status: "active",  fees: "₹12,000" },
    { key: 2, name: "Priya Verma",  class: "9-B",  roll: "S002", status: "pending", fees: "₹8,500" },
    { key: 3, name: "Ravi Kumar",   class: "11-C", roll: "S003", status: "active",  fees: "₹15,000" },
    { key: 4, name: "Neha Singh",   class: "8-A",  roll: "S004", status: "overdue", fees: "₹6,200" },
  ];

  const tableCols = [
    { title: "Student", dataIndex: "name", key: "name",
      render: (n) => (
        <Space>
          <Avatar size={32} style={{
            background: `hsl(${n.charCodeAt(0) * 5 % 360},55%,55%)`,
            fontWeight: 700, fontSize: 13,
          }}>{n[0]}</Avatar>
          <Text strong style={{ fontSize: 13 }}>{n}</Text>
        </Space>
      )
    },
    { title: "Class",   dataIndex: "class",  key: "class" },
    { title: "Roll No", dataIndex: "roll",   key: "roll",
      render: (v) => <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</Text>
    },
    { title: "Fees",    dataIndex: "fees",   key: "fees",
      render: (v) => <Text strong style={{ color: "var(--success)" }}>{v}</Text>
    },
    { title: "Status",  dataIndex: "status", key: "status",
      render: (s) => {
        const map = {
          active:  { color: "success", label: "Active" },
          pending: { color: "warning", label: "Pending" },
          overdue: { color: "error",   label: "Overdue" },
        };
        const c = map[s] || map.pending;
        return <Badge status={c.color} text={c.label} />;
      }
    },
    { title: "", key: "actions",
      render: () => (
        <Space size={4}>
          <Tooltip title="View"><Button type="text" size="small" icon={<EyeOutlined />} /></Tooltip>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      )
    },
  ];

  return (
    <div style={{ display: "flex", background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Sticky left TOC ── */}
      <div style={{
        position: "sticky", top: 0, left: 0, height: "100vh",
        width: 220, flexShrink: 0, overflowY: "auto",
        borderRight: "1px solid var(--border-muted)",
        background: "var(--surface)", padding: "24px 0",
      }}>
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, marginBottom: 10,
            background: "linear-gradient(135deg,var(--accent),var(--cyan))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Style Guide</Text>
          <Text style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            School Management UI
          </Text>
        </div>

        <div style={{ padding: "0 8px" }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: activeSection === item.id
                  ? "rgba(var(--purple-rgb),0.08)" : "transparent",
                border: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: 8,
                color: activeSection === item.id ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 13, fontWeight: activeSection === item.id ? 600 : 400,
                marginBottom: 2, transition: "all 0.15s",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 16px 0", borderTop: "1px solid var(--border-muted)", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {isDark ? "Dark" : "Light"} Mode
            </Text>
            <Switch size="small" checked={isDark} onChange={toggleTheme} />
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto", maxWidth: 1200 }}>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Tag color="purple" style={{ borderRadius: 99 }}>v1.0</Tag>
            <Tag color="cyan" style={{ borderRadius: 99 }}>Ant Design v5 + Tailwind</Tag>
          </div>
          <Title style={{ margin: "0 0 12px", color: "var(--text-primary)", fontWeight: 900, fontSize: 40 }}>
            UI Style Guide
          </Title>
          <Paragraph style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 600, lineHeight: 1.7 }}>
            Complete design system reference for <strong style={{ color: "var(--primary)" }}>School Management System</strong>.
            All colors, typography, spacing, and components in one place.
          </Paragraph>
          <Space size={8} wrap>
            <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end">Get Started</Button>
            <Button icon={<CopyOutlined />}>Copy Tokens</Button>
            <Button icon={<DownloadOutlined />}>Download Figma</Button>
          </Space>
        </div>

        {/* ══ 1. COLORS ══════════════════════════════════════════════ */}
        <Section id="colors" title="Colors">

          <Demo label="Brand Palette">
            <Row gutter={[16, 16]}>
              {[
                { name: "Primary",   value: "#14B8A6", light: "rgba(124,58,237,0.08)" },
                { name: "Secondary", value: "#06b6d4", light: "rgba(6,182,212,0.08)" },
                { name: "Success",   value: "#22C55E", light: "rgba(16,185,129,0.10)" },
                { name: "Warning",   value: "#F59E0B", light: "rgba(245,158,11,0.10)" },
                { name: "Danger",    value: "#EF4444", light: "rgba(239,68,68,0.10)" },
                { name: "Purple",    value: "#14B8A6", light: "rgba(124,58,237,0.10)" },
                { name: "Orange",    value: "#F59E0B", light: "rgba(249,115,22,0.10)" },
                { name: "Cyan",      value: "#06b6d4", light: "rgba(6,182,212,0.10)" },
              ].map((s) => (
                <Col key={s.name} xs={12} sm={8} md={6} lg={3}>
                  <Swatch {...s} />
                </Col>
              ))}
            </Row>
          </Demo>

          <Demo label="Neutral / Greyscale">
            <Row gutter={[12, 12]}>
              {[
                { name: "slate-50",  value: "#F8FAFC" },
                { name: "slate-100", value: "#f1f5f9" },
                { name: "slate-200", value: "#e2e8f0" },
                { name: "slate-300", value: "#cbd5e1" },
                { name: "slate-400", value: "#94A3B8" },
                { name: "slate-500", value: "#64748B" },
                { name: "slate-600", value: "#475569" },
                { name: "slate-700", value: "#334155" },
                { name: "slate-800", value: "#0F172A" },
                { name: "slate-900", value: "#0F172A" },
                { name: "slate-950", value: "#020617" },
              ].map((s) => (
                <Col key={s.name} xs={12} sm={6} md={4} lg={2}>
                  <Swatch {...s} />
                </Col>
              ))}
            </Row>
          </Demo>

          <Demo label="CSS Variables — Light Theme">
            <div>
              <TokenRow name="--primary"          value="#14B8A6"  desc="Main brand colour, buttons, links, active states" />
              <TokenRow name="--primary-hover"     value="#6d28d9"  desc="Button hover / pressed" />
              <TokenRow name="--primary-light"     value="rgba(124,58,237,0.08)" desc="Chip backgrounds, icon wells" />
              <TokenRow name="--secondary"         value="#06b6d4"  desc="Accent for data viz, secondary actions" />
              <TokenRow name="--success"           value="#22C55E"  desc="Success states, positive values" />
              <TokenRow name="--warning"           value="#F59E0B"  desc="Warning alerts, caution states" />
              <TokenRow name="--danger"            value="#EF4444"  desc="Error states, delete actions" />
              <TokenRow name="--text-primary"      value="#0F172A"  desc="Headings, body text" />
              <TokenRow name="--text-secondary"    value="#475569"  desc="Labels, descriptions" />
              <TokenRow name="--text-muted"        value="#64748B"  desc="Placeholders, metadata" />
              <TokenRow name="--surface"           value="#ffffff"  desc="Card / panel background" />
              <TokenRow name="--surface-page"      value="#F8FAFC"  desc="Page background" />
              <TokenRow name="--surface-soft"      value="#f1f5f9"  desc="Input backgrounds, hover fills" />
              <TokenRow name="--border"            value="#e2e8f0"  desc="Standard border" />
              <TokenRow name="--border-muted"      value="#f1f5f9"  desc="Subtle dividers" />
            </div>
          </Demo>

          <Demo label="Dark Mode Overrides (applied automatically via [data-theme='dark'])">
            <div>
              <TokenRow name="--bg"              value="#020617"  desc="Page background" />
              <TokenRow name="--surface"         value="#0F172A"  desc="Card / panel" />
              <TokenRow name="--surface-soft"    value="#0F172A"  desc="Input / hover fill" />
              <TokenRow name="--text-primary"    value="#e2e8f0"  desc="Headings, body" />
              <TokenRow name="--border"          value="#0F172A"  desc="Standard border" />
              <TokenRow name="--primary-light"   value="rgba(124,58,237,0.15)" desc="Chip backgrounds" />
            </div>
          </Demo>
        </Section>

        {/* ══ 2. TYPOGRAPHY ══════════════════════════════════════════ */}
        <Section id="typography" title="Typography">
          <Demo label="Heading Scale — Noto Sans">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Title level={1} style={{ margin: 0 }}>H1 — Page Title (40px, 800)</Title>
              <Title level={2} style={{ margin: 0 }}>H2 — Section Header (32px, 700)</Title>
              <Title level={3} style={{ margin: 0 }}>H3 — Card Header (24px, 600)</Title>
              <Title level={4} style={{ margin: 0 }}>H4 — Sub-section (20px, 600)</Title>
              <Title level={5} style={{ margin: 0 }}>H5 — Component Title (16px, 600)</Title>
            </Space>
          </Demo>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Demo label="Body Text">
                <Space direction="vertical" size={12}>
                  <Text style={{ fontSize: 16 }}>Body Large — 16px / 1.6 line-height</Text>
                  <Text style={{ fontSize: 14 }}>Body Default — 14px / 1.6 line-height</Text>
                  <Text style={{ fontSize: 13 }}>Body Small — 13px / 1.5 line-height</Text>
                  <Text style={{ fontSize: 12 }}>Caption — 12px / 1.4 line-height</Text>
                  <Text style={{ fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase" }}>
                    Label — 11px / uppercase / 0.08em
                  </Text>
                </Space>
              </Demo>
            </Col>
            <Col xs={24} md={12}>
              <Demo label="Text Variants">
                <Space direction="vertical" size={10}>
                  <Text>Default text — var(--text-primary)</Text>
                  <Text type="secondary">Secondary text — var(--text-secondary)</Text>
                  <Text disabled>Disabled text — var(--text-disabled)</Text>
                  <Text strong>Strong / bold text</Text>
                  <Text italic>Italic text for emphasis</Text>
                  <Text delete>Strikethrough — deleted</Text>
                  <Text mark>Highlighted text</Text>
                  <Text code>inline code snippet</Text>
                  <Text type="success">Success colour text</Text>
                  <Text type="warning">Warning colour text</Text>
                  <Text type="danger">Danger colour text</Text>
                </Space>
              </Demo>
            </Col>
          </Row>

          <Demo label="Paragraph">
            <Paragraph style={{ marginBottom: 0, color: "var(--text-secondary)", lineHeight: 1.75 }}>
              School Management System is a comprehensive SaaS platform that enables educational institutions
              to digitally manage students, staff, fees, exams, attendance, and more. It supports multiple
              schools (multi-tenancy) with role-based access control for 18+ roles including Super Admin,
              School Admin, Principal, Teacher, Student, Parent, Accountant, Librarian, and more.
            </Paragraph>
          </Demo>
        </Section>

        {/* ══ 3. SPACING & RADIUS ════════════════════════════════════ */}
        <Section id="spacing" title="Spacing & Radius">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Demo label="Spacing Scale (Tailwind / inline)">
                {[
                  { label: "4px  — xs  (p-1)",  size: 4 },
                  { label: "8px  — sm  (p-2)",  size: 8 },
                  { label: "12px — md  (p-3)",  size: 12 },
                  { label: "16px — base(p-4)", size: 16 },
                  { label: "20px — lg  (p-5)",  size: 20 },
                  { label: "24px — xl  (p-6)",  size: 24 },
                  { label: "32px — 2xl (p-8)",  size: 32 },
                  { label: "40px — 3xl (p-10)", size: 40 },
                  { label: "48px — 4xl (p-12)", size: 48 },
                ].map(({ label, size }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                      width: size, height: size, flexShrink: 0,
                      background: "linear-gradient(135deg,var(--accent),var(--cyan))",
                      borderRadius: 3,
                    }} />
                    <Text style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{label}</Text>
                  </div>
                ))}
              </Demo>
            </Col>
            <Col xs={24} md={12}>
              <Demo label="Border Radius — Ant Design Tokens">
                {[
                  { label: "borderRadiusSM — 10px",  r: 10,  sample: "Input, Small" },
                  { label: "borderRadius   — 14px",  r: 14,  sample: "Button, Select" },
                  { label: "borderRadiusLG — 18px",  r: 18,  sample: "Card, Modal" },
                  { label: "Circular       — 50%",   r: 999, sample: "Avatar, Dot" },
                  { label: "Pill           — 99px",  r: 99,  sample: "Tag, Badge" },
                ].map(({ label, r, sample }) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", gap: 16, marginBottom: 12,
                  }}>
                    <div style={{
                      width: 48, height: 48, flexShrink: 0,
                      background: "var(--primary-light)", border: "2px solid var(--primary)",
                      borderRadius: r,
                    }} />
                    <div>
                      <Text style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-primary)" }}>{label}</Text>
                      <Text style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>{sample}</Text>
                    </div>
                  </div>
                ))}
              </Demo>
            </Col>
          </Row>
        </Section>

        {/* ══ 4. BUTTONS ════════════════════════════════════════════ */}
        <Section id="buttons" title="Buttons">
          <Demo label="Button Types">
            <Space wrap size={10}>
              <Button type="primary">Primary</Button>
              <Button type="default">Default</Button>
              <Button type="dashed">Dashed</Button>
              <Button type="text">Text</Button>
              <Button type="link">Link</Button>
              <Button type="primary" danger>Danger</Button>
              <Button danger>Danger Default</Button>
            </Space>
          </Demo>

          <Demo label="Sizes">
            <Space align="center" wrap size={10}>
              <Button type="primary" size="large">Large</Button>
              <Button type="primary" size="middle">Middle</Button>
              <Button type="primary" size="small">Small</Button>
            </Space>
          </Demo>

          <Demo label="With Icons">
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />}>Add Student</Button>
              <Button icon={<EditOutlined />}>Edit</Button>
              <Button icon={<DeleteOutlined />} danger>Delete</Button>
              <Button icon={<DownloadOutlined />}>Export</Button>
              <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end">Continue</Button>
              <Button icon={<ReloadOutlined />}>Refresh</Button>
            </Space>
          </Demo>

          <Demo label="Icon Only">
            <Space wrap size={10}>
              <Tooltip title="Add"><Button type="primary" shape="circle" icon={<PlusOutlined />} /></Tooltip>
              <Tooltip title="Edit"><Button shape="circle" icon={<EditOutlined />} /></Tooltip>
              <Tooltip title="Delete"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip>
              <Tooltip title="Download"><Button shape="circle" icon={<DownloadOutlined />} /></Tooltip>
              <Tooltip title="Settings"><Button shape="circle" icon={<SettingOutlined />} /></Tooltip>
              <Tooltip title="Search"><Button shape="circle" icon={<SearchOutlined />} /></Tooltip>
            </Space>
          </Demo>

          <Demo label="States">
            <Space wrap size={10}>
              <Button type="primary" loading>Loading</Button>
              <Button type="primary" disabled>Disabled</Button>
              <Button disabled>Disabled Default</Button>
            </Space>
          </Demo>

          <Demo label="Gradient Buttons (custom CSS)">
            <Space wrap size={10}>
              {[
                { label: "Sign In",     bg: "linear-gradient(135deg,var(--accent),var(--purple-hover))", shadow: "rgba(var(--purple-rgb),0.4)" },
                { label: "Confirm",     bg: "linear-gradient(135deg,var(--success),var(--success))", shadow: "rgba(var(--success-rgb),0.4)" },
                { label: "Send",        bg: "linear-gradient(135deg,var(--cyan),var(--cyan))", shadow: "rgba(var(--cyan-rgb),0.4)" },
                { label: "Warning",     bg: "linear-gradient(135deg,var(--warning),var(--warning))", shadow: "rgba(var(--warning-rgb),0.4)" },
                { label: "Delete",      bg: "linear-gradient(135deg,var(--danger),var(--danger))", shadow: "rgba(var(--danger-rgb),0.4)" },
              ].map(({ label, bg, shadow }) => (
                <button
                  key={label}
                  style={{
                    background: bg, color: "#fff", border: "none", cursor: "pointer",
                    padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14,
                    boxShadow: `0 4px 14px ${shadow}`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
                >
                  {label}
                </button>
              ))}
            </Space>
          </Demo>
        </Section>

        {/* ══ 5. INPUTS & FORMS ══════════════════════════════════════ */}
        <Section id="inputs" title="Inputs & Forms">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Demo label="Text Inputs">
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  <Input placeholder="Default input" />
                  <Input size="large" placeholder="Large input" />
                  <Input size="small" placeholder="Small input" />
                  <Input prefix={<UserOutlined />} placeholder="With prefix icon" />
                  <Input suffix={<SearchOutlined />} placeholder="With suffix icon" />
                  <Input prefix={<MailOutlined />} placeholder="Email address" type="email" />
                  <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                  <Input.TextArea rows={3} placeholder="Multi-line text area..." />
                  <Input.Search placeholder="Search students..." enterButton />
                </Space>
              </Demo>
            </Col>
            <Col xs={24} md={12}>
              <Demo label="Select & Other Controls">
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  <Select
                    placeholder="Select class"
                    style={{ width: "100%" }}
                    options={[
                      { value: "10a", label: "Class 10-A" },
                      { value: "10b", label: "Class 10-B" },
                      { value: "9a",  label: "Class 9-A" },
                    ]}
                  />
                  <Select
                    mode="multiple"
                    placeholder="Select subjects"
                    style={{ width: "100%" }}
                    options={[
                      { value: "math", label: "Mathematics" },
                      { value: "sci",  label: "Science" },
                      { value: "eng",  label: "English" },
                      { value: "his",  label: "History" },
                    ]}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Checkbox>Remember me</Checkbox>
                    <Checkbox defaultChecked>Auto-promote</Checkbox>
                    <Checkbox disabled>Disabled</Checkbox>
                  </div>
                  <Radio.Group defaultValue="active">
                    <Radio value="active">Active</Radio>
                    <Radio value="inactive">Inactive</Radio>
                    <Radio value="pending">Pending</Radio>
                  </Radio.Group>
                  <div>
                    <Text style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Slider</Text>
                    <Slider defaultValue={60} />
                  </div>
                  <Rate defaultValue={4} />
                  <Upload>
                    <Button icon={<UploadOutlined />}>Upload Document</Button>
                  </Upload>
                </Space>
              </Demo>
            </Col>
          </Row>

          <Demo label="Form Layout Example">
            <Form layout="vertical" style={{ maxWidth: 600 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="First Name" required>
                    <Input placeholder="Aryan" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Last Name" required>
                    <Input placeholder="Sharma" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Email Address" required help="Use school email">
                <Input prefix={<MailOutlined />} placeholder="aryan@school.edu" type="email" />
              </Form.Item>
              <Form.Item label="Role" required>
                <Select placeholder="Select role" style={{ width: "100%" }}
                  options={Object.keys(ROLE_COLORS).map((r) => ({ value: r, label: r }))}
                />
              </Form.Item>
              <Form.Item label="Class" validateStatus="error" help="Class is required">
                <Select placeholder="Select class" style={{ width: "100%" }} status="error" />
              </Form.Item>
              <Space>
                <Button type="primary">Save Student</Button>
                <Button>Cancel</Button>
              </Space>
            </Form>
          </Demo>
        </Section>

        {/* ══ 6. CARDS ═══════════════════════════════════════════════ */}
        <Section id="cards" title="Cards">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Demo label="Basic Card">
                <Card title="Student Record" extra={<Button type="link" size="small">View All</Button>}>
                  <Statistic title="Total Students" value={1284} prefix={<TeamOutlined />} />
                </Card>
              </Demo>
            </Col>
            <Col xs={24} md={8}>
              <Demo label="Hoverable Card">
                <Card hoverable cover={
                  <div style={{ height: 100, background: "linear-gradient(135deg,var(--accent),var(--cyan))", borderRadius: "14px 14px 0 0" }} />
                }>
                  <Card.Meta title="Class 10-A" description="42 students enrolled" />
                </Card>
              </Demo>
            </Col>
            <Col xs={24} md={8}>
              <Demo label="KPI / Stat Card">
                <div style={{
                  padding: 20, borderRadius: 14, background: "var(--surface)",
                  border: "1px solid var(--border-muted)", position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: -20, right: -20, width: 80, height: 80,
                    borderRadius: "50%", background: "var(--accent)", opacity: 0.07,
                  }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Total Revenue</Text>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: "rgba(var(--purple-rgb),0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)",
                    }}>
                      <RupeeIcon />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Title level={3} style={{ margin: "0 0 4px", color: "var(--text-primary)" }}>₹42,85,000</Title>
                    <Text style={{ fontSize: 12, color: "var(--success)" }}>↑ 12.5% vs last month</Text>
                  </div>
                </div>
              </Demo>
            </Col>
          </Row>

          <Demo label="KPI Grid — School Dashboard Pattern">
            <Row gutter={[12, 12]}>
              {[
                { title: "Total Students", value: "1,284", delta: "+24", icon: <Users size={18} />, color: "var(--accent)" },
                { title: "Teachers",       value: "86",    delta: "+3",  icon: <Award size={18} />,  color: "var(--success)" },
                { title: "Fee Collected",  value: "₹42L",  delta: "+8%", icon: <TrendingUp size={18} />, color: "var(--warning)" },
                { title: "Attendance",     value: "94.2%", delta: "+1.2%", icon: <CheckCircle size={18} />, color: "var(--cyan)" },
              ].map(({ title, value, delta, icon, color }) => (
                <Col key={title} xs={12} lg={6}>
                  <div style={{
                    padding: 16, background: "var(--surface)", borderRadius: 12,
                    border: "1px solid var(--border-muted)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>{title}</Text>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, color,
                        background: `color-mix(in srgb, ${color} 9%, transparent)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {icon}
                      </div>
                    </div>
                    <Title level={4} style={{ margin: "0 0 4px", color: "var(--text-primary)" }}>{value}</Title>
                    <Text style={{ fontSize: 11, color: "var(--success)" }}>↑ {delta} this month</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Demo>
        </Section>

        {/* ══ 7. TAGS & BADGES ═══════════════════════════════════════ */}
        <Section id="tags" title="Tags & Badges">
          <Demo label="Ant Design Tags">
            <Space wrap size={8}>
              <Tag>Default</Tag>
              <Tag color="processing">Processing</Tag>
              <Tag color="success">Success</Tag>
              <Tag color="warning">Warning</Tag>
              <Tag color="error">Error</Tag>
              <Tag color="purple">Purple</Tag>
              <Tag color="cyan">Cyan</Tag>
              <Tag color="geekblue">Geekblue</Tag>
              <Tag color="magenta">Magenta</Tag>
              <Tag color="gold">Gold</Tag>
              <Tag color="lime">Lime</Tag>
              <Tag color="volcano">Volcano</Tag>
            </Space>
          </Demo>

          <Demo label="Role Badges — Custom Pattern">
            <Space wrap size={8}>
              {Object.entries(ROLE_COLORS).map(([role, { bg, color, border }]) => (
                <span
                  key={role}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: bg, color, border: `1px solid ${border}`,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                  {role}
                </span>
              ))}
            </Space>
          </Demo>

          <Demo label="Status Badges">
            <Space direction="vertical" size={8}>
              <Space size={16} wrap>
                <Badge status="success" text="Active" />
                <Badge status="processing" text="Processing" />
                <Badge status="warning" text="Pending" />
                <Badge status="error" text="Suspended" />
                <Badge status="default" text="Inactive" />
              </Space>
              <Space size={16} wrap>
                <Badge count={5}><Button>Messages</Button></Badge>
                <Badge count={99} overflowCount={50}><Button>Notifications</Button></Badge>
                <Badge dot><Button>Has Update</Button></Badge>
                <Badge count={0} showZero><Button>Zero</Button></Badge>
              </Space>
            </Space>
          </Demo>

          <Demo label="Pill Tags (Rounded) — Used in Academic Pages">
            <Space wrap size={8}>
              {["Mathematics", "Science", "English", "History", "Physics", "Chemistry", "Biology", "Computer Science"].map((sub, i) => {
                const c = CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length];
                return (
                  <Tag
                    key={sub}
                    style={{
                      borderRadius: 99, fontWeight: 600, fontSize: 12,
                      background: `color-mix(in srgb, ${c} 8%, transparent)`,
                      color: c, border: `1px solid color-mix(in srgb, ${c} 19%, transparent)`,
                      padding: "2px 12px",
                    }}
                  >
                    {sub}
                  </Tag>
                );
              })}
            </Space>
          </Demo>
        </Section>

        {/* ══ 8. ALERTS & FEEDBACK ═══════════════════════════════════ */}
        <Section id="alerts" title="Alerts & Feedback">
          <Demo label="Alert Variants">
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <Alert message="Success — Record saved successfully." type="success" showIcon />
              <Alert message="Info — Academic year 2024-25 is now active." type="info" showIcon />
              <Alert message="Warning — Fee payment is overdue." type="warning" showIcon />
              <Alert message="Error — Failed to connect to server." type="error" showIcon />
              <Alert
                message="With Description"
                description="Student admission requires parent details and fee verification. Please complete all mandatory fields."
                type="info"
                showIcon
              />
              <Alert
                message="With Action"
                description="Session will expire in 5 minutes."
                type="warning"
                showIcon
                action={<Button size="small">Extend</Button>}
                closable
              />
            </Space>
          </Demo>

          <Demo label="Loading / Spin">
            <Space size={32} align="center" wrap>
              <Spin size="small" />
              <Spin />
              <Spin size="large" />
              <Spin tip="Loading students...">
                <div style={{
                  width: 200, height: 80, background: "var(--surface-soft)",
                  borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--text-muted)", fontSize: 12,
                }}>Content Area</div>
              </Spin>
            </Space>
          </Demo>

          <Demo label="Progress Bars">
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              <div>
                <Text style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
                  Fee Collection — 78%
                </Text>
                <Progress percent={78} strokeColor="var(--accent)" />
              </div>
              <div>
                <Text style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
                  Attendance — 94%
                </Text>
                <Progress percent={94} strokeColor="var(--success)" />
              </div>
              <div>
                <Text style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
                  Syllabus Completion — 62% (Warning)
                </Text>
                <Progress percent={62} strokeColor="var(--warning)" />
              </div>
              <Row gutter={16}>
                <Col span={6}>
                  <Progress type="circle" percent={78} strokeColor="var(--accent)" size={80} />
                </Col>
                <Col span={6}>
                  <Progress type="circle" percent={94} strokeColor="var(--success)" size={80} />
                </Col>
                <Col span={6}>
                  <Progress type="dashboard" percent={62} strokeColor="var(--warning)" size={80} />
                </Col>
                <Col span={6}>
                  <Progress type="circle" percent={100} size={80} />
                </Col>
              </Row>
            </Space>
          </Demo>
        </Section>

        {/* ══ 9. TABLES ══════════════════════════════════════════════ */}
        <Section id="tables" title="Tables">
          <Demo label="Student List Table — Standard Pattern">
            <Table
              columns={tableCols}
              dataSource={tableData}
              size="middle"
              pagination={{ pageSize: 5, size: "small" }}
              scroll={{ x: 600 }}
            />
          </Demo>

          <Demo label="Table with Custom Styles">
            <Table
              columns={[
                { title: "Subject",    dataIndex: "sub",    key: "sub", render: (v) => <Text strong>{v}</Text> },
                { title: "Teacher",    dataIndex: "teacher",key: "teacher" },
                { title: "Marks",      dataIndex: "marks",  key: "marks",
                  render: (v) => (
                    <Space>
                      <Progress
                        percent={v} size="small" showInfo={false}
                        strokeColor={v >= 75 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)"}
                        style={{ width: 80 }}
                      />
                      <Text style={{ fontSize: 12, color: v >= 75 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)", fontWeight: 600 }}>
                        {v}%
                      </Text>
                    </Space>
                  )
                },
                { title: "Grade",      dataIndex: "grade",  key: "grade",
                  render: (g) => {
                    const map = { A: "success", B: "processing", C: "warning", D: "error" };
                    return <Tag color={map[g] || "default"} style={{ borderRadius: 99, fontWeight: 700 }}>{g}</Tag>;
                  }
                },
              ]}
              dataSource={[
                { key: 1, sub: "Mathematics",   teacher: "Mr. Rajesh", marks: 88, grade: "A" },
                { key: 2, sub: "Science",        teacher: "Mrs. Priya",  marks: 72, grade: "B" },
                { key: 3, sub: "English",        teacher: "Ms. Sneha",   marks: 65, grade: "C" },
                { key: 4, sub: "Social Studies", teacher: "Mr. Amit",    marks: 45, grade: "D" },
              ]}
              size="small"
              pagination={false}
            />
          </Demo>
        </Section>

        {/* ══ 10. STATUS PATTERNS ════════════════════════════════════ */}
        <Section id="status" title="Status Patterns">
          <Demo label="Entity Status — Used Across Student / Fee / School Pages">
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Row gutter={[12, 12]}>
                {[
                  { label: "Active",     bg: "rgba(220,252,231,0.15)", color: "var(--success-hover)", border: "#bbf7d0", dot: "var(--success)" },
                  { label: "Pending",    bg: "var(--warning-light)", color: "var(--warning-hover)", border: "var(--warning-light)", dot: "var(--warning)" },
                  { label: "Overdue",    bg: "var(--danger-light)", color: "#be123c", border: "#fecdd3", dot: "var(--danger)" },
                  { label: "Suspended",  bg: "#fafafa", color: "#525252", border: "#e5e5e5", dot: "#a3a3a3" },
                  { label: "Processing", bg: "rgba(219,234,254,0.2)", color: "var(--primary-hover)", border: "rgba(219,234,254,0.4)", dot: "var(--primary)" },
                  { label: "Graduated",  bg: "#faf5ff", color: "var(--purple-hover)", border: "#ddd6fe", dot: "var(--accent)" },
                ].map(({ label, bg, color, border, dot }) => (
                  <Col key={label} xs={12} sm={8} md={4}>
                    <div style={{
                      padding: "8px 14px", borderRadius: 99,
                      background: bg, color, border: `1px solid ${border}`,
                      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
                      {label}
                    </div>
                  </Col>
                ))}
              </Row>
            </Space>
          </Demo>

          <Demo label="Fee Status Indicators">
            <Row gutter={[12, 12]}>
              {[
                { label: "Paid",        icon: <CheckCircleOutlined />, color: "var(--success)" },
                { label: "Partially Paid", icon: <InfoCircleOutlined />, color: "var(--warning)" },
                { label: "Unpaid",      icon: <CloseCircleOutlined />, color: "var(--danger)" },
                { label: "Waived",      icon: <StarOutlined />, color: "var(--accent)" },
                { label: "Overdue",     icon: <WarningOutlined />, color: "var(--warning)" },
              ].map(({ label, icon, color }) => (
                <Col key={label}>
                  <Tag
                    icon={icon}
                    style={{ borderRadius: 8, padding: "4px 12px", border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, color, background: `color-mix(in srgb, ${color} 7%, transparent)`, fontWeight: 600 }}
                  >
                    {label}
                  </Tag>
                </Col>
              ))}
            </Row>
          </Demo>

          <Demo label="Subscription Plan Tiers">
            <Space wrap size={10}>
              {[
                { plan: "Trial",    bg: "#f9f0ff", color: "#722ed1", border: "#d3adf7", icon: <BookOutlined /> },
                { plan: "Standard", bg: "#e6f7ff", color: "#0050b3", border: "#91d5ff", icon: <SafetyCertificateOutlined /> },
                { plan: "Premium",  bg: "#fff7e6", color: "#ad4e00", border: "#ffd591", icon: <CrownOutlined /> },
                { plan: "Enterprise",bg:"rgba(220,252,231,0.15)", color: "#135200", border: "rgba(220,252,231,0.5)", icon: <GlobalOutlined /> },
              ].map(({ plan, bg, color, border, icon }) => (
                <div
                  key={plan}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 10,
                    background: bg, color, border: `1px solid ${border}`,
                    fontWeight: 700, fontSize: 13,
                  }}
                >
                  {React.cloneElement(icon, { style: { fontSize: 15 } })}
                  {plan}
                </div>
              ))}
            </Space>
          </Demo>
        </Section>

        {/* ══ 11. LOADING STATES ═════════════════════════════════════ */}
        <Section id="skeletons" title="Loading States">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Demo label="Card Skeleton">
                <div style={{
                  padding: 20, borderRadius: 12, background: "var(--surface)",
                  border: "1px solid var(--border-muted)",
                }}>
                  <Skeleton active paragraph={{ rows: 3 }} title={{ width: "60%" }} />
                </div>
              </Demo>
            </Col>
            <Col xs={24} md={12}>
              <Demo label="List Skeleton">
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Skeleton.Avatar active size={40} />
                      <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} style={{ flex: 1 }} />
                    </div>
                  ))}
                </Space>
              </Demo>
            </Col>
          </Row>

          <Demo label="KPI Skeleton Grid — Used in Dashboard while loading">
            <Row gutter={[12, 12]}>
              {[1, 2, 3, 4].map((i) => (
                <Col key={i} xs={12} md={6}>
                  <div style={{
                    padding: 16, borderRadius: 12, background: "var(--surface)",
                    border: "1px solid var(--border-muted)",
                  }}>
                    <Skeleton active paragraph={{ rows: 1 }} title={{ width: "70%" }} />
                  </div>
                </Col>
              ))}
            </Row>
          </Demo>

          <Demo label="Pulse Animation Skeleton (pure CSS)">
            <style>{`
              @keyframes sgPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
              .sg-skeleton { background:var(--surface-soft); border-radius:8px; animation:sgPulse 1.6s ease-in-out infinite; }
            `}</style>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              <div className="sg-skeleton" style={{ height: 20, width: "80%" }} />
              <div className="sg-skeleton" style={{ height: 16, width: "60%" }} />
              <div className="sg-skeleton" style={{ height: 16, width: "70%" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <div className="sg-skeleton" style={{ height: 32, flex: 1, borderRadius: 8 }} />
                <div className="sg-skeleton" style={{ height: 32, flex: 2, borderRadius: 8 }} />
              </div>
            </Space>
          </Demo>
        </Section>

        {/* ══ 12. ICONS ══════════════════════════════════════════════ */}
        <Section id="icons" title="Icons">
          <Demo label="Ant Design Icons — Most Used">
            <Space wrap size={20}>
              {[
                [UserOutlined, "User"],
                [TeamOutlined, "Team"],
                [BellOutlined, "Bell"],
                [SearchOutlined, "Search"],
                [PlusOutlined, "Plus"],
                [EditOutlined, "Edit"],
                [DeleteOutlined, "Delete"],
                [EyeOutlined, "Eye"],
                [DownloadOutlined, "Download"],
                [UploadOutlined, "Upload"],
                [CheckCircleOutlined, "Check"],
                [CloseCircleOutlined, "Close"],
                [WarningOutlined, "Warning"],
                [InfoCircleOutlined, "Info"],
                [SettingOutlined, "Settings"],
                [DashboardOutlined, "Dashboard"],
                [CalendarOutlined, "Calendar"],
                ["Dollar"],
                [BookOutlined, "Book"],
                [BankOutlined, "Bank"],
                [GlobalOutlined, "Global"],
                [CrownOutlined, "Crown"],
                [SafetyCertificateOutlined, "Safety"],
                [ThunderboltOutlined, "Thunder"],
                [LinkOutlined, "Link"],
                [FileTextOutlined, "File"],
                [HeartOutlined, "Heart"],
                [StarOutlined, "Star"],
                [LockOutlined, "Lock"],
                [MailOutlined, "Mail"],
              ].map(([Icon, label]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <Tooltip title={label}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "var(--primary-light)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>
                      <Icon />
                    </div>
                  </Tooltip>
                  <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</Text>
                </div>
              ))}
            </Space>
          </Demo>

          <Demo label="Lucide Icons (used in sidebar nav)">
            <Space wrap size={20}>
              {[
                [GraduationCap, "Graduation"],
                [Users, "Users"],
                [BookOpen, "Book"],
                [Calendar, "Calendar"],
                [Bell, "Bell"],
                [Settings, "Settings"],
                [TrendingUp, "Trending"],
                [Award, "Award"],
                [CheckCircle, "Check"],
                [XCircle, "Close"],
                [Clock, "Clock"],
                [AlertTriangle, "Alert"],
              ].map(([Icon, label]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "rgba(var(--cyan-rgb),0.1)", color: "var(--cyan)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</Text>
                </div>
              ))}
            </Space>
          </Demo>
        </Section>

        {/* ══ 13. NAVIGATION ═════════════════════════════════════════ */}
        <Section id="navigation" title="Navigation">
          <Demo label="Breadcrumb">
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Breadcrumb
                separator={<RightOutlined style={{ fontSize: 10 }} />}
                items={[
                  { title: <><HomeOutlined /> Home</> },
                  { title: "School Admin" },
                  { title: "Students" },
                  { title: "Admission" },
                ]}
              />
              <Breadcrumb
                items={[
                  { title: <HomeOutlined /> },
                  { title: "Dashboard" },
                  { title: "Fee Management" },
                ]}
              />
            </Space>
          </Demo>

          <Demo label="Segmented Control">
            <Space direction="vertical" size={16}>
              <Segmented
                options={["All", "Active", "Pending", "Suspended"]}
                defaultValue="All"
              />
              <Segmented
                options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "Quarterly", value: "quarterly" },
                  { label: "Annual", value: "annual" },
                ]}
                defaultValue="monthly"
              />
            </Space>
          </Demo>

          <Demo label="Tabs">
            <Tabs defaultActiveKey="1">
              <TabPane tab="Overview" key="1">
                <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                  School overview content with KPIs and recent activity.
                </div>
              </TabPane>
              <TabPane tab="Students" key="2">
                <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                  Student list and management tools.
                </div>
              </TabPane>
              <TabPane tab="Staff" key="3">
                <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                  Staff roster and payroll overview.
                </div>
              </TabPane>
              <TabPane tab="Reports" key="4" disabled>
                Coming soon
              </TabPane>
            </Tabs>
          </Demo>

          <Demo label="Pagination">
            <Pagination defaultCurrent={1} total={256} pageSize={10} showSizeChanger showQuickJumper />
          </Demo>
        </Section>

        {/* ══ 14. DATA DISPLAY ═══════════════════════════════════════ */}
        <Section id="data" title="Data Display">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Demo label="Timeline — Activity Log">
                <Timeline
                  items={[
                    {
                      color: "var(--accent)",
                      children: (
                        <div>
                          <Text strong style={{ fontSize: 13 }}>New student admitted</Text>
                          <Text style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Aryan Sharma — Class 10-A</Text>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>2 min ago</Text>
                        </div>
                      ),
                    },
                    {
                      color: "var(--success)",
                      children: (
                        <div>
                          <Text strong style={{ fontSize: 13 }}>Fee collected</Text>
                          <Text style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>₹12,000 from Priya Verma</Text>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>25 min ago</Text>
                        </div>
                      ),
                    },
                    {
                      color: "var(--warning)",
                      children: (
                        <div>
                          <Text strong style={{ fontSize: 13 }}>Exam scheduled</Text>
                          <Text style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Mid-term — 15 Jan 2025</Text>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>1 hr ago</Text>
                        </div>
                      ),
                    },
                    {
                      color: "var(--danger)",
                      children: (
                        <div>
                          <Text strong style={{ fontSize: 13 }}>Attendance below threshold</Text>
                          <Text style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>Class 9-B — 68% this week</Text>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>3 hr ago</Text>
                        </div>
                      ),
                    },
                  ]}
                />
              </Demo>
            </Col>
            <Col xs={24} md={12}>
              <Demo label="Statistic Cards">
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic title="Fee Collected" value="₹42,85,000" valueStyle={{ color: "var(--success)", fontSize: 22 }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic title="Attendance" value={94.2} suffix="%" valueStyle={{ color: "var(--accent)", fontSize: 22 }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic title="Students" value={1284} prefix={<TeamOutlined />} valueStyle={{ fontSize: 22 }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic title="Teachers" value={86} prefix={<UserOutlined />} valueStyle={{ color: "var(--warning)", fontSize: 22 }} />
                    </Card>
                  </Col>
                </Row>
              </Demo>

              <Demo label="Avatar + User Info Pattern">
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  {[
                    { name: "Aryan Sharma", role: "Student", class: "Class 10-A", color: "var(--accent)" },
                    { name: "Priya Verma",  role: "Teacher",  class: "Mathematics", color: "var(--success)" },
                    { name: "Rahul Singh",  role: "Parent",   class: "2 children",  color: "var(--warning)" },
                  ].map(({ name, role, class: cls, color }) => (
                    <div key={name} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10, background: "var(--surface-soft)",
                    }}>
                      <Space>
                        <Avatar size={40} style={{
                          background: `color-mix(in srgb, ${color} 13%, transparent)`, color, fontWeight: 700, fontSize: 15,
                          border: `2px solid color-mix(in srgb, ${color} 25%, transparent)`,
                        }}>
                          {name[0]}
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: 13, display: "block" }}>{name}</Text>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{cls}</Text>
                        </div>
                      </Space>
                      <Tag style={{
                        borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: `color-mix(in srgb, ${color} 8%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
                      }}>
                        {role}
                      </Tag>
                    </div>
                  ))}
                </Space>
              </Demo>
            </Col>
          </Row>

          <Demo label="Divider Styles">
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              <Divider />
              <Divider dashed />
              <Divider orientation="left">Section Label</Divider>
              <Divider orientation="center" style={{ color: "var(--primary)" }}>Ant Design Primary</Divider>
              <Divider orientation="right" dashed>Right Aligned</Divider>
            </Space>
          </Demo>
        </Section>

        {/* Footer */}
        <div style={{
          marginTop: 64, paddingTop: 32, borderTop: "1px solid var(--border-muted)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <Text strong style={{ color: "var(--text-primary)" }}>School Management System — Style Guide</Text>
            <Text style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Built with React 19 · Ant Design v5 · Tailwind CSS · Lucide React
            </Text>
          </div>
          <Space size={8}>
            <Tag color="purple" style={{ borderRadius: 99 }}>Primary: #14B8A6</Tag>
            <Tag color="cyan"   style={{ borderRadius: 99 }}>Secondary: #06b6d4</Tag>
            <Tag color="success" style={{ borderRadius: 99 }}>Font: Noto Sans</Tag>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default StyleGuide;

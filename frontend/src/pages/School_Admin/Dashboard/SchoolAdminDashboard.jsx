import React, { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { useGetSchoolAdminDashboardAnalyticsQuery } from "../../../services/schoolDashboardApi";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Skeleton,
  Tag,
  Breadcrumb,
} from "antd";
import {
  DashboardOutlined,
  HomeOutlined,
  RiseOutlined,
  TeamOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../context/ThemeContext.jsx";

// ── Lazy components ──
const SummaryCards      = lazy(() => import("./components/SummaryCards.jsx"));
const IncomeAnalysis    = lazy(() => import("./components/IncomeAnalysis.jsx"));
const EmployeeStructure = lazy(() => import("./components/EmployeeStructure.jsx"));
const EmployeePerformance = lazy(() => import("./components/EmployeePerformance.jsx"));

const { Title, Text } = Typography;

/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
const tokens = (isDark) => ({
  pageBg:       "var(--surface-page)",
  cardBg:       isDark ? "#141414" : "#ffffff",
  cardBorder:   isDark ? "#1f1f1f" : "#f0f0f0",
  sectionBg:    isDark ? "#0f0f0f" : "#f8faff",
  sectionBorder:isDark ? "#1f1f1f" : "#e8eef8",
  textPrimary:  isDark ? "#e8e8e8" : "#1a1a2e",
  textSecondary:isDark ? "#6b7280" : "#9ca3af",
  accent:       isDark ? "#4da3ff" : "#1677ff",
  shadow:       isDark
    ? "0 2px 12px rgba(0,0,0,0.4)"
    : "0 2px 12px rgba(0,0,0,0.06)",
  shadowHover:  isDark
    ? "0 6px 24px rgba(0,0,0,0.5)"
    : "0 6px 24px rgba(0,0,0,0.1)",
});

/* ─────────────────────────────────────────
   Skeleton fallbacks — shaped like their
   real components so layout doesn't jump.
───────────────────────────────────────── */
const CardSkeleton = ({ height = 120, isDark }) => (
  <div
    style={{
      borderRadius: 12,
      padding: 20,
      background: tokens(isDark).cardBg,
      border: `1px solid ${tokens(isDark).cardBorder}`,
      height,
    }}
  >
    <Skeleton active paragraph={{ rows: 2 }} title={{ width: "50%" }} />
  </div>
);

const ChartSkeleton = ({ height = 280, isDark }) => (
  <div
    style={{
      borderRadius: 12,
      padding: 20,
      background: tokens(isDark).cardBg,
      border: `1px solid ${tokens(isDark).cardBorder}`,
    }}
  >
    <Skeleton active title={{ width: "40%" }} paragraph={false} />
    <Skeleton.Node
      active
      style={{ width: "100%", height, marginTop: 16, borderRadius: 8 }}
    />
  </div>
);

/* ─────────────────────────────────────────
   Section header — thin labelled divider
   with an icon and optional tag.
───────────────────────────────────────── */
const SectionHeader = ({ icon, title, tag, tagColor = "blue", isDark }) => {
  const t = tokens(isDark);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isDark ? "rgba(77,163,255,0.1)" : "rgba(22,119,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, {
          style: { fontSize: 15, color: t.accent },
        })}
      </div>
      <Text
        strong
        style={{ fontSize: 13, color: t.textPrimary, letterSpacing: "0.01em" }}
      >
        {title}
      </Text>
      {tag && (
        <Tag color={tagColor} style={{ marginLeft: "auto", fontSize: 11, borderRadius: 99 }}>
          {tag}
        </Tag>
      )}
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(90deg, ${t.sectionBorder} 0%, transparent 100%)`,
          marginLeft: tag ? 0 : "auto",
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────
   Main dashboard
───────────────────────────────────────── */
const SchoolAdminDashboard = () => {
  const { isDark } = useTheme();
  const t = tokens(isDark);
  const schoolId = useSelector((state) => state?.auth?.user?.schoolId?._id || state?.auth?.user?.schoolId);
  const { data: analytics } = useGetSchoolAdminDashboardAnalyticsQuery(schoolId);

  return (
    <>
      <style>{`
        /* Card hover lift */
        .dash-card {
          transition: box-shadow 0.22s ease, transform 0.22s ease !important;
          border-radius: 12px !important;
        }
        .dash-card:hover {
          box-shadow: ${t.shadowHover} !important;
          transform: translateY(-1px);
        }

        /* Section panel */
        .dash-section {
          background: ${t.sectionBg};
          border: 1px solid ${t.sectionBorder};
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }

        /* Staggered fade-in for sections */
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-section:nth-child(1) { animation: dashFadeUp 0.3s ease 0.05s both; }
        .dash-section:nth-child(2) { animation: dashFadeUp 0.3s ease 0.12s both; }
        .dash-section:nth-child(3) { animation: dashFadeUp 0.3s ease 0.19s both; }
        .dash-section:nth-child(4) { animation: dashFadeUp 0.3s ease 0.26s both; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="dash-section" style={{ marginBottom: 20 }}>
        <Breadcrumb
          style={{ marginBottom: 12, fontSize: 12 }}
          items={[
            { href: "/dashboard", title: <HomeOutlined /> },
            { title: "School Dashboard" },
          ]}
        />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Space direction="vertical" size={2}>
            <Space align="center" size={10}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isDark ? "rgba(77,163,255,0.12)" : "rgba(22,119,255,0.09)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DashboardOutlined style={{ fontSize: 20, color: t.accent }} />
              </div>
              <Title level={4} style={{ margin: 0, color: t.textPrimary }}>
                School Dashboard
              </Title>
            </Space>
            <Text style={{ color: t.textSecondary, fontSize: 13, paddingLeft: 50 }}>
              Monitor school performance, finance and staff activity
            </Text>
          </Space>

          <Tag
            color={isDark ? "geekblue" : "blue"}
            style={{ borderRadius: 99, padding: "3px 10px", fontSize: 11, height: "fit-content" }}
          >
            Live Overview
          </Tag>
        </div>
      </div>

      {/* ── SUMMARY KPIs ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<RiseOutlined />}
          title="Key Metrics"
          tag="Today"
          isDark={isDark}
        />
        <Suspense
          fallback={
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map((i) => (
                <Col key={i} xs={24} sm={12} lg={6}>
                  <CardSkeleton height={100} isDark={isDark} />
                </Col>
              ))}
            </Row>
          }
        >
          <SummaryCards summary={analytics?.summary} />
        </Suspense>
      </div>

      {/* ── FINANCE ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<DollarOutlined />}
          title="Finance Overview"
          tag="This Month"
          tagColor="green"
          isDark={isDark}
        />

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Suspense fallback={<ChartSkeleton height={260} isDark={isDark} />}>
              <IncomeAnalysis data={analytics?.incomeAnalysis} />
            </Suspense>
          </Col>
        </Row>
      </div>

      {/* ── HR ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<TeamOutlined />}
          title="Human Resources"
          tag="Staff"
          tagColor="purple"
          isDark={isDark}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Suspense fallback={<ChartSkeleton height={280} isDark={isDark} />}>
              <EmployeeStructure data={analytics?.employeeStructure} />
            </Suspense>
          </Col>
          <Col xs={24} lg={16}>
            <Suspense fallback={<ChartSkeleton height={280} isDark={isDark} />}>
              <EmployeePerformance employees={analytics?.employeePerformance} />
            </Suspense>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SchoolAdminDashboard;
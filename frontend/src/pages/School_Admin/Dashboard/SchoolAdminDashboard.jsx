import React, { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { useGetSchoolAdminDashboardAnalyticsQuery } from "../../../services/schoolDashboardApi";
import {
  Row,
  Col,
  Typography,
  Space,
  Skeleton,
  Tag,
  Alert,
  Button,
} from "antd";
import {
  DashboardOutlined,
  RiseOutlined,
  TeamOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useTheme } from "../../../context/ThemeContext.jsx";
import PageHeader from "../../../components/layout/PageHeader.jsx";

// ── Lazy components ──
const SummaryCards      = lazy(() => import("./components/SummaryCards.jsx"));
const SalaryStatistics  = lazy(() => import("./components/SalaryStatistics.jsx"));
const TotalSalaryByUnit = lazy(() => import("./components/TotalSalaryByUnit.jsx"));
const IncomeAnalysis    = lazy(() => import("./components/IncomeAnalysis.jsx"));
const EmployeeStructure = lazy(() => import("./components/EmployeeStructure.jsx"));
const EmployeePerformance = lazy(() => import("./components/EmployeePerformance.jsx"));

const { Title, Text } = Typography;

/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
const tokens = (isDark) => ({
  pageBg:       "var(--surface-page)",
  cardBg:       isDark ? "#1A2235" : "#ffffff",
  cardBorder:   isDark ? "#2A3550" : "#E2E8F0",
  sectionBg:    isDark ? "#1A2235" : "#ffffff",
  sectionBorder:isDark ? "#2A3550" : "#E2E8F0",
  textPrimary:  isDark ? "#E8EDF7" : "#0F172A",
  textSecondary:isDark ? "#64748B" : "#94A3B8",
  accent:       isDark ? "#7FBAD6" : "#2563EB",
  accentBg:     isDark ? "rgba(219,234,254,0.12)" : "rgba(219,234,254,0.18)",
  shadow:       isDark
    ? "0 2px 12px rgba(0,0,0,0.4)"
    : "0 2px 8px rgba(37,99,235,0.07), 0 4px 20px rgba(37,99,235,0.05)",
  shadowHover:  isDark
    ? "0 6px 24px rgba(0,0,0,0.5)"
    : "0 6px 24px rgba(37,99,235,0.14)",
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

const SectionErrorBanner = ({ message, onRetry }) => (
  <Alert
    type="error"
    showIcon
    message="Failed to load data"
    description={message || "An unexpected error occurred. Please try again."}
    action={
      onRetry && (
        <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
          Retry
        </Button>
      )
    }
    style={{ borderRadius: 10, marginBottom: 8 }}
  />
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
          background: t.accentBg,
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
  const schoolId = useSelector(
    (state) =>
      state?.auth?.user?.school?._id ||
      state?.auth?.user?.schoolId?._id ||
      state?.auth?.user?.schoolId
  );
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSchoolAdminDashboardAnalyticsQuery(schoolId, { skip: !schoolId });

  return (
    <>
      <PageHeader
        title="School Dashboard"
        subtitle="Monitor school performance, finance and staff activity"
        icon={<DashboardOutlined />}
        extra={
          <Tag
            color="purple"
            style={{ borderRadius: 99, padding: "3px 10px", fontSize: 11 }}
          >
            Live Overview
          </Tag>
        }
      />

    <div style={{ padding: "clamp(12px, 3vw, 24px)" }}>
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

      {/* ── API error banner ── */}
      {isError && (
        <SectionErrorBanner
          message={error?.data?.message || error?.message}
          onRetry={refetch}
        />
      )}

      {/* ── SUMMARY KPIs ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<RiseOutlined />}
          title="Key Metrics"
          tag="Today"
          isDark={isDark}
        />
        {isLoading ? (
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={24} sm={12} lg={6}>
                <CardSkeleton height={100} isDark={isDark} />
              </Col>
            ))}
          </Row>
        ) : (
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
        )}
      </div>

      {/* ── FINANCE ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<RupeeIcon />}
          title="Finance Overview"
          tag="This Month"
          tagColor="green"
          isDark={isDark}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {isLoading ? (
              <ChartSkeleton height={260} isDark={isDark} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={260} isDark={isDark} />}>
                <SalaryStatistics stats={analytics?.salaryStatistics} />
              </Suspense>
            )}
          </Col>
          <Col xs={24} lg={12}>
            {isLoading ? (
              <ChartSkeleton height={260} isDark={isDark} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={260} isDark={isDark} />}>
                <IncomeAnalysis data={analytics?.incomeAnalysis} />
              </Suspense>
            )}
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            {isLoading ? (
              <ChartSkeleton height={180} isDark={isDark} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={180} isDark={isDark} />}>
                <TotalSalaryByUnit data={analytics?.salaryByUnit} />
              </Suspense>
            )}
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
            {isLoading ? (
              <ChartSkeleton height={280} isDark={isDark} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={280} isDark={isDark} />}>
                <EmployeeStructure data={analytics?.employeeStructure} />
              </Suspense>
            )}
          </Col>
          <Col xs={24} lg={16}>
            {isLoading ? (
              <ChartSkeleton height={280} isDark={isDark} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={280} isDark={isDark} />}>
                <EmployeePerformance employees={analytics?.employeePerformance} />
              </Suspense>
            )}
          </Col>
        </Row>
      </div>
      </div>
    </>
  );
};

export default SchoolAdminDashboard;
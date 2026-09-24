import React, { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
  RightOutlined,
  UserAddOutlined,
  ScheduleOutlined,
  CheckSquareOutlined,
  NotificationOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import MyAttendanceSection from "../../../components/attendance/MyAttendanceSection";

// ── Lazy components ──
const SummaryCards      = lazy(() => import("./components/SummaryCards.jsx"));
const SalaryStatistics  = lazy(() => import("./components/SalaryStatistics.jsx"));
const TotalSalaryByUnit = lazy(() => import("./components/TotalSalaryByUnit.jsx"));
const IncomeAnalysis    = lazy(() => import("./components/IncomeAnalysis.jsx"));
const EmployeeStructure = lazy(() => import("./components/EmployeeStructure.jsx"));
const EmployeePerformance = lazy(() => import("./components/EmployeePerformance.jsx"));

const { Text } = Typography;

/* ─────────────────────────────────────────
   Where the numbers lead
   ─────────────────────────────────────────
   School Admin, Principal and Vice Principal share this screen but not their menus, so each
   card and button points at the page that exists for the role actually looking at it. A key
   left out here simply renders as a plain, unclickable card.
───────────────────────────────────────── */
const ROLE_LINKS = {
  schooladmin: {
    newAdmissions: "schooladmin/admission/inquiry",
    totalStudents: "schooladmin/studentList",
    totalTeachers: "schooladmin/teacher",
    totalIncome: "schooladmin/fees/reports",
    finance: "schooladmin/fees/reports",
    staff: "schooladmin/teacher",
  },
  principal: {
    totalStudents: "principal/students",
    totalTeachers: "principal/staff",
    totalIncome: "principal/fees/reports",
    finance: "principal/fees/reports",
    staff: "principal/staff",
  },
  viceprincipal: {
    totalStudents: "viceprincipal/attendance/students",
    totalTeachers: "viceprincipal/attendance/staff",
    totalIncome: "viceprincipal/fees/reports",
    finance: "viceprincipal/fees/reports",
    staff: "viceprincipal/attendance/staff",
  },
};

const ROLE_ACTIONS = {
  schooladmin: [
    { label: "Collect Fees", to: "schooladmin/fees/collect", icon: <RupeeIcon /> },
    { label: "New Admission", to: "schooladmin/admission", icon: <UserAddOutlined /> },
    { label: "Mark Attendance", to: "schooladmin/attendance/mark", icon: <CheckSquareOutlined /> },
    { label: "Timetable", to: "schooladmin/timetable", icon: <ScheduleOutlined /> },
    { label: "Send Notice", to: "schooladmin/circulars", icon: <NotificationOutlined /> },
  ],
  principal: [
    { label: "Mark Attendance", to: "principal/attendance/mark", icon: <CheckSquareOutlined /> },
    { label: "Timetable", to: "principal/timetable", icon: <ScheduleOutlined /> },
    { label: "Circulars", to: "principal/circulars", icon: <NotificationOutlined /> },
    { label: "Fee Reports", to: "principal/fees/reports", icon: <RupeeIcon /> },
    { label: "Academic Reports", to: "principal/reports/academic", icon: <FileTextOutlined /> },
  ],
  viceprincipal: [
    { label: "Attendance", to: "viceprincipal/attendance/table", icon: <CheckSquareOutlined /> },
    { label: "Timetable", to: "viceprincipal/timetable", icon: <ScheduleOutlined /> },
    { label: "Exams", to: "viceprincipal/exams", icon: <FileTextOutlined /> },
    { label: "Reports", to: "viceprincipal/reports", icon: <FileTextOutlined /> },
  ],
};

/* Row of one-tap shortcuts — the jobs this role opens the dashboard to do. */
const QuickActions = ({ actions, onGo }) => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {actions.map((a) => (
      <Button
        key={a.to}
        onClick={() => onGo(a.to)}
        icon={a.icon}
        style={{ height: 40, borderRadius: 10, fontWeight: 600 }}
      >
        {a.label}
      </Button>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
// Shared design tokens (frontend/src/styles/main.scss) — replaces a local
// isDark-branched hex object that duplicated what these CSS vars already do.
const tokens = {
  pageBg:       "var(--surface-page)",
  cardBg:       "var(--surface)",
  cardBorder:   "var(--border)",
  sectionBg:    "var(--surface)",
  sectionBorder:"var(--border)",
  textPrimary:  "var(--text)",
  textSecondary:"var(--text-muted)",
  accent:       "var(--primary)",
  accentBg:     "var(--primary-light)",
};

/* ─────────────────────────────────────────
   Skeleton fallbacks — shaped like their
   real components so layout doesn't jump.
───────────────────────────────────────── */
const CardSkeleton = ({ height = 120 }) => (
  <div
    style={{
      borderRadius: 12,
      padding: 20,
      background: tokens.cardBg,
      border: `1px solid ${tokens.cardBorder}`,
      height,
    }}
  >
    <Skeleton active paragraph={{ rows: 2 }} title={{ width: "50%" }} />
  </div>
);

const ChartSkeleton = ({ height = 280 }) => (
  <div
    style={{
      borderRadius: 12,
      padding: 20,
      background: tokens.cardBg,
      border: `1px solid ${tokens.cardBorder}`,
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
const SectionHeader = ({ icon, title, tag, tagColor = "blue", linkLabel, onLink }) => {
  const t = tokens;
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
        <Tag color={tagColor} style={{ fontSize: 11, borderRadius: 99, marginInlineEnd: 0 }}>
          {tag}
        </Tag>
      )}
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(90deg, ${t.sectionBorder} 0%, transparent 100%)`,
        }}
      />
      {linkLabel && onLink && (
        <Button type="link" size="small" onClick={onLink} style={{ padding: 0, height: "auto", fontSize: 12 }}>
          {linkLabel} <RightOutlined style={{ fontSize: 9 }} />
        </Button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   Main dashboard
───────────────────────────────────────── */
const SchoolAdminDashboard = () => {
  // Principal and Vice Principal share this dashboard and check in like other staff; a School Admin
  // has no My Attendance page, so the section is theirs only.
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const roleSegment = pathname.split("/")[2] || "schooladmin";
  const links = ROLE_LINKS[roleSegment] || ROLE_LINKS.schooladmin;
  const actions = ROLE_ACTIONS[roleSegment] || ROLE_ACTIONS.schooladmin;
  const go = (to) => navigate(`/dashboard/${to}`);
  const ownsSelfAttendance = ["principal", "viceprincipal"].includes(roleSegment);
  const schoolId = useSelector(
    (state) =>
      state?.auth?.user?.school?._id ||
      state?.auth?.user?.schoolId?._id ||
      state?.auth?.user?.schoolId
  );
  const {
    data: analytics,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fulfilledTimeStamp,
  } = useGetSchoolAdminDashboardAnalyticsQuery(schoolId, { skip: !schoolId });

  const updatedAt = fulfilledTimeStamp
    ? new Date(fulfilledTimeStamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <PageHeader
        title="School Dashboard"
        subtitle="Monitor school performance, finance and staff activity"
        icon={<DashboardOutlined />}
        extra={
          <Space size={10} wrap>
            {updatedAt && (
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Updated {updatedAt}</Text>
            )}
            <Button icon={<ReloadOutlined />} onClick={refetch} loading={isFetching}>
              Refresh
            </Button>
          </Space>
        }
      />
      {ownsSelfAttendance && <MyAttendanceSection style={{ marginTop: 16 }} />}

    <div style={{ padding: "clamp(12px, 3vw, 24px)" }}>

      {/* ── API error banner ── */}
      {isError && (
        <SectionErrorBanner
          message={error?.data?.message || error?.message}
          onRetry={refetch}
        />
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="dash-section">
        <SectionHeader icon={<ScheduleOutlined />} title="Quick Actions" />
        <QuickActions actions={actions} onGo={go} />
      </div>

      {/* ── SUMMARY KPIs ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<RiseOutlined />}
          title="Key Metrics"
          tag="This month"
                 />
        {isLoading ? (
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={24} sm={12} lg={6}>
                <CardSkeleton height={100} />
              </Col>
            ))}
          </Row>
        ) : (
          <Suspense
            fallback={
              <Row gutter={[16, 16]}>
                {[1, 2, 3, 4].map((i) => (
                  <Col key={i} xs={24} sm={12} lg={6}>
                    <CardSkeleton height={100} />
                  </Col>
                ))}
              </Row>
            }
          >
            <SummaryCards summary={analytics?.summary} links={links} />
          </Suspense>
        )}
      </div>

      {/* ── FINANCE ── */}
      <div className="dash-section">
        <SectionHeader
          icon={<RupeeIcon />}
          title="Finance Overview"
          tag="Last 6 months"
          tagColor="green"
          linkLabel="Fee reports"
          onLink={links.finance ? () => go(links.finance) : undefined}
                 />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {isLoading ? (
              <ChartSkeleton height={260} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={260} />}>
                <SalaryStatistics stats={analytics?.salaryStatistics} />
              </Suspense>
            )}
          </Col>
          <Col xs={24} lg={12}>
            {isLoading ? (
              <ChartSkeleton height={260} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={260} />}>
                <IncomeAnalysis data={analytics?.incomeAnalysis} />
              </Suspense>
            )}
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="u-mt-4">
          <Col span={24}>
            {isLoading ? (
              <ChartSkeleton height={180} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={180} />}>
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
          linkLabel="All staff"
          onLink={links.staff ? () => go(links.staff) : undefined}
                 />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            {isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={280} />}>
                <EmployeeStructure data={analytics?.employeeStructure} />
              </Suspense>
            )}
          </Col>
          <Col xs={24} lg={16}>
            {isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={280} />}>
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
import React from "react";
import { Empty, List, Button } from "antd";
import {
  ReloadOutlined, BarChartOutlined, DollarCircleOutlined,
  CalendarOutlined, DashboardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetRoleDashboardOverviewQuery } from "../../services/schoolDashboardApi";
import PageHeader from "../layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, emptyState,
} from "../../styles/pageStyles";

const STAT_COLORS = ["#2563EB", "#14B8A6", "#22C55E", "#F59E0B", "#7C3AED", "#EF4444"];

const formatMetricValue = (metric = {}) => {
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(metric.value || 0));
  }

  const value = Number.isFinite(metric.value) || typeof metric.value === "number"
    ? metric.value
    : metric.value || 0;
  return metric.suffix ? `${value}${metric.suffix}` : value;
};

const MetricSkeleton = ({ color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={{ ...iconWell(color, 42), opacity: 0.4 }} />
    <div style={{ flex: 1 }}>
      <div style={{ height: 10, width: "50%", borderRadius: 4, background: "var(--surface-soft)", marginBottom: 8 }} />
      <div style={{ height: 18, width: "35%", borderRadius: 4, background: "var(--surface-soft)" }} />
    </div>
  </div>
);

const MetricCard = ({ label, value, color, isCurrency }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>
      {isCurrency ? <DollarCircleOutlined /> : <BarChartOutlined />}
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const RoleDashboardOverview = ({ titlePrefix = "Dashboard" }) => {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRoleDashboardOverviewQuery();

  const loading = isLoading || isFetching;

  const metrics = data?.metrics || [];
  const upcomingExams = data?.lists?.upcomingExams || [];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title={titlePrefix}
        subtitle="Live overview based on your role permissions and school data."
        icon={<DashboardOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} loading={loading} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      <div style={{ marginTop: 20 }}>
        {isError ? (
          <div style={{
            ...sectionPanel,
            borderColor: "rgba(254,226,226,0.6)",
            background: "rgba(254,226,226,0.12)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>Failed to load dashboard</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {error?.data?.message || error?.message || "An unexpected error occurred. Please try again."}
              </div>
            </div>
            <Button danger icon={<ReloadOutlined />} onClick={refetch}>Retry</Button>
          </div>
        ) : (
          <>
            <div style={statGrid(190)}>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => <MetricSkeleton key={i} color={STAT_COLORS[i % STAT_COLORS.length]} />)
              ) : metrics.length ? (
                metrics.map((metric, i) => (
                  <MetricCard
                    key={metric.key}
                    label={metric.label}
                    value={formatMetricValue(metric)}
                    color={STAT_COLORS[i % STAT_COLORS.length]}
                    isCurrency={metric.format === "currency"}
                  />
                ))
              ) : (
                <div style={{ ...emptyState, gridColumn: "1 / -1" }}>
                  <Empty description="No dashboard metrics available yet" />
                </div>
              )}
            </div>

            {!loading && upcomingExams.length > 0 && (
              <div style={{ ...sectionPanel, marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <CalendarOutlined style={{ color: "var(--primary)" }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Upcoming Exams</span>
                </div>
                <List
                  dataSource={upcomingExams}
                  renderItem={(exam) => (
                    <List.Item style={{ borderBottom: "1px solid var(--border-muted)", padding: "10px 0" }}>
                      <List.Item.Meta
                        title={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{exam.title || "Exam"}</span>}
                        description={
                          <span style={{ color: "var(--text-muted)" }}>
                            {exam.date ? dayjs(exam.date).format("DD MMM YYYY") : "Date not assigned"}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RoleDashboardOverview;

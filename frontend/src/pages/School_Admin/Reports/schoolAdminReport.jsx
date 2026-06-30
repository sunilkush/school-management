import React, { useEffect, useState } from "react";
import { Alert, Empty, Flex, Select, Skeleton, Tag, Typography } from "antd";
import {
  BankOutlined, BarChartOutlined, PieChartOutlined,
  SolutionOutlined, TeamOutlined, UserOutlined,
} from "@ant-design/icons";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAcademicYears, fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { fetchSchoolReports } from "../../../features/reportSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, statGrid } from "../../../styles/pageStyles.js";
import { useTheme } from "../../../context/ThemeContext";

const { Text } = Typography;

const PALETTE = ["#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#8B5CF6"];
const GENDER_HEX = { Male: "#2563EB", Female: "#EC4899", Other: "#94A3B8" };

/* ── Custom Tooltip ─────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  return (
    <div style={{
      background: isDark ? "#1e293b" : "#fff",
      border: "1px solid var(--border-muted)", borderRadius: 10,
      padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: fill || "#2563EB", lineHeight: 1 }}>{value}</div>
    </div>
  );
};

/* ── Section header ─────────────────────────────────────────────────── */
const SectionHd = ({ icon, title, color, extra }) => (
  <Flex align="center" justify="space-between" style={{ marginBottom: 18 }}>
    <Flex align="center" gap={10}>
      <div style={iconWell(color, 36)}>{React.cloneElement(icon, { style: { fontSize: 14 } })}</div>
      <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>{title}</Text>
    </Flex>
    {extra}
  </Flex>
);

/* ── Empty chart placeholder ────────────────────────────────────────── */
const NoData = () => (
  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: "var(--text-muted)", fontSize: 12 }}>No data</span>} />
  </div>
);

/* ── Skeleton loading cards ─────────────────────────────────────────── */
const LoadingSkeleton = () => (
  <div>
    <div style={{ ...statGrid(160), marginBottom: 20 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ ...sectionPanel, padding: "18px 20px" }}>
          <Skeleton active avatar paragraph={{ rows: 1 }} />
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 16 }}>
      {[1, 2].map((i) => (
        <div key={i} style={sectionPanel}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
      {[1, 2].map((i) => (
        <div key={i} style={sectionPanel}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
const SchoolAdminReport = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { schoolReports, loading, error } = useSelector((s) => s.reports || {});
  const { academicYears = [], activeYear } = useSelector((s) => s.academicYear || {});
  const { user } = useSelector((s) => s.auth) || {};

  const [selectedYearId, setSelectedYearId] = useState();
  const [accessError, setAccessError] = useState("");

  const roleName = user?.role?.name || "";
  const schoolId = user?.school?._id;
  const isAdmin  = roleName === "School Admin";

  useEffect(() => {
    if (!user)      { setAccessError("User session not found. Please login again."); return; }
    if (!isAdmin)   { setAccessError("This page is only available for School Admin users."); return; }
    if (!schoolId)  { setAccessError("School is not mapped to this account."); return; }
    setAccessError("");
    dispatch(fetchAllAcademicYears(schoolId));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [user, dispatch, isAdmin, schoolId]);

  useEffect(() => {
    if (!activeYear?._id || selectedYearId) return;
    setSelectedYearId(activeYear._id);
  }, [activeYear, selectedYearId]);

  useEffect(() => {
    if (!isAdmin || !schoolId || !selectedYearId) return;
    dispatch(fetchSchoolReports({ schoolId, academicYearId: selectedYearId }));
  }, [dispatch, isAdmin, schoolId, selectedYearId]);

  /* ── Data transforms ─────────────────────────────────────────────── */
  const summary     = schoolReports?.summary || {};
  const roleWise    = (schoolReports?.roleWise    || []).map((r) => ({ name: r._id || "—", count: r.count }));
  const classWise   = (schoolReports?.classWise   || []).map((r) => ({ name: r._id || "—", count: r.count }));
  const sectionWise = (schoolReports?.sectionWise || []).map((r) => ({ name: r._id || "—", count: r.count }));
  const genderStats = (schoolReports?.genderStats || []).map((r) => ({ name: r._id || "Unknown", count: r.count }));

  const KPI = [
    { label: "School Admins", value: summary.adminCount   || 0, color: "#7C3AED", icon: <BankOutlined /> },
    { label: "Teachers",      value: summary.teacherCount || 0, color: "#2563EB", icon: <SolutionOutlined /> },
    { label: "Students",      value: summary.studentCount || 0, color: "#10B981", icon: <TeamOutlined /> },
    { label: "Parents",       value: summary.parentCount  || 0, color: "#F59E0B", icon: <UserOutlined /> },
  ];

  const hasData  = !accessError && !loading && !error && schoolReports?.academicYear;
  const axisClr  = isDark ? "#64748B" : "#94A3B8";
  const gridClr  = isDark ? "#334155" : "#E2E8F0";
  const cursorBg = isDark ? "#334155" : "#F1F5F9";

  const tipContent = (props) => <ChartTip {...props} isDark={isDark} />;
  const legendFmt  = (value) => <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{value}</span>;

  return (
    <>
      <PageHeader
        title="School Reports"
        subtitle="Enrollment analytics, user distribution and academic overview"
        icon={<BarChartOutlined />}
        extra={
          !accessError && (
            <Flex align="center" gap={8} wrap="wrap">
              <Text type="secondary" style={{ fontSize: 13 }}>Academic Year:</Text>
              <Select
                value={selectedYearId}
                onChange={setSelectedYearId}
                placeholder="Select year"
                style={{ width: 200 }}
                options={academicYears.map((y) => ({
                  label: `${y.name}${y.isActive ? " (Active)" : ""}`,
                  value: y._id,
                }))}
              />
              {schoolReports?.academicYear && (
                <Tag color="blue" style={{ borderRadius: 99 }}>{schoolReports.academicYear}</Tag>
              )}
            </Flex>
          )
        }
      />

      <div style={pageWrapper}>
        {/* ── Access / error alerts ── */}
        {accessError && (
          <Alert type="warning" message={accessError} showIcon style={{ borderRadius: 12, marginBottom: 20 }} />
        )}
        {!accessError && !loading && error && (
          <Alert type="error" message={error} showIcon style={{ borderRadius: 12 }} />
        )}

        {/* ── Loading skeleton ── */}
        {!accessError && loading && <LoadingSkeleton />}

        {/* ── No data ── */}
        {!accessError && !loading && !error && !schoolReports?.academicYear && (
          <div style={{ ...sectionPanel, textAlign: "center", padding: "56px 24px" }}>
            <Empty description="No report data available for the selected year" />
          </div>
        )}

        {hasData && (
          <>
            {/* ── KPI Cards ── */}
            <div style={{ ...statGrid(160), marginBottom: 20 }}>
              {KPI.map((k) => (
                <div key={k.label} style={{
                  padding: "18px 20px", background: "var(--surface)", borderRadius: 14,
                  border: "1px solid var(--border-muted)", borderLeft: `4px solid ${k.color}`,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={iconWell(k.color, 44)}>
                    {React.cloneElement(k.icon, { style: { fontSize: 18 } })}
                  </div>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {k.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 6 }}>
                      {k.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Distribution Charts ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 16 }}>
              {/* Role Distribution — Donut */}
              <div style={sectionPanel}>
                <SectionHd icon={<PieChartOutlined />} title="Role Distribution" color="#7C3AED"
                  extra={<Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{roleWise.length} roles</Text>}
                />
                {roleWise.length === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={roleWise} dataKey="count" nameKey="name"
                        innerRadius={68} outerRadius={100} paddingAngle={2}
                      >
                        {roleWise.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={tipContent} />
                      <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gender Distribution — Donut */}
              <div style={sectionPanel}>
                <SectionHd icon={<PieChartOutlined />} title="Gender Distribution" color="#2563EB"
                  extra={
                    <Flex gap={6}>
                      {genderStats.map((g, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 10px",
                          background: `${GENDER_HEX[g.name] || PALETTE[i]}18`,
                          color: GENDER_HEX[g.name] || PALETTE[i],
                        }}>
                          {g.name}: {g.count}
                        </span>
                      ))}
                    </Flex>
                  }
                />
                {genderStats.length === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={genderStats} dataKey="count" nameKey="name"
                        innerRadius={68} outerRadius={100} paddingAngle={2}
                      >
                        {genderStats.map((entry, i) => (
                          <Cell key={i} fill={GENDER_HEX[entry.name] || PALETTE[i % PALETTE.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={tipContent} />
                      <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Enrollment Charts ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {/* Class-wise — Horizontal Bar */}
              <div style={sectionPanel}>
                <SectionHd icon={<BarChartOutlined />} title="Class-wise Enrollment" color="#10B981"
                  extra={<Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{classWise.length} classes · {classWise.reduce((s, c) => s + c.count, 0)} students</Text>}
                />
                {classWise.length === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height={Math.min(Math.max(200, classWise.length * 38), 420)}>
                    <BarChart
                      layout="vertical" data={classWise}
                      margin={{ top: 0, right: 28, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridClr} horizontal={false} />
                      <XAxis
                        type="number" tick={{ fontSize: 11, fill: axisClr }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        type="category" dataKey="name" width={64}
                        tick={{ fontSize: 11, fill: axisClr }} axisLine={false} tickLine={false}
                      />
                      <Tooltip content={tipContent} cursor={{ fill: cursorBg }} />
                      <Bar dataKey="count" name="Students" fill="#10B981" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {classWise.map((_, i) => (
                          <Cell key={i} fill={`${["#10B981", "#0EA5E9", "#06B6D4", "#14B8A6"][i % 4]}`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Section-wise — Horizontal Bar */}
              <div style={sectionPanel}>
                <SectionHd icon={<BarChartOutlined />} title="Section-wise Enrollment" color="#F59E0B"
                  extra={<Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{sectionWise.length} sections · {sectionWise.reduce((s, c) => s + c.count, 0)} students</Text>}
                />
                {sectionWise.length === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height={Math.min(Math.max(200, sectionWise.length * 38), 420)}>
                    <BarChart
                      layout="vertical" data={sectionWise}
                      margin={{ top: 0, right: 28, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridClr} horizontal={false} />
                      <XAxis
                        type="number" tick={{ fontSize: 11, fill: axisClr }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        type="category" dataKey="name" width={64}
                        tick={{ fontSize: 11, fill: axisClr }} axisLine={false} tickLine={false}
                      />
                      <Tooltip content={tipContent} cursor={{ fill: cursorBg }} />
                      <Bar dataKey="count" name="Students" fill="#F59E0B" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {sectionWise.map((_, i) => (
                          <Cell key={i} fill={`${["#F59E0B", "#FB923C", "#FBBF24", "#FCD34D"][i % 4]}`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SchoolAdminReport;

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Select, Input, Empty, Drawer, Spin, Button, message } from "antd";
import {
  BankOutlined, SearchOutlined, CheckCircleOutlined, StopOutlined,
  ScheduleOutlined, RiseOutlined, EyeOutlined, EnvironmentOutlined,
  TeamOutlined, SolutionOutlined, BookOutlined, UserOutlined,
} from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchFinanceSummary, fetchAttendanceSummary } from "../../../features/analyticsSlice";
import { fetchSchoolReports } from "../../../features/reportSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  toolbarRow, tableContainer, tableHeadCss, avatarStyle, modalTitle,
} from "../../../styles/pageStyles";

const formatCurrency = (n = 0) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2].map((y) => ({ label: `FY ${y}-${String(y + 1).slice(-2)}`, value: y }));
})();

/**
 * Cross-school comparison dashboard for Super Admin — complements the
 * single-school drill-down at "School Reports" by showing every school
 * side by side on status, today's attendance, and revenue collected, with
 * a "View Full Report" drawer that pulls together everything about
 * whichever school is selected (headcounts, attendance, finance, plan).
 */
const SchoolWiseReports = () => {
  const dispatch = useDispatch();
  const { schools = [], loading: schoolsLoading } = useSelector((s) => s.school || {});
  const { finance, attendance, loading } = useSelector((s) => s.analytics || {});
  const { schoolReports } = useSelector((s) => s.reports || {});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [year, setYear] = useState(YEAR_OPTIONS[0].value);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportSchool, setReportSchool] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFinance, setReportFinance] = useState(null);
  const [reportAttendance, setReportAttendance] = useState(null);
  const [reportYear, setReportYear] = useState(null);

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchAttendanceSummary());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFinanceSummary({ year }));
  }, [dispatch, year]);

  const financeMap = useMemo(() => {
    const map = new Map();
    (finance?.topSchools || []).forEach((row) => map.set(String(row._id), row));
    return map;
  }, [finance]);

  const attendanceMap = useMemo(() => {
    const map = new Map();
    (attendance?.schoolStats || []).forEach((row) => map.set(String(row.schoolId), row));
    return map;
  }, [attendance]);

  const rows = useMemo(() => {
    return schools.map((school) => {
      const fin = financeMap.get(String(school._id));
      const att = attendanceMap.get(String(school._id));
      return {
        key: school._id,
        name: school.name,
        address: school.address,
        isActive: school.isActive,
        boards: (school.boards || []).map((b) => b.name).filter(Boolean),
        plan: school.subscriptionPlan || null,
        revenue: fin?.totalCollected || 0,
        paymentCount: fin?.paymentCount || 0,
        attendanceRate: att ? att.attendanceRate : null,
      };
    });
  }, [schools, financeMap, attendanceMap]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchSearch = !keyword || row.name?.toLowerCase().includes(keyword);
      const matchStatus = !statusFilter || (statusFilter === "active" ? row.isActive : !row.isActive);
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const totalSchools = rows.length;
    const activeSchools = rows.filter((r) => r.isActive).length;
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const withAttendance = rows.filter((r) => r.attendanceRate !== null);
    const avgAttendance = withAttendance.length
      ? Math.round(withAttendance.reduce((sum, r) => sum + r.attendanceRate, 0) / withAttendance.length)
      : 0;
    return { totalSchools, activeSchools, totalRevenue, avgAttendance };
  }, [rows]);

  // Pull together everything about one school: headcounts (via the same
  // endpoint "School Reports" uses), today's attendance, and this FY's
  // revenue — fetched directly (not through the shared analytics slice)
  // so it can't clobber the comparison table's all-schools data above.
  const openFullReport = async (row) => {
    setReportSchool(row);
    setReportOpen(true);
    setReportLoading(true);
    setReportFinance(null);
    setReportAttendance(null);
    setReportYear(year);
    try {
      const activeYear = await dispatch(fetchActiveAcademicYear(row.key)).unwrap().catch(() => null);
      if (activeYear?._id) {
        dispatch(fetchSchoolReports({ schoolId: row.key, academicYearId: activeYear._id }));
      }
      const [financeRes, attendanceRes] = await Promise.all([
        apiClient.get("/analytics/finance", { params: { schoolId: row.key, year } }),
        apiClient.get("/analytics/attendance", { params: { schoolId: row.key } }),
      ]);
      setReportFinance(financeRes.data?.data);
      setReportAttendance(attendanceRes.data?.data);
    } catch {
      message.error("Failed to load full report for this school");
    } finally {
      setReportLoading(false);
    }
  };

  const columns = [
    {
      title: "School",
      dataIndex: "name",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={avatarStyle(name, 34)}><BankOutlined style={{ fontSize: 14 }} /></div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
        </div>
      ),
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Boards",
      dataIndex: "boards",
      render: (boards) => boards.length
        ? <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{boards.map((b) => <span key={b} style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>{b}</span>)}</div>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan) => plan
        ? <span style={pill("var(--accent)", "rgba(20,184,166,0.15)")}>{plan.name}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No plan</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) => isActive
        ? <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}><CheckCircleOutlined /> Active</span>
        : <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}><StopOutlined /> Inactive</span>,
    },
    {
      title: "Today's Attendance",
      dataIndex: "attendanceRate",
      align: "center",
      sorter: (a, b) => (a.attendanceRate ?? -1) - (b.attendanceRate ?? -1),
      render: (rate) => {
        if (rate === null) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No data</span>;
        const color = rate >= 85 ? "var(--success-hover)" : rate >= 60 ? "var(--warning-hover)" : "var(--danger-hover)";
        const bg = rate >= 85 ? "rgba(220,252,231,0.5)" : rate >= 60 ? "rgba(254,243,199,0.5)" : "rgba(254,226,226,0.5)";
        return <span style={pill(color, bg)}>{rate}%</span>;
      },
    },
    {
      title: "Revenue Collected",
      dataIndex: "revenue",
      align: "right",
      sorter: (a, b) => a.revenue - b.revenue,
      defaultSortOrder: "descend",
      render: (revenue, row) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--success-hover)" }}>{formatCurrency(revenue)}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.paymentCount} payment{row.paymentCount === 1 ? "" : "s"}</div>
        </div>
      ),
    },
    {
      title: "Action",
      align: "center",
      render: (_, row) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => openFullReport(row)}>
          View Full Report
        </Button>
      ),
    },
  ];

  const summary = schoolReports?.summary;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="School Wise Reports"
        subtitle="Compare every school side by side on status, attendance and revenue"
        icon={<BankOutlined />}
        extra={
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 140 }}
            options={YEAR_OPTIONS}
          />
        }
      />

      <div style={{ ...statGrid(190), marginTop: 20 }}>
        <StatCard icon={<BankOutlined />} label="Total Schools" value={stats.totalSchools} color="var(--primary)" />
        <StatCard icon={<CheckCircleOutlined />} label="Active Schools" value={stats.activeSchools} color="var(--success)" />
        <StatCard icon={<RiseOutlined />} label="Revenue Collected" value={formatCurrency(stats.totalRevenue)} color="var(--warning)" />
        <StatCard icon={<ScheduleOutlined />} label="Avg. Attendance Today" value={`${stats.avgAttendance}%`} color="var(--accent)" />
      </div>

      <style>{tableHeadCss("school-wise-tbl")}</style>

      <div style={sectionPanel}>
        <div style={toolbarRow}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by school name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="Filter status"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || "")}
            style={{ width: 160 }}
            options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
          />
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>
            Showing <strong style={{ color: "var(--text-primary)" }}>{filteredRows.length}</strong> of <strong style={{ color: "var(--text-primary)" }}>{stats.totalSchools}</strong> schools
          </span>
        </div>

        <div className="school-wise-tbl" style={tableContainer}>
          <Table
            columns={columns}
            dataSource={filteredRows}
            loading={schoolsLoading || loading?.finance || loading?.attendance}
            rowKey="key"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
            locale={{ emptyText: <Empty description="No schools found" /> }}
          />
        </div>
      </div>

      {/* ── Complete Report Drawer ── */}
      <Drawer
        title={modalTitle(<BankOutlined />, reportSchool?.name || "School Report", "Complete report for this school")}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        width={480}
        destroyOnClose
      >
        {reportLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* School info */}
            <div style={sectionPanel}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <EnvironmentOutlined style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-primary)" }}>{reportSchool?.address || "No address provided"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {reportSchool?.isActive
                  ? <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>Active</span>
                  : <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}>Inactive</span>}
                {(reportSchool?.boards || []).map((b) => <span key={b} style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>{b}</span>)}
                {reportSchool?.plan && (
                  <span style={pill("var(--accent)", "rgba(20,184,166,0.15)")}>
                    {reportSchool.plan.name} · ₹{reportSchool.plan.price}/{reportSchool.plan.durationInDays}d
                  </span>
                )}
              </div>
            </div>

            {/* Headcounts for the active academic year */}
            {summary ? (
              <div style={statGrid(120)}>
                <StatCard icon={<UserOutlined />} label="Admins" value={summary.adminCount ?? 0} color="var(--purple)" />
                <StatCard icon={<SolutionOutlined />} label="Teachers" value={summary.teacherCount ?? 0} color="var(--primary)" />
                <StatCard icon={<BookOutlined />} label="Students" value={summary.studentCount ?? 0} color="var(--success)" />
                <StatCard icon={<TeamOutlined />} label="Parents" value={summary.parentCount ?? 0} color="var(--danger)" />
              </div>
            ) : (
              <div style={{ ...pill("var(--warning-hover)", "rgba(254,243,199,0.5)"), display: "block", padding: "10px 14px" }}>
                No active academic year set for this school — headcounts unavailable.
              </div>
            )}

            {/* Attendance + Finance */}
            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>Today's Attendance</div>
              {reportAttendance ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>Present: {reportAttendance.presentToday}</span>
                  <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}>Absent: {reportAttendance.absentToday}</span>
                  <span style={pill("var(--warning-hover)", "rgba(254,243,199,0.5)")}>Late: {reportAttendance.lateToday}</span>
                  <span style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>Rate: {reportAttendance.attendanceRate}%</span>
                </div>
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No attendance marked today</span>
              )}
            </div>

            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>
                Revenue — FY {reportYear}-{String((reportYear || 0) + 1).slice(-2)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--success-hover)" }}>{formatCurrency(reportFinance?.totalIncome)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{reportFinance?.paymentCount ?? 0} payments collected</div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SchoolWiseReports;

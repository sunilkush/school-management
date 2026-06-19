import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchoolReports } from "../../../features/reportSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { Select, Table, Button, Empty, Tooltip, Drawer, Descriptions, Tag } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  SolutionOutlined,
  EyeOutlined,
  BankOutlined,
  BarChartOutlined,
  CalendarOutlined,
  LoadingOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Option } = Select;

/* ─── Design Tokens ───────────────────────────────────────────── */
const t = {
  bg:           "#F8FAFC",
  surface:      "#ffffff",
  surfaceAlt:   "#f0f2f8",
  border:       "1px solid #e4e7ef",
  borderColor:  "#e4e7ef",

  purple:       "#14B8A6",
  purpleLight:  "rgba(20,184,166,0.2)",
  purpleMid:    "rgba(20,184,166,0.5)",

  blue:         "#2563EB",
  blueLight:    "rgba(219,234,254,0.2)",

  green:        "#22C55E",
  greenLight:   "rgba(220,252,231,0.2)",

  pink:         "#EF4444",
  pinkLight:    "rgba(254,226,226,0.2)",

  amber:        "#F59E0B",
  amberLight:   "rgba(254,243,199,0.25)",

  textPrimary:   "#0F172A",
  textSecondary: "#64748B",
  textMuted:     "#94A3B8",

  radius:   "14px",
  radiusSm: "8px",
  shadow:   "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
};

/* ─── Stat Card ───────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, lightColor }) => (
  <div
    style={{
      background: t.surface,
      border: t.border,
      borderTop: `3px solid ${color}`,
      borderRadius: t.radius,
      padding: "20px 22px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: t.shadow,
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "default",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = t.shadowMd;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = t.shadow;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: lightColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary, lineHeight: 1 }}>
        {(value ?? 0).toLocaleString()}
      </div>
    </div>
  </div>
);

/* ─── Stat Pill (table) ───────────────────────────────────────── */
const StatPill = ({ value, color, lightColor }) => (
  <span
    style={{
      display: "inline-block",
      background: lightColor,
      color,
      border: `1px solid ${color}55`,
      borderRadius: 6,
      padding: "3px 14px",
      fontWeight: 700,
      fontSize: 14,
      minWidth: 40,
      textAlign: "center",
    }}
  >
    {(value ?? 0).toLocaleString()}
  </span>
);

/* ─── Main Component ──────────────────────────────────────────── */
const SchoolReports = () => {
  const dispatch = useDispatch();
  const { schoolReports, loading } = useSelector((state) => state.reports);
  const { schools } = useSelector((state) => state.school);

  const [schoolId, setSchoolId] = useState(null);
  const [selectedSchoolName, setSelectedSchoolName] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState(null);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleSchoolChange = async (id) => {
    setSchoolId(id);
    const school = schools.find((s) => s._id === id);
    setSelectedSchoolName(school?.name || null);
    if (!id) return;
    try {
      const res = await dispatch(fetchActiveAcademicYear(id)).unwrap();
      const academicYearId = res?._id;
      if (academicYearId) {
        dispatch(fetchSchoolReports({ schoolId: id, academicYearId }));
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  const handleViewRecord = (record) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
  };

  const summary = schoolReports?.summary;
  const tableData = schoolReports ? [schoolReports] : [];

  const columns = [
    {
      title: "Academic Year",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarOutlined style={{ color: t.purple, fontSize: 14 }} />
          <span
            style={{
              background: t.purpleLight,
              color: t.purple,
              border: `1px solid ${t.purpleMid}`,
              borderRadius: 6,
              padding: "3px 10px",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {record.academicYear}
          </span>
        </div>
      ),
    },
    {
      title: "Admins",
      align: "center",
      render: (_, record) => (
        <StatPill value={record.summary?.adminCount} color={t.purple} lightColor={t.purpleLight} />
      ),
    },
    {
      title: "Teachers",
      align: "center",
      render: (_, record) => (
        <StatPill value={record.summary?.teacherCount} color={t.blue} lightColor={t.blueLight} />
      ),
    },
    {
      title: "Students",
      align: "center",
      render: (_, record) => (
        <StatPill value={record.summary?.studentCount} color={t.green} lightColor={t.greenLight} />
      ),
    },
    {
      title: "Parents",
      align: "center",
      render: (_, record) => (
        <StatPill value={record.summary?.parentCount} color={t.pink} lightColor={t.pinkLight} />
      ),
    },
    {
      title: "Action",
      align: "center",
      render: (_, record) => (
        <Tooltip title="View full report">
          <Button
            onClick={() => handleViewRecord(record)}
            style={{
              background: t.purpleLight,
              border: `1px solid ${t.purpleMid}`,
              color: t.purple,
              borderRadius: 8,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <EyeOutlined />
            View
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        padding: "32px 28px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: t.purpleLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: t.purple,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <BarChartOutlined />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: t.textPrimary, letterSpacing: "-0.3px" }}>
              School Reports
            </h2>
            <p style={{ margin: 0, color: t.textSecondary, fontSize: 13 }}>
              Select a school to view academic year statistics
            </p>
          </div>
        </div>
      </div>

      {/* ── School Selector ── */}
      <div
        style={{
          background: t.surface,
          border: t.border,
          borderRadius: t.radius,
          padding: "20px 22px",
          marginBottom: 20,
          boxShadow: t.shadow,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 11,
            color: t.textSecondary,
            marginBottom: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          <BankOutlined style={{ color: t.purple }} />
          Select School
        </label>
        <Select
          placeholder="Search and select a school..."
          style={{ width: "100%" }}
          value={schoolId}
          onChange={handleSchoolChange}
          allowClear
          showSearch
          filterOption={(input, option) =>
            option?.children?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {schools.map((school) => (
            <Option key={school._id} value={school._id}>
              {school.name}
            </Option>
          ))}
        </Select>
      </div>

      {/* ── Warning ── */}
      {schoolId && !loading && !summary && (
        <div
          style={{
            background: t.amberLight,
            border: `1px solid ${t.amber}55`,
            borderRadius: t.radiusSm,
            padding: "11px 16px",
            color: t.amber,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
          }}
        >
          ⚠ No active academic year found for this school.
        </div>
      )}

      {/* ── Stat Cards ── */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <StatCard icon={<UserOutlined />}     label="Admins"   value={summary.adminCount}   color={t.purple} lightColor={t.purpleLight} />
          <StatCard icon={<SolutionOutlined />} label="Teachers" value={summary.teacherCount} color={t.blue}   lightColor={t.blueLight}   />
          <StatCard icon={<BookOutlined />}     label="Students" value={summary.studentCount} color={t.green}  lightColor={t.greenLight}  />
          <StatCard icon={<TeamOutlined />}     label="Parents"  value={summary.parentCount}  color={t.pink}   lightColor={t.pinkLight}   />
        </div>
      )}

      {/* ── Table ── */}
      <div
        style={{
          background: t.surface,
          border: t.border,
          borderRadius: t.radius,
          overflow: "hidden",
          boxShadow: t.shadow,
        }}
      >
        {selectedSchoolName && (
          <div
            style={{
              padding: "14px 22px",
              borderBottom: t.border,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: t.surfaceAlt,
            }}
          >
            <BankOutlined style={{ color: t.purple, fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary }}>
              {selectedSchoolName}
            </span>
          </div>
        )}

        <Table
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 24, color: t.purple }} spin />,
          }}
          columns={columns}
          dataSource={tableData}
          rowKey={(r) => r.academicYearId}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: t.textMuted }}>
                    Select a school to load report instantly
                  </span>
                }
              />
            ),
          }}
          style={{ background: "transparent" }}
        />
      </div>

      {/* ── Detail Drawer ── */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: t.purpleLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.purple,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              <BarChartOutlined />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary }}>
              School Report Details
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={440}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: "24px 20px" } }}
      >
        {drawerRecord && (
          <>
            {/* School name */}
            {selectedSchoolName && (
              <div
                style={{
                  background: t.purpleLight,
                  border: `1px solid ${t.purpleMid}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <BankOutlined style={{ color: t.purple, fontSize: 16 }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: t.purple }}>
                  {selectedSchoolName}
                </span>
              </div>
            )}

            {/* Academic Year */}
            <Descriptions
              column={1}
              size="small"
              bordered
              style={{ marginBottom: 20 }}
              labelStyle={{ fontWeight: 600, color: t.textSecondary, width: 140 }}
              contentStyle={{ color: t.textPrimary }}
            >
              <Descriptions.Item label={<span><CalendarOutlined style={{ marginRight: 6 }} />Academic Year</span>}>
                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                  {drawerRecord.academicYear || "—"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div
                style={{
                  background: t.purpleLight,
                  border: `1px solid ${t.purpleMid}`,
                  borderRadius: 10,
                  padding: "16px 14px",
                  textAlign: "center",
                }}
              >
                <UserOutlined style={{ fontSize: 20, color: t.purple, marginBottom: 6, display: "block" }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: t.purple, lineHeight: 1 }}>
                  {(drawerRecord.summary?.adminCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Admins
                </div>
              </div>

              <div
                style={{
                  background: t.blueLight,
                  border: `1px solid ${t.blue}55`,
                  borderRadius: 10,
                  padding: "16px 14px",
                  textAlign: "center",
                }}
              >
                <SolutionOutlined style={{ fontSize: 20, color: t.blue, marginBottom: 6, display: "block" }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: t.blue, lineHeight: 1 }}>
                  {(drawerRecord.summary?.teacherCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Teachers
                </div>
              </div>

              <div
                style={{
                  background: t.greenLight,
                  border: `1px solid ${t.green}55`,
                  borderRadius: 10,
                  padding: "16px 14px",
                  textAlign: "center",
                }}
              >
                <BookOutlined style={{ fontSize: 20, color: t.green, marginBottom: 6, display: "block" }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: t.green, lineHeight: 1 }}>
                  {(drawerRecord.summary?.studentCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Students
                </div>
              </div>

              <div
                style={{
                  background: t.pinkLight,
                  border: `1px solid ${t.pink}55`,
                  borderRadius: 10,
                  padding: "16px 14px",
                  textAlign: "center",
                }}
              >
                <TeamOutlined style={{ fontSize: 20, color: t.pink, marginBottom: 6, display: "block" }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: t.pink, lineHeight: 1 }}>
                  {(drawerRecord.summary?.parentCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Parents
                </div>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default SchoolReports;

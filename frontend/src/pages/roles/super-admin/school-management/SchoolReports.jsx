import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchoolReports } from "../../../../features/reportSlice.js";
import { fetchActiveAcademicYear } from "../../../../features/academicYearSlice.js";
import { fetchSchools } from "../../../../features/schoolSlice.js";
import { Select, Table, Button, Empty, Tooltip } from "antd";
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
} from "@ant-design/icons";

const { Option } = Select;

/* ─── Design Tokens ───────────────────────────────────────────── */
const t = {
  bg:           "#f5f6fa",
  surface:      "#ffffff",
  surfaceAlt:   "#f0f2f8",
  border:       "1px solid #e4e7ef",
  borderColor:  "#e4e7ef",

  purple:       "#5b52e8",
  purpleLight:  "#ededfd",
  purpleMid:    "#c7c4f8",

  blue:         "#2563eb",
  blueLight:    "#dbeafe",

  green:        "#16a34a",
  greenLight:   "#dcfce7",

  pink:         "#db2777",
  pinkLight:    "#fce7f3",

  amber:        "#d97706",
  amberLight:   "#fef3c7",

  textPrimary:   "#0f172a",
  textSecondary: "#64748b",
  textMuted:     "#94a3b8",

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
            onClick={() => console.log(record)}
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
    </div>
  );
};

export default SchoolReports;

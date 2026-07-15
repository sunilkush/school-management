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
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  tableContainer,
  tableHeadCss,
  modalTitle,
} from "../../../styles/pageStyles";

const { Option } = Select;

/* ─── Accent palette (category color-coding, kept as brand accents) ───── */
const t = {
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
};

/* ─── Stat Card ───────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, lightColor }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", marginBottom: 0 }}>
    <div style={{ ...iconWell(color, 48), background: lightColor }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
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
    <div style={pageWrapper}>
      <PageHeader
        title="School Reports"
        subtitle="Select a school to view academic year statistics"
        icon={<BarChartOutlined />}
      />

      {/* ── School Selector ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 11,
            color: "var(--text-muted)",
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
            borderRadius: 8,
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
        <div style={{ ...statGrid(190), marginBottom: 20 }}>
          <StatCard icon={<UserOutlined />}     label="Admins"   value={summary.adminCount}   color={t.purple} lightColor={t.purpleLight} />
          <StatCard icon={<SolutionOutlined />} label="Teachers" value={summary.teacherCount} color={t.blue}   lightColor={t.blueLight}   />
          <StatCard icon={<BookOutlined />}     label="Students" value={summary.studentCount} color={t.green}  lightColor={t.greenLight}  />
          <StatCard icon={<TeamOutlined />}     label="Parents"  value={summary.parentCount}  color={t.pink}   lightColor={t.pinkLight}   />
        </div>
      )}

      <style>{tableHeadCss("school-reports-tbl")}</style>

      {/* ── Table ── */}
      <div style={{ ...sectionPanel, padding: 0 }}>
        {selectedSchoolName && (
          <div
            style={{
              padding: "14px 22px",
              borderBottom: "1px solid var(--border-muted)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface-soft)",
            }}
          >
            <BankOutlined style={{ color: t.purple, fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {selectedSchoolName}
            </span>
          </div>
        )}

        <div className="school-reports-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
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
                    <span style={{ color: "var(--text-muted)" }}>
                      Select a school to load report instantly
                    </span>
                  }
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <Drawer
        title={modalTitle(<BarChartOutlined />, "School Report Details")}
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
              labelStyle={{ fontWeight: 600, color: "var(--text-muted)", width: 140 }}
              contentStyle={{ color: "var(--text-primary)" }}
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
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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

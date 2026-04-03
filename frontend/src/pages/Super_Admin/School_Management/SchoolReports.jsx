import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchoolReports } from "../../../features/reportSlice.js";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";
import {
  Select,
  Table,
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Empty,
  Tooltip,
  Divider,
  Row,
  Col,
} from "antd";
import {
  ApartmentOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  SolutionOutlined,
  EyeOutlined,
  FilterOutlined,
  CalendarOutlined,
  BankOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Color tokens ──────────────────────────────────────────────
const C = {
  primary: "#0F6E56",
  primaryLight: "#E1F5EE",
  primaryMid: "#1D9E75",
  primaryBorder: "#9FE1CB",
  surface: "#ffffff",
  bg: "#F4F6F5",
  border: "#E8EDEB",
  text: "#111827",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  blue: "#1D4ED8",
  blueLight: "#EFF6FF",
  blueBorder: "#BFDBFE",
  purple: "#6D28D9",
  purpleLight: "#F5F3FF",
  purpleBorder: "#DDD6FE",
  gold: "#B45309",
  goldLight: "#FFFBEB",
  goldBorder: "#FDE68A",
  rose: "#BE123C",
  roseLight: "#FFF1F2",
  roseBorder: "#FECDD3",
};

// ─── Stat mini-card ────────────────────────────────────────────
const StatPill = ({ icon, label, value, color, bg, border }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: "12px 16px",
      flex: 1,
      minWidth: 110,
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: C.surface,
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <Text
        style={{
          display: "block",
          fontSize: 10,
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Text>
      <Text strong style={{ fontSize: 20, color: C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>
        {value ?? 0}
      </Text>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────
const SchoolReports = () => {
  const dispatch = useDispatch();

  const { schoolReports, loading } = useSelector((state) => state.reports);
  const { schools } = useSelector((state) => state.school);
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);

  const [schoolId, setSchoolId] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState(null);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleSchoolChange = (id) => {
    setSchoolId(id);
    const selectedSchool = schools.find((s) => s._id === id);
    setAcademicYears(selectedSchool?.academicYears || []);
    setAcademicYearId(null);
    dispatch(fetchActiveAcademicYear(id));
    return setAcademicYearId(selectedAcademicYear?._id || null);
  };

  useEffect(() => {
    if (
      academicYears.length > 0 &&
      selectedAcademicYear?._id &&
      academicYears.some((y) => y._id === selectedAcademicYear._id)
    ) {
      setAcademicYearId(selectedAcademicYear._id);
    }
  }, [academicYears, selectedAcademicYear]);

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSchoolReports({ schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  const summary = schoolReports?.summary;
  const tableData = schoolReports ? [schoolReports] : [];
  const hasData = !!schoolReports;

  const columns = [
    {
      title: (
        <Space size={6}>
          <CalendarOutlined style={{ color: C.textMuted, fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Academic Year
          </Text>
        </Space>
      ),
      key: "academicYear",
      render: (_, record) => (
        <Tag
          style={{
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: C.primaryLight,
            color: C.primary,
            border: `1px solid ${C.primaryBorder}`,
            padding: "2px 10px",
          }}
        >
          {record.academicYearId}
        </Tag>
      ),
    },
    {
      title: (
        <Space size={6}>
          <UserOutlined style={{ color: C.textMuted, fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Admins
          </Text>
        </Space>
      ),
      key: "adminCount",
      align: "center",
      render: (_, record) => (
        <Text strong style={{ fontSize: 15, color: C.text }}>
          {record.summary?.adminCount ?? 0}
        </Text>
      ),
    },
    {
      title: (
        <Space size={6}>
          <SolutionOutlined style={{ color: C.textMuted, fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Teachers
          </Text>
        </Space>
      ),
      key: "teacherCount",
      align: "center",
      render: (_, record) => (
        <Text strong style={{ fontSize: 15, color: C.text }}>
          {record.summary?.teacherCount ?? 0}
        </Text>
      ),
    },
    {
      title: (
        <Space size={6}>
          <BookOutlined style={{ color: C.textMuted, fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Students
          </Text>
        </Space>
      ),
      key: "studentCount",
      align: "center",
      render: (_, record) => (
        <Text strong style={{ fontSize: 15, color: C.text }}>
          {record.summary?.studentCount ?? 0}
        </Text>
      ),
    },
    {
      title: (
        <Space size={6}>
          <TeamOutlined style={{ color: C.textMuted, fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Parents
          </Text>
        </Space>
      ),
      key: "parentCount",
      align: "center",
      render: (_, record) => (
        <Text strong style={{ fontSize: 15, color: C.text }}>
          {record.summary?.parentCount ?? 0}
        </Text>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Actions
        </Text>
      ),
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Tooltip title="View full report">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => console.log(record)}
            style={{
              background: C.primary,
              borderColor: C.primary,
              borderRadius: 7,
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            View
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 24px" }}>

      {/* ══ PAGE HEADER ══ */}
      <Space align="center" size={10} style={{ marginBottom: 6 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.primaryLight,
            border: `1px solid ${C.primaryBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BarChartOutlined style={{ color: C.primary, fontSize: 16 }} />
        </div>
        <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 700, letterSpacing: "-0.5px" }}>
          School Reports
        </Title>
      </Space>
      <Text style={{ color: C.textSec, fontSize: 13, display: "block", marginBottom: 24 }}>
        View academic year summaries for each registered school
      </Text>

      {/* ══ FILTER CARD ══ */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          background: C.surface,
          marginBottom: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
        styles={{ body: { padding: "18px 20px" } }}
      >
        <Space size={8} align="center" style={{ marginBottom: 14 }}>
          <FilterOutlined style={{ color: C.primary, fontSize: 13 }} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Filters
          </Text>
        </Space>

        <Row gutter={[14, 14]}>
          {/* School Select */}
          <Col xs={24} md={12}>
            <Text
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              <BankOutlined style={{ marginRight: 5 }} />
              School
            </Text>
            <Select
              placeholder="Select a school..."
              style={{ width: "100%", borderRadius: 10 }}
              value={schoolId}
              onChange={handleSchoolChange}
              showSearch
              optionFilterProp="children"
              allowClear
              size="middle"
            >
              {schools.map((school) => (
                <Option key={school._id} value={school._id}>
                  {school.name}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Academic Year Select */}
          <Col xs={24} md={12}>
            <Text
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              <CalendarOutlined style={{ marginRight: 5 }} />
              Academic Year
            </Text>
            <Select
              placeholder={schoolId ? "Select academic year..." : "Select a school first"}
              style={{ width: "100%" }}
              disabled={!academicYears.length}
              value={academicYearId}
              onChange={(value) => setAcademicYearId(value)}
              allowClear
              size="middle"
            >
              {academicYears.map((yr) => (
                <Option key={yr._id} value={yr._id}>
                  {yr.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* ══ STATS ROW (visible only when data loaded) ══ */}
      {hasData && summary && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <StatPill
            icon={<UserOutlined />}
            label="Admins"
            value={summary.adminCount}
            color={C.blue}
            bg={C.blueLight}
            border={C.blueBorder}
          />
          <StatPill
            icon={<SolutionOutlined />}
            label="Teachers"
            value={summary.teacherCount}
            color={C.primary}
            bg={C.primaryLight}
            border={C.primaryBorder}
          />
          <StatPill
            icon={<BookOutlined />}
            label="Students"
            value={summary.studentCount}
            color={C.purple}
            bg={C.purpleLight}
            border={C.purpleBorder}
          />
          <StatPill
            icon={<TeamOutlined />}
            label="Parents"
            value={summary.parentCount}
            color={C.gold}
            bg={C.goldLight}
            border={C.goldBorder}
          />
        </div>
      )}

      {/* ══ TABLE CARD ══ */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          background: C.surface,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            Report Summary
          </Text>
          {hasData && (
            <Text style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>
              1 record found
            </Text>
          )}
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={tableData}
          rowKey={(record) => record.academicYearId}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: C.textMuted, fontSize: 13 }}>
                    {!schoolId
                      ? "Select a school to view its report"
                      : !academicYearId
                      ? "Select an academic year to continue"
                      : "No report data available"}
                  </Text>
                }
                style={{ padding: "32px 0" }}
              />
            ),
          }}
          style={{ borderRadius: 0 }}
          rowClassName={() => "report-table-row"}
          onRow={() => ({
            style: { fontSize: 14 },
          })}
        />
      </Card>

      <style>{`
        .report-table-row:hover > td {
          background: ${C.primaryLight} !important;
        }
        .ant-table-thead > tr > th {
          background: #F9FAFB !important;
          border-bottom: 1px solid ${C.border} !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid ${C.border} !important;
        }
      `}</style>
    </div>
  );
};

export default SchoolReports;
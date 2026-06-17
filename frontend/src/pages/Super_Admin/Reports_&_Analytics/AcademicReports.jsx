import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Button,
  Spin,
  Empty,
  Table,
} from "antd";
import {
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  UserOutlined,
  ReloadOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { fetchAcademicSummary } from "../../../features/analyticsSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  toolbarRow,
  statGrid,
  iconWell,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";

const { Option } = Select;

const TABLE_CLS = "academic-tbl";

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: "var(--surface)",
    border: "1px solid var(--border-muted)",
    borderRadius: 14,
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "var(--shadow-soft)",
  }}>
    <div style={iconWell(color, 44)}>
      {icon}
    </div>
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
        {value !== undefined && value !== null ? Number(value).toLocaleString("en-IN") : "—"}
      </div>
    </div>
  </div>
);

const AcademicReports = () => {
  const dispatch = useDispatch();
  const { academic, loading: loadingMap, error } = useSelector((s) => s.analytics || {});
  const { schools = [] } = useSelector((s) => s.school || {});
  const loading = loadingMap?.academic || false;

  const [selectedSchool, setSelectedSchool] = useState("");

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools]
  );

  const doFetch = useCallback(
    (schoolId) => {
      const params = {};
      if (schoolId) params.schoolId = schoolId;
      dispatch(fetchAcademicSummary(params));
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch(fetchSchools());
    doFetch("");
  }, [dispatch]);

  const handleSchoolChange = (val) => {
    setSelectedSchool(val || "");
    doFetch(val || "");
  };

  const handleRefresh = () => doFetch(selectedSchool);

  /* ── Stats ── */
  const stats          = academic || {};
  const totalStudents  = stats.totalStudents;
  const totalTeachers  = stats.totalTeachers;
  const totalSubjects  = stats.totalSubjects;
  const totalExams     = stats.totalExams;

  /* ── School performance table ── */
  const schoolData = stats.schools || stats.schoolWise || [];

  const schoolColumns = [
    {
      title: "School",
      dataIndex: "schoolName",
      render: (n) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{n || "—"}</span>,
    },
    {
      title: "Students",
      dataIndex: "students",
      align: "right",
      render: (v) => v != null ? Number(v).toLocaleString("en-IN") : "—",
    },
    {
      title: "Teachers",
      dataIndex: "teachers",
      align: "right",
      render: (v) => v != null ? Number(v).toLocaleString("en-IN") : "—",
    },
    {
      title: "Subjects",
      dataIndex: "subjects",
      align: "right",
      render: (v) => v != null ? Number(v).toLocaleString("en-IN") : "—",
    },
    {
      title: "Exams",
      dataIndex: "exams",
      align: "right",
      render: (v) => v != null ? Number(v).toLocaleString("en-IN") : "—",
    },
    {
      title: "Avg Score",
      dataIndex: "avgScore",
      align: "right",
      render: (v) => v != null
        ? <span style={{ color: "var(--success)", fontWeight: 700 }}>{Number(v).toFixed(1)}%</span>
        : "—",
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Academic Reports"
        subtitle="Academic performance insights across schools"
        icon={<ReadOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            style={{ borderColor: "var(--border-muted)" }}
          >
            Refresh
          </Button>
        }
      />

      {/* Toolbar */}
      <div style={{ ...toolbarRow, marginTop: 20 }}>
        <Select
          placeholder="All Schools"
          allowClear
          style={{ width: 220 }}
          onChange={handleSchoolChange}
          value={selectedSchool || undefined}
        >
          {schoolOptions.map((s) => (
            <Option key={s.value} value={s.value}>{s.label}</Option>
          ))}
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "14px 18px",
          background: "var(--danger)10",
          border: "1px solid var(--danger)30",
          borderRadius: 10,
          color: "var(--danger)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{error}</span>
          <Button size="small" danger onClick={handleRefresh}>Retry</Button>
        </div>
      )}

      <Spin spinning={loading}>
        {/* Stat Cards */}
        <div style={statGrid(160)}>
          <StatCard
            icon={<TeamOutlined />}
            label="Total Students"
            value={totalStudents}
            color="var(--primary)"
          />
          <StatCard
            icon={<UserOutlined />}
            label="Total Teachers"
            value={totalTeachers}
            color="var(--success)"
          />
          <StatCard
            icon={<BookOutlined />}
            label="Total Subjects"
            value={totalSubjects}
            color="var(--warning)"
          />
          <StatCard
            icon={<BarChartOutlined />}
            label="Exams Conducted"
            value={totalExams}
            color="var(--danger)"
          />
        </div>

        {/* School breakdown table */}
        {schoolData.length > 0 ? (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 8,
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-muted)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text-primary)",
            }}>
              School-wise Academic Overview
            </div>
            <div style={tableContainer}>
              <Table
                className={TABLE_CLS}
                rowKey={(r) => r.schoolId || r.schoolName}
                columns={schoolColumns}
                dataSource={schoolData}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 700 }}
              />
            </div>
          </div>
        ) : !loading && academic && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
            marginTop: 8,
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--text-muted)" }}>
                  No school-wise breakdown available
                </span>
              }
            />
          </div>
        )}

        {/* Empty state when no data at all */}
        {!loading && !academic && !error && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "56px 24px",
            textAlign: "center",
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: "var(--text-muted)" }}>No academic data available</span>}
            >
              <Button type="primary" onClick={handleRefresh}>Load Data</Button>
            </Empty>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AcademicReports;

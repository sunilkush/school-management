import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Empty, Input, Select, Space, Table, message } from "antd";
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import { exportReportExcel, exportReportPDF, fetchReports } from "../../../features/examReportSlice";
import { getExams } from "../../../features/examSlice";
import { getClassData } from "../../../features/schoolClassSlice";
import { getAccessToken } from "../../../api/authToken";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  toolbarRow,
  tableHeadCss,
  statCard,
  statLabel,
  statValue,
  statGrid,
  pill,
} from "../../../styles/pageStyles";

const ExamReports = () => {
  const dispatch = useDispatch();
  const { reports = [], loading = false, error = null } = useSelector((state) => state.examReports || {});
  const { exams = [] } = useSelector((state) => state.exams || {});
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});
  const { user = {} } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});

  const [filters, setFilters] = useState({ examId: undefined, schoolClassId: undefined, type: "", search: "" });
  const [downloading, setDownloading] = useState(null);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(getExams({ schoolId, academicYearId, limit: 100 }));
    dispatch(getClassData({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    dispatch(fetchReports({ examId: filters.examId, type: filters.type }));
  }, [dispatch, filters.examId, filters.type]);

  const filteredReports = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    if (!searchTerm) return reports;
    return reports.filter((item) => {
      const examName = item?.examTitle?.toLowerCase() || "";
      const studentName = item?.studentName?.toLowerCase() || "";
      const studentEmail = item?.studentEmail?.toLowerCase() || "";
      return examName.includes(searchTerm) || studentName.includes(searchTerm) || studentEmail.includes(searchTerm);
    });
  }, [reports, filters.search]);

  const stats = useMemo(() => {
    const total = filteredReports.length;
    const passed = filteredReports.filter((r) => String(r?.status || "").toLowerCase() === "pass").length;
    const avg = total
      ? Math.round(filteredReports.reduce((acc, r) => acc + Number(r?.percentage || 0), 0) / total)
      : 0;
    return { total, passed, failed: total - passed, avg };
  }, [filteredReports]);

  const handleExport = (format) => {
    const payload = { examId: filters.examId, type: filters.type };
    if (format === "excel") return dispatch(exportReportExcel(payload));
    return dispatch(exportReportPDF(payload));
  };

  const handleDownloadMarksheet = async (format) => {
    if (!filters.examId) return message.warning("Please select an exam first");
    if (!filters.schoolClassId) return message.warning("Please select a class for marksheet download");

    setDownloading(format);
    try {
      const token = getAccessToken();
      const params = new URLSearchParams({ examId: filters.examId, schoolClassId: filters.schoolClassId, format });
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${apiBase}/exams/results/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || "Download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marksheet-${filters.examId}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("Marksheet downloaded successfully");
    } catch (err) {
      message.error(err.message || "Failed to download marksheet");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("report-table")}</style>
      <PageHeader
        title="Exam Reports"
        subtitle="Filter, audit, and export report outcomes with enterprise-ready controls."
        icon={<FileTextOutlined />}
        extra={[
          <Button key="excel" icon={<FileExcelOutlined />} onClick={() => handleExport("excel")}>Export Excel</Button>,
          <Button key="pdf" danger icon={<FilePdfOutlined />} onClick={() => handleExport("pdf")}>Export PDF</Button>,
        ]}
      />

      <div style={{ marginTop: 20 }}>
        <div className="stat-grid" style={statGrid(160)}>
          {[
            { key: "total", title: "Total Records", value: stats.total, color: "var(--primary)" },
            { key: "passed", title: "Pass", value: stats.passed, color: "var(--success)" },
            { key: "failed", title: "Fail", value: stats.failed, color: "var(--danger)" },
            { key: "avg", title: "Average %", value: `${stats.avg}%`, color: "var(--cyan)" },
          ].map((item) => (
            <div key={item.key} style={statCard({ color: item.color })}>
              <div>
                <div style={statLabel(item.color)}>{item.title}</div>
                <div style={statValue(item.color)}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={pageCard}>
          <div className="page-toolbar" style={{ ...toolbarRow, padding: "16px 16px 0" }}>
            <Select
              allowClear
              style={{ minWidth: 220 }}
              placeholder="Select exam"
              value={filters.examId}
              onChange={(value) => setFilters((prev) => ({ ...prev, examId: value }))}
              options={exams.map((exam) => ({ label: exam?.title || "Untitled Exam", value: exam?._id }))}
            />
            <Select
              allowClear
              style={{ minWidth: 170 }}
              placeholder="Result type"
              value={filters.type || undefined}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value || "" }))}
              options={[{ label: "All", value: "" }, { label: "Passed", value: "pass" }, { label: "Failed", value: "fail" }]}
            />
            <Input.Search
              allowClear
              placeholder="Search student/exam"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              style={{ minWidth: 240 }}
            />
          </div>

          {/* ── Marksheet Download Panel ── */}
          <div style={{
            margin: "12px 16px 0",
            padding: "14px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Download Marksheet:
            </span>
            <Select
              allowClear
              style={{ minWidth: 180 }}
              placeholder="Select class"
              value={filters.schoolClassId}
              onChange={(value) => setFilters((prev) => ({ ...prev, schoolClassId: value }))}
              options={schoolClasses.map((c) => ({ label: c?.name || "Class", value: c?._id }))}
              size="small"
            />
            <Button
              size="small"
              icon={<FileExcelOutlined />}
              loading={downloading === "excel"}
              onClick={() => handleDownloadMarksheet("excel")}
              style={{ borderColor: "var(--success)", color: "var(--success)" }}
            >
              Excel
            </Button>
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              loading={downloading === "pdf"}
              onClick={() => handleDownloadMarksheet("pdf")}
              danger
            >
              PDF
            </Button>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              (select exam + class above)
            </span>
          </div>

          {error ? (
            <Alert
              style={{ margin: 16 }}
              type="error"
              showIcon
              message="Failed to load exam reports"
              description={String(error)}
            />
          ) : null}

          <Table
            className="report-table"
            loading={loading}
            rowKey="_id"
            dataSource={filteredReports}
            locale={{ emptyText: <Empty description="No report records found" /> }}
            scroll={{ x: "max-content" }}
            columns={[
              { title: "Exam", dataIndex: "examTitle", key: "examTitle" },
              { title: "Student", dataIndex: "studentName", key: "studentName" },
              { title: "Email", dataIndex: "studentEmail", key: "studentEmail", responsive: ["lg"] },
              {
                title: "Score",
                key: "score",
                align: "center",
                render: (_, record) => `${record?.score ?? 0} / ${record?.totalMarks ?? 0}`,
              },
              {
                title: "Percentage",
                dataIndex: "percentage",
                key: "percentage",
                align: "center",
                render: (value) => `${value ?? 0}%`,
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                align: "center",
                render: (status) => (
                  // pill()'s first arg (color) is baked into its border as `${color}25` —
                  // a raw-hex alpha-suffix trick that breaks with a var() string, so it
                  // stays hex; the bg arg (used directly) is safely tokenized.
                  <span style={pill(
                    status === "Pass" ? "#389e0d" : status === "Fail" ? "#cf1322" : "#0284c7",
                    status === "Pass" ? "var(--success-light)" : status === "Fail" ? "var(--danger-light)" : "var(--info-light)"
                  )}>
                    {status || "Pending"}
                  </span>
                ),
              },
            ]}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </div>
      </div>
    </div>
  );
};

export default ExamReports;

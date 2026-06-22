import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Empty, Input, Select, Space, Table, Tag } from "antd";
import { FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import { exportReportExcel, exportReportPDF, fetchReports } from "../../../features/examReportSlice";
import { getExams } from "../../../features/examSlice";
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
  const { user = {} } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});

  const [filters, setFilters] = useState({ examId: undefined, type: "", search: "" });

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(getExams({ schoolId, academicYearId, limit: 100 }));
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
            { key: "passed", title: "Pass", value: stats.passed, color: "#389e0d" },
            { key: "failed", title: "Fail", value: stats.failed, color: "#cf1322" },
            { key: "avg", title: "Average %", value: `${stats.avg}%`, color: "#0284c7" },
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
                  <span style={pill(
                    status === "Pass" ? "#389e0d" : status === "Fail" ? "#cf1322" : "#0284c7",
                    status === "Pass" ? "#f0fdf4" : status === "Fail" ? "#fff1f2" : "#e0f2fe"
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

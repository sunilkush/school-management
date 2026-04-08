import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import {
  exportReportExcel,
  exportReportPDF,
  fetchReports,
} from "../../../features/examReportSlice";
import { getExams } from "../../../features/examSlice";

const { Title, Text } = Typography;

const ExamReports = () => {
  const dispatch = useDispatch();
  const { reports = [], loading = false, error = null } = useSelector(
    (state) => state.examReports || {}
  );
  const { exams = [] } = useSelector((state) => state.exams || {});

  const [filters, setFilters] = useState({
    examId: undefined,
    type: "",
    search: "",
  });

  useEffect(() => {
    dispatch(getExams({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchReports({
        examId: filters.examId,
        type: filters.type,
      })
    );
  }, [dispatch, filters.examId, filters.type]);

  const filteredReports = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    if (!searchTerm) return reports;

    return reports.filter((item) => {
      const examName = item?.examTitle?.toLowerCase() || "";
      const studentName = item?.studentName?.toLowerCase() || "";
      const studentEmail = item?.studentEmail?.toLowerCase() || "";
      return (
        examName.includes(searchTerm) ||
        studentName.includes(searchTerm) ||
        studentEmail.includes(searchTerm)
      );
    });
  }, [reports, filters.search]);

  const handleExport = (format) => {
    const payload = {
      examId: filters.examId,
      type: filters.type,
    };

    if (format === "excel") {
      dispatch(exportReportExcel(payload));
      return;
    }

    dispatch(exportReportPDF(payload));
  };

  const columns = [
    {
      title: "Exam",
      dataIndex: "examTitle",
      key: "examTitle",
    },
    {
      title: "Student",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Email",
      dataIndex: "studentEmail",
      key: "studentEmail",
      responsive: ["lg"],
    },
    {
      title: "Score",
      dataIndex: "score",
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
      render: (status) => {
        const color =
          status === "Pass" ? "green" : status === "Fail" ? "red" : "blue";
        return <Tag color={color}>{status || "Pending"}</Tag>;
      },
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            📑 Exam Reports
          </Title>
          <Text type="secondary">Dynamic reports with API + Redux filters</Text>
        </div>

        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExport("excel")}>
            Export Excel
          </Button>
          <Button danger icon={<FilePdfOutlined />} onClick={() => handleExport("pdf")}>
            Export PDF
          </Button>
        </Space>
      </Space>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Select exam"
            value={filters.examId}
            onChange={(value) => setFilters((prev) => ({ ...prev, examId: value }))}
            options={exams.map((exam) => ({
              label: exam?.title || "Untitled Exam",
              value: exam?._id,
            }))}
          />
        </Col>

        <Col xs={24} md={8}>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Result type"
            value={filters.type || undefined}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, type: value || "" }))
            }
            options={[
              { label: "All", value: "" },
              { label: "Passed", value: "pass" },
              { label: "Failed", value: "fail" },
            ]}
          />
        </Col>

        <Col xs={24} md={8}>
          <Input.Search
            allowClear
            placeholder="Search student/exam"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
          />
        </Col>
      </Row>

      {error ? (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="Failed to load exam reports"
          description={String(error)}
        />
      ) : null}

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredReports}
            rowKey="_id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            bordered
          />
        )}
      </div>
    </Card>
  );
};

export default ExamReports;
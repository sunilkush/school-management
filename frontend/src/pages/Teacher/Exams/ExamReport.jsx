import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Spin,
  Tag,
} from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  fetchReports,
  exportExamReport,
} from "../../../features/examReportSlice";

const { Title } = Typography;

const ExamReports = () => {
  const dispatch = useDispatch();

  const { reports = [], loading } = useSelector(
    (state) => state.examReports
  );

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const handleExport = (format) => {
    dispatch(exportExamReport({ format }));
  };

  const columns = [
    {
      title: "Exam",
      render: (_, record) => record.exam?.title || "-",
    },
    {
      title: "Student",
      render: (_, record) => record.student?.name || "-",
    },
    {
      title: "Score",
      align: "center",
      render: (_, record) =>
        record.totalObtainedMarks ?? 0,
    },
    {
      title: "Status",
      align: "center",
      render: (_, record) => {
        const status = record.status;
        const color =
          status === "Pass"
            ? "green"
            : status === "Fail"
            ? "red"
            : "blue";

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Space
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Title level={3} style={{ margin: 0 }}>
          📑 Exam Reports
        </Title>

        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExport("excel")}
          >
            Export Excel
          </Button>
          <Button
            danger
            icon={<FilePdfOutlined />}
            onClick={() => handleExport("pdf")}
          >
            Export PDF
          </Button>
        </Space>
      </Space>

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={reports}
            rowKey={(record) => record._id}
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>
    </Card>
  );
};

export default ExamReports;

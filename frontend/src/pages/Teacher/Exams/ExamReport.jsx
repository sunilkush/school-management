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
import { fetchReports, exportReportPDF } from "../../../features/examReportSlice";

const { Title } = Typography;

const ExamReports = () => {
  const dispatch = useDispatch();
  const { reports, loading } = useSelector((state) => state.reports);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const handleExport = (format) => {
    dispatch(exportReportPDF(format));
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
      title: "Score",
      dataIndex: "score",
      key: "score",
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => {
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
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 24 }}
    >
      {/* Header */}
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

      {/* Table */}
      <div style={{ marginTop: 20 }}>
        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            bordered
          />
        )}
      </div>
    </Card>
  );
};

export default ExamReports;

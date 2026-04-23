import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";

const { Title, Text, Paragraph } = Typography;

const FALLBACK_HOMEWORK = [
  {
    _id: "demo-1",
    subject: "Mathematics",
    title: "Algebra Practice",
    description: "Solve questions from chapter 3",
    dueDate: "2026-04-30",
    status: "Pending",
  },
  {
    _id: "demo-2",
    subject: "Science",
    title: "Physics Assignment",
    description: "Write short notes on Motion",
    dueDate: "2026-04-20",
    status: "Submitted",
  },
];

const normalizeStatus = (status, dueDate) => {
  if (status === "Submitted") return "Submitted";
  if (!dueDate) return "Pending";
  return dayjs(dueDate).isBefore(dayjs(), "day") ? "Late" : "Pending";
};

const statusColor = (status) => {
  if (status === "Submitted") return "green";
  if (status === "Late") return "red";
  return "orange";
};

const StudentHomework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedHomework, setSelectedHomework] = useState(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const loadHomework = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get("/student-portal/me/homework");
      const apiHomework = res.data?.data?.homework || [];

      const normalized = apiHomework.map((item) => {
        const id = String(item?._id || item?.id || Math.random());
        const baseStatus = item?.submission ? "Submitted" : item?.status || "Pending";

        return {
          _id: id,
          subject:
            item?.subjectId?.name ||
            item?.subject?.name ||
            item?.subject ||
            "Subject",
          title: item?.title || item?.topic || "Homework",
          description: item?.description || "No description available",
          dueDate: item?.dueDate ? dayjs(item.dueDate).format("YYYY-MM-DD") : "",
          status: normalizeStatus(baseStatus, item?.dueDate),
        };
      });

      setHomeworkList(normalized);
    } catch (err) {
      setError(err?.response?.data?.message || "Homework API unavailable right now. Showing demo data.");
      setHomeworkList(FALLBACK_HOMEWORK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, []);

  const filteredHomework = useMemo(() => {
    return homeworkList.filter((item) => {
      const search = query.trim().toLowerCase();
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.subject.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [homeworkList, query, statusFilter]);

  const stats = useMemo(
    () => ({
      total: homeworkList.length,
      submitted: homeworkList.filter((item) => item.status === "Submitted").length,
      pending: homeworkList.filter((item) => item.status === "Pending").length,
      late: homeworkList.filter((item) => item.status === "Late").length,
    }),
    [homeworkList]
  );

  const openDetails = (hw) => {
    setSelectedHomework(hw);
    setOpen(true);
    setFileList([]);
  };

  const handleUpload = async () => {
    if (!selectedHomework) return;

    if (!fileList.length) {
      message.warning("Please choose at least one file.");
      return;
    }

    try {
      setUploading(true);
      await new Promise((resolve) => setTimeout(resolve, 700));

     const formData = new FormData();
      fileList.forEach((file) => {
        if (file?.originFileObj) {
          formData.append("attachments", file.originFileObj);
        }
      });

      await apiClient.post(
        `/student-portal/me/homework/${selectedHomework._id}/submit`,
        formData
      );

      setHomeworkList((prev) =>
        prev.map((item) =>
          item._id === selectedHomework._id ? { ...item, status: "Submitted" } : item
        )
      );

      message.success("Homework submitted successfully.");
      setOpen(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <Title level={3} style={{ margin: 0 }}>📘 My Homework</Title>

        {error && <Alert type="warning" showIcon message={error} />}

        <Space wrap>
          <Statistic title="Total" value={stats.total} />
          <Statistic title="Submitted" value={stats.submitted} />
          <Statistic title="Pending" value={stats.pending} />
          <Statistic title="Late" value={stats.late} />
        </Space>

        <Space wrap style={{ width: "100%" }}>
          <Input
            placeholder="Search by subject/title"
            prefix={<SearchOutlined />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "All Status" },
              { value: "Pending", label: "Pending" },
              { value: "Late", label: "Late" },
              { value: "Submitted", label: "Submitted" },
            ]}
          />

          <Button onClick={loadHomework}>Refresh</Button>
        </Space>

        {loading ? (
          <Card>
            <Spin />
          </Card>
        ) : (
          <List
            locale={{ emptyText: <Empty description="No homework found" /> }}
            itemLayout="vertical"
            dataSource={filteredHomework}
            renderItem={(item) => (
              <Card style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <FileTextOutlined />
                    <Text strong>{item.subject}</Text>
                  </Space>

                  <Title level={5} style={{ margin: 0 }}>{item.title}</Title>

                  <Space>
                    <ClockCircleOutlined />
                    <Text type="secondary">Due: {item.dueDate || "Not specified"}</Text>
                  </Space>

                  <Tag color={statusColor(item.status)}>{item.status}</Tag>

                  <Button type="link" onClick={() => openDetails(item)}>
                    View Details
                  </Button>
                </Space>
              </Card>
            )}
          />
        )}
      </Space>

      <Modal
        open={open}
        title="Homework Details"
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {selectedHomework && (
          <Space direction="vertical" style={{ width: "100%" }} size={10}>
            <Text strong>Subject: </Text>
            <Text>{selectedHomework.subject}</Text>

            <Text strong>Title: </Text>
            <Text>{selectedHomework.title}</Text>

            <Text strong>Description:</Text>
            <Paragraph style={{ marginTop: -8 }}>{selectedHomework.description}</Paragraph>

            {selectedHomework.status !== "Submitted" ? (
              <>
                <Upload
                  beforeUpload={() => false}
                  multiple
                  fileList={fileList}
                  onChange={({ fileList: files }) => setFileList(files)}
                >
                  <Button icon={<UploadOutlined />}>Upload Homework</Button>
                </Upload>

                <Button
                  type="primary"
                  block
                  loading={uploading}
                  onClick={handleUpload}
                >
                  Submit Homework
                </Button>
              </>
            ) : (
              <Tag color="green">Already Submitted</Tag>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default StudentHomework
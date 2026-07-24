import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
  Slider,
} from "antd";
import {
  BookOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  statGrid,
  statCard,
  statLabel,
  statValue,
  toolbarRow,
  pill,
} from "../../../styles/pageStyles";

const { Text, Paragraph } = Typography;

const normalizeStatus = (status, dueDate) => {
  if (status === "Submitted") return "Submitted";
  if (!dueDate) return "Pending";
  return dayjs(dueDate).isBefore(dayjs(), "day") ? "Late" : "Pending";
};

const statusColor = (status) => {
  if (status === "Submitted") return { color: "#22C55E", bg: "rgba(220,252,231,0.15)" };
  if (status === "Late") return { color: "#EF4444", bg: "#fff1f2" };
  return { color: "#F59E0B", bg: "#fffbeb" };
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
  const [rubric, setRubric] = useState({ quality: 0, clarity: 0, timeliness: 0 });
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
          grade: item?.submission?.grade ?? null,
          feedback: item?.submission?.feedback || "",
          submissionId: item?.submission?._id || null,
        };
      });

      setHomeworkList(normalized);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load homework. Please try again.");
      setHomeworkList([]);
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
    setRubric({ quality: 0, clarity: 0, timeliness: 0 });
  };

  const rubricScore = Math.round((rubric.quality + rubric.clarity + rubric.timeliness) / 3);

  const plagiarismRisk = useMemo(() => {
    if (!selectedHomework || !fileList.length) return 0;
    const tokens = selectedHomework.title.toLowerCase().split(/\s+/).filter(Boolean);
    const filenames = fileList.map((f) => String(f.name || f.originFileObj?.name || '').toLowerCase()).join(' ');
    const overlap = tokens.filter((t) => filenames.includes(t)).length;
    return Math.min(100, Math.round((overlap / Math.max(tokens.length, 1)) * 100));
  }, [selectedHomework, fileList]);

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

  const STAT_ITEMS = [
    { label: "Total", value: stats.total, color: "var(--primary)" },
    { label: "Submitted", value: stats.submitted, color: "#22C55E" },
    { label: "Pending", value: stats.pending, color: "#F59E0B" },
    { label: "Late", value: stats.late, color: "#EF4444" },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Homework"
        subtitle="Track and submit your assignments"
        icon={<BookOutlined />}
      />

      {error && <Alert type="warning" showIcon message={error} style={{ margin: "16px 0" }} />}

      <div className="stat-grid" style={{ ...statGrid(140), margin: "16px 0" }}>
        {STAT_ITEMS.map((s) => (
          <div key={s.label} style={statCard({ color: s.color })}>
            <div>
              <div style={statLabel(s.color)}>{s.label}</div>
              <div style={statValue(s.color)}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={pageCard}>
        <div className="page-toolbar" style={toolbarRow}>
          <Input
            placeholder="Search by subject/title"
            prefix={<SearchOutlined />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 260 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "All Status" },
              { value: "Pending", label: "Pending" },
              { value: "Late", label: "Late" },
              { value: "Submitted", label: "Submitted" },
            ]}
          />
          <Button onClick={loadHomework}>Refresh</Button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <List
            locale={{ emptyText: <Empty description="No homework found" /> }}
            itemLayout="vertical"
            dataSource={filteredHomework}
            renderItem={(item) => {
              const sc = statusColor(item.status);
              return (
                <div
                  key={item._id}
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border-muted)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 20, color: "var(--primary)", marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{item.subject}</div>
                    <Space wrap size={8}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        Due: {item.dueDate || "Not specified"}
                      </span>
                      <span style={pill(sc.color, sc.bg)}>{item.status}</span>
                      {item.grade !== null && item.grade !== undefined && (
                        <span style={pill("#22C55E", "rgba(220,252,231,0.15)")}>Grade: {item.grade}/100</span>
                      )}
                    </Space>
                  </div>
                  <Button type="link" style={{ padding: 0 }} onClick={() => openDetails(item)}>
                    View Details
                  </Button>
                </div>
              );
            }}
          />
        )}
      </div>

      <Modal
        open={open}
        title="Homework Details"
        onCancel={() => setOpen(false)}
        footer={null}
        centered
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
                <div style={sectionPanel}>
                  <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Rubric Self-Check (before submit)</div>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text>Quality</Text>
                    <Slider value={rubric.quality} onChange={(v) => setRubric((p) => ({ ...p, quality: v }))} />
                    <Text>Clarity</Text>
                    <Slider value={rubric.clarity} onChange={(v) => setRubric((p) => ({ ...p, clarity: v }))} />
                    <Text>Timeliness</Text>
                    <Slider value={rubric.timeliness} onChange={(v) => setRubric((p) => ({ ...p, timeliness: v }))} />
                    <Tag color="blue">Rubric Score Preview: {rubricScore}/100</Tag>
                  </Space>
                </div>

                <Upload
                  beforeUpload={() => false}
                  multiple
                  fileList={fileList}
                  onChange={({ fileList: files }) => setFileList(files)}
                >
                  <Button icon={<UploadOutlined />}>Upload Homework</Button>
                </Upload>
                <Tag color={plagiarismRisk > 70 ? "red" : plagiarismRisk > 40 ? "orange" : "green"}>
                  Basic Similarity Check: {plagiarismRisk}%
                </Tag>
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
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <Tag color="green">Already Submitted</Tag>
                {selectedHomework.grade !== null && selectedHomework.grade !== undefined && (
                  <div style={{ ...sectionPanel, padding: "12px 16px", background: "rgba(220,252,231,0.15)", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#22C55E", marginBottom: 6 }}>Teacher Feedback</div>
                    <Space wrap>
                      <Tag color="blue" style={{ fontSize: 14, padding: "2px 12px" }}>
                        Grade: {selectedHomework.grade}/100
                      </Tag>
                    </Space>
                    {selectedHomework.feedback && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-primary)" }}>{selectedHomework.feedback}</div>
                    )}
                  </div>
                )}
              </Space>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default StudentHomework;

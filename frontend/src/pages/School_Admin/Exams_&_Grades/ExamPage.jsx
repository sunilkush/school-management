import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Dropdown,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Drawer,
  Descriptions,
} from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileDoneOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import memoryStorage from "../../../utils/memoryStorage";
import {
  deleteExam,
  getExamAnalytics,
  getExams,
  publishExam,
  publishResults,
} from "../../../features/examSlice.js";
import ExamPageHeader from "../../../components/exams/ExamPageHeader";
import ExamStatCards from "../../../components/exams/ExamStatCards";

const { Text } = Typography;

const statusColor = {
  published: "green",
  draft: "gold",
  completed: "purple",
};

const ExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], loading, analytics, pagination, error } = useSelector((state) => state.exams || {});
  const { selectedAcademicYear: selectedAcademicYearFromState } = useSelector((state) => state.academicYear || {});

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const selectedAcademicYear = useMemo(() => {
    if (selectedAcademicYearFromState?._id) return selectedAcademicYearFromState;
    const storedAcademicYear = memoryStorage.getItem("selectedAcademicYear");
    return storedAcademicYear ? JSON.parse(storedAcademicYear) : null;
  }, [selectedAcademicYearFromState]);

  const academicYearId = selectedAcademicYear?._id || null;
  const schoolId = selectedAcademicYear?.schoolId || null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!schoolId || !academicYearId) return;

    const params = {
      schoolId,
      academicYearId,
      page,
      limit: pageSize,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    };
    dispatch(getExams(params));
  }, [schoolId, academicYearId, dispatch, statusFilter, search, page, pageSize]);

  const summary = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((exam) => exam.status === "published").length;
    const draft = exams.filter((exam) => exam.status === "draft").length;
    const completed = exams.filter((exam) => exam.status === "completed").length;
    return { total, published, draft, completed };
  }, [exams]);

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteExam(id)).unwrap();
      message.success("Exam deleted successfully");
    } catch {
      message.error("Failed to delete exam");
    }
  };

  const handlePublishResult = async (record, publish = true) => {
    try {
      await dispatch(
        publishResults({
          examId: record._id,
          schoolClassId: record.schoolClassId?._id || record.schoolClassId,
          sectionId: record.sectionId?._id || record.sectionId,
          publish,
        })
      ).unwrap();
      message.success(publish ? "Results published" : "Results unpublished");
    } catch (err) {
      message.error(err || "Failed to update result status");
    }
  };

  const handleViewAnalytics = async (record) => {
    try {
      await dispatch(getExamAnalytics(record?._id)).unwrap();
      setAnalyticsOpen(true);
    } catch (err) {
      message.error(err || "Failed to fetch analytics");
    }
  };

  const handleExamStatusChange = async (record, status) => {
    try {
      await dispatch(publishExam({ examId: record._id, status })).unwrap();
      message.success(`Exam moved to ${status}`);
      dispatch(getExams({ schoolId, academicYearId, page, limit: pageSize }));
    } catch (err) {
      message.error(err || "Failed to update exam status");
    }
  };

  const columns = [
    {
      title: "Exam",
      dataIndex: "title",
      render: (text, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.examCode || "No code"}</Text>
        </Space>
      ),
      fixed: "left",
      width: 220,
    },
    {
      title: "Class / Subject",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>{row.schoolClassId?.name || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{row.subjectId?.name || "-"}</Text>
        </Space>
      ),
      width: 180,
    },
    {
      title: "Type",
      dataIndex: "examType",
      render: (type) => <Tag color="blue">{String(type || "-").toUpperCase()}</Tag>,
      width: 130,
    },
    {
      title: "Window",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>{row.startTime ? dayjs(row.startTime).format("DD MMM YYYY, hh:mm A") : "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ends {row.endTime ? dayjs(row.endTime).format("DD MMM YYYY, hh:mm A") : "-"}
          </Text>
        </Space>
      ),
      width: 230,
    },
    {
      title: "Marks",
      render: (_, row) => `${row.passingMarks ?? 0} / ${row.totalMarks ?? 0}`,
      width: 110,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <Tag color={statusColor[status] || "default"}>{status?.toUpperCase()}</Tag>,
      width: 120,
    },
    {
      title: "Actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit",
                onClick: () => navigate(`/dashboard/schooladmin/exams/edit/${record._id}`),
              },
              {
                key: "status",
                icon: <CheckCircleOutlined />,
                label: "Move to published",
                onClick: () => handleExamStatusChange(record, "published"),
              },
              {
                key: "draft",
                label: "Move to draft",
                onClick: () => handleExamStatusChange(record, "draft"),
              },
              {
                key: "publish-result",
                label: "Publish result",
                onClick: () => handlePublishResult(record, true),
              },
              {
                key: "unpublish-result",
                label: "Unpublish result",
                onClick: () => handlePublishResult(record, false),
              },
              {
                key: "analytics",
                icon: <EyeOutlined />,
                label: "View analytics",
                onClick: () => handleViewAnalytics(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                danger: true,
                label: "Delete",
                onClick: () => handleDelete(record._id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <ExamPageHeader
          title="Exam Operations"
          subtitle="Manage exam lifecycle, publishing, and performance from one workspace."
          breadcrumbItems={[{ title: "Dashboard" }, { title: "Exams" }, { title: "Exam List" }]}
          actions={[
            <Select
              key="status"
              value={statusFilter}
              style={{ width: 150 }}
              onChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
              options={["all", "draft", "published", "completed"].map((status) => ({
                label: status.charAt(0).toUpperCase() + status.slice(1),
                value: status,
              }))}
            />,
            <Input.Search
              key="search"
              allowClear
              placeholder="Search exam title or code"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              style={{ width: 280 }}
            />,
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/dashboard/schooladmin/exams/exams-create")}
            >
              Create Exam
            </Button>,
          ]}
        />
      </Card>

      <ExamStatCards
        items={[
          { key: "total", title: "Total Exams", value: summary.total, prefix: <FileDoneOutlined /> },
          { key: "published", title: "Published", value: summary.published, prefix: <CheckCircleOutlined />, valueStyle: { color: "#389e0d" } },
          { key: "draft", title: "Draft", value: summary.draft, prefix: <ClockCircleOutlined />, valueStyle: { color: "#d48806" } },
          { key: "completed", title: "Completed", value: summary.completed, prefix: <BarChartOutlined />, valueStyle: { color: "#531dab" } },
        ]}
      />

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={exams}
          rowKey="_id"
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total: pagination?.total || exams.length,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description={error ? "Unable to load exams. Retry with different filters." : "No exams found"}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      <Drawer
        title="Exam Analytics"
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        width={680}
      >
        {analytics ? (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Exam">{analytics.exam?.title}</Descriptions.Item>
              <Descriptions.Item label="Class">{analytics.exam?.schoolClassId?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="Subject">{analytics.exam?.subjectId?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="Risk Level">{analytics.enterpriseInsights?.riskLevel?.toUpperCase()}</Descriptions.Item>
              <Descriptions.Item label="Recommendation">{analytics.enterpriseInsights?.recommendation}</Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <Empty description="No analytics available" />
        )}
      </Drawer>
    </Space>
  );
};

export default ExamsPage;

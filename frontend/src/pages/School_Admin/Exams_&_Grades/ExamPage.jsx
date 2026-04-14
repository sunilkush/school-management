import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Card,
  Tag,
  Typography,
  Empty,
  Select,
  Drawer,
  Descriptions,
  Statistic,
  Row,
  Col,
  Input,
  Segmented,
  Tooltip,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getExams, deleteExam, publishResults, getExamAnalytics, publishExam } from "../../../features/examSlice.js";
import { useDispatch, useSelector } from "react-redux";
import memoryStorage from "../../../utils/memoryStorage";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ✅ Redux State */
  const { exams = [], loading, analytics, pagination } = useSelector((state) => state.exams || {});
  const { selectedAcademicYear: selectedAcademicYearFromState } = useSelector((state) => state.academicYear || {});
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  /* ✅ Academic Year + School */
  const selectedAcademicYear = useMemo(() => {
    if (selectedAcademicYearFromState?._id) return selectedAcademicYearFromState;
    const storeAcadmicYear = memoryStorage.getItem("selectedAcademicYear");
    return storeAcadmicYear ? JSON.parse(storeAcadmicYear) : null;
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


  /* ✅ Fetch Exams */
  useEffect(() => {
    if (schoolId && academicYearId) {
      const params = {
        schoolId,
        academicYearId,
        page,
        limit: pageSize,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      dispatch(getExams(params));
    }
  }, [schoolId, academicYearId, dispatch, statusFilter, search, page, pageSize]);

  /* ✅ Delete Handler */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteExam(id)).unwrap();
      message.success("Exam deleted successfully");
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      message.error(error || "Failed to update result status");
    }
  };

  const handleViewAnalytics = async (record) => {
    try {
      await dispatch(getExamAnalytics(record?._id)).unwrap();
      setAnalyticsOpen(true);
    } catch (error) {
      message.error(error || "Failed to fetch analytics");
    }
  };

  const handleExamStatusChange = async (record, status) => {
    try {
      await dispatch(publishExam({ examId: record._id, status })).unwrap();
      message.success(`Exam moved to ${status}`);
      dispatch(getExams({ schoolId, academicYearId, page, limit: pageSize }));
    } catch (error) {
      message.error(error || "Failed to update exam status");
    }
  };

    /* ✅ Safe Date Formatter */
  const formatDate = (date) => {
    if (!date) return "-";
    return dayjs(date).format("DD MMM YYYY hh:mm A");
  };

  /* ✅ Table Columns */
  const columns = [
    {
      title: "Exam Title",
      dataIndex: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Code",
      dataIndex: "examCode",
      render: (code) => code || "-",
    },
    {
      title: "Type",
      dataIndex: "examType",
      render: (type) => <Tag color="blue">{type?.toUpperCase()}</Tag>,
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      render: formatDate,
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      render: formatDate,
    },
    {
      title: "Total Marks",
      dataIndex: "totalMarks",
    },
    {
      title: "Passing Marks",
      dataIndex: "passingMarks",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color =
          status === "published"
            ? "green"
            : status === "completed"
            ? "purple"
            : "orange";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space wrap>
          <Popconfirm title="Edit Exam?" onClick={() => {
  if (!record?._id) {
    message.error("Invalid exam id");
    return;
  }
  navigate(`/dashboard/schooladmin/exams/edit/${record._id}`);
}}>
            <Button type="primary" icon={<EditOutlined />} />
          </Popconfirm>

          <Popconfirm title="Delete Exam?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>

          <Select
            value={record?.status}
            style={{ width: 120 }}
            onChange={(value) => handleExamStatusChange(record, value)}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
            ]}
          />
          <Button size="small" onClick={() => handlePublishResult(record, true)}>Publish Result</Button>
          <Button size="small" onClick={() => handlePublishResult(record, false)}>Unpublish</Button>
          <Tooltip title="Class performance analytics">
            <Button size="small" icon={<BarChartOutlined />} onClick={() => handleViewAnalytics(record)}>
              Analytics
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const summary = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((exam) => exam.status === "published").length;
    const draft = exams.filter((exam) => exam.status === "draft").length;
    const completed = exams.filter((exam) => exam.status === "completed").length;

    return { total, published, draft, completed };
  }, [exams]);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="Total Exams" prefix={<FileDoneOutlined />} value={summary.total} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="Published" prefix={<CheckCircleOutlined />} value={summary.published} valueStyle={{ color: "#389e0d" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="Draft" prefix={<ClockCircleOutlined />} value={summary.draft} valueStyle={{ color: "#d48806" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="Completed" prefix={<BarChartOutlined />} value={summary.completed} valueStyle={{ color: "#531dab" }} />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }}>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          📘 Exams Management
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            navigate("/dashboard/schooladmin/exams/exams-create")
          }
        >
          Create Exam
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Search by exam title/code"
           value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          style={{ width: 300 }}
        />
        <Text type="secondary">Filter by status:</Text>
        <Segmented
          value={statusFilter}
          onChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          options={["all", "draft", "published", "completed"].map((status) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status,
          }))}
        />
      </Space>
      <Divider style={{ marginTop: 0 }} />

      <Table
        loading={loading}
        columns={columns}
        dataSource={exams}
        rowKey="_id"
        bordered
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
              description="No exams found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />

      <Drawer
        title="Enterprise Exam Analytics"
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
              <Descriptions.Item label="Recommendation">
                {analytics.enterpriseInsights?.recommendation}
              </Descriptions.Item>
            </Descriptions>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Statistic title="Students Evaluated" value={analytics.evaluation?.studentsEvaluated || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="Avg Marks" value={analytics.evaluation?.averageObtainedMarks || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="Pass %" value={analytics.evaluation?.passPercentage || 0} suffix="%" />
              </Col>
            </Row>
          </>
        ) : (
          <Empty description="No analytics available" />
        )}
      </Drawer>
      </Card>
    </Space>
  );
};

export default ExamsPage;

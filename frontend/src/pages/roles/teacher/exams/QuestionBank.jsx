import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Button,
  Modal,
  FloatButton,
  Spin,
  Empty,
  message,
  Typography,
  Space,
  Divider,
  Avatar,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FilterOutlined,
  BookOutlined,
  FileTextOutlined,
  UploadOutlined,
  ReloadOutlined,
  SearchOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

import { getQuestions, deleteQuestion } from "../../../../features/questionSlice";
import { fetchAssignedClasses } from "../../../../features/classSlice";
import apiClient from "../../../../api/httpClient";

import CreateQuestion from "./CreateQuestion";
import BulkUploadQuestions from "./BulkUploadQuestions";

const { Title, Text } = Typography;

const QuestionBank = () => {
  const dispatch = useDispatch();

  const { questions = [], loading } = useSelector((s) => s.questions || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector(
    (s) => s.class || {}
  );
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { user } = useSelector((state) => state.auth || {});

  const schoolId = user?.schoolId?._id || user?.schoolId || user?.school?._id;

  const [modalType, setModalType] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [filters, setFilters] = useState({
    schoolClassId: "",
    subjectId: "",
    chapterId: "",
    search: "",
  });

  const [chapterOptions, setChapterOptions] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
  }, [dispatch, selectedAcademicYear?._id]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(getQuestions({ schoolId, limit: 1000 }));
  }, [dispatch, schoolId]);

  const getId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value._id : value;
  };

  const selectedClass = useMemo(() => {
    if (!filters.schoolClassId) return null;

    return (
      classAssignTeacher.find(
        (cls) => String(getId(cls?._id)) === String(filters.schoolClassId)
      ) || null
    );
  }, [classAssignTeacher, filters.schoolClassId]);

  const subjectOptions = useMemo(() => {
    if (!selectedClass) return [];

    const subjectMap = new Map();

    const addSubject = (subjectLike) => {
      const subjectId = String(
        getId(subjectLike?.subjectId || subjectLike?._id || subjectLike?.id) || ""
      );

      const subjectName =
        subjectLike?.subjectId?.name ||
        subjectLike?.name ||
        subjectLike?.subjectName ||
        "";

      if (!subjectId || !subjectName) return;
      if (subjectMap.has(subjectId)) return;

      subjectMap.set(subjectId, {
        value: subjectId,
        label: subjectName,
      });
    };

    (selectedClass?.subjects || []).forEach(addSubject);

    (selectedClass?.sections || []).forEach((section) => {
      (section?.subjects || []).forEach(addSubject);
    });

    return Array.from(subjectMap.values());
  }, [selectedClass]);

  useEffect(() => {
    if (!filters.schoolClassId) {
      setFilters((prev) => ({
        ...prev,
        subjectId: "",
        chapterId: "",
      }));
      return;
    }

    if (!subjectOptions.length) {
      setFilters((prev) => ({
        ...prev,
        subjectId: "",
        chapterId: "",
      }));
      return;
    }

    const currentSubjectStillValid = subjectOptions.some(
      (subject) => String(subject.value) === String(filters.subjectId)
    );

    if (!currentSubjectStillValid) {
      setFilters((prev) => ({
        ...prev,
        subjectId: "",
        chapterId: "",
      }));
    }
  }, [filters.schoolClassId, subjectOptions, filters.subjectId]);

  useEffect(() => {
    const fetchChaptersBySubject = async () => {
      if (!filters.schoolClassId || !filters.subjectId) {
        setChapterOptions([]);
        return;
      }

      try {
        setChapterLoading(true);

        const res = await apiClient.get("/chapters", {
          params: {
            schoolClassId: filters.schoolClassId,
            subjectId: filters.subjectId,
            page: 1,
            limit: 1000,
          },
        });

        const chapters = res?.data?.data || [];

        setChapterOptions(
          chapters.map((chapter) => ({
            value: chapter?._id,
            label:
              chapter?.chapterNo && chapter?.name
                ? `${chapter.chapterNo}. ${chapter.name}`
                : chapter?.name || "Untitled Chapter",
          }))
        );
      } catch (error) {
        setChapterOptions([]);
        message.error(
          error?.response?.data?.message || "Failed to fetch chapters"
        );
      } finally {
        setChapterLoading(false);
      }
    };

    fetchChaptersBySubject();
  }, [filters.schoolClassId, filters.subjectId]);

  const permissionMap = useMemo(() => {
    const classIds = new Set();
    const subjectIdsByClass = new Map();

    classAssignTeacher.forEach((cls) => {
      const classId = String(getId(cls?._id) || "");
      if (!classId) return;

      classIds.add(classId);

      const subjectIds = new Set();

      (cls?.subjects || []).forEach((sub) => {
        const subjectId = String(getId(sub?.subjectId) || "");
        if (subjectId) subjectIds.add(subjectId);
      });

      (cls?.sections || []).forEach((section) => {
        (section?.subjects || []).forEach((sub) => {
          const subjectId = String(getId(sub?.subjectId) || "");
          if (subjectId) subjectIds.add(subjectId);
        });
      });

      subjectIdsByClass.set(classId, subjectIds);
    });

    return { classIds, subjectIdsByClass };
  }, [classAssignTeacher]);

  const filteredQuestions = useMemo(() => {
    const searchText = filters.search.trim().toLowerCase();

    return questions.filter((q) => {
      const questionClassId = String(getId(q.schoolClassId) || "");
      const questionSubjectId = String(getId(q.subjectId) || "");
      const questionChapterId = String(getId(q.chapterId) || "");

      if (!permissionMap.classIds.has(questionClassId)) return false;

      const allowedSubjects = permissionMap.subjectIdsByClass.get(questionClassId);
      if (allowedSubjects?.size && !allowedSubjects.has(questionSubjectId)) {
        return false;
      }

      const matchesClass =
        !filters.schoolClassId || questionClassId === filters.schoolClassId;

      const matchesSubject =
        !filters.subjectId || questionSubjectId === filters.subjectId;

      const matchesChapter =
        !filters.chapterId || questionChapterId === filters.chapterId;

      const matchesSearch =
        !searchText || q.statement?.toLowerCase().includes(searchText);

      return matchesClass && matchesSubject && matchesChapter && matchesSearch;
    });
  }, [questions, filters, permissionMap]);

  const stats = useMemo(() => {
    return {
      total: filteredQuestions.length,
      mcq: filteredQuestions.filter((q) =>
        String(q.questionType || "").toLowerCase().includes("mcq")
      ).length,
      tf: filteredQuestions.filter(
        (q) => String(q.questionType || "").toLowerCase() === "true_false"
      ).length,
      fill: filteredQuestions.filter(
        (q) => String(q.questionType || "").toLowerCase() === "fill_blank"
      ).length,
    };
  }, [filteredQuestions]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      schoolClassId: "",
      subjectId: "",
      chapterId: "",
      search: "",
    });
    setChapterOptions([]);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Question?",
      content: "Are you sure you want to delete this question?",
      okText: "Delete",
      okType: "danger",
      centered: true,
      onOk: async () => {
        try {
          setDeletingId(id);
          await dispatch(deleteQuestion(id));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const getQuestionTypeColor = (type) => {
    const value = String(type || "").toLowerCase();
    if (value.includes("mcq")) return "blue";
    if (value === "true_false") return "green";
    if (value === "fill_blank") return "orange";
    return "default";
  };

  const getDifficultyColor = (difficulty) => {
    const value = String(difficulty || "").toLowerCase();
    if (value === "easy") return "green";
    if (value === "medium") return "gold";
    if (value === "hard") return "red";
    return "default";
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "linear-gradient(180deg, #f8fbff 0%, #f3f6fb 55%, #eef2f7 100%)",
        padding: 16,
      }}
    >
      {/* Header */}
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(24,144,255,0.10), rgba(82,196,26,0.06), #ffffff)",
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space align="start" size={16}>
              <Avatar
                size={56}
                icon={<BookOutlined />}
                style={{
                  background:
                    "linear-gradient(135deg, #1677ff 0%, #4096ff 100%)",
                  boxShadow: "0 8px 20px rgba(22, 119, 255, 0.25)",
                }}
              />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Question Bank
                </Title>
                <Text type="secondary">
                  Manage, search, filter and organize questions class-wise,
                  subject-wise and chapter-wise.
                </Text>
                <div style={{ marginTop: 10 }}>
                  <Space wrap>
                    <Tag color="processing">
                      Academic Year: {selectedAcademicYear?.name || "Not Selected"}
                    </Tag>
                    <Tag color="default">
                      Assigned Classes: {classAssignTeacher?.length || 0}
                    </Tag>
                    <Tag color="success">
                      Visible Questions: {filteredQuestions.length}
                    </Tag>
                  </Space>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Button
                icon={<UploadOutlined />}
                size="large"
                onClick={() => setModalType("bulk")}
              >
                Bulk Upload
              </Button>

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setModalType("single")}
              >
                Add Question
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Filter Toolbar */}
      <Card
        bordered={false}
        className="sticky top-0 z-20"
        style={{
          marginBottom: 16,
          borderRadius: 18,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
          backdropFilter: "blur(10px)",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Select
              size="large"
              placeholder="Select Class"
              allowClear
              showSearch
              optionFilterProp="children"
              loading={classLoading}
              style={{ width: "100%" }}
              value={filters.schoolClassId || undefined}
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  schoolClassId: value || "",
                  subjectId: "",
                  chapterId: "",
                }));
              }}
            >
              {classAssignTeacher.map((cls) => (
                <Select.Option key={cls._id} value={cls._id}>
                  {cls.name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={6}>
            <Select
              size="large"
              placeholder="Select Subject"
              allowClear
              showSearch
              optionFilterProp="children"
              disabled={!selectedClass}
              style={{ width: "100%" }}
              value={filters.subjectId || undefined}
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  subjectId: value || "",
                  chapterId: "",
                }));
              }}
            >
              {subjectOptions.map((subject) => (
                <Select.Option key={subject.value} value={subject.value}>
                  {subject.label}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={6}>
            <Select
              size="large"
              placeholder="Select Chapter"
              allowClear
              showSearch
              optionFilterProp="label"
              disabled={!filters.subjectId}
              loading={chapterLoading}
              style={{ width: "100%" }}
              value={filters.chapterId || undefined}
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  chapterId: value || "",
                }));
              }}
              options={chapterOptions}
            />
          </Col>

          <Col xs={24} md={6}>
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search question statement..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value || "",
                }))
              }
            />
          </Col>

          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Space wrap>
                <Tag
                  icon={<FilterOutlined />}
                  color={activeFilterCount ? "processing" : "default"}
                  style={{ paddingInline: 10, borderRadius: 999 }}
                >
                  Active Filters: {activeFilterCount}
                </Tag>

                {filters.schoolClassId && (
                  <Tag closable onClose={() => setFilters((p) => ({ ...p, schoolClassId: "", subjectId: "", chapterId: "" }))}>
                    Class
                  </Tag>
                )}
                {filters.subjectId && (
                  <Tag closable onClose={() => setFilters((p) => ({ ...p, subjectId: "", chapterId: "" }))}>
                    Subject
                  </Tag>
                )}
                {filters.chapterId && (
                  <Tag closable onClose={() => setFilters((p) => ({ ...p, chapterId: "" }))}>
                    Chapter
                  </Tag>
                )}
                {filters.search && (
                  <Tag closable onClose={() => setFilters((p) => ({ ...p, search: "" }))}>
                    Search
                  </Tag>
                )}
              </Space>

              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={clearFilters}
                  disabled={!activeFilterCount}
                >
                  Reset Filters
                </Button>

                <Button
                  icon={<AppstoreOutlined />}
                  onClick={() => dispatch(getQuestions({ schoolId, limit: 1000 }))}
                >
                  Refresh
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          {
            label: "Total Questions",
            value: stats.total,
            icon: <FileTextOutlined />,
            extra: "All filtered records",
          },
          {
            label: "MCQ",
            value: stats.mcq,
            icon: <CheckCircleOutlined />,
            extra: "Multiple choice questions",
          },
          {
            label: "True / False",
            value: stats.tf,
            icon: <CheckCircleOutlined />,
            extra: "Binary answer questions",
          },
          {
            label: "Fill in the Blank",
            value: stats.fill,
            icon: <EditOutlined />,
            extra: "Blank-based practice",
          },
        ].map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.label}>
            <Card
              bordered={false}
              style={{
                borderRadius: 18,
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
                height: "100%",
              }}
              bodyStyle={{ padding: 18 }}
            >
              <Space align="start" size={14}>
                <Avatar
                  shape="square"
                  size={48}
                  icon={item.icon}
                  style={{
                    background: "#e6f4ff",
                    color: "#1677ff",
                    borderRadius: 14,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <Text type="secondary">{item.label}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Statistic value={item.value} valueStyle={{ fontSize: 28 }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.extra}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Content */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        }}
        bodyStyle={{ padding: 18 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Question List
            </Title>
            <Text type="secondary">
              Easily review and manage question records.
            </Text>
          </div>

          <Tag color="blue" style={{ paddingInline: 12, borderRadius: 999 }}>
            Showing {filteredQuestions.length} question(s)
          </Tag>
        </div>

        <Divider style={{ marginTop: 12, marginBottom: 16 }} />

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Loading questions...</Text>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Empty
            description="No questions found for the selected filters"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space wrap>
              <Button onClick={clearFilters}>Clear Filters</Button>
              <Button type="primary" onClick={() => setModalType("single")}>
                Add New Question
              </Button>
            </Space>
          </Empty>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredQuestions}
            split={false}
            renderItem={(q, index) => {
              const className =
                q?.schoolClassId?.name ||
                selectedClass?.name ||
                "Unknown Class";

              const subjectName =
                q?.subjectId?.name || q?.subjectName || "Unknown Subject";

              const chapterName =
                q?.chapterId?.name || "No Chapter";

              return (
                <List.Item style={{ padding: 0, marginBottom: 14 }}>
                  <Card
                    hoverable
                    bordered={false}
                    style={{
                      borderRadius: 18,
                      background:
                        "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
                      border: "1px solid #f0f0f0",
                    }}
                    bodyStyle={{ padding: 18 }}
                  >
                    <Row gutter={[16, 16]} align="top">
                      <Col xs={24} md={18}>
                        <Space align="start" size={12}>
                          <Avatar
                            shape="square"
                            size={40}
                            style={{
                              background: "#1677ff",
                              borderRadius: 12,
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </Avatar>

                          <div style={{ flex: 1 }}>
                            <Title
                              level={5}
                              style={{
                                margin: 0,
                                lineHeight: 1.5,
                                fontSize: 16,
                              }}
                            >
                              {q.statement || "No question statement"}
                            </Title>

                            <div style={{ marginTop: 10 }}>
                              <Space size={[8, 8]} wrap>
                                <Tag color={getQuestionTypeColor(q.questionType)}>
                                  {q.questionType || "Unknown Type"}
                                </Tag>

                                <Tag color={getDifficultyColor(q.difficulty)}>
                                  {q.difficulty || "No Difficulty"}
                                </Tag>

                                <Tag color="purple">{className}</Tag>
                                <Tag color="cyan">{subjectName}</Tag>
                                <Tag>{chapterName}</Tag>
                                <Tag color="gold">Marks: {q.marks ?? 0}</Tag>
                              </Space>
                            </div>
                          </div>
                        </Space>
                      </Col>

                      <Col xs={24} md={6}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Tooltip title="Delete Question">
                            <Button
                              danger
                              type="default"
                              icon={<DeleteOutlined />}
                              loading={deletingId === q._id}
                              onClick={() => handleDelete(q._id)}
                            >
                              Delete
                            </Button>
                          </Tooltip>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      {/* Floating Actions */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 20 }}
        icon={<PlusOutlined />}
      >
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="Add Question"
          onClick={() => setModalType("single")}
        />
        <FloatButton
          icon={<UploadOutlined />}
          tooltip="Bulk Upload"
          onClick={() => setModalType("bulk")}
        />
      </FloatButton.Group>

      {/* Modal */}
      <Modal
        open={!!modalType}
        footer={null}
        width={900}
        destroyOnClose
        centered
        onCancel={() => setModalType(null)}
      >
        {modalType === "single" && <CreateQuestion />}
        {modalType === "bulk" && <BulkUploadQuestions />}
      </Modal>
    </div>
  );
};

export default QuestionBank;
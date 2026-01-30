import React, { useEffect, useState } from "react";
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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

import { getQuestions, deleteQuestion } from "../../../features/questionSlice";
import { fetchAllClasses } from "../../../features/classSlice";

import CreateQuestion from "./CreateQuestion";
import BulkUploadQuestions from "./BulkUploadQuestions";

const QuestionBank = () => {
  const dispatch = useDispatch();

  /* ================= Redux ================= */
  const { questions = [], loading } = useSelector((s) => s.questions);
  const { classList = [], loading: classLoading } = useSelector(
    (s) => s.class || {}
  );

  /* ================= Local State ================= */
  const [modalType, setModalType] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [filters, setFilters] = useState({
    classId: "",
    subjectId: "",
    chapter: "",
    search: "",
  });

  const [selectedClass, setSelectedClass] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedSubject, setSelectedSubject] = useState(null);

  /* ================= User ================= */
  const user = JSON.parse(localStorage.getItem("user"));
  const schoolId = user?.school?._id;

  /* ================= Effects ================= */
  useEffect(() => {
    if (schoolId) dispatch(fetchAllClasses({ schoolId }));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (schoolId) dispatch(getQuestions({ schoolId, ...filters }));
  }, [dispatch, schoolId, filters]);

  /* ================= Delete ================= */
  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Question?",
      content: "Are you sure you want to delete this question?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        setDeletingId(id);
        await dispatch(deleteQuestion(id));
        setDeletingId(null);
      },
    });
  };

  /* ================= Stats ================= */
  const stats = {
    total: questions.length,
    mcq: questions.filter((q) => q.questionType?.includes("mcq")).length,
    tf: questions.filter((q) => q.questionType === "true_false").length,
    fill: questions.filter((q) => q.questionType === "fill_blank").length,
  };

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      {/* ================= Filters ================= */}
      <Card className="sticky top-0 z-30" bodyStyle={{ padding: 16 }}>
  <Row gutter={[16, 16]}>

    {/* ================= Class ================= */}
    <Col xs={24} md={6}>
      <Select
        placeholder="Select Class"
        allowClear
        loading={classLoading}
        style={{ width: "100%" }}
        value={filters.classId || undefined}
        onChange={(value) => {
          const cls = classList.find((c) => c._id === value);

          setSelectedClass(cls || null);
          setSelectedSubject(null);

          setFilters({
            ...filters,
            classId: value || "",
            subjectId: "",
            chapter: "",
          });
        }}
      >
        {classList.map((cls) => (
          <Select.Option key={cls._id} value={cls._id}>
            {cls.name}
          </Select.Option>
        ))}
      </Select>
    </Col>

    {/* ================= Subject ================= */}
    <Col xs={24} md={6}>
      <Select
        placeholder="Select Subject"
        allowClear
        disabled={!selectedClass}
        style={{ width: "100%" }}
        value={filters.subjectId || undefined}
        onChange={(value) => {
          const sub = selectedClass?.subjects?.find(
            (s) => s.subjectId?._id === value
          );

          setSelectedSubject(sub || null);

          setFilters({
            ...filters,
            subjectId: value || "",
            chapter: "",
          });
        }}
      >
        {selectedClass?.subjects
          ?.filter((s) => s.subjectId) // null subject hatao
          .map((sub) => (
            <Select.Option
              key={sub.subjectId._id}
              value={sub.subjectId._id}
            >
              {sub.subjectId.name}
            </Select.Option>
          ))}
      </Select>
    </Col>

    {/* ================= Chapter (Disabled – no data yet) ================= */}
    <Col xs={24} md={6}>
      <Select
        placeholder="Select Chapter"
        disabled
        style={{ width: "100%" }}
      />
    </Col>

    {/* ================= Search ================= */}
    <Col xs={24} md={6}>
      <Input.Search
        placeholder="Search question..."
        allowClear
        onSearch={(v) =>
          setFilters({ ...filters, search: v || "" })
        }
      />
    </Col>

  </Row>
</Card>


      {/* ================= Content ================= */}
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Question Bank</h2>
          <p style={{ color: "#888" }}>
            Browse questions by class, subject & chapter
          </p>
        </div>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[
            { label: "Total", value: stats.total },
            { label: "MCQ", value: stats.mcq },
            { label: "True / False", value: stats.tf },
            { label: "Fill Blank", value: stats.fill },
          ].map((s) => (
            <Col xs={12} md={6} key={s.label}>
              <Card>
                <Statistic title={s.label} value={s.value} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : questions.length === 0 ? (
          <Empty description="No questions found" />
        ) : (
          <List
            dataSource={questions}
            renderItem={(q, index) => (
              <Card
                key={q._id}
                style={{ marginBottom: 12 }}
                hoverable
                actions={[
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    loading={deletingId === q._id}
                    onClick={() => handleDelete(q._id)}
                  >
                    Delete
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={`${index + 1}. ${q.statement}`}
                  description={
                    <div style={{ marginTop: 8 }}>
                      <Tag color="blue">{q.questionType}</Tag>
                      <Tag color="green">{q.difficulty}</Tag>
                      <Tag>Marks: {q.marks}</Tag>
                    </div>
                  }
                />
              </Card>
            )}
          />
        )}
      </div>

      {/* ================= Floating Buttons ================= */}
      <FloatButton.Group trigger="hover" type="primary">
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="Add Question"
          onClick={() => setModalType("single")}
        />
        <FloatButton
          tooltip="Bulk Upload"
          onClick={() => setModalType("bulk")}
        >
          Bulk
        </FloatButton>
      </FloatButton.Group>

      {/* ================= Modal ================= */}
      <Modal
        open={!!modalType}
        footer={null}
        width={800}
        destroyOnClose
        onCancel={() => setModalType(null)}
      >
        {modalType === "single" && <CreateQuestion />}
        {modalType === "bulk" && <BulkUploadQuestions />}
      </Modal>
    </div>
  );
};

export default QuestionBank;

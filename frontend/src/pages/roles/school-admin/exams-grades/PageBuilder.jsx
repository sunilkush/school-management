import React, { useMemo, useState } from "react";
import { Button, Card, Empty, InputNumber, Select, Space, Table, Tag, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getExams, updateExam } from "../../../../features/examSlice";

const { Title, Text } = Typography;

const PaperBuilder = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((state) => state.exams || {});
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);

  React.useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }));
  }, [dispatch]);

  const selectedExam = useMemo(() => exams.find((exam) => exam._id === selectedExamId), [exams, selectedExamId]);

  const totalMarks = Number(selectedExam?.totalMarks || 0);
  const perQuestion = questionCount > 0 ? Number((totalMarks / questionCount).toFixed(2)) : 0;

  const handlePublishPaper = async () => {
    if (!selectedExamId) return message.warning("Select an exam first");
    await dispatch(updateExam({ examId: selectedExamId, payload: { status: "published" } })).unwrap();
    message.success("Paper blueprint saved and exam marked as published");
  };

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4}>Paper Builder</Title>
        <Select
          placeholder="Select exam"
          value={selectedExamId}
          onChange={setSelectedExamId}
          options={exams.map((exam) => ({ label: exam.title, value: exam._id }))}
          style={{ width: 320, maxWidth: "100%" }}
        />

        {!selectedExam ? (
          <Empty description="Select an exam to configure paper details" />
        ) : (
          <>
            <Space wrap>
              <Tag color="blue">Total Marks: {totalMarks}</Tag>
              <Tag color="purple">Subject: {selectedExam?.subjectId?.name || "N/A"}</Tag>
            </Space>
            <Space>
              <Text>Questions Count</Text>
              <InputNumber min={1} value={questionCount} onChange={setQuestionCount} />
              <Text type="secondary">~ {perQuestion} marks/question</Text>
            </Space>
            <Table
              pagination={false}
              rowKey="key"
              dataSource={[
                { key: "1", section: "Section A", questionType: "Objective", marks: Math.round(totalMarks * 0.4) },
                { key: "2", section: "Section B", questionType: "Short Answer", marks: Math.round(totalMarks * 0.3) },
                { key: "3", section: "Section C", questionType: "Long Answer", marks: totalMarks - Math.round(totalMarks * 0.7) },
              ]}
              columns={[
                { title: "Section", dataIndex: "section" },
                { title: "Question Type", dataIndex: "questionType" },
                { title: "Marks", dataIndex: "marks" },
              ]}
            />
            <Button type="primary" onClick={handlePublishPaper}>Save Draft & Publish</Button>
          </>
        )}
      </Space>
    </Card>
  );
};

export default PaperBuilder;

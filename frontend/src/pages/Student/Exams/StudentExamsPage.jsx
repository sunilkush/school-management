import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Collapse, Empty, Space, Table, Tag, Typography } from "antd";
import { getExams, getStudentResults } from "../../../features/examSlice";

const { Title, Text } = Typography;

const StudentExamsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], results = [], loading } = useSelector((state) => state.exams || {});

  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "asc" }));
    dispatch(getStudentResults());
  }, [dispatch]);

  const resultColumns = [
    { title: "Subject", dataIndex: "subjectName" },
    { title: "Obtained", dataIndex: "obtainedMarks" },
    { title: "Total", dataIndex: "totalMarks" },
    { title: "Passing", dataIndex: "passingMarks" },
    {
      title: "Status",
      render: (_, row) => <Tag color={row.isPassed ? "green" : "red"}>{row.isPassed ? "PASS" : "FAIL"}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card>
        <Title level={4}>Exam Schedule</Title>
        {exams.length ? exams.map((exam) => <Text key={exam._id} style={{ display: "block" }}>{exam.title} - {new Date(exam.examDate).toLocaleDateString()}</Text>) : <Empty description="No exams scheduled" />}
      </Card>

      <Card loading={loading}>
        <Title level={4}>Published Results</Title>
        {!results.length ? (
          <Empty description="No published results" />
        ) : (
          <Collapse
            items={results.map((result) => ({
              key: result._id,
              label: `${result.examId?.title || "Exam"} | Total ${result.totalObtainedMarks}/${result.totalMaximumMarks} | ${result.percentage}% | ${result.grade}`,
              children: (
                <>
                  <Table rowKey={(row) => `${row.subjectId}-${row.subjectName}`} pagination={false} columns={resultColumns} dataSource={result.subjects || []} />
                  <Text strong>Status: <Tag color={result.resultStatus === "PASS" ? "green" : "red"}>{result.resultStatus}</Tag></Text>
                </>
              ),
            }))}
          />
        )}
      </Card>
    </Space>
  );
};

export default StudentExamsPage;

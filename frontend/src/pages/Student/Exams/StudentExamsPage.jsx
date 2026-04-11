import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Collapse, Empty, Segmented, Space, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { getExams, getStudentResults } from "../../../features/examSlice";

const { Title, Text } = Typography;

const StudentExamsPage = () => {
  const dispatch = useDispatch();
  const { exams = [], results = [], loading } = useSelector((state) => state.exams || {});
  const [scheduleFilter, setScheduleFilter] = useState("upcoming");

  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "asc" }));
    dispatch(getStudentResults());
  }, [dispatch]);

  const filteredExams = useMemo(() => {
    const now = dayjs();
    if (scheduleFilter === "all") return exams;
    return exams.filter((exam) => {
      const examDate = dayjs(exam.examDate);
      if (scheduleFilter === "upcoming") return examDate.isAfter(now, "day") || examDate.isSame(now, "day");
      return examDate.isBefore(now, "day");
    });
  }, [exams, scheduleFilter]);

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

  const summary = useMemo(() => {
    if (!results.length) return null;
    const passed = results.filter((result) => result.resultStatus === "PASS").length;
    return {
      total: results.length,
      passed,
      failed: results.length - passed,
    };
  }, [results]);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Title level={4} style={{ marginBottom: 0 }}>Exam Schedule</Title>
          <Segmented
            value={scheduleFilter}
            onChange={setScheduleFilter}
            options={[
              { label: "Upcoming", value: "upcoming" },
              { label: "Completed", value: "completed" },
              { label: "All", value: "all" },
            ]}
          />
          {filteredExams.length ? (
            filteredExams.map((exam) => (
              <Card key={exam._id} type="inner" style={{ marginTop: 4 }}>
                <Space direction="vertical" size={0}>
                  <Text strong>{exam.title}</Text>
                  <Text type="secondary">{dayjs(exam.examDate).format("DD MMM YYYY")} • {exam.subjectId?.name || "Subject"}</Text>
                </Space>
              </Card>
            ))
          ) : (
            <Empty description="No exams scheduled" />
          )}
        </Space>
      </Card>

      <Card loading={loading}>
        <Title level={4}>Published Results</Title>
        {summary && (
          <Space style={{ marginBottom: 12 }}>
            <Tag color="blue">Total: {summary.total}</Tag>
            <Tag color="green">Passed: {summary.passed}</Tag>
            <Tag color="red">Failed: {summary.failed}</Tag>
          </Space>
        )}

        {!results.length ? (
          <Empty description="No published results" />
        ) : (
          <Collapse
            items={results.map((result) => ({
              key: result._id,
              label: `${result.examId?.title || "Exam"} | ${result.percentage}% | Grade ${result.grade}`,
              children: (
                <>
                  <Table rowKey={(row) => `${row.subjectId}-${row.subjectName}`} pagination={false} columns={resultColumns} dataSource={result.subjects || []} />
                  <Text strong>
                    Status: <Tag color={result.resultStatus === "PASS" ? "green" : "red"}>{result.resultStatus}</Tag>
                  </Text>
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

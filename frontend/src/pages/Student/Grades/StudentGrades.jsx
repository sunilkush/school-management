import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Collapse, Empty, Space, Table, Tag, Typography } from "antd";
import { fetchStudentGrades } from "../../../features/studentPortalSlice";

const { Title, Text } = Typography;

const StudentGrades = () => {
  const dispatch = useDispatch();
  const { grades, loading } = useSelector((state) => state.studentPortal);

  useEffect(() => {
    dispatch(fetchStudentGrades());
  }, [dispatch]);

  const subjectColumns = [
    { title: "Subject", dataIndex: "subjectName", key: "subjectName" },
    { title: "Obtained", dataIndex: "obtainedMarks", key: "obtainedMarks" },
    { title: "Total", dataIndex: "totalMarks", key: "totalMarks" },
    {
      title: "Result",
      key: "isPassed",
      render: (_, row) => (
        <Tag color={row.isPassed ? "green" : "red"}>{row.isPassed ? "PASS" : "FAIL"}</Tag>
      ),
    },
  ];

  const summary = useMemo(() => {
    if (!grades.length) return null;
    const passCount = grades.filter((grade) => grade.resultStatus === "PASS").length;
    return {
      total: grades.length,
      passCount,
      failCount: grades.length - passCount,
    };
  }, [grades]);

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>My Grades</Title>
        {summary && (
          <Space>
            <Tag color="blue">Total Exams: {summary.total}</Tag>
            <Tag color="green">Passed: {summary.passCount}</Tag>
            <Tag color="red">Failed: {summary.failCount}</Tag>
          </Space>
        )}

        {!grades.length ? (
          <Empty description="No published grades found" />
        ) : (
          <Collapse
            items={grades.map((grade) => ({
              key: grade._id,
              label: `${grade.examId?.title || "Exam"} • ${grade.percentage}% • Grade ${grade.grade}`,
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Table
                    rowKey={(row) => `${row.subjectId || row.subjectName}`}
                    columns={subjectColumns}
                    dataSource={grade.subjects || []}
                    pagination={false}
                    size="small"
                  />
                  <Text>
                    Status:{" "}
                    <Tag color={grade.resultStatus === "PASS" ? "green" : "red"}>
                      {grade.resultStatus}
                    </Tag>
                  </Text>
                </Space>
              ),
            }))}
          />
        )}
      </Space>
    </Card>
  );
};

export default StudentGrades;

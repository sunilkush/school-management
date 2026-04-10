import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Collapse, Empty, Select, Space, Table, Tag, Typography } from "antd";
import { getParentResults } from "../../../features/examSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";

const { Title } = Typography;

const ChildGrades = () => {
  const dispatch = useDispatch();
  const { children = [] } = useSelector((state) => state.studentPortal || {});
  const { results = [], loading } = useSelector((state) => state.exams || {});
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0].userId);
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      dispatch(getParentResults({ studentId: selectedChildId }));
    }
  }, [dispatch, selectedChildId]);

  const summary = useMemo(() => {
    const total = results.length;
    const passed = results.filter((item) => item.resultStatus === "PASS").length;
    return { total, passed, failed: total - passed };
  }, [results]);

  const subjectColumns = [
    { title: "Subject", dataIndex: "subjectName", key: "subjectName" },
    { title: "Obtained", dataIndex: "obtainedMarks", key: "obtainedMarks" },
    { title: "Total", dataIndex: "totalMarks", key: "totalMarks" },
    {
      title: "Status",
      render: (_, row) => <Tag color={row.isPassed ? "green" : "red"}>{row.isPassed ? "PASS" : "FAIL"}</Tag>,
    },
  ];

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>Child Grades</Title>

        <Select
          placeholder="Select child"
          value={selectedChildId}
          onChange={setSelectedChildId}
          style={{ maxWidth: 320 }}
          options={children.map((child) => ({ label: child.name, value: child.userId }))}
        />

        {selectedChildId && (
          <Space>
            <Tag color="blue">Total Exams: {summary.total}</Tag>
            <Tag color="green">Passed: {summary.passed}</Tag>
            <Tag color="red">Failed: {summary.failed}</Tag>
          </Space>
        )}

        {!selectedChildId ? (
          <Empty description="No child selected" />
        ) : !results.length ? (
          <Empty description="No published grades found" />
        ) : (
          <Collapse
            items={results.map((result) => ({
              key: result._id,
              label: `${result.examId?.title || "Exam"} • ${result.percentage}% • Grade ${result.grade}`,
              children: (
                <Table
                  rowKey={(row) => `${row.subjectId || row.subjectName}`}
                  columns={subjectColumns}
                  dataSource={result.subjects || []}
                  pagination={false}
                  size="small"
                />
              ),
            }))}
          />
        )}
      </Space>
    </Card>
  );
};

export default ChildGrades;

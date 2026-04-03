import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Space, Table, Tag, Typography } from "antd";
import { getParentResults } from "../../../features/examSlice";

const { Title } = Typography;

const ParentExamsPage = () => {
  const dispatch = useDispatch();
  const { results = [], loading } = useSelector((state) => state.exams || {});

  useEffect(() => {
    dispatch(getParentResults());
  }, [dispatch]);

  const columns = [
    { title: "Exam", render: (_, row) => row.examId?.title || "-" },
    { title: "Class", render: (_, row) => row.schoolClassId?.name || "-" },
    { title: "Obtained", render: (_, row) => `${row.totalObtainedMarks}/${row.totalMaximumMarks}` },
    { title: "Percentage", dataIndex: "percentage" },
    { title: "Grade", dataIndex: "grade" },
    { title: "Rank", dataIndex: "rank" },
    { title: "Status", render: (_, row) => <Tag color={row.resultStatus === "PASS" ? "green" : "red"}>{row.resultStatus}</Tag> },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card>
        <Title level={4}>Child Result Dashboard</Title>
      </Card>
      <Card loading={loading}>
        {!results.length ? <Empty description="No published child results found" /> : <Table rowKey="_id" columns={columns} dataSource={results} />}
      </Card>
    </Space>
  );
};

export default ParentExamsPage;

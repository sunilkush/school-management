import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Select, Space, Table, Tag, Typography } from "antd";
import { getParentResults } from "../../../features/examSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";

const { Title } = Typography;

const ParentExamsPage = () => {
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

  const columns = [
    { title: "Exam", render: (_, row) => row.examId?.title || "-" },
    { title: "Class", render: (_, row) => row.schoolClassId?.name || "-" },
    { title: "Obtained", render: (_, row) => `${row.totalObtainedMarks}/${row.totalMaximumMarks}` },
    { title: "Percentage", dataIndex: "percentage" },
    { title: "Grade", dataIndex: "grade" },
    { title: "Rank", dataIndex: "rank" },
    {
      title: "Status",
      render: (_, row) => (
        <Tag color={row.resultStatus === "PASS" ? "green" : "red"}>{row.resultStatus}</Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>Child Result Dashboard</Title>
          <Select
            placeholder="Select child"
            value={selectedChildId}
            onChange={setSelectedChildId}
            style={{ maxWidth: 320 }}
            options={children.map((child) => ({ label: child.name, value: child.userId }))}
          />
        </Space>
      </Card>

      <Card loading={loading}>
        {!selectedChildId ? (
          <Empty description="No child selected" />
        ) : !results.length ? (
          <Empty description="No published child results found" />
        ) : (
          <Table rowKey="_id" columns={columns} dataSource={results} />
        )}
      </Card>
    </Space>
  );
};

export default ParentExamsPage;

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Card, Empty, List, Select, Space, Tag, Timeline, Typography } from "antd";
import { fetchMyChildren } from "../../../features/studentPortalSlice";

const { Title, Text } = Typography;

const ChildHomework = () => {
  const dispatch = useDispatch();
  const { children = [], loading } = useSelector((state) => state.studentPortal || {});
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0].userId);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find((child) => child.userId === selectedChildId);

  const timelineItems = useMemo(() => {
    if (!selectedChild) return [];

    return [
      {
        color: "blue",
        children: <Text>Attendance alert: {selectedChild.name} has 2 absences in last 7 days.</Text>,
      },
      {
        color: "orange",
        children: <Text>Homework reminder: Mathematics worksheet due tomorrow.</Text>,
      },
      {
        color: "red",
        children: <Text>Fee reminder: Transport fee pending for this month.</Text>,
      },
      {
        color: "green",
        children: <Text>Exam update: Unit Test result published in Science.</Text>,
      },
      {
        color: "purple",
        children: <Text>Teacher comment: “Needs more focus on algebra practice.”</Text>,
      },
    ];
  }, [selectedChild]);

  return (
    <Card loading={loading} style={{ margin: "24px" }}  >
      <Space direction="vertical" style={{ width: "100%" }} size={14}>
        <Title level={4} style={{ margin: 0 }}>Parent Engagement Center</Title>

        <Select
          placeholder="Select child"
          value={selectedChildId}
          onChange={setSelectedChildId}
          style={{ maxWidth: 320 }}
          options={children.map((child) => ({ label: child.name, value: child.userId }))}
        />

        {!selectedChild ? (
          <Empty description="No child selected" />
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              message={`Engagement timeline for ${selectedChild.name}`}
              description="Attendance alerts, homework reminders, fee dues, exam updates and teacher comments in one place."
            />

            <Card title="Child Timeline" size="small">
              <Timeline items={timelineItems} />
            </Card>

            <List
              bordered
              header={<Text strong>Homework Visibility</Text>}
              dataSource={[
                { title: "Algebra Practice", subject: "Mathematics", status: "Pending" },
                { title: "Motion Notes", subject: "Science", status: "Submitted" },
              ]}
              locale={{ emptyText: "No homework published for the selected child" }}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Text>{item.title}</Text>
                    <Tag color="blue">{item.subject}</Tag>
                    <Tag color={item.status === "Submitted" ? "green" : "orange"}>{item.status}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}
      </Space>
    </Card>
  );
};

export default ChildHomework;
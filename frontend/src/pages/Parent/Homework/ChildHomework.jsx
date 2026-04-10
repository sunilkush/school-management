import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Card, Empty, List, Select, Space, Tag, Typography } from "antd";
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

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>Child Homework</Title>

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
              message="Homework module sync in progress"
              description="Homework APIs for parent role are not available yet. This screen is now ready and child-aware; homework items will auto-populate once the backend endpoint is enabled."
            />

            <List
              bordered
              header={<Text strong>Selected Child: {selectedChild.name}</Text>}
              dataSource={[]}
              locale={{ emptyText: "No homework published for the selected child" }}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Text>{item.title}</Text>
                    <Tag color="blue">{item.subject}</Tag>
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

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Card, Empty, Select, Space, Typography } from "antd";
import { fetchMyChildren } from "../../../../features/studentPortalSlice";

const { Title, Text } = Typography;

const ChildMessages = () => {
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
        <Title level={4} style={{ margin: 0 }}>Child Messages</Title>

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
            <Text type="secondary">Conversation view for: {selectedChild.name}</Text>
            <Alert
              type="info"
              showIcon
              message="Messaging integration pending"
              description="Parent-specific message APIs are not yet available. Once enabled, this screen will show teacher notices and direct messages for the selected child."
            />
          </>
        )}
      </Space>
    </Card>
  );
};

export default ChildMessages;

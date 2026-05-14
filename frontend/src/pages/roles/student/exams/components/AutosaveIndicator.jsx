import React from "react";
import { Typography, Space, Spin } from "antd";
import {
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const AutosaveIndicator = ({ status }) => {
  const renderStatus = () => {
    switch (status) {
      case "saving":
        return (
          <Space>
            <Spin size="small" />
            <Text type="warning">Saving...</Text>
          </Space>
        );

      case "saved":
        return (
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            <Text type="success">All changes saved</Text>
          </Space>
        );

      default:
        return (
          <Space>
            <EditOutlined style={{ color: "#8c8c8c" }} />
            <Text type="secondary">Waiting for input</Text>
          </Space>
        );
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {renderStatus()}
    </div>
  );
};

export default AutosaveIndicator;

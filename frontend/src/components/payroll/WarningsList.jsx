import React from "react";
import { Space, Tag, Typography } from "antd";

const { Text } = Typography;

const WarningsList = ({ warnings = [] }) => {
  if (!warnings.length) return <Text type="secondary">-</Text>;

  return (
    <Space wrap>
      {warnings.map((warning) => (
        <Tag key={warning} color="gold">
          {warning}
        </Tag>
      ))}
    </Space>
  );
};

export default WarningsList;

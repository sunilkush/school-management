import React from "react";
import { Card, Progress, Typography, Space } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const colorMap = {
  purple: "#722ed1",
  blue: "#1677ff",
  green: "#52c41a",
  orange: "#fa8c16",
};

const SummaryCard = ({
  title,
  value,
  percentage = 0,
  trend = "",
  color = "blue",
  label = "",
}) => {
  const isDecrease = trend.toLowerCase().includes("decrease");

  return (
    <Card bordered hoverable>
      <Space
        align="start"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        {/* Left Content */}
        <Space direction="vertical" size={0}>
          <Text type="secondary">{title}</Text>
          <Title level={4} style={{ margin: 0 }}>
            {value}
          </Title>
        </Space>

        {/* Progress Ring */}
        <Progress
          type="circle"
          percent={percentage}
          width={60}
          strokeColor={colorMap[color]}
          format={(percent) => `${percent}%`}
        />
      </Space>

      {/* Footer */}
      <Space
        style={{
          marginTop: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Space>
          {isDecrease ? (
            <ArrowDownOutlined style={{ color: "#ff4d4f" }} />
          ) : (
            <ArrowUpOutlined style={{ color: "#52c41a" }} />
          )}
          <Text type={isDecrease ? "danger" : "success"}>
            {trend}
          </Text>
        </Space>

        <Text type="secondary">{label}</Text>
      </Space>
    </Card>
  );
};

export default SummaryCard;

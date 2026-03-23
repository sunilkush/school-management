import React from "react";
import { Card, Typography, Progress, Space, Divider } from "antd";

const { Title, Text } = Typography;

const structureData = [
  {
    label: "Students",
    percent: 65,
    color: "#13c2c2",
  },
  {
    label: "Teachers",
    percent: 30,
    color: "#69c0ff",
  },
  {
    label: "Staff",
    percent: 5,
    color: "#95de64",
  },
];

const EmployeeStructure = () => {
  return (
    <Card bordered={false} style={{ height: "100%" }}>
      <Title level={5}>School Structure</Title>

      {/* Overall */}
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Progress
          type="circle"
          percent={100}
          width={120}
          strokeColor="#13c2c2"
        />
        <div style={{ marginTop: 8 }}>
          <Text strong>Total Users</Text>
        </div>
      </div>

      <Divider />

      {/* Breakdown */}
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {structureData.map((item, index) => (
          <div key={index}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text>{item.label}</Text>
              <Text strong>{item.percent}%</Text>
            </div>
            <Progress
              percent={item.percent}
              showInfo={false}
              strokeColor={item.color}
            />
          </div>
        ))}
      </Space>
    </Card>
  );
};

export default EmployeeStructure;

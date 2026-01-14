import React from "react";
import { Card, Typography, Progress, Row, Col } from "antd";

const { Title, Text } = Typography;

const incomeData = [
  {
    label: "Design",
    value: 55,
    color: "#1677ff",
  },
  {
    label: "Development",
    value: 25,
    color: "#13c2c2",
  },
  {
    label: "SEO",
    value: 20,
    color: "#52c41a",
  },
];

const IncomeAnalysis = () => {
  return (
    <Card bordered={false} style={{ height: "100%" }}>
      <Title level={5} style={{ marginBottom: 24 }}>
        Income Analysis
      </Title>

      <Row gutter={[16, 16]} justify="center">
        {incomeData.map((item, index) => (
          <Col xs={24} sm={8} key={index} style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={item.value}
              strokeColor={item.color}
              width={90}
            />
            <div style={{ marginTop: 12 }}>
              <Text strong>{item.label}</Text>
              <br />
              <Text type="secondary">{item.value}%</Text>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default IncomeAnalysis;

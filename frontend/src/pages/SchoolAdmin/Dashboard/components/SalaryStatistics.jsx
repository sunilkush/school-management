import React from "react";
import { Card, Select, Typography, Space, Progress, Row, Col } from "antd";

const { Option } = Select;
const { Title, Text } = Typography;

const stats = [
  { title: "Developer", value: 6000, color: "#6366f1" },
  { title: "Marketing", value: 3000, color: "#818cf8" },
  { title: "Sales", value: 2000, color: "#a5b4fc" },
];

// Max value for percentage calculation
const maxValue = Math.max(...stats.map((s) => s.value));

const SalaryStatistics = () => {
  return (
    <Card
      title="Salary Statistics"
      extra={
        <Select defaultValue="lastMonth" size="small" style={{ width: 120 }}>
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
          <Option value="lastWeek">Last Week</Option>
        </Select>
      }
      bordered
      hoverable
    >
      <Row gutter={24} align="bottom">
        {stats.map((item) => {
          const percent = Math.round((item.value / maxValue) * 100);

          return (
            <Col span={8} key={item.title}>
              <Space direction="vertical" align="center" style={{ width: "100%" }}>
                {/* Value */}
                <Space direction="vertical" align="center" size={0}>
                  <Text type="secondary">{item.title}</Text>
                  <Title level={5} style={{ margin: 0 }}>
                    {item.value / 1000}k USD
                  </Title>
                </Space>

                {/* Bar */}
                <Progress
                  percent={percent}
                  showInfo={false}
                  strokeColor={item.color}
                />
              </Space>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

export default SalaryStatistics;

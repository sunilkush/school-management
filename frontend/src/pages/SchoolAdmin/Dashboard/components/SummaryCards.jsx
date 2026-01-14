import React from "react";
import { Card, Row, Col, Statistic, Progress, Typography, Space } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserAddOutlined,
  TeamOutlined,
  SolutionOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const cardData = [
  {
    title: "New Admission",
    value: 1203,
    percentage: 10,
    trend: "increase",
    icon: <UserAddOutlined />,
  },
  {
    title: "Total Students",
    value: 12300,
    percentage: 20,
    trend: "increase",
    icon: <TeamOutlined />,
  },
  {
    title: "Total Teachers",
    value: 1280,
    percentage: 20,
    trend: "increase",
    icon: <SolutionOutlined />,
  },
  {
    title: "Income",
    value: 65865,
    percentage: 20,
    trend: "decrease",
    icon: <DollarOutlined />,
  },
];

const SummaryCards = () => {
  return (
    <Row gutter={[16, 16]}>
      {cardData.map((item, index) => {
        const isDecrease = item.trend === "decrease";

        return (
          <Col xs={24} sm={12} lg={12} key={index}>
            <Card hoverable bordered>
              <Space
                align="start"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                {/* Left Content */}
                <Space direction="vertical">
                  <Statistic
                    title={item.title}
                    value={item.value}
                    prefix={item.icon}
                  />

                  <Text
                    type={isDecrease ? "danger" : "success"}
                    style={{ fontSize: 13 }}
                  >
                    {isDecrease ? (
                      <ArrowDownOutlined />
                    ) : (
                      <ArrowUpOutlined />
                    )}{" "}
                    {item.percentage}% {isDecrease ? "decrease" : "increase"} ·
                    Last Month
                  </Text>
                </Space>

                {/* Right Progress */}
                <Progress
                  type="circle"
                  percent={item.percentage}
                  width={70}
                  strokeColor={isDecrease ? "#ff4d4f" : "#52c41a"}
                />
              </Space>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default SummaryCards;

import React from "react";
import { Card, Row, Col, Typography, Divider, Space } from "antd";
import { DashboardOutlined } from "@ant-design/icons";

import SummaryCards from "./components/SummaryCards.jsx";
import SalaryStatistics from "./components/SalaryStatistics.jsx";
import TotalSalaryByUnit from "./components/TotalSalaryByUnit.jsx";
import IncomeAnalysis from "./components/IncomeAnalysis.jsx";
import EmployeeStructure from "./components/EmployeeStructure.jsx";
import EmployeePerformance from "./components/EmployeePerformance.jsx";

const { Title, Text } = Typography;

const sectionCardStyle = {
  borderRadius: 16,
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
};

const SchoolAdminDashboard = () => {
  return (
    <div style={{ padding: 20 }}>
      
      {/* 🔥 HEADER */}
      <Card
        bordered={false}
        style={{
          ...sectionCardStyle,
          marginBottom: 20,
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={3} style={{ margin: 0 }}>
            <DashboardOutlined /> School Dashboard
          </Title>
          <Text type="secondary">
            Monitor school performance, finance and staff activity
          </Text>
        </Space>
      </Card>

      {/* 🔥 SUMMARY */}
      <div style={{ marginBottom: 24 }}>
        <SummaryCards />
      </div>

      <Divider />

      {/* 🔥 FINANCE */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
           <SalaryStatistics />
        </Col>

        <Col xs={24} lg={12}>
          <IncomeAnalysis />
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <TotalSalaryByUnit />
        </Col>
      </Row>

      <Divider />

      {/* 🔥 HR SECTION */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <EmployeeStructure />
        </Col>

        <Col xs={24} lg={16}>
            <EmployeePerformance />
        </Col>
      </Row>
    </div>
  );
};

export default SchoolAdminDashboard;
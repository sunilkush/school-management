import React from "react";
import { Card, Row, Col, Typography, Divider } from "antd";
import {
  TeamOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

import SummaryCards from "./components/SummaryCards.jsx";
import SalaryStatistics from "./components/SalaryStatistics.jsx";
import TotalSalaryByUnit from "./components/TotalSalaryByUnit.jsx";
import IncomeAnalysis from "./components/IncomeAnalysis.jsx";
import EmployeeStructure from "./components/EmployeeStructure.jsx";
import EmployeePerformance from "./components/EmployeePerformance.jsx";

const { Title, Text } = Typography;

const SchoolAdminDashboard = () => {
  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          <DashboardOutlined /> School Admin Dashboard
        </Title>
        <Text type="secondary">
          Overview of school operations, finance & staff performance
        </Text>
      </Card>

      {/* Summary Section */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <SummaryCards />
        </Col>
      </Row>

      <Divider />

      {/* Finance Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <SalaryStatistics />
        </Col>

        <Col xs={24} md={12}>
          <IncomeAnalysis />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
           <TotalSalaryByUnit />
        </Col>
      </Row>

      <Divider />

      {/* HR / Employee Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <EmployeeStructure />
        </Col>

        <Col xs={24} md={16}>
           <EmployeePerformance />
        </Col>
      </Row>
    </div>
  );
};

export default SchoolAdminDashboard;

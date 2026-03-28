import React, { lazy, Suspense } from "react";
import { Card, Row, Col, Typography, Divider, Space, Spin } from "antd";
import { DashboardOutlined } from "@ant-design/icons";

// 🔥 Lazy Components
const SummaryCards = lazy(() => import("./components/SummaryCards.jsx"));
const SalaryStatistics = lazy(() => import("./components/SalaryStatistics.jsx"));
const TotalSalaryByUnit = lazy(() => import("./components/TotalSalaryByUnit.jsx"));
const IncomeAnalysis = lazy(() => import("./components/IncomeAnalysis.jsx"));
const EmployeeStructure = lazy(() => import("./components/EmployeeStructure.jsx"));
const EmployeePerformance = lazy(() => import("./components/EmployeePerformance.jsx"));

const { Title, Text } = Typography;

// 🔹 Loader
const loader = (
  <div style={{ textAlign: "center", padding: 20 }}>
    <Spin />
  </div>
);

const sectionCardStyle = {
  borderRadius: 16,
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
};

const SchoolAdminDashboard = () => {
  return (
    <>
      
      {/* 🔥 HEADER */}
      <Card bordered={false} style={{ ...sectionCardStyle, marginBottom: 20 }}>
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
        <Suspense fallback={loader}>
          <SummaryCards />
        </Suspense>
      </div>

      <Divider />

      {/* 🔥 FINANCE */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Suspense fallback={loader}>
            <SalaryStatistics />
          </Suspense>
        </Col>

        <Col xs={24} lg={12}>
          <Suspense fallback={loader}>
            <IncomeAnalysis />
          </Suspense>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Suspense fallback={loader}>
            <TotalSalaryByUnit />
          </Suspense>
        </Col>
      </Row>

      <Divider />

      {/* 🔥 HR SECTION */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Suspense fallback={loader}>
            <EmployeeStructure />
          </Suspense>
        </Col>

        <Col xs={24} lg={16}>
          <Suspense fallback={loader}>
            <EmployeePerformance />
          </Suspense>
        </Col>
      </Row>
    </>
  );
};

export default SchoolAdminDashboard;
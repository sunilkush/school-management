import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Typography,
  Select,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Divider,
} from "antd";
import { DollarOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const FinanceSummary = () => {
  const dispatch = useDispatch();
  const { schools = [] } = useSelector((state) => state.school);

  const [selectedSchool, setSelectedSchool] = useState("All");

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ School Dropdown Options
  const schoolOptions = useMemo(() => {
    return ["All", ...schools.map((s) => s.name).filter(Boolean)];
  }, [schools]);

  // Placeholder finance data
  const financeData = {
    totalIncome: 500000,
    totalExpenses: 320000,
    totalProfit: 180000,
    pendingFees: 25000,
  };

  return (
    <div style={{ padding: 16 }}>
      {/* 🔹 Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Finance Summary
            </Title>
            <Text type="secondary">
              Overview of income, expenses, and financial performance across schools
            </Text>
          </div>

          <Space>
            <Select
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: 220 }}
            >
              {schoolOptions.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchSchools())}
            >
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 🔹 KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Income"
              value={financeData.totalIncome}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Expenses"
              value={financeData.totalExpenses}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Profit"
              value={financeData.totalProfit}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Pending Fees"
              value={financeData.pendingFees}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 🔹 Detailed Sections */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Income Breakdown"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              See detailed income reports by school or fee type.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Expense Breakdown"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              See detailed expense reports by department or category.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Pending Fee Details"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Identify students with pending fees and outstanding payments.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Profit Analysis"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Compare profits across different schools or time periods.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceSummary;

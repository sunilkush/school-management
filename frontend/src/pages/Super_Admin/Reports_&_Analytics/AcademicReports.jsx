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
  Flex,
} from "antd";
import {
  BarChartOutlined,
  BookOutlined,
  TeamOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const AcademicReports = () => {
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

  return (
    <div style={{ padding: 16 }}>
      {/* 🔹 Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Academic Reports
            </Title>
            <Text type="secondary">
              Academic performance insights across schools
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
        </Flex>
      </Card>

      {/* 🔹 KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Students"
              value={1250}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Subjects"
              value={85}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card bordered={false}>
            <Statistic
              title="Exams Conducted"
              value={320}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 🔹 Report Sections */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            title="Student Performance Overview"
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              School-wise average marks, pass percentage, and ranking trends.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            title="Subject-wise Analysis"
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Identify strong and weak subjects across schools.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            title="Exam Performance"
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Compare exam difficulty and student performance trends.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            title="Top Performing Schools"
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Ranking schools based on academic excellence.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AcademicReports;

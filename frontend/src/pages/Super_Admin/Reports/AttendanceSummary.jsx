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
  Tag,
} from "antd";
import { TeamOutlined, UserOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const AttendanceSummary = () => {
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

  // Placeholder summary data
  const summaryData = {
    studentsPresent: 1200,
    studentsAbsent: 50,
    staffPresent: 80,
    staffAbsent: 5,
  };

  return (
    <div style={{ padding: 16 }}>
      {/* 🔹 Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Attendance Summary
            </Title>
            <Text type="secondary">
              Overall student and staff attendance across schools
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
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Students Present"
              value={summaryData.studentsPresent}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Students Absent"
              value={summaryData.studentsAbsent}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Staff Present"
              value={summaryData.staffPresent}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Staff Absent"
              value={summaryData.staffAbsent}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 🔹 Detailed Sections */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Student Attendance Trends"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Track daily, weekly, and monthly student attendance.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Staff Attendance Trends"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Track daily, weekly, and monthly staff attendance.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Late/Absent Students"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Identify patterns for late or absent students.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Late/Absent Staff"
            bordered={false}
            extra={<Button type="link">View Details</Button>}
          >
            <Text type="secondary">
              Identify patterns for late or absent staff members.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AttendanceSummary;

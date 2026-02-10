import React, { useState } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Avatar,
  Tag,
  Space,
  Statistic,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const MyStudents = () => {
  /* ================= STATE ================= */
  const [searchText, setSearchText] = useState("");

  /* ================= DUMMY DATA ================= */
  const students = [
    {
      _id: "1",
      name: "Rahul Sharma",
      class: "10",
      section: "A",
      rollNo: 12,
      phone: "9876543210",
      status: "active",
    },
    {
      _id: "2",
      name: "Priya Singh",
      class: "10",
      section: "B",
      rollNo: 8,
      phone: "9876500000",
      status: "active",
    },
  ];

  /* ================= FILTER ================= */
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Student",
      dataIndex: "name",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Roll No : {record.rollNo}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Class",
      dataIndex: "class",
      render: (val, rec) => (
        <Tag color="blue">
          {val} - {rec.section}
        </Tag>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phone",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (val) => (
        <Tag color={val === "active" ? "green" : "red"}>
          {val.toUpperCase()}
        </Tag>
      ),
    },
  ];

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20 }}>
      {/* ===== HEADER ===== */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            My Students
          </Title>
        </Col>

        <Col>
          <Space>
            <Select placeholder="Class" style={{ width: 120 }}>
              <Option value="10">Class 10</Option>
              <Option value="9">Class 9</Option>
            </Select>

            <Select placeholder="Section" style={{ width: 120 }}>
              <Option value="A">Section A</Option>
              <Option value="B">Section B</Option>
            </Select>

            <Input
              placeholder="Search Student"
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
            />
          </Space>
        </Col>
      </Row>

      {/* ===== STATS ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Students"
              value={students.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic title="Active Students" value={students.length} />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic title="My Sections" value={2} />
          </Card>
        </Col>
      </Row>

      {/* ===== TABLE ===== */}
      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default MyStudents;

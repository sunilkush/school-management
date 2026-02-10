import React, { useState } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Statistic,
  Modal,
  Form,
  DatePicker,
} from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const Assignments = () => {
  /* ================= STATE ================= */
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);

  /* ================= DUMMY DATA ================= */
  const assignments = [
    {
      _id: "1",
      title: "Math Homework Chapter 3",
      class: "10",
      section: "A",
      subject: "Math",
      dueDate: "2026-02-15",
      status: "active",
    },
    {
      _id: "2",
      title: "Science Project",
      class: "9",
      section: "B",
      subject: "Science",
      dueDate: "2026-02-18",
      status: "pending",
    },
  ];

  /* ================= FILTER ================= */
  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Assignment",
      dataIndex: "title",
      render: (val) => <b>{val}</b>,
    },
    {
      title: "Class",
      render: (_, rec) => (
        <Tag color="blue">
          {rec.class} - {rec.section}
        </Tag>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (val) => (
        <Tag color={val === "active" ? "green" : "orange"}>
          {val.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: () => (
        <Space>
          <Button size="small">View</Button>
          <Button size="small" type="primary">
            Submissions
          </Button>
        </Space>
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
            Assignments
          </Title>
        </Col>

        <Col>
          <Space>
            <Select placeholder="Class" style={{ width: 120 }}>
              <Option value="10">Class 10</Option>
            </Select>

            <Select placeholder="Section" style={{ width: 120 }}>
              <Option value="A">Section A</Option>
            </Select>

            <Input
              placeholder="Search Assignment"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
            >
              Create Assignment
            </Button>
          </Space>
        </Col>
      </Row>

      {/* ===== STATS ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Assignments"
              value={assignments.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic title="Active" value={1} />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic title="Pending Review" value={1} />
          </Card>
        </Col>
      </Row>

      {/* ===== TABLE ===== */}
      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredAssignments}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* ===== CREATE ASSIGNMENT MODAL ===== */}
      <Modal
        title="Create Assignment"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Assignment Title" name="title">
            <Input placeholder="Enter assignment title" />
          </Form.Item>

          <Form.Item label="Subject" name="subject">
            <Select>
              <Option value="math">Math</Option>
              <Option value="science">Science</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Due Date" name="dueDate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Button type="primary" block>
            Create Assignment
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Assignments;

import React, { useState } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Select,
  Button,
  Typography,
  Radio,
  Tag,
  Space,
  DatePicker,
} from "antd";

const { Title } = Typography;
const { Option } = Select;

const StaffAttendance = () => {
  // 🔹 Dummy staff data (API se aayega)
  const staffList = [
    {
      _id: "1",
      name: "Rohit Sharma",
      role: "Teacher",
      department: "Math",
    },
    {
      _id: "2",
      name: "Anita Verma",
      role: "Accountant",
      department: "Accounts",
    },
    {
      _id: "3",
      name: "Suresh Kumar",
      role: "Peon",
      department: "Admin",
    },
  ];

  const [attendance, setAttendance] = useState({});
  const [filterDept, setFilterDept] = useState(null);
  const [filterRole, setFilterRole] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleAttendanceChange = (staffId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [staffId]: status,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    staffList.forEach((staff) => {
      updated[staff._id] = status;
    });
    setAttendance(updated);
  };

  const columns = [
    {
      title: "Staff Name",
      dataIndex: "name",
    },
    {
      title: "Role",
      dataIndex: "role",
    },
    {
      title: "Department",
      dataIndex: "department",
    },
    {
      title: "Attendance",
      render: (_, record) => (
        <Radio.Group
          value={attendance[record._id]}
          onChange={(e) =>
            handleAttendanceChange(record._id, e.target.value)
          }
        >
          <Space>
            <Radio value="present">
              <Tag color="green">Present</Tag>
            </Radio>
            <Radio value="absent">
              <Tag color="red">Absent</Tag>
            </Radio>
            <Radio value="leave">
              <Tag color="orange">Leave</Tag>
            </Radio>
          </Space>
        </Radio.Group>
      ),
    },
  ];

  const filteredStaff = staffList.filter((staff) => {
    return (
      (filterDept ? staff.department === filterDept : true) &&
      (filterRole ? staff.role === filterRole : true)
    );
  });

  const handleSubmit = () => {
    const payload = filteredStaff
      .filter((s) => attendance[s._id])
      .map((s) => ({
        staffId: s._id,
        date: selectedDate,
        status: attendance[s._id],
      }));

    console.log("Staff Attendance Payload:", payload);
  };

  return (
    <Card bordered={false}>
      <Title level={4}>Staff Attendance</Title>

      {/* 🔹 Filters & Controls */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={4}>
          <DatePicker
            style={{ width: "100%" }}
            onChange={(date) => setSelectedDate(date)}
            placeholder="Select Date"
          />
        </Col>

        <Col xs={24} md={4}>
          <Select
            placeholder="Department"
            allowClear
            style={{ width: "100%" }}
            onChange={setFilterDept}
          >
            <Option value="Math">Math</Option>
            <Option value="Accounts">Accounts</Option>
            <Option value="Admin">Admin</Option>
          </Select>
        </Col>

        <Col xs={24} md={4}>
          <Select
            placeholder="Role"
            allowClear
            style={{ width: "100%" }}
            onChange={setFilterRole}
          >
            <Option value="Teacher">Teacher</Option>
            <Option value="Accountant">Accountant</Option>
            <Option value="Peon">Peon</Option>
          </Select>
        </Col>

        <Col xs={24} md={4}>
          <Button block onClick={() => markAll("present")}>
            Mark All Present
          </Button>
        </Col>

        <Col xs={24} md={4}>
          <Button block danger onClick={() => markAll("absent")}>
            Mark All Absent
          </Button>
        </Col>

        <Col xs={24} md={4}>
          <Button type="primary" block onClick={handleSubmit}>
            Save Attendance
          </Button>
        </Col>
      </Row>

      {/* 🔹 Table */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredStaff}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default StaffAttendance;

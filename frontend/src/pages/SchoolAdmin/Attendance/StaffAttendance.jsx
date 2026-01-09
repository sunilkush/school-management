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
  TimePicker,
} from "antd";


const { Title } = Typography;
const { Option } = Select;

const StaffAttendance = () => {
  const staffList = [
    { _id: "1", name: "Rohit Sharma", role: "Teacher", department: "Math" },
    { _id: "2", name: "Anita Verma", role: "Accountant", department: "Accounts" },
    { _id: "3", name: "Suresh Kumar", role: "Peon", department: "Admin" },
  ];

  const [attendance, setAttendance] = useState({});
  const [timings, setTimings] = useState({});
  const [filterDept, setFilterDept] = useState(null);
  const [filterRole, setFilterRole] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleAttendanceChange = (staffId, status) => {
    setAttendance((prev) => ({ ...prev, [staffId]: status }));

    // ❌ Clear time if absent / leave
    if (status !== "present") {
      setTimings((prev) => ({
        ...prev,
        [staffId]: { in: null, out: null },
      }));
    }
  };

  const handleTimeChange = (staffId, type, value) => {
    setTimings((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [type]: value,
      },
    }));
  };

  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return "-";
    const diff = outTime.diff(inTime, "minute");
    return diff > 0 ? `${(diff / 60).toFixed(2)} hrs` : "-";
  };

  const markAll = (status) => {
    const updated = {};
    staffList.forEach((s) => (updated[s._id] = status));
    setAttendance(updated);
  };

  const columns = [
    { title: "Staff Name", dataIndex: "name" },
    { title: "Role", dataIndex: "role" },
    { title: "Department", dataIndex: "department" },

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

    {
      title: "In Time",
      render: (_, record) => (
        <TimePicker
          value={timings[record._id]?.in}
          onChange={(t) => handleTimeChange(record._id, "in", t)}
          disabled={attendance[record._id] !== "present"}
          format="HH:mm"
        />
      ),
    },

    {
      title: "Out Time",
      render: (_, record) => (
        <TimePicker
          value={timings[record._id]?.out}
          onChange={(t) => handleTimeChange(record._id, "out", t)}
          disabled={attendance[record._id] !== "present"}
          format="HH:mm"
        />
      ),
    },

    {
      title: "Working Hours",
      render: (_, record) =>
        calculateHours(
          timings[record._id]?.in,
          timings[record._id]?.out
        ),
    },
  ];

  const filteredStaff = staffList.filter(
    (s) =>
      (filterDept ? s.department === filterDept : true) &&
      (filterRole ? s.role === filterRole : true)
  );

  const handleSubmit = () => {
    const payload = filteredStaff.map((s) => ({
      staffId: s._id,
      date: selectedDate,
      status: attendance[s._id],
      inTime: timings[s._id]?.in,
      outTime: timings[s._id]?.out,
      workingHours: calculateHours(
        timings[s._id]?.in,
        timings[s._id]?.out
      ),
    }));

    console.log("Attendance Payload:", payload);
  };

  return (
    <Card bordered={false}>
      <Title level={4}>Staff Attendance</Title>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col md={4}>
          <DatePicker
            style={{ width: "100%" }}
            onChange={setSelectedDate}
          />
        </Col>

        <Col md={4}>
          <Select allowClear placeholder="Department" onChange={setFilterDept}>
            <Option value="Math">Math</Option>
            <Option value="Accounts">Accounts</Option>
            <Option value="Admin">Admin</Option>
          </Select>
        </Col>

        <Col md={4}>
          <Select allowClear placeholder="Role" onChange={setFilterRole}>
            <Option value="Teacher">Teacher</Option>
            <Option value="Accountant">Accountant</Option>
            <Option value="Peon">Peon</Option>
          </Select>
        </Col>

        <Col md={4}>
          <Button block onClick={() => markAll("present")}>
            Mark All Present
          </Button>
        </Col>

        <Col md={4}>
          <Button block danger onClick={() => markAll("absent")}>
            Mark All Absent
          </Button>
        </Col>

        <Col md={4}>
          <Button type="primary" block onClick={handleSubmit}>
            Save Attendance
          </Button>
        </Col>
      </Row>

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

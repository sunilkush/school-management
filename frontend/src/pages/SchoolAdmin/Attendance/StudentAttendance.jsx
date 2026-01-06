import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Tag,
  DatePicker,
  message,
  Space,
  Radio
} from "antd";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { activeUser } from "../../../features/authSlice";
import { markAttendance } from "../../../features/attendanceSlice";
import { fetchAllClasses } from "../../../features/classSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const StudentAttendance = () => {
  const dispatch = useDispatch();

  const { schoolStudents = [], loading } = useSelector(
    (state) => state.students
  );
  const { user: currentUser } = useSelector((state) => state.auth);
  const { classList = [] } = useSelector((state) => state.class);

  const schoolId = currentUser?.school?._id;
  const academicYearId = currentUser?.academicYear?._id;

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});

  // 🔹 Initial Load
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchStudentsBySchoolId({ schoolId }));
      dispatch(fetchAllClasses({ schoolId }));
    }
    dispatch(activeUser());
  }, [dispatch, schoolId]);

  // 🔹 Default Attendance = Present
  useEffect(() => {
    const defaultAttendance = {};
    schoolStudents.forEach((s) => {
      defaultAttendance[s._id] = "present";
    });
    setAttendance(defaultAttendance);
  }, [schoolStudents]);

  // 🔹 Class Change
  const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedSection(null); // reset section
  };

  // 🔹 Attendance Change
  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // 🔹 Section list based on class
  const sectionList = useMemo(() => {
    if (!selectedClass) return [];

    const sections = schoolStudents
      .filter((s) => s.class?.name === selectedClass)
      .map((s) => s.section?.name)
      .filter(Boolean);

    return [...new Set(sections)];
  }, [schoolStudents, selectedClass]);

  // 🔹 Filter Students
  const filteredData = useMemo(() => {
    return schoolStudents.filter((item) => {
      return (
        (selectedClass ? item.class?.name === selectedClass : false) &&
        (selectedSection ? item.section?.name === selectedSection : true) &&
        (filterStatus
          ? attendance[item._id] === filterStatus
          : true)
      );
    });
  }, [
    schoolStudents,
    selectedClass,
    selectedSection,
    filterStatus,
    attendance,
  ]);

  // 🔹 Attendance Summary
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    filteredData.forEach((s) => {
      attendance[s._id] === "absent" ? absent++ : present++;
    });
    return { present, absent };
  }, [filteredData, attendance]);

  // 🔹 Mark All Present
  const markAllPresent = () => {
    const updated = {};
    filteredData.forEach((s) => {
      updated[s._id] = "present";
    });
    setAttendance((prev) => ({ ...prev, ...updated }));
  };

  // 🔹 Table Columns
  const columns = [
    {
      title: "Student Name",
      dataIndex: ["userDetails", "name"],
    },
    {
      title: "Class",
      render: (_, record) =>
        `${record.class?.name} - ${record.section?.name || ""}`,
    },
   {
      title: "Attendance",
      key: "attendance",
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
          </Space>
        </Radio.Group>
      ),
    },
  ];

  // 🔹 Submit Attendance
  const handleSubmit = () => {
    if (!selectedClass || !selectedSection) {
      message.warning("Please select class and section");
      return;
    }

    const attendanceData = filteredData.map((student) => ({
      schoolId,
      studentId: student._id,
      classId: student.class?._id,
      sectionId: student.section?._id,
      date: attendanceDate.toISOString(),
      status: attendance[student._id],
      recordedBy: currentUser?._id,
      academicYearId,
    }));

    dispatch(markAttendance({ attendanceData }));
    message.success("Attendance saved successfully");
  };

  return (
    <Card>
      <Title level={4}>Student Attendance</Title>

      {/* 🔹 Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Select
            placeholder="Select Class *"
            style={{ width: "100%" }}
            onChange={handleClassChange}
          >
            {classList.map((cls) => (
              <Option key={cls._id} value={cls.name}>
                {cls.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <Select
            placeholder="Select Section *"
            style={{ width: "100%" }}
            disabled={!selectedClass}
            value={selectedSection}
            onChange={setSelectedSection}
          >
            {sectionList.map((sec) => (
              <Option key={sec} value={sec}>
                {sec}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <DatePicker
            style={{ width: "100%" }}
            value={attendanceDate}
            onChange={setAttendanceDate}
          />
        </Col>

        <Col xs={24} md={6}>
          <Select
            placeholder="Filter Status"
            allowClear
            style={{ width: "100%" }}
            onChange={setFilterStatus}
          >
            <Option value="present">Present</Option>
            <Option value="absent">Absent</Option>
          </Select>
        </Col>
      </Row>

      {/* 🔹 Actions */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Space>
          <Button onClick={markAllPresent}>Mark All Present</Button>
          <Text>
            <Tag color="green">Present: {summary.present}</Tag>
            <Tag color="red">Absent: {summary.absent}</Tag>
          </Text>
        </Space>

        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={!selectedClass || !selectedSection}
        >
          Save Attendance
        </Button>
      </Row>

      {/* 🔹 Table */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default StudentAttendance;

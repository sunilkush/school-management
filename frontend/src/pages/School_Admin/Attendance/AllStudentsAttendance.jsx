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
import { markBulkAttendance } from "../../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const AllStudentsAttendance = () => {
  const dispatch = useDispatch();

   const { schoolStudents = [], loading } = useSelector((state) => state.students);
  const { loading: attendanceLoading } = useSelector((state) => state.attendance);
  const { user: currentUser } = useSelector((state) => state.auth);

  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});

  const schoolId = currentUser?.school?._id;


  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});

  // 🔹 Initial Load
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchStudentsBySchoolId({ schoolId }));
      dispatch(fetchSchoolClasses({ schoolId }));
    }

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
      dataIndex: ["user", "name"],
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
const handleSubmit = async () => {
    if (!selectedClass || !selectedSection) {
      message.warning("Please select class and section");
      return;
    }

    if (!filteredData.length) {
      message.warning("No students found for selected class and section");
      return;
    }

    const selectedClassDetails =
      schoolClasses.find((cls) => cls.name === selectedClass) || null;
    const selectedSectionDetails =
      filteredData.find((student) => student.section?.name === selectedSection)?.section || null;

    const payload = {
      schoolId,
      role: "student",
      classId: selectedClassDetails?._id || filteredData[0]?.class?._id || null,
      sectionId: selectedSectionDetails?._id || filteredData[0]?.section?._id || null,
      date: attendanceDate.toISOString(),
      records: filteredData.map((student) => ({
        userId: student.user?._id || student._id,
        status: attendance[student._id] || "present",
      })),
    };

    const result = await dispatch(markBulkAttendance(payload));

    if (result.meta.requestStatus === "fulfilled") {
      message.success("Attendance saved successfully");
    } else {
      message.error(result.payload || "Failed to save attendance");
    }
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
            {[...schoolClasses] // spread operator se naya array banaya
              .sort((a, b) => {
                const numA = parseInt(a.name.replace(/\D/g, ""), 10);
                const numB = parseInt(b.name.replace(/\D/g, ""), 10);
                return numA - numB;
              })
              .map((cls) => (
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
          loading={attendanceLoading}
          disabled={!selectedClass || !selectedSection || attendanceLoading}
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

export default AllStudentsAttendance;

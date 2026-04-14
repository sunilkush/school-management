import React, { useEffect, useMemo, useState } from "react";
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
   Radio,
  Input,
  Progress,
  Divider,
} from "antd";
import { CheckCircleOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { markBulkAttendance } from "../../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";

const { Title, Text } = Typography;


const AllStudentsAttendance = () => {
  const dispatch = useDispatch();

  const { schoolStudents = [], loading } = useSelector((state) => state.students);
  const { loading: attendanceLoading } = useSelector((state) => state.attendance);
  const { user: currentUser } = useSelector((state) => state.auth);

  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});

  const schoolId = currentUser?.school?._id;
  const academicYearId = currentUser?.school?.academicYear;


  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [searchText, setSearchText] = useState("");
  const [attendance, setAttendance] = useState({});

  const normalizedStudents = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (Array.isArray(schoolStudents?.students)) return schoolStudents.students;
    return [];
  }, [schoolStudents]);

  const normalizedClasses = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  // 🔹 Initial Load
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    }

  }, [dispatch, schoolId, academicYearId]);

  // 🔹 Default Attendance = Present
  useEffect(() => {
    const defaultAttendance = {};
    normalizedStudents.forEach((s) => {
      defaultAttendance[s._id] = attendance[s._id] || "present";
    });
    setAttendance(defaultAttendance);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedStudents]);

 const sortedClasses = useMemo(
    () =>
      [...normalizedClasses].sort((a, b) => {
        const numA = parseInt((a.name || "").replace(/\D/g, ""), 10);
        const numB = parseInt((b.name || "").replace(/\D/g, ""), 10);

        if (Number.isNaN(numA) || Number.isNaN(numB)) {
          return (a.name || "").localeCompare(b.name || "");
        }
        return numA - numB;
      }),
    [normalizedClasses]
  );

  // 🔹 Section list based on class
  const sectionList = useMemo(() => {
    if (!selectedClass) return [];

    const sections = normalizedStudents
      .filter((s) => s.class?.name === selectedClass)
      .map((s) => s.section?.name)
      .filter(Boolean);

    return [...new Set(sections)];
  }, [normalizedStudents, selectedClass]);

  // 🔹 Filter Students
  const filteredData = useMemo(() => {
    return normalizedStudents.filter((item) => {
       const fullName = item?.user?.name?.toLowerCase() || "";
      const rollNo = `${item?.rollNumber || ""}`.toLowerCase();
      const query = searchText.trim().toLowerCase();

      return (
        (selectedClass ? item.class?.name === selectedClass : true) &&
        (selectedSection ? item.section?.name === selectedSection : true) &&
       (filterStatus ? attendance[item._id] === filterStatus : true) &&
        (!query || fullName.includes(query) || rollNo.includes(query))
      );
    });
   }, [normalizedStudents, selectedClass, selectedSection, filterStatus, attendance, searchText]);

  // 🔹 Attendance Summary
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    filteredData.forEach((s) => {
     if (attendance[s._id] === "absent") absent += 1;
      else present += 1;
    });

   const total = filteredData.length;
    const presentRate = total ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, presentRate };
  }, [filteredData, attendance]);

  // 🔹 Mark All Present
    const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedSection(null);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const updated = {};
    filteredData.forEach((s) => {
      updated[s._id] = "present";
    });
    setAttendance((prev) => ({ ...prev, ...updated }));
  };

  // 🔹 Table Columns
 const markAllAbsent = () => {
    const updated = {};
    filteredData.forEach((s) => {
      updated[s._id] = "absent";
    });
    setAttendance((prev) => ({ ...prev, ...updated }));
  };
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

    if (!attendanceDate) {
      message.warning("Please select attendance date");
      return;
    }

   const selectedClassDetails = normalizedClasses.find((cls) => cls.name === selectedClass) || null;
    const selectedSectionDetails =
      filteredData.find((student) => student.section?.name === selectedSection)?.section || null;

    const payload = {
      schoolId,
      role: "student",
      classId: selectedClassDetails?._id || filteredData[0]?.class?._id || null,
      sectionId: selectedSectionDetails?._id || filteredData[0]?.section?._id || null,
      date: attendanceDate.startOf("day").toISOString(),
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

   const columns = [
    {
      title: "Student",
      dataIndex: ["user", "name"],
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record?.user?.name || "Unnamed"}</Text>
          <Text type="secondary">Roll No: {record?.rollNumber || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Class/Section",
      render: (_, record) => (
        <Tag>{`${record.class?.name || "-"}${record.section?.name ? ` • ${record.section?.name}` : ""}`}</Tag>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (_, record) => (
        <Radio.Group
          value={attendance[record._id]}
          onChange={(e) => handleAttendanceChange(record._id, e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="present">Present</Radio.Button>
          <Radio.Button value="absent">Absent</Radio.Button>
        </Radio.Group>
      ),
    },
  ];
  return (
    <Card>
      <Space direction="vertical" size={4} style={{ width: "100%", marginBottom: 14 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Student Attendance
        </Title>
        <Text type="secondary">Fast, filter-first attendance flow for class teachers and admin teams.</Text>
      </Space>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={6}>
          <Select
            placeholder="Select Class *"
            style={{ width: "100%" }}
            onChange={handleClassChange}
             value={selectedClass}
           options={sortedClasses.map((cls) => ({ value: cls.name, label: cls.name }))}
          />
        </Col>

        <Col xs={24} md={5}>
          <Select
            placeholder="Select Section *"
            style={{ width: "100%" }}
            disabled={!selectedClass}
            value={selectedSection}
            onChange={setSelectedSection}
          options={sectionList.map((sec) => ({ value: sec, label: sec }))}
          />
        </Col>

       <Col xs={24} md={5}>
          <DatePicker
            style={{ width: "100%" }}
            value={attendanceDate}
            onChange={setAttendanceDate}
            disabledDate={(current) => current && current > dayjs().endOf("day")}
          />
        </Col>

         <Col xs={24} md={4}>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: "100%" }}
            value={filterStatus}
            onChange={setFilterStatus}
            
          options={[
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
            ]}
          />
        </Col>
        <Col xs={24} md={4}>
          <Input
            placeholder="Search name / roll"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
      </Row>

      {/* 🔹 Actions */}
       <Divider style={{ margin: "14px 0" }} />
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={9}>
          <Card size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text type="secondary">Present rate</Text>
              <Progress percent={summary.presentRate} size="small" />
              <Space>
                <Tag color="green">Present: {summary.present}</Tag>
                <Tag color="red">Absent: {summary.absent}</Tag>
                <Tag>Total: {summary.total}</Tag>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={15} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <Space wrap>
            <Button icon={<CheckCircleOutlined />} onClick={markAllPresent} disabled={!filteredData.length}>
              Mark all present
            </Button>
            <Button danger onClick={markAllAbsent} disabled={!filteredData.length}>
              Mark all absent
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={attendanceLoading}
              disabled={!selectedClass || !selectedSection || attendanceLoading}
            >
              Save attendance
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 🔹 Table */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
         pagination={{ pageSize: 10, showSizeChanger: true }}
        rowClassName={(record) => (attendance[record._id] === "absent" ? "attendance-row-absent" : "")}
      />
    </Card>
  );
};

export default AllStudentsAttendance;

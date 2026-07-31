import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAssignedClasses } from "../../../features/classSlice";
import { submitAttendance } from "../../../features/attendanceSlice";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice.js";

const { Title, Text } = Typography;
const { Option } = Select;

const MyStudents = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { classAssignTeacher = [] } = useSelector((state) => state.class);
  const { schoolStudents = [], loading } = useSelector((state) => state.students);
  const { loading: attendanceLoading } = useSelector((state) => state.attendance);
  const schoolId = user?.school?._id || user?.schoolId;
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  
  const academicYearId = selectedAcademicYear?._id;
  const [selectedClassSectionKey, setSelectedClassSectionKey] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    if (!schoolId || !academicYearId || !user?._id) return;
    dispatch(fetchAssignedClasses({ schoolId, academicYearId, teacherId: user._id }));
  }, [dispatch, schoolId, academicYearId, user?._id]);

  const classTeacherSections = useMemo(() => {
    if (!Array.isArray(classAssignTeacher)) return [];

    return classAssignTeacher
      .flatMap((cls) =>
        (cls.sections || [])
          .filter((sec) => sec?.isClassTeacher)
          .map((sec) => ({
            key: `${cls._id}_${sec.sectionId?._id}`,
            classId: cls._id,
            className: cls.name,
            sectionId: sec.sectionId?._id,
            sectionName: sec.sectionId?.name,
            studentCount: sec.studentCount ?? 0,
          }))
      )
      .filter((item) => item.classId && item.sectionId);
  }, [classAssignTeacher]);

  useEffect(() => {
    if (!selectedClassSectionKey && classTeacherSections.length) {
      setSelectedClassSectionKey(classTeacherSections[0].key);
    }
  }, [selectedClassSectionKey, classTeacherSections]);

  const selectedClassSection = useMemo(
    () => classTeacherSections.find((item) => item.key === selectedClassSectionKey) || null,
    [classTeacherSections, selectedClassSectionKey]
  );

  // Scoped to just this one class-teacher section (~30-40 students) — this used to fetch the
  // entire school's roster on every visit just to filter it down to one homeroom afterward.
  useEffect(() => {
    if (!schoolId || !academicYearId || !selectedClassSection) return;
    dispatch(fetchStudentsBySchoolId({
      schoolId,
      academicYearId,
      schoolClassId: selectedClassSection.classId,
      sectionId: selectedClassSection.sectionId,
      limit: 200,
    }));
  }, [dispatch, schoolId, academicYearId, selectedClassSection]);

  const classStudents = schoolStudents;

  const filteredStudents = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return classStudents;

    return classStudents.filter((student) => {
      const name = student?.user?.name || "";
      const admission = student?.registrationNumber || "";
      return (
        name.toLowerCase().includes(keyword) ||
        admission.toLowerCase().includes(keyword)
      );
    });
  }, [classStudents, searchText]);

  useEffect(() => {
    const defaultAttendance = {};
    classStudents.forEach((student) => {
      defaultAttendance[student._id] = "present";
    });
    setAttendanceMap(defaultAttendance);
  }, [classStudents]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;

    classStudents.forEach((student) => {
      if (attendanceMap[student._id] === "absent") absent += 1;
      else present += 1;
    });

    return {
      present,
      absent,
      total: classStudents.length,
      attendanceRate:
        classStudents.length > 0
          ? Math.round((present / classStudents.length) * 100)
          : 0,
    };
  }, [classStudents, attendanceMap]);

  const setAllAttendance = (status) => {
    const next = {};
    classStudents.forEach((student) => {
      next[student._id] = status;
    });
    setAttendanceMap(next);
  };

  const handleAttendanceSubmit = async () => {
    if (!selectedClassSection) {
      message.warning("Please select class and section.");
      return;
    }

    if (!classStudents.length) {
      message.warning("No students found for selected class section.");
      return;
    }

    const records = classStudents.map((student) => ({
      userId: student?.user?._id,
      status: attendanceMap[student._id] || "present",
    }));

    if (records.some((record) => !record.userId)) {
      message.error("Some students are missing user mapping. Please contact admin.");
      return;
    }

    try {
      await dispatch(
        submitAttendance({
          schoolId,
          date: attendanceDate?.toISOString?.() || new Date().toISOString(),
          role: "student",
          classId: selectedClassSection.classId,
          sectionId: selectedClassSection.sectionId,
          records,
        })
      ).unwrap();

      message.success("Attendance saved successfully.");
    } catch (error) {
      message.error(error || "Failed to save attendance.");
    }
  };

  const columns = [
    {
      title: "Student",
      dataIndex: "user",
      key: "student",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record?.user?.avatar} />
          <div>
            <Text strong>{record?.user?.name || "N/A"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Reg: {record?.registrationNumber || "-"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Roll & Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>Mobile: {record?.mobileNumber || "-"}</Text>
          <Text type="secondary">Status: {record?.status || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      width: 260,
      render: (_, record) => (
        <Radio.Group
          value={attendanceMap[record._id] || "present"}
          onChange={(event) => {
            setAttendanceMap((prev) => ({
              ...prev,
              [record._id]: event.target.value,
            }));
          }}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio value="present">Present</Radio>
          <Radio value="absent">Absent</Radio>
        </Radio.Group>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bordered={false}>
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col>
              <Space direction="vertical" size={2}>
                <Title level={3} style={{ margin: 0 }}>
                  My Class Students
                </Title>
                <Text type="secondary">
                  Sirf unhi sections ke students dikh rahe hain jahan aap class teacher ho.
                </Text>
              </Space>
            </Col>
            <Col>
              <Tag color="processing" icon={<TeamOutlined />}>
                Class Teacher View
              </Tag>
            </Col>
          </Row>
        </Card>

        {classTeacherSections.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="Class teacher assignment not found"
            description="Aapko abhi tak kisi section ka class teacher assign nahi kiya gaya hai."
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={10}>
                <Card bordered={false}>
                  <Text strong>Select Class Section</Text>
                  <Select
                    value={selectedClassSectionKey}
                    onChange={setSelectedClassSectionKey}
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="Select class section"
                  >
                    {classTeacherSections.map((item) => (
                      <Option key={item.key} value={item.key}>
                        {item.className} - {item.sectionName}
                      </Option>
                    ))}
                  </Select>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card bordered={false}>
                  <Text strong>Date</Text>
                  <DatePicker
                    value={attendanceDate}
                    onChange={(date) => setAttendanceDate(date || dayjs())}
                    style={{ width: "100%", marginTop: 8 }}
                    suffixIcon={<CalendarOutlined />}
                  />
                </Card>
              </Col>

              <Col xs={24} md={6}>
                <Card bordered={false}>
                  <Text strong>Search Student</Text>
                  <Input
                    allowClear
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    style={{ marginTop: 8 }}
                    placeholder="Name / Registration"
                    prefix={<SearchOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Card bordered={false}>
                  <Statistic title="Total" value={summary.total} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card bordered={false}>
                  <Statistic title="Present" value={summary.present} prefix={<CheckCircleOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card bordered={false}>
                  <Statistic title="Absent" value={summary.absent} prefix={<CloseCircleOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card bordered={false}>
                  <Statistic title="Attendance %" value={summary.attendanceRate} suffix="%" />
                </Card>
              </Col>
            </Row>

            <Card
              bordered={false}
              title={`Students: ${selectedClassSection?.className || "-"} - ${selectedClassSection?.sectionName || "-"}`}
              extra={
                <Space>
                  <Button onClick={() => setAllAttendance("present")}>Mark all Present</Button>
                  <Button danger onClick={() => setAllAttendance("absent")}>Mark all Absent</Button>
                  <Button
                    type="primary"
                    loading={attendanceLoading}
                    onClick={handleAttendanceSubmit}
                  >
                    Save Attendance
                  </Button>
                </Space>
              }
            >
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={filteredStudents}
                loading={loading}
                pagination={{ pageSize: 10 }}
                locale={{
                  emptyText: (
                    <Empty description="No students found in selected class section" />
                  ),
                }}
              />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
};

export default MyStudents;
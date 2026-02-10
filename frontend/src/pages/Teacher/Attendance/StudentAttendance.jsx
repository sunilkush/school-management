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
  Radio,
  Statistic,
  Divider
} from "antd";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice.js";
import { activeUser } from "../../../features/authSlice.js";
import { submitAttendance } from "../../../features/attendanceSlice.js";
import { fetchAssignedClasses } from "../../../features/classSlice.js";

const { Title } = Typography;
const { Option } = Select;

const StudentAttendance = () => {

  const dispatch = useDispatch();

  const { schoolStudents = [], loading } = useSelector(state => state.students);
  const { user } = useSelector(state => state.auth);
  const { classAssignTeacher = [] } = useSelector(state => state.class);

  const schoolId = user?.school?._id;
  const storeAcadmicYear = localStorage.getItem("selectedAcademicYear");
  const academicYearId = storeAcadmicYear
    ? JSON.parse(storeAcadmicYear)._id
    : null;

  const [selectedClassObj, setSelectedClassObj] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});

  /* ================= INIT ================= */

  useEffect(() => {
    dispatch(activeUser());

    if (schoolId && academicYearId && user?._id) {
      dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
      dispatch(fetchAssignedClasses({
        schoolId,
        academicYearId,
        teacherId: user?._id
      }));
    }

  }, [schoolId, academicYearId, user?._id, dispatch]);

  /* ================= FLATTEN ASSIGNED DATA ================= */

  const assignedClassSections = useMemo(() => {

    if (!classAssignTeacher?.length || !user?._id) return [];

    let result = [];

    classAssignTeacher.forEach(cls => {

      // Section Teacher / Class Teacher
      cls.sections?.forEach(sec => {
        if (sec.teacherId?._id === user._id) {
          result.push({
            key: `${cls._id}_${sec.sectionId?._id}`,
            classId: cls._id,
            className: cls.name,
            sectionId: sec.sectionId?._id,
            sectionName: sec.sectionId?.name,
            type: "section"
          });
        }
      });

      // Subject Teacher
      cls.subjects?.forEach(sub => {
        if (sub.teacherId?._id === user._id) {
          cls.sections?.forEach(sec => {
            result.push({
              key: `${cls._id}_${sec.sectionId?._id}_${sub.subjectId?._id}`,
              classId: cls._id,
              className: cls.name,
              sectionId: sec.sectionId?._id,
              sectionName: sec.sectionId?.name,
              subjectId: sub.subjectId?._id,
              subjectName: sub.subjectId?.name,
              type: "subject"
            });
          });
        }
      });

    });

    return result;

  }, [classAssignTeacher, user]);

  /* ================= AUTO SELECT FIRST ================= */

  useEffect(() => {
    if (assignedClassSections.length && !selectedClassObj) {
      setSelectedClassObj(assignedClassSections[0]);
    }
  }, [assignedClassSections,selectedClassObj]);

  /* ================= FILTER STUDENTS ================= */

  const filteredStudents = useMemo(() => {

    if (!selectedClassObj) return [];

    return schoolStudents.filter(s =>
      s.class?._id === selectedClassObj.classId &&
      s.section?._id === selectedClassObj.sectionId
    );

  }, [schoolStudents, selectedClassObj]);

  /* ================= DEFAULT ATTENDANCE ================= */

  useEffect(() => {
    const obj = {};
    filteredStudents.forEach(s => {
      obj[s._id] = "present";
    });
    setAttendance(obj);
  }, [filteredStudents]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {

    let present = 0;
    let absent = 0;

    filteredStudents.forEach(s => {
      attendance[s._id] === "absent" ? absent++ : present++;
    });

    return { present, absent };

  }, [filteredStudents, attendance]);

  /* ================= ACTIONS ================= */

  const handleAttendanceChange = (id, value) => {
    setAttendance(prev => ({ ...prev, [id]: value }));
  };

  const markAll = status => {
    const obj = {};
    filteredStudents.forEach(s => obj[s._id] = status);
    setAttendance(prev => ({ ...prev, ...obj }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = () => {

    if (!selectedClassObj) {
      return message.warning("Please select class");
    }

    const records = filteredStudents.map(s => ({
      studentId: s._id,
      status: attendance[s._id]
    }));

    dispatch(submitAttendance({
      records,
      role: "teacher",
      date: attendanceDate.toISOString(),
      classId: selectedClassObj.classId,
      sectionId: selectedClassObj.sectionId,
      subjectId: selectedClassObj.subjectId || selectedSubject
    }));

    message.success("Attendance Saved");
  };

  /* ================= TABLE ================= */

  const columns = [
    {
      title: "Student",
      render: (_, record) => record?.userDetails?.name
    },
    {
      title: "Attendance",
      render: (_, record) => (
        <Radio.Group
          value={attendance[record._id]}
          onChange={e =>
            handleAttendanceChange(record._id, e.target.value)
          }
        >
          <Radio value="present">
            <Tag color="green">Present</Tag>
          </Radio>
          <Radio value="absent">
            <Tag color="red">Absent</Tag>
          </Radio>
        </Radio.Group>
      )
    }
  ];

  /* ================= UI ================= */

  return (
    <Card bordered={false}>

      <Title level={4}>Student Attendance</Title>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Statistic title="Present" value={summary.present} />
        </Col>
        <Col span={6}>
          <Statistic title="Absent" value={summary.absent} />
        </Col>
        <Col span={6}>
          <DatePicker
            value={attendanceDate}
            onChange={setAttendanceDate}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      <Divider />

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 20 }}>

        {/* Class Section */}
        <Col span={8}>
          <Select
            placeholder="Select Class & Section"
            style={{ width: "100%" }}
            value={selectedClassObj?.key}
            onChange={val => {
              const selected = assignedClassSections.find(
                c => c.key === val
              );
              setSelectedClassObj(selected);
            }}
          >
            {assignedClassSections.map(cls => (
              <Option key={cls.key} value={cls.key}>
                {cls.className} - {cls.sectionName}
                {cls.subjectName ? ` (${cls.subjectName})` : ""}
              </Option>
            ))}
          </Select>
        </Col>

      </Row>

      {/* Actions */}
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={() => markAll("present")}>
            Mark All Present
          </Button>
          <Button danger onClick={() => markAll("absent")}>
            Mark All Absent
          </Button>
        </Space>

        <Button type="primary" onClick={handleSubmit}>
          Save Attendance
        </Button>
      </Row>

      {/* Table */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredStudents}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

    </Card>
  );
};

export default StudentAttendance;

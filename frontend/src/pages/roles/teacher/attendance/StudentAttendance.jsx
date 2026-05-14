import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
  Divider,
  Input,
  Progress,
  Empty,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../../../features/studentSlice.js";
import { submitAttendance } from "../../../../features/attendanceSlice.js";
import { fetchAssignedClasses } from "../../../../features/classSlice.js";

const { Title, Text } = Typography;

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value?._id || value?.id || null;
  return null;
};

const getStudentUserId = (student) => {
  return (
    getId(student?.user) ||
    getId(student?.student) ||
    getId(student?.userId) ||
    getId(student?.studentId) ||
    null
  );
};

const getStudentName = (student) => {
  return (
    student?.user?.name ||
    student?.student?.name ||
    student?.name ||
    student?.fullName ||
    "-"
  );
};

const getStudentMobile = (student) => {
  return (
    student?.mobileNumber ||
    student?.user?.mobileNumber ||
    student?.student?.mobileNumber ||
    "-"
  );
};

const getStudentClassId = (student) => {
  return (
    getId(student?.class) ||
    getId(student?.schoolClass) ||
    getId(student?.schoolClassId) ||
    null
  );
};

const getStudentSectionId = (student) => {
  return (
    getId(student?.section) ||
    getId(student?.sectionId) ||
    null
  );
};

const StudentAttendance = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const studentState = useSelector((state) => state.students || {});
  const attendanceState = useSelector((state) => state.attendance || {});
  const classState = useSelector((state) => state.class || {});
  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );

  const studentsLoading = studentState?.loading || false;
  const attendanceLoading = attendanceState?.loading || false;
  const attendanceList = Array.isArray(attendanceState?.list)
    ? attendanceState.list
    : [];
  const classAssignTeacher = Array.isArray(classState?.classAssignTeacher)
    ? classState.classAssignTeacher
    : [];

  const schoolStudents = Array.isArray(studentState?.schoolStudents)
    ? studentState.schoolStudents
    : Array.isArray(studentState?.schoolStudents?.students)
    ? studentState.schoolStudents.students
    : Array.isArray(studentState?.students)
    ? studentState.students
    : [];

  const schoolId = user?.school?._id || user?.schoolId || null;
  const academicYearId = selectedAcademicYear?._id || null;

  const [selectedClassObj, setSelectedClassObj] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const prefilledClassId = query.get("classId");

  useEffect(() => {
    if (!schoolId || !academicYearId || !user?._id) return;

    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
    dispatch(
      fetchAssignedClasses({
        schoolId,
        academicYearId,
        teacherId: user._id,
      })
    );
  }, [dispatch, schoolId, academicYearId, user?._id]);

  const assignedClassSections = useMemo(() => {
    if (!Array.isArray(classAssignTeacher)) return [];

    const result = [];

    classAssignTeacher.forEach((item) => {
      const classId = getId(item);
      const className = item?.name || "Class";
      const sections = Array.isArray(item?.sections) ? item.sections : [];
      const subjects = Array.isArray(item?.subjects) ? item.subjects : [];

      sections.forEach((section) => {
        const sectionId = getId(section?.sectionId) || getId(section);
        const sectionName =
          section?.sectionId?.name || section?.name || "Section";

        if (!classId || !sectionId) return;

        result.push({
          key: `${classId}-${sectionId}`,
          schoolClassId: classId,
          sectionId,
          className,
          sectionName,
          isClassTeacher: Boolean(section?.isClassTeacher),
          type: "class",
        });

        subjects.forEach((sub) => {
          const subjectId = getId(sub?.subjectId) || getId(sub);
          const subjectName =
            sub?.subjectId?.name || sub?.name || "Subject";

          if (!subjectId) return;

          result.push({
            key: `${classId}-${sectionId}-${subjectId}`,
            schoolClassId: classId,
            sectionId,
            className,
            sectionName,
            subjectId,
            subjectName,
            isClassTeacher: Boolean(section?.isClassTeacher),
            type: "subject",
          });
        });
      });
    });

    const uniqueMap = new Map();
    result.forEach((item) => {
      if (!uniqueMap.has(item.key)) {
        uniqueMap.set(item.key, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [classAssignTeacher]);

  useEffect(() => {
    if (!assignedClassSections.length) {
      setSelectedClassObj(null);
      return;
    }

    const prefilledClass = prefilledClassId
      ? assignedClassSections.find(
          (item) => item.schoolClassId === prefilledClassId
        )
      : null;

    if (!selectedClassObj) {
      setSelectedClassObj(prefilledClass || assignedClassSections[0]);
      return;
    }

    const stillExists = assignedClassSections.find(
      (item) => item.key === selectedClassObj?.key
    );

    if (!stillExists) {
      setSelectedClassObj(prefilledClass || assignedClassSections[0]);
    }
  }, [assignedClassSections, selectedClassObj, prefilledClassId]);

  const classStudents = useMemo(() => {
    if (!selectedClassObj || !Array.isArray(schoolStudents)) return [];

    return schoolStudents.filter((student) => {
      const studentClassId = getStudentClassId(student);
      const studentSectionId = getStudentSectionId(student);

      return (
        studentClassId === selectedClassObj.schoolClassId &&
        studentSectionId === selectedClassObj.sectionId
      );
    });
  }, [schoolStudents, selectedClassObj]);

  const existingAttendanceMap = useMemo(() => {
    const map = {};

    attendanceList.forEach((record) => {
      const linkedId =
        getId(record?.studentId) ||
        getId(record?.userId) ||
        getId(record?.student) ||
        getId(record?.user);

      if (linkedId && record?.status) {
        map[linkedId] = record.status;
      }
    });

    return map;
  }, [attendanceList]);

  useEffect(() => {
    if (!Array.isArray(classStudents)) return;

    setAttendance((prev) => {
      const next = { ...prev };

      classStudents.forEach((student) => {
        const localKey = student?._id;
        const userId = getStudentUserId(student);

        if (next[localKey]) return;

        next[localKey] =
          existingAttendanceMap[userId] ||
          existingAttendanceMap[localKey] ||
          "present";
      });

      return next;
    });
  }, [classStudents, existingAttendanceMap]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassObj) return [];

    const queryText = searchText.trim().toLowerCase();

    return classStudents.filter((student) => {
      const currentStatus = attendance[student._id] || "present";
      const statusMatch = statusFilter ? currentStatus === statusFilter : true;

      const name = getStudentName(student).toLowerCase();
      const regNo = String(student?.registrationNumber || "").toLowerCase();
      const mobile = String(getStudentMobile(student)).toLowerCase();

      const textMatch =
        !queryText ||
        name.includes(queryText) ||
        regNo.includes(queryText) ||
        mobile.includes(queryText);

      return statusMatch && textMatch;
    });
  }, [selectedClassObj, classStudents, searchText, statusFilter, attendance]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;

    filteredStudents.forEach((student) => {
      if ((attendance[student._id] || "present") === "absent") {
        absent += 1;
      } else {
        present += 1;
      }
    });

    const total = filteredStudents.length;
    const presentRate = total ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, presentRate };
  }, [filteredStudents, attendance]);

  const handleAttendanceChange = (studentId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    filteredStudents.forEach((student) => {
      updated[student._id] = status;
    });

    setAttendance((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClassObj) {
      message.warning("Please select class");
      return;
    }

    if (!attendanceDate) {
      message.warning("Please select attendance date");
      return;
    }

    const records = classStudents
      .map((student) => ({
        userId: getStudentUserId(student),
        status: attendance[student._id] || "present",
      }))
      .filter((record) => record.userId);

    if (!records.length) {
      message.error("No valid student records found.");
      return;
    }

    try {
      await dispatch(
        submitAttendance({
          schoolId,
          records,
          role: "student",
          date: attendanceDate.startOf("day").toISOString(),
          classId: selectedClassObj.schoolClassId,
          sectionId: selectedClassObj.sectionId,
          subjectId: selectedClassObj.subjectId || undefined,
          academicYearId,
        })
      ).unwrap();

      message.success("Attendance saved successfully");
    } catch (error) {
      message.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to save attendance."
      );
    }
  };

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{getStudentName(record)}</div>
          <Text type="secondary">
            Reg No: {record?.registrationNumber || "-"}
          </Text>
          <br />
          <Text type="secondary">
            Mobile: {getStudentMobile(record)}
          </Text>
        </div>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (_, record) => (
        <Radio.Group
          value={attendance[record._id] || "present"}
          onChange={(e) => handleAttendanceChange(record._id, e.target.value)}
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

  return (
    <Card bordered={false}>
      <Title level={4} style={{ marginBottom: 20 }}>
        Student Attendance
      </Title>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Present" value={summary.present} />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Statistic title="Absent" value={summary.absent} />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Text type="secondary">Present Rate</Text>
            <Progress percent={summary.presentRate} size="small" />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <DatePicker
            value={attendanceDate}
            onChange={(date) => setAttendanceDate(date || dayjs())}
            style={{ width: "100%" }}
            disabledDate={(current) =>
              current && current > dayjs().endOf("day")
            }
          />
        </Col>
      </Row>

      <Divider />

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Select
            placeholder="Select Class & Section"
            style={{ width: "100%" }}
            value={selectedClassObj?.key}
            onChange={(value) => {
              const selected = assignedClassSections.find(
                (item) => item.key === value
              );
              setSelectedClassObj(selected || null);
            }}
            showSearch
            optionFilterProp="label"
            options={assignedClassSections.map((cls) => ({
              value: cls.key,
              label: `${cls.className} - ${cls.sectionName}${
                cls.subjectName ? ` (${cls.subjectName})` : ""
              }`,
            }))}
          />
        </Col>

        <Col xs={24} md={8}>
          <Select
            placeholder="Filter by status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: "100%" }}
            options={[
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
            ]}
          />
        </Col>

        <Col xs={24} md={8}>
          <Input
            placeholder="Search by student / reg no. / mobile"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
      </Row>

      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button onClick={() => markAll("present")}>Mark All Present</Button>
          <Button danger onClick={() => markAll("absent")}>
            Mark All Absent
          </Button>
        </Space>

        <Button
          type="primary"
          onClick={handleSubmit}
          loading={attendanceLoading}
          disabled={!selectedClassObj || !classStudents.length}
        >
          Save Attendance
        </Button>
      </Row>

      <Table
        rowKey={(record) => record?._id}
        columns={columns}
        dataSource={filteredStudents}
        loading={studentsLoading || attendanceLoading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: <Empty description="No students found" />,
        }}
      />
    </Card>
  );
};

export default StudentAttendance;
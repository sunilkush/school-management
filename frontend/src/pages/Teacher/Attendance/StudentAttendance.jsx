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

import { fetchStudentsBySchoolId } from "../../../features/studentSlice.js";
import {
  submitAttendance,
 // fetchAttendance,
} from "../../../features/attendanceSlice.js";
import { fetchAssignedClasses } from "../../../features/classSlice.js";

const { Title, Text } = Typography;
const { Option } = Select;

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
  const attendanceList = attendanceState?.list || [];
  const classAssignTeacher = classState?.classAssignTeacher || [];

  // ✅ handle both possible shapes
  const schoolStudents = Array.isArray(studentState?.schoolStudents)
    ? studentState.schoolStudents
    : Array.isArray(studentState?.schoolStudents?.students)
    ? studentState.schoolStudents.students
    : Array.isArray(studentState?.students)
    ? studentState.students
    : [];

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

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
    if (schoolId && academicYearId && user?._id) {
      dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
      dispatch(
        fetchAssignedClasses({
          schoolId,
          academicYearId,
          teacherId: user?._id,
        })
      );
    }
  }, [dispatch, schoolId, academicYearId, user?._id]);

  // ✅ fixed as per your actual classAssignTeacher data
  const assignedClassSections = useMemo(() => {
    if (!Array.isArray(classAssignTeacher)) return [];

    const result = [];

    classAssignTeacher.forEach((item) => {
      const classId = item?._id;
      const className = item?.name;
      const sections = Array.isArray(item?.sections) ? item.sections : [];
      const subjects = Array.isArray(item?.subjects) ? item.subjects : [];

      sections.forEach((section) => {
        const sectionId = section?.sectionId?._id || section?.sectionId;
        const sectionName = section?.sectionId?.name || section?.name;

        if (!classId || !sectionId) return;

        result.push({
          key: `${classId}-${sectionId}`,
          schoolClassId: classId,
          sectionId,
          className: className || "Class",
          sectionName: sectionName || "Section",
          isClassTeacher: section?.isClassTeacher || false,
          type: "class",
        });

        // optional subject rows if future me subjects aaye
        subjects.forEach((sub) => {
          const subjectId = sub?.subjectId?._id || sub?.subjectId;
          const subjectName = sub?.subjectId?.name || sub?.name;

          if (!subjectId) return;

          result.push({
            key: `${classId}-${sectionId}-${subjectId}`,
            schoolClassId: classId,
            sectionId,
            className: className || "Class",
            sectionName: sectionName || "Section",
            subjectId,
            subjectName,
            isClassTeacher: section?.isClassTeacher || false,
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
    if (!assignedClassSections.length) return;

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

 /*  useEffect(() => {
    if (!schoolId || !selectedClassObj || !academicYearId || !attendanceDate) {
      return;
    }

    dispatch(
      fetchAttendance({
        schoolId,
        academicYearId,
        classId: selectedClassObj.schoolClassId,
        sectionId: selectedClassObj.sectionId,
        subjectId: selectedClassObj.subjectId || undefined,
        role: "teacher",
        date: attendanceDate.startOf("day").toISOString(),
        page: 1,
        limit: 500,
      })
    );
  }, [dispatch, schoolId, academicYearId, selectedClassObj, attendanceDate]); */

  // ✅ fixed student filtering
  const classStudents = useMemo(() => {
    if (!selectedClassObj || !Array.isArray(schoolStudents)) return [];

    return schoolStudents.filter(
      (student) =>
        student?.class?._id === selectedClassObj.schoolClassId &&
        student?.section?._id === selectedClassObj.sectionId
    );
  }, [schoolStudents, selectedClassObj]);

  const existingAttendanceMap = useMemo(() => {
    const map = {};

    attendanceList.forEach((record) => {
      const linkedId =
        record?.studentId?._id ||
        record?.studentId ||
        record?.userId?._id ||
        record?.userId ||
        record?.student?._id;

      if (linkedId && record?.status) {
        map[linkedId] = record.status;
      }
    });

    return map;
  }, [attendanceList]);

  useEffect(() => {
    const nextAttendance = {};

    classStudents.forEach((student) => {
      nextAttendance[student._id] =
        existingAttendanceMap[student._id] || "present";
    });

    setAttendance(nextAttendance);
  }, [classStudents, existingAttendanceMap]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassObj) return [];

    const queryText = searchText.trim().toLowerCase();

    return classStudents.filter((student) => {
      const currentStatus = attendance[student._id];
      const statusMatch = statusFilter ? currentStatus === statusFilter : true;

      const name = student?.user?.name?.toLowerCase() || "";
      const regNo = student?.registrationNumber?.toLowerCase() || "";
      const mobile = String(student?.mobileNumber || "").toLowerCase();

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
      if (attendance[student._id] === "absent") {
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
      return message.warning("Please select class");
    }

    const records = filteredStudents.map((s) => ({
      userId: s?.user?._id,
      status: attendance[s._id] || "present",
    }));

    if (records.some((record) => !record.userId)) {
      message.error("Some students are missing user mapping. Please contact admin.");
      return;
    }

    try {
      await dispatch(submitAttendance({
        schoolId,
        records,
        role: "student",
        date: attendanceDate.toISOString(),
        classId: selectedClassObj.schoolClassId,
        sectionId: selectedClassObj.sectionId,
        subjectId: selectedClassObj.subjectId,
      })).unwrap();
      message.success("Attendance Saved");
    } catch (error) {
      message.error(error || "Failed to save attendance.");
    }
  };

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record?.user?.name || "-"}</div>
          <Text type="secondary">
            Reg No: {record?.registrationNumber || "-"}
          </Text>
          <br />
          <Text type="secondary">Mobile: {record?.mobileNumber || "-"}</Text>
        </div>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (_, record) => (
        <Radio.Group
          value={attendance[record._id]}
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
            optionFilterProp="children"
          >
            {assignedClassSections.map((cls) => (
              <Option key={cls.key} value={cls.key}>
                {cls.className} - {cls.sectionName}
                {cls.subjectName ? ` (${cls.subjectName})` : ""}
              </Option>
            ))}
          </Select>
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
        >
          Save Attendance
        </Button>
      </Row>

      <Table
        rowKey="_id"
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
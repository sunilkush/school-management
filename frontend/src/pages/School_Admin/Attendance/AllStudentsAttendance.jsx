import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Select,
  Button,
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
import {
  CheckCircleOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { markBulkAttendance } from "../../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";

const { Title, Text } = Typography;

const AllStudentsAttendance = () => {
  const dispatch = useDispatch();

  const { schoolStudents = [], loading } = useSelector((s) => s.students || {});
  const { loading: attendanceLoading } = useSelector((s) => s.attendance || {});
  const { user: currentUser } = useSelector((s) => s.auth || {});
  const { schoolClasses = [] } = useSelector((s) =>  s.schoolClass || {});
  const { selectedAcademicYear} = useSelector((s) => s.academicYear || {});
  const schoolId = currentUser?.school?._id;
  const academicYearId = selectedAcademicYear?._id;
 
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [searchText, setSearchText] = useState("");
  const [attendance, setAttendance] = useState({});

  /* ---------------- DATA ---------------- */
  const students = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (Array.isArray(schoolStudents?.students)) return schoolStudents.students;
    if (Array.isArray(schoolStudents?.data?.students))
      return schoolStudents.data.students;
    return [];
  }, [schoolStudents]);

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  /* ---------------- FILTER ---------------- */
  const filteredStudents = useMemo(() => {
    const q = searchText.toLowerCase();

    return students.filter((s) => {
      const name = s?.user?.name?.toLowerCase() || "";
      const roll =
        `${s?.rollNumber || s?.registrationNumber || ""}`.toLowerCase();

      const classMatch = selectedClass
        ? s?.schoolClass?.name === selectedClass
        : true;

      const sectionMatch = selectedSection
        ? s?.section?._id === selectedSection
        : true;

      const statusMatch = filterStatus
        ? attendance[s._id] === filterStatus
        : true;

      const searchMatch = !q || name.includes(q) || roll.includes(q);

      return classMatch && sectionMatch && statusMatch && searchMatch;
    });
  }, [
    students,
    selectedClass,
    selectedSection,
    filterStatus,
    searchText,
    attendance,
  ]);

  /* ---------------- SUMMARY ---------------- */
  const summary = useMemo(() => {
    let present = 0,
      absent = 0;

    filteredStudents.forEach((s) => {
      if (attendance[s._id] === "absent") absent++;
      else present++;
    });

    const total = filteredStudents.length;
    return {
      present,
      absent,
      total,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  }, [filteredStudents, attendance]);

  /* ---------------- ACTIONS ---------------- */
  const handleChange = (id, value) => {
    setAttendance((p) => ({ ...p, [id]: value }));
  };

  const markAll = (status) => {
    const updated = {};
    filteredStudents.forEach((s) => (updated[s._id] = status));
    setAttendance((p) => ({ ...p, ...updated }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSection)
      return message.warning("Select class & section");

    const payload = {
      schoolId,
      role: "student",
      classId: classes.find((c) => c.name === selectedClass)?._id,
      sectionId: selectedSection,
      date: attendanceDate.startOf("day").toISOString(),
      records: filteredStudents.map((s) => ({
        userId: s?.user?._id,
        status: attendance[s._id] || "present",
      })),
    };

    const res = await dispatch(markBulkAttendance(payload));

    if (res?.meta?.requestStatus === "fulfilled") {
      message.success("Attendance saved");
    } else {
      message.error("Failed to save attendance");
    }
  };

  /* ---------------- TABLE ---------------- */
  const columns = [
    {
      title: "Student",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r?.user?.name}</span>
          <span className="text-xs text-gray-500">
            Roll: {r?.rollNumber || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Class",
      render: (_, r) => (
        <Tag color="blue">
          {r?.schoolClass?.name} {r?.section?.name && `• ${r.section.name}`}
        </Tag>
      ),
    },
    {
      title: "Status",
      render: (_, r) => (
        <Radio.Group
          value={attendance[r._id]}
          onChange={(e) => handleChange(r._id, e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="present">P</Radio.Button>
          <Radio.Button value="absent">A</Radio.Button>
        </Radio.Group>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          Attendance Management 01
        </Title>
        <Text type="secondary">
          Simple class-wise attendance tracking system
        </Text>
      </div>

      {/* FILTER BAR */}
      <Card className="mb-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select
            placeholder="Class"
            value={selectedClass}
            onChange={setSelectedClass}
            options={classes.map((c) => ({ value: c.name, label: c.name }))}
          />

          <Select
            placeholder="Section"
            value={selectedSection}
            onChange={setSelectedSection}
            disabled={!selectedClass}
            options={
              classes
                .find((c) => c.name === selectedClass)
                ?.sections?.map((s) => ({
                  value: s._id,
                  label: s.name,
                })) || []
            }
          />

          <DatePicker
            value={attendanceDate}
            onChange={setAttendanceDate}
            className="w-full"
          />

          <Select
            allowClear
            placeholder="Status"
            onChange={setFilterStatus}
            options={[
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
            ]}
          />

          <Input
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </Card>

      {/* SUMMARY */}
      <Card className="mb-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="w-full md:w-1/2">
            <Progress percent={summary.rate} />
            <div className="flex gap-2 mt-2">
              <Tag color="green">Present {summary.present}</Tag>
              <Tag color="red">Absent {summary.absent}</Tag>
              <Tag>Total {summary.total}</Tag>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button onClick={() => markAll("present")}>
              All Present
            </Button>
            <Button danger onClick={() => markAll("absent")}>
              All Absent
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={attendanceLoading}
              onClick={handleSubmit}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredStudents}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AllStudentsAttendance;
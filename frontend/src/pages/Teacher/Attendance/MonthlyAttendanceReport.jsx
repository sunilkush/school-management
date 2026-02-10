import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Select,
  Row,
  Col,
  Typography,
  DatePicker,
  Statistic,
  Tag,
  Spin,
  Empty,
} from "antd";
import dayjs from "dayjs";

// 👉 You can replace with your API slice
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchMonthlyAttendance } from "../../../features/attendanceSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { activeUser } from "../../../features/authSlice";

const { Title } = Typography;
const { Option } = Select;

const MonthlyAttendanceReport = () => {
  const dispatch = useDispatch();

  // 🔹 Redux Data
  const { schoolStudents = [], loading: studentLoading } = useSelector(
    (state) => state.students
  );

  const { monthlyAttendance = [], loading: attendanceLoading } = useSelector(
    (state) => state.attendance
  );

  const { classList = [] } = useSelector((state) => state.class);
  const { user: currentUser } = useSelector((state) => state.auth);

  const schoolId = currentUser?.school?._id;
  const academicYearId = currentUser?.academicYear?._id;

  // 🔹 Local State
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  // 🔹 Initial Load
  useEffect(() => {
    dispatch(activeUser());

    if (schoolId) {
      dispatch(fetchStudentsBySchoolId({ schoolId }));
      dispatch(fetchAllClasses({ schoolId }));
    }
  }, [dispatch, schoolId]);

  // 🔹 Fetch Monthly Attendance
  useEffect(() => {
    if (selectedClass && selectedSection && selectedMonth) {
      dispatch(
        fetchMonthlyAttendance({
          schoolId,
          className: selectedClass,
          sectionName: selectedSection,
          month: selectedMonth.format("MM"),
          year: selectedMonth.format("YYYY"),
          academicYearId,
        })
      );
    }
  }, [
    dispatch,
    selectedClass,
    selectedSection,
    selectedMonth,
    schoolId,
    academicYearId,
  ]);

  // 🔹 Section List
  const sectionList = useMemo(() => {
    if (!selectedClass) return [];

    const sections = schoolStudents
      .filter((s) => s.class?.name === selectedClass)
      .map((s) => s.section?.name)
      .filter(Boolean);

    return [...new Set(sections)];
  }, [schoolStudents, selectedClass]);

  // 🔹 Table Data Mapping
  const tableData = useMemo(() => {
    return monthlyAttendance.map((item) => {
      const totalDays = item.present + item.absent;
      const percentage = totalDays
        ? ((item.present / totalDays) * 100).toFixed(1)
        : 0;

      return {
        ...item,
        totalDays,
        percentage,
      };
    });
  }, [monthlyAttendance]);

  // 🔹 Summary Stats
  const summary = useMemo(() => {
    let totalStudents = tableData.length;
    let totalPresent = 0;
    let totalAbsent = 0;

    tableData.forEach((s) => {
      totalPresent += s.present;
      totalAbsent += s.absent;
    });

    const totalDays = totalPresent + totalAbsent;
    const avgPercentage = totalDays
      ? ((totalPresent / totalDays) * 100).toFixed(1)
      : 0;

    return {
      totalStudents,
      totalPresent,
      totalAbsent,
      avgPercentage,
    };
  }, [tableData]);

  // 🔹 Table Columns
  const columns = [
    {
      title: "Student Name",
      dataIndex: ["student", "name"],
    },
    {
      title: "Present",
      dataIndex: "present",
      render: (val) => <Tag color="green">{val}</Tag>,
    },
    {
      title: "Absent",
      dataIndex: "absent",
      render: (val) => <Tag color="red">{val}</Tag>,
    },
    {
      title: "Total Days",
      dataIndex: "totalDays",
    },
    {
      title: "Attendance %",
      dataIndex: "percentage",
      render: (val) => (
        <Tag color={val >= 75 ? "green" : val >= 50 ? "orange" : "red"}>
          {val}%
        </Tag>
      ),
    },
  ];

  const loading = studentLoading || attendanceLoading;

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Title level={4}>Monthly Attendance Report</Title>

      {/* 🔹 Filters */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={6}>
          <Select
            placeholder="Select Class"
            style={{ width: "100%" }}
            onChange={(val) => {
              setSelectedClass(val);
              setSelectedSection(null);
            }}
          >
            {[...classList]
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
            placeholder="Select Section"
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
            picker="month"
            style={{ width: "100%" }}
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        </Col>
      </Row>

      {/* 🔹 Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Students" value={summary.totalStudents} />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Total Present" value={summary.totalPresent} />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Total Absent" value={summary.totalAbsent} />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Avg Attendance"
              value={summary.avgPercentage}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* 🔹 Table */}
      {loading ? (
        <Spin />
      ) : tableData.length === 0 ? (
        <Empty description="No Attendance Data" />
      ) : (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default MonthlyAttendanceReport;

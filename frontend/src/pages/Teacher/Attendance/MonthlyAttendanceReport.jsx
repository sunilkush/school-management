import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
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

import { fetchMonthlyAttendance } from "../../../features/attendanceSlice";
import { fetchAssignedClasses } from "../../../features/classSlice";

const { Title } = Typography;
const { Option } = Select;

const MonthlyAttendanceReport = () => {
  const dispatch = useDispatch();

  const { monthlyAttendance = [], loading: attendanceLoading } = useSelector(
    (state) => state.attendance
  );

  const { classAssignTeacher = [], loading: classLoading } = useSelector((state) => state.class);
  const { user: currentUser } = useSelector((state) => state.auth);
  const {selectedAcademicYear} = useSelector((state) => state.academicYear || {});
  const schoolId = currentUser?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [selectedClassSectionKey, setSelectedClassSectionKey] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  useEffect(() => {
    if (!schoolId || !academicYearId || !currentUser?._id) return;
    dispatch(fetchAssignedClasses({ schoolId, academicYearId, teacherId: currentUser._id }));
  }, [dispatch, schoolId, academicYearId, currentUser?._id]);

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

  useEffect(() => {
    if (!selectedClassSection || !selectedMonth || !schoolId) return;

    dispatch(
      fetchMonthlyAttendance({
        schoolId,
        classId: selectedClassSection.classId,
        sectionId: selectedClassSection.sectionId,
        role: "student",
        month: selectedMonth.format("MM"),
        year: selectedMonth.format("YYYY"),
      })
    );
  }, [dispatch, selectedClassSection, selectedMonth, schoolId]);

  const totalDaysInMonth = useMemo(() => selectedMonth.daysInMonth(), [selectedMonth]);

  const tableData = useMemo(() => {
    return monthlyAttendance.map((item, index) => {
      const totalDays = item.present + item.absent;
      const percentage = totalDays
        ? ((item.present / totalDays) * 100).toFixed(1)
        : 0;
      const row = {
        ...item,
        key: item.userId || item._id || `${item.student?.name || "student"}-${index}`,
        totalDays,
        percentage,
      };

      for (let day = 1; day <= totalDaysInMonth; day += 1) {
        const status = item.dailyStatus?.[String(day)];
        row[`day_${day}`] = status || "-";
      }

      return row;
    });
  }, [monthlyAttendance, totalDaysInMonth]);

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

  const dateColumns = useMemo(
    () =>
      Array.from({ length: totalDaysInMonth }, (_, idx) => {
        const day = idx + 1;
        return {
          title: day,
          dataIndex: `day_${day}`,
          width: 72,
          align: "center",
          render: (val) => {
            if (val === "present") return <Tag color="green">P</Tag>;
            if (val === "absent") return <Tag color="red">A</Tag>;
            if (val === "late") return <Tag color="orange">L</Tag>;
            if (val === "halfday") return <Tag color="gold">H</Tag>;
            if (val === "leave") return <Tag color="blue">Lv</Tag>;
            return <Tag>-</Tag>;
          },
        };
      }),
    [totalDaysInMonth]
  );

  const columns = [
    {
      title: "Student Name",
      dataIndex: ["student", "name"],
      fixed: "left",
      width: 220,
    },
    ...dateColumns,
    {
      title: "Total Days",
      dataIndex: "totalDays",
      fixed: "right",
      width: 100,
      align: "center",
    },
    {
      title: "Present",
      dataIndex: "present",
      fixed: "right",
      width: 90,
      align: "center",
      render: (val) => <Tag color="green">{val}</Tag>,
    },
    {
      title: "Absent",
      dataIndex: "absent",
      fixed: "right",
      width: 90,
      align: "center",
      render: (val) => <Tag color="red">{val}</Tag>,
    },
    {
      title: "Attendance %",
      dataIndex: "percentage",
      fixed: "right",
      width: 120,
      align: "center",
      render: (val) => (
        <Tag color={val >= 75 ? "green" : val >= 50 ? "orange" : "red"}>
          {val}%
        </Tag>
      ),
    },
  ];

  const loading = classLoading || attendanceLoading;

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Title level={4}>Monthly Attendance Report</Title>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={10}>
          <Select
            placeholder="Select Assigned Class & Section"
            style={{ width: "100%" }}
            value={selectedClassSectionKey}
            onChange={setSelectedClassSectionKey}
            options={classTeacherSections.map((item) => ({
              label: `${item.className} - ${item.sectionName}`,
              value: item.key,
            }))}
          >
            {classTeacherSections.map((item) => (
              <Option key={item.key} value={item.key}>
                {item.className} - {item.sectionName}
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

      {!classTeacherSections.length && !loading && (
        <Alert
          style={{ marginBottom: 20 }}
          type="warning"
          message="Class teacher assignment not found"
          description="Aapko class teacher ke roop mein koi section assign nahi hai. Report dekhne ke liye admin se assignment karwayein."
          showIcon
        />
      )}

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
      ) : !selectedClassSection ? (
        <Empty description="Assigned class-section select karein" />
      ) : tableData.length === 0 ? (
        <Empty description="No Attendance Data" />
      ) : (
        <Table
          rowKey="key"
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1600 }}
        />
      )}
    </Card>
  );
};

export default MonthlyAttendanceReport;
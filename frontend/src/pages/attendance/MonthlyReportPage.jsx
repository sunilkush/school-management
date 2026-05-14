import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonthlyReport } from "../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";

const { Text } = Typography;

const ROLE_OPTIONS = [
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Staff", value: "staff" },
];

const MonthlyReportPage = () => {
  const dispatch = useDispatch();

  const { monthlyReport = [], reportLoading } = useSelector((state) => state.attendance || {});
  const { schoolClasses = [] } = useSelector((state) => state.schoolClass || {});
  const { user: currentUser } = useSelector((state) => state.auth || {});

  const schoolId = currentUser?.school?._id;
  const academicYearId = currentUser?.school?.academicYear?._id || currentUser?.school?.academicYear;

  const [monthDate, setMonthDate] = useState(dayjs());
  const [role, setRole] = useState("student");
  const [schoolClassId, setSchoolClassId] = useState();
  const [sectionId, setSectionId] = useState();

  useEffect(() => {
    if (!schoolId || role !== "student") return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId, role]);

  const normalizedClasses = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    if (Array.isArray(schoolClasses?.data)) return schoolClasses.data;
    return [];
  }, [schoolClasses]);

  const selectedClass = useMemo(
    () => normalizedClasses.find((item) => item?._id === schoolClassId),
    [normalizedClasses, schoolClassId]
  );

  const classOptions = useMemo(
    () =>
      normalizedClasses.map((item) => ({
        value: item?._id,
        label: item?.name,
      })),
    [normalizedClasses]
  );

  const sectionOptions = useMemo(
    () =>
      (selectedClass?.sections || []).map((item) => ({
        value: item?._id,
        label: item?.name,
      })),
    [selectedClass]
  );

  const summary = useMemo(() => {
    if (!monthlyReport.length) {
      return { average: 0, totalUsers: 0, highRisk: 0 };
    }

    const average = (
      monthlyReport.reduce((acc, row) => acc + (row.attendancePercentage || 0), 0) / monthlyReport.length
    ).toFixed(2);

    const highRisk = monthlyReport.filter((row) => (row.attendancePercentage || 0) < 75).length;

    return {
      average: Number(average),
      totalUsers: monthlyReport.length,
      highRisk,
    };
  }, [monthlyReport]);

  const handleRoleChange = (value) => {
    setRole(value);
    setSchoolClassId(undefined);
    setSectionId(undefined);
  };

  const handleGenerate = () => {
    if (!schoolId) {
      message.error("School information not found in current login session.");
      return;
    }

    if (role === "student" && schoolClassId && !sectionId) {
      message.warning("Please select a section or clear class filter.");
      return;
    }

    dispatch(
      fetchMonthlyReport({
        schoolId,
        month: monthDate.month() + 1,
        year: monthDate.year(),
        role,
        schoolClassId: role === "student" ? schoolClassId : undefined,
        sectionId: role === "student" ? sectionId : undefined,
      })
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (value) => value || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (value) => value || "-",
    },
    {
      title: "Present",
      dataIndex: "presentDays",
      align: "center",
      width: 100,
    },
    {
      title: "Absent",
      key: "absentDays",
      align: "center",
      width: 100,
      render: (_, row) => row?.statusBreakdown?.absent || 0,
    },
    {
      title: "Leave",
      key: "leaveDays",
      align: "center",
      width: 100,
      render: (_, row) => row?.statusBreakdown?.leave || 0,
    },
    {
      title: "Total",
      dataIndex: "totalDays",
      align: "center",
      width: 100,
    },
    {
      title: "Attendance %",
      dataIndex: "attendancePercentage",
      align: "center",
      width: 130,
      render: (value) => (
        <Tag color={value >= 90 ? "green" : value >= 75 ? "gold" : "red"}>{value || 0}%</Tag>
      ),
    },
  ];

  return (
    <Card
      title="Monthly Attendance Report"
      extra={<Text type="secondary">School Admin can track students, teachers and staff month-wise.</Text>}
    >
      <Row gutter={[12, 12]}>
        <Col xs={24} md={5}>
          <DatePicker picker="month" style={{ width: "100%" }} value={monthDate} onChange={setMonthDate} />
        </Col>
        <Col xs={24} md={5}>
          <Select
            style={{ width: "100%" }}
            value={role}
            onChange={handleRoleChange}
            options={ROLE_OPTIONS}
            placeholder="Select role"
          />
        </Col>

        <Col xs={24} md={5}>
          <Select
            allowClear
            disabled={role !== "student"}
            style={{ width: "100%" }}
            value={schoolClassId}
            options={classOptions}
            placeholder="Class (students)"
            onChange={(value) => {
              setSchoolClassId(value);
              setSectionId(undefined);
            }}
          />
        </Col>

        <Col xs={24} md={5}>
          <Select
            allowClear
            disabled={role !== "student" || !schoolClassId}
            style={{ width: "100%" }}
            value={sectionId}
            options={sectionOptions}
            placeholder="Section (students)"
            onChange={setSectionId}
          />
        </Col>

        <Col xs={24} md={4}>
          <Button block type="primary" loading={reportLoading} onClick={handleGenerate}>
            Generate
          </Button>
        </Col>
      </Row>

      <Space size={12} style={{ marginTop: 16, marginBottom: 8 }} wrap>
        <Statistic title="Users" value={summary.totalUsers} />
        <Statistic title="Average %" value={summary.average} precision={2} suffix="%" />
        <Statistic title="Below 75%" value={summary.highRisk} />
      </Space>

      <Table
        rowKey="userId"
        loading={reportLoading}
        style={{ marginTop: 8 }}
        dataSource={monthlyReport}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </Card>
  );
};

export default MonthlyReportPage;
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Select,
  Button,
  DatePicker,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonthlyReport } from "../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";

const { Text, Title } = Typography;

const ROLE_OPTIONS = [
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Staff", value: "staff" },
];

const MonthlyReportPage = () => {
  const dispatch = useDispatch();

  const { monthlyReport = [], reportLoading } = useSelector(
    (s) => s.attendance || {}
  );
  const { schoolClasses = [] } = useSelector(
    (s) => s.schoolClass || {}
  );
  const { user } = useSelector((s) => s.auth || {});

  const schoolId = user?.school?._id;
  const academicYearId =
    user?.school?.academicYear?._id || user?.school?.academicYear;

  const [month, setMonth] = useState(dayjs());
  const [role, setRole] = useState("student");
  const [classId, setClassId] = useState();
  const [sectionId, setSectionId] = useState();

  /* ---------------- FETCH CLASSES ---------------- */
  useEffect(() => {
    if (role === "student" && schoolId) {
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    }
  }, [role, schoolId]);

  /* ---------------- NORMALIZE ---------------- */
  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  const selectedClass = classes.find((c) => c._id === classId);

  /* ---------------- OPTIONS ---------------- */
  const classOptions = classes.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  const sectionOptions =
    selectedClass?.sections?.map((s) => ({
      value: s._id,
      label: s.name,
    })) || [];

  /* ---------------- SUMMARY ---------------- */
  const summary = useMemo(() => {
    const total = monthlyReport.length;

    const avg =
      total > 0
        ? (
            monthlyReport.reduce(
              (a, b) => a + (b.attendancePercentage || 0),
              0
            ) / total
          ).toFixed(1)
        : 0;

    const low = monthlyReport.filter(
      (r) => (r.attendancePercentage || 0) < 75
    ).length;

    return {
      total,
      avg,
      low,
    };
  }, [monthlyReport]);

  /* ---------------- ACTION ---------------- */
  const handleGenerate = () => {
    if (!schoolId) return message.error("School not found");

    dispatch(
      fetchMonthlyReport({
        schoolId,
        month: month.month() + 1,
        year: month.year(),
        role,
        schoolClassId: role === "student" ? classId : undefined,
        sectionId: role === "student" ? sectionId : undefined,
      })
    );
  };

  /* ---------------- TABLE ---------------- */
  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    { title: "Present", dataIndex: "presentDays", align: "center" },
    {
      title: "Absent",
      render: (_, r) => r?.statusBreakdown?.absent || 0,
      align: "center",
    },
    {
      title: "Leave",
      render: (_, r) => r?.statusBreakdown?.leave || 0,
      align: "center",
    },
    { title: "Total", dataIndex: "totalDays", align: "center" },
    {
      title: "Attendance",
      dataIndex: "attendancePercentage",
      align: "center",
      render: (v) => (
        <Tag color={v >= 90 ? "green" : v >= 75 ? "gold" : "red"}>
          {v || 0}%
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          Monthly Attendance Report
        </Title>
        <Text type="secondary">
          Track performance of students, staff & teachers
        </Text>
      </div>

      {/* FILTERS */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <DatePicker
            picker="month"
            value={month}
            onChange={setMonth}
            className="w-full"
          />

          <Select
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
            placeholder="Role"
          />

          <Select
            placeholder="Class"
            allowClear
            disabled={role !== "student"}
            value={classId}
            onChange={(v) => {
              setClassId(v);
              setSectionId(undefined);
            }}
            options={classOptions}
          />

          <Select
            placeholder="Section"
            allowClear
            disabled={!classId || role !== "student"}
            value={sectionId}
            onChange={setSectionId}
            options={sectionOptions}
          />

          <Button type="primary" loading={reportLoading} onClick={handleGenerate}>
            Generate
          </Button>
        </div>
      </Card>

      {/* SUMMARY DASHBOARD */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Total Users" value={summary.total} />
          </Card>
        </Col>

        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Average Attendance" value={summary.avg} suffix="%" />
          </Card>
        </Col>

        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Below 75%" value={summary.low} />
          </Card>
        </Col>
      </Row>

      {/* TABLE */}
      <Card>
        <Table
          rowKey="userId"
          loading={reportLoading}
          dataSource={monthlyReport}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default MonthlyReportPage;
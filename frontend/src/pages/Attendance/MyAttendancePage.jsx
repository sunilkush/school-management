import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  DatePicker,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  message,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyAttendance,
  markBulkAttendance,
} from "../../features/attendanceSlice";
import StatusTag from "../../components/attendance/StatusTag";

const { Title, Text } = Typography;

const MyAttendancePage = () => {
  const dispatch = useDispatch();

  const { myAttendance = [], loading, error, successMessage } = useSelector(
    (s) => s.attendance
  );
  const { user } = useSelector((s) => s.auth);

  const [month, setMonth] = useState(dayjs());
  const [todayStatus, setTodayStatus] = useState("present");

  const canSelfMark = !["Student", "Parent", "Super Admin", "School Admin"].includes(
    typeof user?.role === "string" ? user.role : user?.role?.name
  );

  const isMonthlyRoute = false;

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    dispatch(
      fetchMyAttendance({
        month: month.month() + 1,
        year: month.year(),
      })
    );
  }, [month]);

  /* ---------------- SUMMARY ---------------- */
  const summary = useMemo(() => {
    const s = {
      total: myAttendance.length,
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
      halfday: 0,
    };

    myAttendance.forEach((i) => {
      if (s[i.status] !== undefined) s[i.status]++;
    });

    const percent = s.total
      ? ((s.present / s.total) * 100).toFixed(1)
      : "0.0";

    return { ...s, percent };
  }, [myAttendance]);

  /* ---------------- SELF MARK ---------------- */
  const handleSelfMark = async () => {
    if (!user?._id || !canSelfMark) return;

    try {
      await dispatch(
        markBulkAttendance({
          schoolId: user?.school?._id || user?.schoolId,
          date: new Date().toISOString(),
          role: "staff",
          records: [
            {
              userId: user._id,
              status: todayStatus,
              remarks: "Self marked attendance",
            },
          ],
        })
      ).unwrap();

      message.success("Attendance added");

      dispatch(
        fetchMyAttendance({
          month: month.month() + 1,
          year: month.year(),
        })
      );
    } catch (e) {
      message.error("Failed to mark attendance",e);
    }
  };

  /* ---------------- TABLE ---------------- */
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => new Date(d).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (t) => t || "—",
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          My Attendance
        </Title>
        <Text type="secondary">
          Monthly attendance tracking and history
        </Text>
      </div>

      {/* ALERTS */}
      <Space direction="vertical" style={{ width: "100%" }}>
        {error && <Alert type="error" showIcon message={error} />}
        {successMessage && (
          <Alert type="success" showIcon message={successMessage} />
        )}
      </Space>

      {/* FILTER BAR */}
      <Card className="mt-3 mb-4">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <DatePicker
            picker="month"
            value={month}
            onChange={(v) => setMonth(v || dayjs())}
          />

          {canSelfMark && !isMonthlyRoute && (
            <div className="flex gap-2 items-center">
              <Select
                value={todayStatus}
                onChange={setTodayStatus}
                style={{ width: 140 }}
                options={[
                  { value: "present", label: "Present" },
                  { value: "late", label: "Late" },
                  { value: "halfday", label: "Half Day" },
                  { value: "leave", label: "Leave" },
                  { value: "absent", label: "Absent" },
                ]}
              />

              <Button type="primary" onClick={handleSelfMark} loading={loading}>
                Mark Today
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* SUMMARY DASHBOARD */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Total" value={summary.total} />
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Present" value={summary.present} />
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Absent" value={summary.absent} />
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Late" value={summary.late} />
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Leave" value={summary.leave} />
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Attendance %" value={summary.percent} suffix="%" />
          </Card>
        </Col>
      </Row>

      {/* TABLE */}
      <Card>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={myAttendance}
          columns={columns}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default MyAttendancePage;
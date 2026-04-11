import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Typography, message } from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import StatusTag from "../../components/attendance/StatusTag";
import { fetchMyAttendance, markBulkAttendance } from "../../features/attendanceSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const MyAttendancePage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { myAttendance, loading, error, successMessage } = useSelector((state) => state.attendance);
  const { user } = useSelector((state) => state.auth);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [todayStatus, setTodayStatus] = useState("present");

  const isTeacher = user?.role?.name === "Teacher";
  const isMonthlyRoute = location.pathname.endsWith("/monthly");

  useEffect(() => {
    dispatch(
      fetchMyAttendance({
        month: selectedMonth.month() + 1,
        year: selectedMonth.year(),
      })
    );
  }, [dispatch, selectedMonth]);

  const handleAddDailyAttendance = async () => {
    if (!isTeacher || !user?._id) return;

    try {
      await dispatch(
        markBulkAttendance({
          schoolId: user?.school?._id || user?.schoolId,
          date: new Date().toISOString(),
          role: "teacher",
          records: [
            {
              userId: user._id,
              status: todayStatus,
              remarks: "Self marked by teacher",
            },
          ],
        })
      ).unwrap();

      message.success("Today attendance added successfully");
      dispatch(
        fetchMyAttendance({
          month: selectedMonth.month() + 1,
          year: selectedMonth.year(),
        })
      );
    } catch (err) {
      message.error(err || "Unable to add daily attendance");
    }
  };

  const summary = useMemo(() => {
    const initial = {
      totalDays: myAttendance.length,
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
      halfday: 0,
    };

    myAttendance.forEach((item) => {
      if (initial[item.status] !== undefined) {
        initial[item.status] += 1;
      }
    });

    const attendancePercent = initial.totalDays
      ? ((initial.present / initial.totalDays) * 100).toFixed(1)
      : "0.0";

    return { ...initial, attendancePercent };
  }, [myAttendance]);

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              My Attendance
            </Title>
            <Text type="secondary">
              {isMonthlyRoute ? "Monthly report and history" : "Daily attendance and monthly report"}
            </Text>
          </Col>
          <Col>
            <DatePicker picker="month" value={selectedMonth} onChange={(value) => setSelectedMonth(value || dayjs())} />
          </Col>
        </Row>

        {error ? <Alert type="error" showIcon message={error} /> : null}
        {successMessage ? <Alert type="success" showIcon message={successMessage} /> : null}

        {isTeacher && !isMonthlyRoute ? (
          <Row gutter={12} align="middle">
            <Col>
              <Text strong>Add Daily Attendance:</Text>
            </Col>
            <Col>
              <Select value={todayStatus} onChange={setTodayStatus} style={{ minWidth: 140 }}>
                <Option value="present">Present</Option>
                <Option value="late">Late</Option>
                <Option value="halfday">Half Day</Option>
                <Option value="leave">Leave</Option>
                <Option value="absent">Absent</Option>
              </Select>
            </Col>
            <Col>
              <Button type="primary" onClick={handleAddDailyAttendance} loading={loading}>
                Add Today
              </Button>
            </Col>
          </Row>
        ) : null}

        <Row gutter={[12, 12]}>
          <Col xs={12} md={4}>
            <Card size="small">
              <Statistic title="Total Days" value={summary.totalDays} />
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
              <Statistic title="Attendance %" value={summary.attendancePercent} suffix="%" />
            </Card>
          </Col>
        </Row>

        <Table
          rowKey="_id"
          loading={loading}
          dataSource={myAttendance}
          columns={[
            { title: "Date", dataIndex: "date", render: (value) => new Date(value).toLocaleDateString() },
            { title: "Status", dataIndex: "status", render: (status) => <StatusTag status={status} /> },
            { title: "Remarks", dataIndex: "remarks" },
          ]}
        />
      </Space>
    </Card>
  );
};

export default MyAttendancePage;
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
  message,
  Calendar,
  Tag,
  Empty,
  Divider,
  List,
  Avatar,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { fetchMyAttendance, markBulkAttendance } from "../../../features/attendanceSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const statusColorMap = {
  present: "green",
  absent: "red",
  leave: "blue",
  late: "orange",
  halfday: "gold",
};

const statusLabelMap = {
  present: "Present",
  absent: "Absent",
  leave: "Leave",
  late: "Late",
  halfday: "Half Day",
};

const MyAttendanceMonthlyReport = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const {
    myAttendance = [],
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.attendance || {});
  const { user } = useSelector((state) => state.auth || {});

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [todayStatus, setTodayStatus] = useState("present");
  const [selectedDate, setSelectedDate] = useState(dayjs());

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

  const attendanceMap = useMemo(() => {
    const map = {};
    myAttendance.forEach((item) => {
      const key = dayjs(item.date).format("YYYY-MM-DD");
      map[key] = item;
    });
    return map;
  }, [myAttendance]);

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

  const selectedDayRecord = useMemo(() => {
    const key = dayjs(selectedDate).format("YYYY-MM-DD");
    return attendanceMap[key] || null;
  }, [attendanceMap, selectedDate]);

  const monthRecords = useMemo(() => {
    return [...myAttendance].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [myAttendance]);

  const dateCellRender = (value) => {
    const key = value.format("YYYY-MM-DD");
    const record = attendanceMap[key];

    if (!record) return null;

    return (
      <div
        style={{
          marginTop: 6,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Tag
          color={statusColorMap[record.status] || "default"}
          style={{
            borderRadius: 999,
            paddingInline: 10,
            fontSize: 11,
            marginInlineEnd: 0,
          }}
        >
          {statusLabelMap[record.status] || record.status}
        </Tag>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #f7faff 0%, #ffffff 100%)",
        minHeight: "100%",
      }}
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          border: "1px solid #edf2f7",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f8fbff 45%, #eef5ff 100%)",
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space align="start" size={14}>
              <Avatar
                size={54}
                icon={<CalendarOutlined />}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                }}
              />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  My Attendance
                </Title>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  {isMonthlyRoute
                    ? "Monthly attendance calendar and daily history"
                    : "Mark daily attendance and monitor monthly performance"}
                </Text>
                <div style={{ marginTop: 10 }}>
                  <Tag color="blue" style={{ borderRadius: 999 }}>
                    {selectedMonth.format("MMMM YYYY")}
                  </Tag>
                  <Tag color="purple" style={{ borderRadius: 999 }}>
                    {user?.role?.name || "User"}
                  </Tag>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} lg={8}>
            <Row justify="end">
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(value) => {
                  const next = value || dayjs();
                  setSelectedMonth(next);
                  setSelectedDate(next.startOf("month"));
                }}
                style={{ width: 220 }}
              />
            </Row>
          </Col>
        </Row>
      </Card>

      {(error || successMessage) && (
        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {error ? <Alert type="error" showIcon message={error} /> : null}
            {successMessage ? (
              <Alert type="success" showIcon message={successMessage} />
            ) : null}
          </Space>
        </div>
      )}

      {isTeacher && !isMonthlyRoute ? (
        <Card
          bordered={false}
          style={{
            marginTop: 16,
            borderRadius: 18,
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
            border: "1px solid #edf2f7",
          }}
        >
          <Row justify="space-between" align="middle" gutter={[12, 12]}>
            <Col xs={24} lg={14}>
              <Space align="center">
                <DashboardOutlined style={{ fontSize: 18, color: "#2563eb" }} />
                <div>
                  <Text strong style={{ display: "block" }}>
                    Quick Daily Attendance
                  </Text>
                  <Text type="secondary">
                    Mark your attendance for today in one click
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <Row gutter={[10, 10]} justify="end">
                <Col xs={24} sm="auto">
                  <Select
                    value={todayStatus}
                    onChange={setTodayStatus}
                    style={{ minWidth: 160 }}
                  >
                    <Option value="present">Present</Option>
                    <Option value="late">Late</Option>
                    <Option value="halfday">Half Day</Option>
                    <Option value="leave">Leave</Option>
                    <Option value="absent">Absent</Option>
                  </Select>
                </Col>
                <Col xs={24} sm="auto">
                  <Button
                    type="primary"
                    onClick={handleAddDailyAttendance}
                    loading={loading}
                  >
                    Add Today
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} md={8} lg={4}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Statistic title="Marked Days" value={summary.totalDays} />
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Statistic
              title="Present"
              value={summary.present}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Statistic
              title="Absent"
              value={summary.absent}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Statistic
              title="Late"
              value={summary.late}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Statistic title="Leave" value={summary.leave} />
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Statistic title="Attendance %" value={summary.attendancePercent} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={17}>
          <Card
            bordered={false}
            loading={loading}
            style={{
              borderRadius: 18,
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
              border: "1px solid #edf2f7",
            }}
            bodyStyle={{ padding: 16 }}
          >
            {myAttendance?.length ? (
              <Calendar
                value={selectedDate}
                fullscreen
                onSelect={(date) => setSelectedDate(date)}
                dateCellRender={dateCellRender}
              />
            ) : (
              <Empty description="No attendance data available for this month" />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={7}>
          <Card
            bordered={false}
            style={{
              borderRadius: 18,
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
              border: "1px solid #edf2f7",
              height: "100%",
            }}
          >
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <div>
                <Title level={5} style={{ marginBottom: 4 }}>
                  Selected Day Details
                </Title>
                <Text type="secondary">
                  {selectedDate.format("DD MMMM YYYY")}
                </Text>
              </div>

              <Divider style={{ margin: 0 }} />

              {selectedDayRecord ? (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 14,
                      background: "#fafcff",
                      border: "1px solid #edf2f7",
                    }}
                  >
                    <Space direction="vertical" size={8}>
                      <Text strong>Status</Text>
                      <Tag
                        color={statusColorMap[selectedDayRecord.status] || "default"}
                        style={{ borderRadius: 999, width: "fit-content" }}
                      >
                        {statusLabelMap[selectedDayRecord.status] || selectedDayRecord.status}
                      </Tag>
                    </Space>
                  </Card>

                  <Card
                    size="small"
                    style={{
                      borderRadius: 14,
                      background: "#fafcff",
                      border: "1px solid #edf2f7",
                    }}
                  >
                    <Space direction="vertical" size={8}>
                      <Text strong>Remarks</Text>
                      <Text type="secondary">
                        {selectedDayRecord.remarks || "No remarks added"}
                      </Text>
                    </Space>
                  </Card>
                </Space>
              ) : (
                <Empty description="No attendance marked for selected date" />
              )}

              <Divider style={{ marginBottom: 0 }} />

              <div>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Monthly History
                </Title>

                {monthRecords.length ? (
                  <List
                    size="small"
                    dataSource={monthRecords.slice(0, 8)}
                    renderItem={(item) => (
                      <List.Item style={{ paddingInline: 0 }}>
                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <Text strong>{dayjs(item.date).format("DD MMM")}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.remarks || "No remarks"}
                            </Text>
                          </div>

                          <Tag
                            color={statusColorMap[item.status] || "default"}
                            style={{ borderRadius: 999 }}
                          >
                            {statusLabelMap[item.status] || item.status}
                          </Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No history found" />
                )}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MyAttendanceMonthlyReport;
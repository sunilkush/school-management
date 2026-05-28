import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
  message,
  Tag,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import StatusTag from "../../../components/attendance/StatusTag";
import {
  fetchMyAttendance,
  markBulkAttendance,
} from "../../../features/attendanceSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const MyAttendancePage = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { myAttendance, loading, error, successMessage } = useSelector(
    (state) => state.attendance
  );

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
      : "0";

    return {
      ...initial,
      attendancePercent,
    };
  }, [myAttendance]);

  const stats = [
    {
      title: "Present",
      value: summary.present,
      icon: <CheckCircleOutlined />,
      bg: "bg-green-50",
      border: "border-green-100",
      text: "text-green-600",
    },
    {
      title: "Absent",
      value: summary.absent,
      icon: <CloseCircleOutlined />,
      bg: "bg-red-50",
      border: "border-red-100",
      text: "text-red-600",
    },
    {
      title: "Late",
      value: summary.late,
      icon: <ClockCircleOutlined />,
      bg: "bg-yellow-50",
      border: "border-yellow-100",
      text: "text-yellow-600",
    },
    {
      title: "Leave",
      value: summary.leave,
      icon: <CalendarOutlined />,
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-600",
    },
  ];

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (value) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {dayjs(value).format("DD MMM YYYY")}
          </span>
          <span className="text-xs text-gray-400">
            {dayjs(value).format("dddd")}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (remarks) =>
        remarks ? (
          <Text className="text-gray-600">{remarks}</Text>
        ) : (
          <Tag color="default">No Remarks</Tag>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Space direction="vertical" size={20} className="w-full">
        {/* HERO SECTION */}
        <Card
          bordered={false}
          className="rounded-3xl overflow-hidden shadow-sm"
          bodyStyle={{ padding: 0 }}
        >
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-6 md:p-8">
            <Row
              gutter={[20, 20]}
              align="middle"
              justify="space-between"
            >
              <Col>
                <div className="flex items-center gap-4">
                  <Avatar
                    size={72}
                    icon={<UserOutlined />}
                    className="shadow-lg"
                  />

                  <div>
                    <Title
                      level={2}
                      className="!text-white !mb-1"
                    >
                      My Attendance
                    </Title>

                    <Text className="text-blue-100 text-base">
                      {isMonthlyRoute
                        ? "Monthly attendance overview & analytics"
                        : "Track your daily attendance and performance"}
                    </Text>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag color="gold">
                        {user?.role?.name || "Staff"}
                      </Tag>

                      <Tag color="green">
                        {selectedMonth.format("MMMM YYYY")}
                      </Tag>
                    </div>
                  </div>
                </div>
              </Col>

              <Col>
                <DatePicker
                  picker="month"
                  size="large"
                  value={selectedMonth}
                  onChange={(value) =>
                    setSelectedMonth(value || dayjs())
                  }
                  className="rounded-xl"
                />
              </Col>
            </Row>
          </div>
        </Card>

        {/* ALERTS */}
        {error ? (
          <Alert
            type="error"
            showIcon
            message={error}
            className="rounded-2xl"
          />
        ) : null}

        {successMessage ? (
          <Alert
            type="success"
            showIcon
            message={successMessage}
            className="rounded-2xl"
          />
        ) : null}

        {/* DAILY ATTENDANCE ACTION */}
        {isTeacher && !isMonthlyRoute ? (
          <Card
            bordered={false}
            className="rounded-3xl shadow-sm"
          >
            <Row
              gutter={[16, 16]}
              align="middle"
              justify="space-between"
            >
              <Col xs={24} lg={12}>
                <div>
                  <Title level={4} className="!mb-1">
                    Mark Today Attendance
                  </Title>

                  <Text type="secondary">
                    Select your status and submit attendance.
                  </Text>
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div className="flex flex-col md:flex-row gap-3 justify-end">
                  <Select
                    value={todayStatus}
                    onChange={setTodayStatus}
                    size="large"
                    className="w-full md:w-48"
                  >
                    <Option value="present">Present</Option>
                    <Option value="late">Late</Option>
                    <Option value="halfday">Half Day</Option>
                    <Option value="leave">Leave</Option>
                    <Option value="absent">Absent</Option>
                  </Select>

                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={handleAddDailyAttendance}
                    className="rounded-xl px-8"
                  >
                    Submit Attendance
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        ) : null}

        {/* ATTENDANCE OVERVIEW */}
        <Row gutter={[16, 16]}>
          {/* Attendance Percentage */}
          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              className="rounded-3xl h-full shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <Text type="secondary">
                    Attendance Performance
                  </Text>

                  <Title level={3} className="!mb-0">
                    {summary.attendancePercent}%
                  </Title>
                </div>

                <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <PercentageOutlined className="text-indigo-600 text-xl" />
                </div>
              </div>

              <Progress
                percent={Number(summary.attendancePercent)}
                strokeLinecap="round"
                size={[undefined, 12]}
              />

              <Divider />

              <div className="flex items-center justify-between">
                <div>
                  <Text type="secondary">Total Working Days</Text>

                  <Title level={4} className="!mb-0">
                    {summary.totalDays}
                  </Title>
                </div>

                <Statistic
                  title="Half Day"
                  value={summary.halfday}
                />
              </div>
            </Card>
          </Col>

          {/* Quick Stats */}
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              {stats.map((item, index) => (
                <Col xs={12} md={12} xl={6} key={index}>
                  <Card
                    bordered={false}
                    className={`rounded-3xl shadow-sm border ${item.bg} ${item.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="text-gray-500">
                          {item.title}
                        </Text>

                        <Title level={3} className="!mb-0">
                          {item.value}
                        </Title>
                      </div>

                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${item.text} bg-white`}
                      >
                        {item.icon}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* TABLE */}
        <Card
          bordered={false}
          className="rounded-3xl shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <Title level={4} className="!mb-1">
                Attendance History
              </Title>

              <Text type="secondary">
                Complete attendance records for selected month.
              </Text>
            </div>

            <Tag color="blue" className="px-4 py-1 rounded-full">
              Total Records : {summary.totalDays}
            </Tag>
          </div>

          <Table
            rowKey="_id"
            loading={loading}
            dataSource={myAttendance}
            columns={columns}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
            }}
            className="custom-attendance-table"
            scroll={{ x: 600 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default MyAttendancePage;
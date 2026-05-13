import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Calendar, Card, DatePicker, Empty, Row, Spin, Statistic } from "antd";
import dayjs from "dayjs";
import apiClient from "../api/httpClient";
import { getErrorMessage } from "./../utils/errorMessage";

const ATTENDANCE_STATUSES = ["present", "absent", "leave", "late", "halfday"];

const getBadgeStatus = (status) => {
  switch (status) {
    case "present":
      return "success";
    case "absent":
      return "error";
    case "leave":
      return "warning";
    case "late":
      return "processing";
    case "halfday":
      return "default";
    default:
      return "default";
  }
};

const AttendanceCalendar = ({ userId, schoolId }) => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [attendanceByDay, setAttendanceByDay] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployeeAttendance = async () => {
      if (!userId || !schoolId) {
        setAttendanceByDay({});
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get("/attendance/report/monthly", {
          params: {
            schoolId,
            month: selectedMonth.month() + 1,
            year: selectedMonth.year(),
          },
        });

        const monthlyReport = response?.data?.data || [];
        const currentEmployeeReport = monthlyReport.find((item) => item?.userId === userId);
        setAttendanceByDay(currentEmployeeReport?.dailyStatus || {});
      } catch (err) {
        setError(err?.response?.data?.message || "Attendance fetch failed");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeAttendance();
  }, [userId, schoolId, selectedMonth]);

  const summary = useMemo(() => {
    const initial = {
      totalDays: 0,
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
      halfday: 0,
    };

    Object.values(attendanceByDay).forEach((status) => {
      initial.totalDays += 1;
      if (ATTENDANCE_STATUSES.includes(status)) {
        initial[status] += 1;
      }
    });

    const attendancePercent = initial.totalDays
      ? ((initial.present / initial.totalDays) * 100).toFixed(1)
      : "0.0";

    return { ...initial, attendancePercent };
  }, [attendanceByDay]);

  const dateCellRender = (value) => {
    const status = attendanceByDay[String(value.date())];

    if (!status) {
      return null;
    }

    return (
      <Badge
        status={getBadgeStatus(status)}
        text={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" className="mb-4 gap-2">
        <h3 className="text-lg font-medium m-0">Employee Attendance</h3>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(value) => setSelectedMonth(value || dayjs())}
        />
      </Row>

      {!userId ? (
        <Empty description="Attendance dekhne ke liye Profile tab me employee select karein." />
      ) : (
        <>
          {error ? <Alert type="error" showIcon message={getErrorMessage(error)} className="mb-3" /> : null}

          <Row gutter={[12, 12]} className="mb-4">
            <Card size="small" className="min-w-[120px]">
              <Statistic title="Total Days" value={summary.totalDays} />
            </Card>
            <Card size="small" className="min-w-[120px]">
              <Statistic title="Present" value={summary.present} />
            </Card>
            <Card size="small" className="min-w-[120px]">
              <Statistic title="Absent" value={summary.absent} />
            </Card>
            <Card size="small" className="min-w-[120px]">
              <Statistic title="Leave" value={summary.leave} />
            </Card>
            <Card size="small" className="min-w-[120px]">
              <Statistic title="Attendance %" value={summary.attendancePercent} suffix="%" />
            </Card>
          </Row>

          {loading ? (
            <div className="py-10 text-center">
              <Spin />
            </div>
          ) : (
            <Calendar value={selectedMonth} dateCellRender={dateCellRender} />
          )}
        </>
      )}
    </Card>
  );
};

export default AttendanceCalendar;

import React, { useEffect, useMemo } from "react";
import { Card, Col, Progress, Row, Statistic, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonthlyReport } from "../../features/attendanceSlice";

const { Title } = Typography;

const AttendanceDashboard = () => {
  const dispatch = useDispatch();
  const { monthlyReport, reportLoading } = useSelector((state) => state.attendance);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const now = new Date();
    if (user?.schoolId || user?.school?._id) {
      dispatch(
        fetchMonthlyReport({
          schoolId: user?.schoolId || user?.school?._id,
          month: now.getUTCMonth() + 1,
          year: now.getUTCFullYear(),
        })
      );
    }
  }, [dispatch, user]);

  const metrics = useMemo(() => {
    if (!monthlyReport.length) return { avg: 0, highRisk: 0, total: 0 };

    const total = monthlyReport.length;
    const avg = monthlyReport.reduce((acc, item) => acc + (item.attendancePercentage || 0), 0) / total;
    const highRisk = monthlyReport.filter((item) => (item.attendancePercentage || 0) < 75).length;
    return { avg: Number(avg.toFixed(2)), highRisk, total };
  }, [monthlyReport]);

  return (
    <Card loading={reportLoading}>
      <Title level={4}>Attendance Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Statistic title="Students/Users Tracked" value={metrics.total} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Average Attendance %" value={metrics.avg} suffix="%" />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Need Attention (&lt;75%)" value={metrics.highRisk} />
        </Col>
      </Row>
      <Progress percent={metrics.avg} status={metrics.avg < 75 ? "exception" : "active"} />
    </Card>
  );
};

export default AttendanceDashboard;

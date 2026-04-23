import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonthlyReport } from "../../features/attendanceSlice";

const { Title, Text } = Typography;

const queueStorageKey = ({ schoolId, month, year }) => `attendanceActionQueue:${schoolId || "na"}:${year}-${month}`;

const normalizeDailyEntries = (dailyStatus = {}) =>
  Object.entries(dailyStatus)
    .map(([key, status]) => {
      const numericDay = Number(key);
      const parsed = Number.isNaN(numericDay) ? dayjs(key).date() : numericDay;
      return {
        day: Number.isNaN(parsed) ? 0 : parsed,
        status: String(status || "").toLowerCase(),
      };
    })
    .filter((entry) => entry.day > 0)
    .sort((a, b) => a.day - b.day);

const getConsecutiveAbsenceStreak = (dailyStatus = {}) => {
  const entries = normalizeDailyEntries(dailyStatus);
  let streak = 0;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].status === "absent") streak += 1;
    else break;
  }
  return streak;
};

const getWeeklyAbsenceRate = (dailyStatus = {}) => {
  const entries = normalizeDailyEntries(dailyStatus);
  if (!entries.length) return 0;
  const last7 = entries.slice(-7);
  const absentDays = last7.filter((entry) => entry.status === "absent").length;
  return Number(((absentDays / last7.length) * 100).toFixed(2));
};

const getMonthlyAbsenceRate = (row) => {
  const present = Number(row?.statusBreakdown?.present || 0);
  const absent = Number(row?.statusBreakdown?.absent || 0);
  const leave = Number(row?.statusBreakdown?.leave || 0);
  const total = present + absent + leave;
  if (!total) return Number((100 - Number(row?.attendancePercentage || 0)).toFixed(2));
  return Number(((absent / total) * 100).toFixed(2));
};

const AttendanceDashboard = () => {
  const dispatch = useDispatch();
  const { monthlyReport, reportLoading } = useSelector((state) => state.attendance);
  const { user } = useSelector((state) => state.auth);

  const now = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(now.month() + 1);
  const [selectedYear, setSelectedYear] = useState(now.year());
  const [queueItems, setQueueItems] = useState([]);
  const [noteDrafts, setNoteDrafts] = useState({});

  const activeSchoolId = user?.schoolId || user?.school?._id || null;

  useEffect(() => {
    if (!activeSchoolId) return;
    dispatch(
      fetchMonthlyReport({
        schoolId: activeSchoolId,
        month: selectedMonth,
        year: selectedYear,
      })
    );
  }, [dispatch, activeSchoolId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!activeSchoolId) return;
    try {
      const raw = localStorage.getItem(
        queueStorageKey({ schoolId: activeSchoolId, month: selectedMonth, year: selectedYear })
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setQueueItems(parsed);
      } else {
        setQueueItems([]);
      }
    } catch {
      setQueueItems([]);
    }
  }, [activeSchoolId, selectedMonth, selectedYear]);

  const persistQueue = (nextQueue) => {
    setQueueItems(nextQueue);
    if (!activeSchoolId) return;
    try {
      localStorage.setItem(
        queueStorageKey({ schoolId: activeSchoolId, month: selectedMonth, year: selectedYear }),
        JSON.stringify(nextQueue)
      );
    } catch {
      // ignore storage quota errors
    }
  };

  const analytics = useMemo(() => {
    if (!monthlyReport.length) {
      return {
        tracked: 0,
        averageAttendance: 0,
        weeklyAbsenceRate: 0,
        monthlyAbsenceRate: 0,
        chronicRiskCount: 0,
        parentAlertCandidates: [],
        riskRows: [],
      };
    }

    const tracked = monthlyReport.length;
    const averageAttendance =
      monthlyReport.reduce((acc, row) => acc + Number(row?.attendancePercentage || 0), 0) / tracked;

    const weeklyAbsenceRate =
      monthlyReport.reduce((acc, row) => acc + getWeeklyAbsenceRate(row?.dailyStatus || {}), 0) / tracked;

    const monthlyAbsenceRate =
      monthlyReport.reduce((acc, row) => acc + getMonthlyAbsenceRate(row), 0) / tracked;

    const riskRows = monthlyReport
      .map((row) => {
        const streak = getConsecutiveAbsenceStreak(row?.dailyStatus || {});
        const attendance = Number(row?.attendancePercentage || 0);
        const monthlyAbsence = getMonthlyAbsenceRate(row);

        return {
          userId: row?.userId,
          name: row?.name || row?.studentName || row?.user?.name || "Unknown",
          attendance,
          monthlyAbsence,
          streak,
          riskScore: Number((Math.max(0, 75 - attendance) + streak * 8 + monthlyAbsence * 0.4).toFixed(2)),
        };
      })
      .filter((row) => row.attendance < 75 || row.streak >= 3)
      .sort((a, b) => b.riskScore - a.riskScore);

    const parentAlertCandidates = riskRows.filter((row) => row.streak >= 3);

    return {
      tracked,
      averageAttendance: Number(averageAttendance.toFixed(2)),
      weeklyAbsenceRate: Number(weeklyAbsenceRate.toFixed(2)),
      monthlyAbsenceRate: Number(monthlyAbsenceRate.toFixed(2)),
      chronicRiskCount: riskRows.length,
      parentAlertCandidates,
      riskRows,
    };
  }, [monthlyReport]);

  const handleQueueCandidate = (candidate) => {
    const exists = queueItems.some((item) => item.userId === candidate.userId);
    if (exists) {
      message.info("Student already in teacher action queue");
      return;
    }

    const nextQueue = [
      {
        userId: candidate.userId,
        name: candidate.name,
        status: "pending-follow-up",
        streak: candidate.streak,
        attendance: candidate.attendance,
        note: "",
        updatedAt: new Date().toISOString(),
      },
      ...queueItems,
    ];

    persistQueue(nextQueue);
    message.success("Added to class teacher action queue");
  };

  const handleSaveNote = (userId) => {
    const note = (noteDrafts[userId] || "").trim();
    if (!note) {
      message.warning("Please enter follow-up note first");
      return;
    }

    const nextQueue = queueItems.map((item) =>
      item.userId === userId
        ? {
            ...item,
            note,
            status: "follow-up-done",
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    persistQueue(nextQueue);
    setNoteDrafts((prev) => ({ ...prev, [userId]: "" }));
    message.success("Follow-up note saved");
  };

  const riskColumns = [
    {
      title: "Student",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Attendance %",
      dataIndex: "attendance",
      key: "attendance",
      render: (value) => <Tag color={value < 75 ? "red" : "green"}>{value}%</Tag>,
    },
    {
      title: "Current Absence Streak",
      dataIndex: "streak",
      key: "streak",
      render: (value) => <Tag color={value >= 3 ? "volcano" : "default"}>{value} day(s)</Tag>,
    },
    {
      title: "Risk",
      dataIndex: "riskScore",
      key: "riskScore",
      render: (value) => <Tag color={value > 30 ? "red" : "orange"}>{value}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_value, record) => (
        <Button size="small" onClick={() => handleQueueCandidate(record)}>
          Add to Queue
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card loading={reportLoading}>
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          <Title level={4} style={{ marginBottom: 0 }}>Attendance Analytics Dashboard</Title>
          <Text type="secondary">Weekly/monthly trends, chronic risk flags, parent alerts and teacher action queue.</Text>

          <Space wrap>
            <Text strong>Report Month:</Text>
            <DatePicker
              picker="month"
              value={dayjs(`${selectedYear}-${selectedMonth}-01`) }
              onChange={(value) => {
                const next = value || dayjs();
                setSelectedMonth(next.month() + 1);
                setSelectedYear(next.year());
              }}
            />
          </Space>
        </Space>

        <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
          <Col xs={24} sm={12} lg={6}><Statistic title="Students Tracked" value={analytics.tracked} /></Col>
          <Col xs={24} sm={12} lg={6}><Statistic title="Average Attendance" value={analytics.averageAttendance} suffix="%" /></Col>
          <Col xs={24} sm={12} lg={6}><Statistic title="Weekly Absence Trend" value={analytics.weeklyAbsenceRate} suffix="%" /></Col>
          <Col xs={24} sm={12} lg={6}><Statistic title="Monthly Absence Trend" value={analytics.monthlyAbsenceRate} suffix="%" /></Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col xs={24} md={12}>
            <Card size="small" title="Attendance Health">
              <Progress
                percent={analytics.averageAttendance}
                status={analytics.averageAttendance < 75 ? "exception" : "active"}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="Priority Alerts">
              <Space direction="vertical" size={4}>
                <Text>Chronic risk students: <strong>{analytics.chronicRiskCount}</strong></Text>
                <Text>Parent alert candidates (3+ consecutive absences): <strong>{analytics.parentAlertCandidates.length}</strong></Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        title="Auto-risk Flags (Chronic Absentees)"
        extra={<Tag color="red">Rule: Attendance &lt;75% OR 3+ consecutive absences</Tag>}
      >
        {analytics.riskRows.length ? (
          <Table rowKey={(row) => row.userId || row.name} columns={riskColumns} dataSource={analytics.riskRows} pagination={{ pageSize: 8 }} />
        ) : (
          <Empty description="No chronic risk students detected." />
        )}
      </Card>

      <Card
        title="Parent Auto-alert Queue"
        extra={<Tag color="orange">Rule: Trigger when 3 consecutive absences found</Tag>}
      >
        {!analytics.parentAlertCandidates.length ? (
          <Empty description="No candidates for parent alerts this month." />
        ) : (
          <List
            dataSource={analytics.parentAlertCandidates}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="queue" size="small" onClick={() => handleQueueCandidate(item)}>
                    Add to Teacher Queue
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={`${item.name} (${item.attendance}% attendance)`}
                  description={`Consecutive absence streak: ${item.streak} day(s)`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="Class Teacher Action Queue (with Follow-up Notes)">
        {!queueItems.length ? (
          <Empty description="No pending follow-ups." />
        ) : (
          <List
            dataSource={queueItems}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  <Space wrap>
                    <Text strong>{item.name}</Text>
                    <Tag color={item.status === "follow-up-done" ? "green" : "gold"}>{item.status}</Tag>
                    <Tag>Streak: {item.streak}</Tag>
                    <Tag>Attendance: {item.attendance}%</Tag>
                    <Text type="secondary">Updated: {new Date(item.updatedAt).toLocaleString()}</Text>
                  </Space>

                  <Input.TextArea
                    rows={2}
                    value={noteDrafts[item.userId] ?? item.note}
                    onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [item.userId]: event.target.value }))}
                    placeholder="Add follow-up note for parent call / counseling / home visit"
                  />

                  <Space>
                    <Button size="small" type="primary" onClick={() => handleSaveNote(item.userId)}>
                      Save Follow-up
                    </Button>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );
};

export default AttendanceDashboard;
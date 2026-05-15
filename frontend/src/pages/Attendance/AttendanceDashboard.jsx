import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  DatePicker,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Progress,
  List,
  Button,
  Empty,
  Space,
  Input,
  message,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonthlyReport } from "../../features/attendanceSlice";

const { Title, Text } = Typography;

const AttendanceDashboard = () => {
  const dispatch = useDispatch();

  const { monthlyReport = [], reportLoading } = useSelector(
    (s) => s.attendance
  );

  const { user } = useSelector((s) => s.auth);

  const schoolId = user?.schoolId || user?.school?._id;

  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());

  const [queue, setQueue] = useState([]);
  const [notes, setNotes] = useState({});

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchMonthlyReport({ schoolId, month, year }));
  }, [month, year]);

  /* ---------------- HELPERS ---------------- */
  const getStreak = (daily = {}) => {
    const values = Object.values(daily || {});
    let streak = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] === "absent") streak++;
      else break;
    }
    return streak;
  };

  /* ---------------- ANALYTICS ---------------- */
  const analytics = useMemo(() => {
    if (!monthlyReport.length) {
      return {
        total: 0,
        avg: 0,
        risk: 0,
        alerts: [],
        highRisk: [],
      };
    }

    const total = monthlyReport.length;

    const avg =
      monthlyReport.reduce(
        (a, b) => a + Number(b.attendancePercentage || 0),
        0
      ) / total;

    const enriched = monthlyReport.map((r) => {
      const streak = getStreak(r.dailyStatus || {});
      const att = Number(r.attendancePercentage || 0);

      return {
        id: r.userId,
        name: r.name,
        attendance: att,
        streak,
        risk: Math.max(0, 75 - att) + streak * 8,
      };
    });

    const highRisk = enriched.filter(
      (r) => r.attendance < 75 || r.streak >= 3
    );

    const alerts = enriched.filter((r) => r.streak >= 3);

    return {
      total,
      avg: Number(avg.toFixed(1)),
      risk: highRisk.length,
      alerts,
      highRisk,
    };
  }, [monthlyReport]);

  /* ---------------- QUEUE ---------------- */
  const addToQueue = (item) => {
    if (queue.find((q) => q.id === item.id)) {
      message.info("Already in queue");
      return;
    }

    setQueue((prev) => [
      {
        ...item,
        status: "pending",
        note: "",
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const saveNote = (id) => {
    if (!notes[id]) return message.warning("Enter note first");

    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              note: notes[id],
              status: "done",
              updatedAt: new Date().toISOString(),
            }
          : q
      )
    );

    message.success("Saved");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-4">
      {/* HEADER */}
      <div>
        <Title level={4} className="!mb-0">
          Attendance Analytics
        </Title>
        <Text type="secondary">
          Risk detection, trends & teacher follow-ups
        </Text>
      </div>

      {/* MONTH SELECT */}
      <Card>
        <DatePicker
          picker="month"
          value={dayjs(`${year}-${month}-01`)}
          onChange={(v) => {
            const d = v || dayjs();
            setMonth(d.month() + 1);
            setYear(d.year());
          }}
        />
      </Card>

      {/* KPI CARDS */}
      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Students" value={analytics.total} />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Avg Attendance" value={analytics.avg} suffix="%" />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Risk Students" value={analytics.risk} />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Progress percent={analytics.avg} />
          </Card>
        </Col>
      </Row>

      {/* ALERTS */}
      <Card title="🚨 Risk Alerts">
        {analytics.alerts.length ? (
          <List
            dataSource={analytics.alerts}
            renderItem={(i) => (
              <List.Item
                actions={[
                  <Button key="add" size="small" onClick={() => addToQueue(i)}>
                    Add
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={i.name}
                  description={`Attendance: ${i.attendance}% | Streak: ${i.streak}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No alerts" />
        )}
      </Card>

      {/* HIGH RISK TABLE */}
      <Card title="High Risk Students">
        <Table
          rowKey="id"
          dataSource={analytics.highRisk}
          pagination={{ pageSize: 6 }}
          columns={[
            { title: "Name", dataIndex: "name" },
            {
              title: "Attendance",
              dataIndex: "attendance",
              render: (v) => <Tag color={v < 75 ? "red" : "green"}>{v}%</Tag>,
            },
            {
              title: "Streak",
              dataIndex: "streak",
              render: (v) => <Tag color="orange">{v}</Tag>,
            },
            {
              title: "Action",
              render: (_, r) => (
                <Button size="small" onClick={() => addToQueue(r)}>
                  Add to Queue
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* QUEUE */}
      <Card title="Teacher Action Queue">
        {!queue.length ? (
          <Empty description="No pending follow-ups" />
        ) : (
          <List
            dataSource={queue}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag>{item.name}</Tag>
                    <Tag color={item.status === "done" ? "green" : "gold"}>
                      {item.status}
                    </Tag>
                  </Space>

                  <Input.TextArea
                    rows={2}
                    value={notes[item.id] || item.note}
                    onChange={(e) =>
                      setNotes((p) => ({ ...p, [item.id]: e.target.value }))
                    }
                    placeholder="Follow-up note"
                  />

                  <Button size="small" type="primary" onClick={() => saveNote(item.id)}>
                    Save
                  </Button>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default AttendanceDashboard;
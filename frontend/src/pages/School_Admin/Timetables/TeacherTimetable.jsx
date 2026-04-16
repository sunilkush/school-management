import React, { useMemo, useState } from "react";
import { Alert, Card, Col, Empty, Layout, Row, Segmented, Space, Table, Tag, Typography } from "antd";
import { BookOutlined, ClockCircleOutlined, TeamOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const sampleTeacherSchedule = [
  {
    key: 1,
    day: "Monday",
    subject: "Mathematics",
    className: "8",
    section: "A",
    startTime: "09:00",
    endTime: "09:45",
    room: "Room 204",
  },
  {
    key: 2,
    day: "Monday",
    subject: "Mathematics",
    className: "9",
    section: "B",
    startTime: "11:00",
    endTime: "11:45",
    room: "Room 112",
  },
  {
    key: 3,
    day: "Tuesday",
    subject: "Algebra",
    className: "10",
    section: "A",
    startTime: "08:30",
    endTime: "09:15",
    room: "Room 119",
  },
];

const TeacherTimetable = () => {
  const [activeDay, setActiveDay] = useState("Monday");
  const [timetable] = useState(sampleTeacherSchedule);

  const daySchedule = useMemo(
    () => timetable.filter((item) => item.day === activeDay).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activeDay, timetable]
  );

  const stats = useMemo(() => {
    const classCount = new Set(timetable.map((item) => `${item.className}-${item.section}`)).size;
    return {
      periods: timetable.length,
      classes: classCount,
      subjects: new Set(timetable.map((item) => item.subject)).size,
    };
  }, [timetable]);

  const columns = [
    { title: "Period", key: "period", render: (_, row, idx) => `P${idx + 1}` },
    { title: "Time", key: "time", render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { title: "Subject", dataIndex: "subject", key: "subject", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Class", key: "class", render: (_, row) => `Class ${row.className} - ${row.section}` },
    { title: "Room", dataIndex: "room", key: "room" },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "transparent" }}>
      <Content>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card>
              <Space>
                <ClockCircleOutlined style={{ color: "#1677ff" }} />
                <div>
                  <Text type="secondary">Weekly Periods</Text>
                  <Title level={4} style={{ margin: 0 }}>{stats.periods}</Title>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Space>
                <TeamOutlined style={{ color: "#52c41a" }} />
                <div>
                  <Text type="secondary">Classes Handled</Text>
                  <Title level={4} style={{ margin: 0 }}>{stats.classes}</Title>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Space>
                <BookOutlined style={{ color: "#722ed1" }} />
                <div>
                  <Text type="secondary">Subjects</Text>
                  <Title level={4} style={{ margin: 0 }}>{stats.subjects}</Title>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>Teacher Timetable</Title>
              <Text type="secondary">Daily view for classes, room and period planning.</Text>
            </div>

            <Alert
              type="info"
              showIcon
              message="Need changes in schedule?"
              description="Please contact School Admin to update class allocations."
            />

            <Segmented options={dayOrder} value={activeDay} onChange={setActiveDay} />

            {daySchedule.length ? (
              <Table rowKey="key" columns={columns} dataSource={daySchedule} pagination={false} />
            ) : (
              <Empty description="No periods scheduled for selected day" />
            )}
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default TeacherTimetable;

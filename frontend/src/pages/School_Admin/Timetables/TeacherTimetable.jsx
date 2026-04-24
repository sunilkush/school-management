import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  Layout,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { BookOutlined, ClockCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTeacherTimetable,
  fetchTimetableMasterData,
} from "../../../features/timetableSlice";

const { Content } = Layout;
const { Title, Text } = Typography;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TeacherTimetable = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const {
    teachers,
    teacherTimetable: timetable,
    activeAcademicYearId,
    loading,
  } = useSelector((state) => state.timetable);
  const [activeDay, setActiveDay] = useState("Monday");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    dispatch(fetchTimetableMasterData({ schoolId: user?.schoolId }))
      .unwrap()
      .catch((error) => message.error(error || "Failed to load teachers"));
  }, [dispatch, user?.schoolId]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length) {
      setSelectedTeacherId(teachers?.[0]?.userId?._id || "");
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (!selectedTeacherId) return;
    dispatch(
      fetchTeacherTimetable({
        teacherId: selectedTeacherId,
        day: activeDay,
        academicYearId: activeAcademicYearId,
      })
    )
      .unwrap()
      .catch((error) => message.error(error || "Failed to fetch teacher timetable"));
  }, [activeAcademicYearId, activeDay, dispatch, selectedTeacherId]);

  const stats = useMemo(() => {
    const classCount = new Set(timetable.map((item) => `${item.schoolClassId?._id}-${item.sectionId?._id}`)).size;
    return {
      periods: timetable.length,
      classes: classCount,
      subjects: new Set(timetable.map((item) => item.subjectId?._id)).size,
    };
  }, [timetable]);

  const columns = [
    { title: "Period", key: "period", render: (_, row, idx) => `P${idx + 1}` },
    { title: "Time", key: "time", render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { title: "Subject", key: "subject", render: (_, row) => <Tag color="blue">{row.subjectId?.name || "-"}</Tag> },
    { title: "Class", key: "class", render: (_, row) => `${row.schoolClassId?.name || "-"} - ${row.sectionId?.name || "-"}` },
    { title: "Room", dataIndex: "room", key: "room", render: (value) => value || "-" },
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
                  <Text type="secondary">Daily Periods</Text>
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
              <Text type="secondary">Live teacher-wise daily schedule from backend data.</Text>
            </div>

            <Alert
              type="info"
              showIcon
              message="Need changes in schedule?"
              description="Please update from Class Timetable page as School Admin."
            />

            <Select
              value={selectedTeacherId || undefined}
              placeholder="Select teacher"
              style={{ maxWidth: 320 }}
              onChange={setSelectedTeacherId}
            >
              {teachers.map((teacher) => (
                <Select.Option key={teacher.userId?._id} value={teacher.userId?._id}>
                  {teacher.userId?.name}
                </Select.Option>
              ))}
            </Select>

            <Segmented options={dayOrder} value={activeDay} onChange={setActiveDay} />

            <Spin spinning={loading}>
              {timetable.length ? (
                <Table rowKey="_id" columns={columns} dataSource={timetable} pagination={false} />
              ) : (
                <Empty description="No periods scheduled for selected teacher/day" />
              )}
            </Spin>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default TeacherTimetable;

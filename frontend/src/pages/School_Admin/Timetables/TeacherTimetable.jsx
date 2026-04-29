import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  Grid,
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
import {
  BookOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTeacherTimetable,
  fetchTimetableMasterData,
} from "../../../features/timetableSlice";

const { Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TeacherTimetable = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const user = useSelector((state) => state.auth?.user);

  const {
    teachers = [],
    teacherTimetable: timetable = [],
    activeAcademicYearId,
    loading,
  } = useSelector((state) => state.timetable || {});

  const [activeDay, setActiveDay] = useState("Monday");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    if (!user?.school?._id) return;

    dispatch(fetchTimetableMasterData({ schoolId: user?.school?._id }))
      .unwrap()
      .catch((error) => message.error(error || "Failed to load teachers"));
  }, [dispatch, user?.school?._id]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length) {
      setSelectedTeacherId(teachers?.[0]?.userId?._id || "");
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (!selectedTeacherId || !activeAcademicYearId) return;

    dispatch(
      fetchTeacherTimetable({
        teacherId: selectedTeacherId,
        day: activeDay,
        academicYearId: activeAcademicYearId,
      })
    )
      .unwrap()
      .catch((error) =>
        message.error(error || "Failed to fetch teacher timetable")
      );
  }, [activeAcademicYearId, activeDay, dispatch, selectedTeacherId]);

  const stats = useMemo(() => {
    const classCount = new Set(
      timetable.map(
        (item) => `${item.schoolClassId?._id || ""}-${item.sectionId?._id || ""}`
      )
    ).size;

    return {
      periods: timetable.length,
      classes: classCount,
      subjects: new Set(timetable.map((item) => item.subjectId?._id).filter(Boolean))
        .size,
    };
  }, [timetable]);

  const columns = [
    {
      title: "Period",
      key: "period",
      render: (_, row, idx) => `P${idx + 1}`,
    },
    {
      title: "Time",
      key: "time",
      render: (_, row) => `${row.startTime || "-"} - ${row.endTime || "-"}`,
    },
    {
      title: "Subject",
      key: "subject",
      render: (_, row) => <Tag color="blue">{row.subjectId?.name || "-"}</Tag>,
    },
    {
      title: "Class",
      key: "class",
      render: (_, row) =>
        `${row.schoolClassId?.name || "-"} - ${row.sectionId?.name || "-"}`,
    },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
      render: (value) => value || "-",
    },
  ];

  const TimetableCard = ({ item, index }) => (
    <Card
      size="small"
      style={{
        borderRadius: 14,
        marginBottom: 12,
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <div>
            <Text strong>P{index + 1}</Text>
            <br />
            <Text type="secondary">
              {item.startTime || "-"} - {item.endTime || "-"}
            </Text>
          </div>

          <Tag color="blue">{item.subjectId?.name || "-"}</Tag>
        </div>

        <div>
          <Text type="secondary">Class: </Text>
          <Text>
            {item.schoolClassId?.name || "-"} - {item.sectionId?.name || "-"}
          </Text>
        </div>

        <div>
          <Text type="secondary">Room: </Text>
          <Text>{item.room || "-"}</Text>
        </div>
      </Space>
    </Card>
  );

  return (
    <Layout
      style={{
        padding: isMobile ? 0 : 0,
        minHeight: "100vh",
        background: "transparent",
      }}
    >
      <Content>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card size={isMobile ? "small" : "default"} style={{ borderRadius: 16 }}>
              <Space>
                <ClockCircleOutlined style={{ color: "#1677ff", fontSize: 22 }} />
                <div>
                  <Text type="secondary">Daily Periods</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.periods}
                  </Title>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card size={isMobile ? "small" : "default"} style={{ borderRadius: 16 }}>
              <Space>
                <TeamOutlined style={{ color: "#52c41a", fontSize: 22 }} />
                <div>
                  <Text type="secondary">Classes Handled</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.classes}
                  </Title>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} lg={8}>
            <Card size={isMobile ? "small" : "default"} style={{ borderRadius: 16 }}>
              <Space>
                <BookOutlined style={{ color: "#722ed1", fontSize: 22 }} />
                <div>
                  <Text type="secondary">Subjects</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.subjects}
                  </Title>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div>
              <Title level={isMobile ? 5 : 4} style={{ marginBottom: 4 }}>
                Teacher Timetable
              </Title>
              <Text type="secondary">
                Live teacher-wise daily schedule from backend data.
              </Text>
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
              style={{ width: isMobile ? "100%" : 320 }}
              onChange={setSelectedTeacherId}
              showSearch
              optionFilterProp="children"
            >
              {teachers.map((teacher) => (
                <Select.Option
                  key={teacher.userId?._id}
                  value={teacher.userId?._id}
                >
                  {teacher.userId?.name}
                </Select.Option>
              ))}
            </Select>

            <div
              style={{
                width: "100%",
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              <Segmented
                options={dayOrder}
                value={activeDay}
                onChange={setActiveDay}
              />
            </div>

            <Spin spinning={!!loading}>
              {timetable.length ? (
                isMobile ? (
                  timetable.map((item, index) => (
                    <TimetableCard key={item._id || index} item={item} index={index} />
                  ))
                ) : (
                  <Table
                    rowKey={(record) => record._id}
                    columns={columns}
                    dataSource={timetable}
                    pagination={false}
                    scroll={{ x: 760 }}
                  />
                )
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
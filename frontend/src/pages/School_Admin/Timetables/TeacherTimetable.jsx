import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Empty,
  Grid,
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
import PageHeader from "../../../components/layout/PageHeader";
import { statGrid, iconWell } from "../../../styles/pageStyles";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getTeacherOption = (teacher = {}) => {
  const user = teacher?.userId || teacher?.user || teacher;
  const id = user?._id || teacher?._id || "";
  const name = user?.name || teacher?.name || teacher?.fullName || "";
  return { id, name };
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="section-panel is-header-strip">
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div className="u-title-lg">{value}</div>
    </div>
  </div>
);

const TeacherTimetable = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const user = useSelector((state) => state.auth?.user);
  const schoolId = user.school?._id
  const {
    teachers = [],
    teacherTimetable: timetable = [],
    activeAcademicYearId,
    loading,
  } = useSelector((state) => state.timetable || {});

  const [activeDay, setActiveDay] = useState("Monday");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchTimetableMasterData({schoolId}))
      .unwrap()
      .catch((error) => message.error(error || "Failed to load teachers"));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length) {
       setSelectedTeacherId(getTeacherOption(teachers?.[0]).id || "");
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
      <Space direction="vertical" size={8} className="u-full">
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
    <>
      <PageHeader
        title="Teacher Timetable"
        subtitle="Live teacher-wise daily schedule from backend data"
        icon={<ClockCircleOutlined />}
      />
      <div className="page-wrapper">
        <div style={statGrid(200)}>
          <StatCard icon={<ClockCircleOutlined />} label="Daily Periods" value={stats.periods} color="var(--primary)" />
          <StatCard icon={<TeamOutlined />} label="Classes Handled" value={stats.classes} color="var(--success)" />
          <StatCard icon={<BookOutlined />} label="Subjects" value={stats.subjects} color="var(--purple)" />
        </div>


        <div className="section-panel">
          <Space direction="vertical" size={12} className="u-full">
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
              {teachers.map((teacher) => {
                const option = getTeacherOption(teacher);
                if (!option.id) return null;

                return (
                  <Select.Option key={option.id} value={option.id}>
                    {option.name || "Unnamed Teacher"}
                  </Select.Option>
                );
              })}
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
                  <div className="teacher-timetable-tbl table-container">
                    <Table
                      rowKey={(record) => record._id}
                      columns={columns}
                      dataSource={timetable}
                      pagination={false}
                      scroll={{ x: 760 }}
                    />
                  </div>
                )
              ) : (
                <Empty description="No periods scheduled for selected teacher/day" />
              )}
            </Spin>
          </Space>
        </div>
      </div>
    </>
  );
};

export default TeacherTimetable;

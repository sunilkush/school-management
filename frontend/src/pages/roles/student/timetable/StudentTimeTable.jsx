import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Card, Empty, Segmented, Space, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { fetchStudentTimetable } from "../../../../features/studentPortalSlice";

const { Title, Text } = Typography;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentTimeTable = () => {
  const dispatch = useDispatch();
  const { timetable, loading } = useSelector((state) => state.studentPortal);
  const [activeDay, setActiveDay] = useState(dayjs().format("dddd"));

  useEffect(() => {
    dispatch(fetchStudentTimetable());
  }, [dispatch]);

  useEffect(() => {
    if (!dayOrder.includes(activeDay)) {
      setActiveDay("Monday");
    }
  }, [activeDay]);

  const sortedData = useMemo(() => {
    return [...(timetable || [])].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return String(a.startTime).localeCompare(String(b.startTime));
    });
  }, [timetable]);

  const dayWiseData = useMemo(() => {
    return sortedData.filter((entry) => entry.day === activeDay);
  }, [activeDay, sortedData]);

  const nextClass = useMemo(() => {
    const now = dayjs();
    const nowDayIndex = dayOrder.indexOf(now.format("dddd"));

    return sortedData.find((entry) => {
      const entryDayIndex = dayOrder.indexOf(entry.day);
      if (entryDayIndex < nowDayIndex) return false;

      if (entryDayIndex > nowDayIndex) return true;

      const start = dayjs(entry.startTime, "HH:mm");
      return start.isAfter(now);
    });
  }, [sortedData]);

  const columns = [
    { title: "Time", render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { title: "Subject", render: (_, row) => row.subjectId?.name || "-" },
    { title: "Teacher", render: (_, row) => row.teacherId?.name || "Not Assigned" },
    { title: "Room", dataIndex: "room", render: (value) => value || "-" },
    {
      title: "Status",
      render: () => <Tag color="blue">Scheduled</Tag>,
    },
  ];

  return (
    <Card loading={loading}>
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: 2 }}>My Timetable</Title>
          <Text type="secondary">Track today’s and weekly periods with subject + teacher details.</Text>
        </div>

        {nextClass ? (
          <Alert
            type="success"
            showIcon
            message={`Next class: ${nextClass.subjectId?.name || "Subject"} (${nextClass.day} ${nextClass.startTime})`}
            description={`Teacher: ${nextClass.teacherId?.name || "TBA"} • Room: ${nextClass.room || "-"}`}
          />
        ) : (
          <Alert type="info" showIcon message="No upcoming classes found this week." />
        )}

        <Segmented
          options={dayOrder}
          value={dayOrder.includes(activeDay) ? activeDay : "Monday"}
          onChange={setActiveDay}
        />

        {dayWiseData.length ? (
          <Table rowKey="_id" columns={columns} dataSource={dayWiseData} pagination={false} />
        ) : (
          <Empty description="No classes scheduled for selected day" />
        )}
      </Space>
    </Card>
  );
};

export default StudentTimeTable;

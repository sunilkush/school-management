import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Table, Tag, Typography } from "antd";
import { fetchStudentTimetable } from "../../../features/studentPortalSlice";

const { Title } = Typography;

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentTimeTable = () => {
  const dispatch = useDispatch();
  const { timetable, loading } = useSelector((state) => state.studentPortal);

  useEffect(() => {
    dispatch(fetchStudentTimetable());
  }, [dispatch]);

  const sortedData = useMemo(() => {
    return [...(timetable || [])].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return String(a.startTime).localeCompare(String(b.startTime));
    });
  }, [timetable]);

  const columns = [
    { title: "Day", dataIndex: "day" },
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
      <Title level={4}>My Timetable</Title>
      {sortedData.length ? (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={sortedData}
          pagination={false}
        />
      ) : (
        <Empty description="Timetable not published yet" />
      )}
    </Card>
  );
};

export default StudentTimeTable;

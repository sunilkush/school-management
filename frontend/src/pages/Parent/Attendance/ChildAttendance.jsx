import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Select, Space, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { fetchMyAttendance } from "../../../features/attendanceSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";

const { Title, Text } = Typography;

const ChildAttendancePage = () => {
  const dispatch = useDispatch();
  const { children = [] } = useSelector((state) => state.studentPortal || {});
  const { myAttendance = [], loading } = useSelector((state) => state.attendance || {});

  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0].userId);
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      dispatch(fetchMyAttendance({ childId: selectedChildId }));
    }
  }, [dispatch, selectedChildId]);

  const summary = useMemo(() => {
    const total = myAttendance.length;
    const present = myAttendance.filter((item) => item.status === "present").length;
    const absent = myAttendance.filter((item) => item.status === "absent").length;
    return { total, present, absent };
  }, [myAttendance]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color = status === "present" ? "green" : status === "absent" ? "red" : "blue";
        return <Tag color={color}>{String(status || "-").toUpperCase()}</Tag>;
      },
    },
    { title: "Remarks", dataIndex: "remarks", render: (value) => value || "-" },
  ];

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>Child Attendance</Title>

        <Select
          placeholder="Select child"
          value={selectedChildId}
          onChange={setSelectedChildId}
          style={{ maxWidth: 320 }}
          options={children.map((child) => ({ label: child.name, value: child.userId }))}
        />

        {selectedChildId && (
          <Space>
            <Text><Tag color="blue">Total: {summary.total}</Tag></Text>
            <Text><Tag color="green">Present: {summary.present}</Tag></Text>
            <Text><Tag color="red">Absent: {summary.absent}</Tag></Text>
          </Space>
        )}

        {!selectedChildId ? (
          <Empty description="No child selected" />
        ) : myAttendance.length ? (
          <Table rowKey="_id" columns={columns} dataSource={myAttendance} pagination={{ pageSize: 10 }} />
        ) : (
          <Empty description="No attendance records found" />
        )}
      </Space>
    </Card>
  );
};

export default ChildAttendancePage;

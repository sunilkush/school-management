import React, { useEffect } from "react";
import { Card, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import StatusTag from "../../components/attendance/StatusTag";
import { fetchMyAttendance } from "../../features/attendanceSlice";

const MyAttendancePage = () => {
  const dispatch = useDispatch();
  const { myAttendance, loading } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(fetchMyAttendance());
  }, [dispatch]);

  return (
    <Card title="My Attendance">
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={myAttendance}
        columns={[
          { title: "Date", dataIndex: "date", render: (value) => new Date(value).toLocaleDateString() },
          { title: "Status", dataIndex: "status", render: (status) => <StatusTag status={status} /> },
          { title: "Remarks", dataIndex: "remarks" },
        ]}
      />
    </Card>
  );
};

export default MyAttendancePage;

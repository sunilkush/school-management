import React, { useState } from "react";
import { Button, Card, Input, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import StatusTag from "../../components/attendance/StatusTag";
import { fetchMyAttendance } from "../../features/attendanceSlice";

const ChildAttendancePage = () => {
  const dispatch = useDispatch();
  const { myAttendance, loading } = useSelector((state) => state.attendance);
  const [childId, setChildId] = useState("");

  return (
    <Card title="Child Attendance">
      <Input
        value={childId}
        placeholder="Child User ID"
        style={{ width: 280, marginRight: 8 }}
        onChange={(e) => setChildId(e.target.value)}
      />
      <Button type="primary" onClick={() => dispatch(fetchMyAttendance({ childId }))}>
        Load
      </Button>

      <Table
        rowKey="_id"
        style={{ marginTop: 16 }}
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

export default ChildAttendancePage;

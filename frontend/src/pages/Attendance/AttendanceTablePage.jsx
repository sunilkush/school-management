import React, { useEffect } from "react";
import { Button, Card, Space, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import AttendanceFilters from "../../components/attendance/AttendanceFilters";
import StatusTag from "../../components/attendance/StatusTag";
import {
  deleteAttendanceRecord,
  fetchAttendance,
  setAttendanceFilters,
  updateAttendanceRecord,
} from "../../features/attendanceSlice";

const AttendanceTablePage = () => {
  const dispatch = useDispatch();
  const { list, filters, pagination, loading } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(fetchAttendance(filters));
  }, [dispatch, filters]);

  const columns = [
    { title: "Date", dataIndex: "date", render: (v) => new Date(v).toLocaleDateString() },
    { title: "User", render: (_, row) => row.userId?.name || row.userId?.email || row.userId },
    { title: "Role", dataIndex: "role" },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag status={status} /> },
    {
      title: "Actions",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => dispatch(updateAttendanceRecord({ id: row._id, payload: { status: "present" } }))}>
            Mark Present
          </Button>
          <Button danger size="small" onClick={() => dispatch(deleteAttendanceRecord(row._id))}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Attendance Table">
      <AttendanceFilters filters={filters} onChange={(delta) => dispatch(setAttendanceFilters({ ...delta, page: 1 }))} />
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={list}
        style={{ marginTop: 12 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: (page, limit) => dispatch(setAttendanceFilters({ page, limit })),
        }}
      />
    </Card>
  );
};

export default AttendanceTablePage;

import React, { useEffect } from "react";
import { Button, Card, Table, Space, Typography, Tag, Popconfirm } from "antd";
import { useDispatch, useSelector } from "react-redux";
import AttendanceFilters from "../../components/attendance/AttendanceFilters";
import StatusTag from "../../components/attendance/StatusTag";

import {
  deleteAttendanceRecord,
  fetchAttendance,
  setAttendanceFilters,
  updateAttendanceRecord,
} from "../../features/attendanceSlice";

const { Title, Text } = Typography;

const AttendanceTablePage = () => {
  const dispatch = useDispatch();

  const { list, filters, pagination, loading } = useSelector(
    (state) => state.attendance
  );

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    dispatch(fetchAttendance(filters));
  }, [filters]);

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (v) => (
        <Tag color="blue">{new Date(v).toLocaleDateString()}</Tag>
      ),
    },

    {
      title: "User",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row?.userId?.name || "User"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row?.userId?.email || row?.userId || "-"}
          </Text>
        </Space>
      ),
    },

    {
      title: "Role",
      dataIndex: "role",
      render: (v) => <Tag color="geekblue">{v || "-"}</Tag>,
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <StatusTag status={status} />,
    },

    {
      title: "Actions",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() =>
              dispatch(
                updateAttendanceRecord({
                  id: row._id,
                  payload: { status: "present" },
                })
              )
            }
          >
            Present
          </Button>

          <Button
            size="small"
            onClick={() =>
              dispatch(
                updateAttendanceRecord({
                  id: row._id,
                  payload: { status: "absent" },
                })
              )
            }
          >
            Absent
          </Button>

          <Popconfirm
            title="Delete this attendance record?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => dispatch(deleteAttendanceRecord(row._id))}
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          Attendance Management
        </Title>
        <Text type="secondary">
          Manage, filter and update attendance records
        </Text>
      </div>

      {/* FILTER PANEL */}
      <Card className="mb-4 shadow-sm">
        <AttendanceFilters
          filters={filters}
          onChange={(delta) =>
            dispatch(setAttendanceFilters({ ...delta, page: 1 }))
          }
        />
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm">
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, limit) =>
              dispatch(setAttendanceFilters({ page, limit })),
          }}
        />
      </Card>
    </div>
  );
};

export default AttendanceTablePage;
import React from "react";
import { Select, Table } from "antd";
import StatusTag from "./StatusTag";

const statusOptions = ["present", "absent", "late", "halfday"].map((status) => ({
  label: status,
  value: status,
}));

const BulkAttendanceTable = ({ rows, draftMap, onStatusChange, loading }) => {
  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (_, record) => record?.name || record?.email || record?.userId,
    },
    {
      title: "Current",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Mark Status",
      key: "mark",
      render: (_, record) => (
        <Select
          style={{ width: 150 }}
          options={statusOptions}
          value={draftMap[record.userId] || record.status || "present"}
          onChange={(value) => onStatusChange(record.userId, value)}
        />
      ),
    },
  ];

  return <Table rowKey="userId" loading={loading} columns={columns} dataSource={rows} pagination={false} />;
};

export default BulkAttendanceTable;

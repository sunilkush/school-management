import React, { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { Clock, User, Settings } from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  // ---------------------------------
  // Simulated API Data
  // ---------------------------------
  useEffect(() => {
    const fakeLogs = [
      {
        id: 1,
        user: "Admin John",
        action: "Updated school settings",
        module: "School Management",
        timestamp: "2025-10-24 14:32",
      },
      {
        id: 2,
        user: "Super Admin",
        action: "Deleted user account",
        module: "User Management",
        timestamp: "2025-10-23 18:11",
      },
      {
        id: 3,
        user: "Teacher Mary",
        action: "Added new exam schedule",
        module: "Exams",
        timestamp: "2025-10-22 10:05",
      },
    ];

    setLogs(fakeLogs);
  }, []);

  // ---------------------------------
  // TABLE CONFIG
  // ---------------------------------
  const columns = [
    {
      title: "User",
      dataIndex: "user",
      render: (user) => (
        <div className="flex items-center gap-2 text-gray-800">
          <User size={16} className="text-gray-500" />
          {user}
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
    },
    {
      title: "Module",
      dataIndex: "module",
      render: (module) => (
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-gray-500" />
          <Tag color="blue">{module}</Tag>
        </div>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      width: 180,
    },
  ];

  return (
    <div className="min-h-screen space-y-4">

      {/* HEADER */}
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Clock className="text-purple-600" />
        Audit Logs
      </h1>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          pagination={{ pageSize: 6 }}
          bordered
          locale={{ emptyText: "No audit logs found" }}
        />
      </div>

    </div>
  );
};

export default AuditLogs;

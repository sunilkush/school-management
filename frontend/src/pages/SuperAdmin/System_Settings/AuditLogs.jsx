import React, { useEffect, useState } from "react";
import { Clock, User, Settings } from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  // Simulated API data
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="h-6 w-6 text-purple-600" />
          Audit Logs
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full table-auto">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Action</th>
              <th className="px-6 py-3 text-left">Module</th>
              <th className="px-6 py-3 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3 flex items-center gap-2 text-gray-800">
                    <User className="h-4 w-4 text-gray-500" />
                    {log.user}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.action}</td>
                  <td className="px-6 py-3 text-gray-700 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    {log.module}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{log.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center text-gray-500 py-6 italic"
                >
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;

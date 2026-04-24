import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Spin } from "antd";
import {
  Database,
  Download,
  Trash2,
  CloudUpload,
  RefreshCw,
} from "lucide-react";

const STORAGE_KEY = "superadmin_system_backups";

const getDefaultBackups = () => [
  {
    id: 1,
    name: "backup_2025_10_20.zip",
    size: "25.4 MB",
    date: "2025-10-20 14:30",
  },
  {
    id: 2,
    name: "backup_2025_10_10.zip",
    size: "24.8 MB",
    date: "2025-10-10 12:15",
  },
];

const saveBackups = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const loadBackups = () => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const defaults = getDefaultBackups();
    saveBackups(defaults);
    return defaults;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const defaults = getDefaultBackups();
    saveBackups(defaults);
    return defaults;
  }
};

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------
  // Load simulated backups
  // -------------------------------------------
  useEffect(() => {
    setBackups(loadBackups());
  }, []);

  // -------------------------------------------
  // CREATE BACKUP
  // -------------------------------------------
  const handleCreateBackup = () => {
    setLoading(true);

    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        name: `backup_${new Date().toISOString().slice(0, 10)}.zip`,
        size: `${(20 + Math.random() * 10).toFixed(1)} MB`,
        date: new Date().toLocaleString(),
      };

      setBackups((prev) => {
        const updated = [newBackup, ...prev];
        saveBackups(updated);
        return updated;
      });
      setLoading(false);

      message.success("Backup created successfully!");
    }, 1500);
  };

  // -------------------------------------------
  // DOWNLOAD
  // -------------------------------------------
  const handleDownload = (backup) => {
    const backupContent = {
      generatedAt: backup.date,
      fileName: backup.name,
      size: backup.size,
      data: {
        note: "Simulated backup payload",
        tables: ["schools", "users", "settings", "audit_logs"],
      },
    };

    const blob = new Blob([JSON.stringify(backupContent, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backup.name.replace(/\.zip$/i, ".json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(`${backup.name} downloaded`);
  };

  // -------------------------------------------
  // DELETE
  // -------------------------------------------
  const handleDelete = (id) => {
    setBackups((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveBackups(updated);
      return updated;
    });
    message.success("Backup deleted");
  };

  // -------------------------------------------
  // REFRESH
  // -------------------------------------------
  const handleRefresh = () => {
    setLoading(true);

    setTimeout(() => {
      const latestBackups = loadBackups();
      setBackups(latestBackups);
      setLoading(false);
      message.success("Backup list refreshed");
    }, 500);
  };
  // -------------------------------------------
  // TABLE CONFIG
  // -------------------------------------------
  const columns = [
    {
      title: "File Name",
      dataIndex: "name",
    },
    {
      title: "Size",
      dataIndex: "size",
      width: 120,
    },
    {
      title: "Created At",
      dataIndex: "date",
      width: 180,
    },
    {
      title: "Actions",
      align: "center",
      width: 150,
      render: (_, record) => (
        <div className="flex justify-center gap-3">
          <Button
            type="link"
            onClick={() => handleDownload(record)}
            icon={<Download size={16} />}
          />

          <Popconfirm
            title="Delete this backup?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger type="link" icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Database className="text-purple-600" />
          Backups
        </h1>

        <Button
          type="primary"
          loading={loading}
          onClick={handleCreateBackup}
          icon={<CloudUpload size={16} />}
          className="!flex !items-center"
        >
          Create Backup
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={backups}
            bordered
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: "No backups found." }}
          />
        </Spin>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end">
        <Button
          type="link"
          onClick={handleRefresh}
          icon={<RefreshCw size={14} />}
          className="!flex !items-center"
        >
          Refresh
        </Button>
      </div>

    </div>
  );
};

export default Backups;

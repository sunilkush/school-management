import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Space, Table, Tag, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import apiClient from "../../api/httpClient";
import dayjs from "dayjs";

const SystemLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/activity-logs");
      const raw = res.data.data || [];
      setLogs(raw);
    } catch {
      message.error("Failed to load system logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = useMemo(() => {
    if (!query) return logs;
    const q = query.toLowerCase();
    return logs.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.user?.name?.toLowerCase().includes(q)
    );
  }, [logs, query]);

  const getLogLevel = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("error") || a.includes("fail") || a.includes("delete")) return { color: "red",    label: "ERROR" };
    if (a.includes("warn")  || a.includes("update"))                         return { color: "orange", label: "WARN"  };
    return { color: "green", label: "INFO" };
  };

  const columns = [
    {
      title: "Level",
      dataIndex: "action",
      key: "level",
      width: 80,
      render: (v) => { const lv = getLogLevel(v); return <Tag color={lv.color}>{lv.label}</Tag>; },
    },
    { title: "Action",      dataIndex: "action",      key: "action",     ellipsis: true },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (u) => u?.name || "—",
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "time",
      width: 160,
      render: (v) => dayjs(v).format("DD MMM HH:mm"),
    },
  ];

  return (
    <Card
      title="System Activity Logs"
      extra={
        <Space>
          <Input
            placeholder="Search logs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadLogs} loading={loading} />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 15 }}
        size="small"
        locale={{ emptyText: "No activity logs found" }}
      />
    </Card>
  );
};

export default SystemLogs;

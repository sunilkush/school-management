import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Select, Space, Table, Tag, Typography } from "antd";
import { Clock, Search } from "lucide-react";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS = {
  SUCCESS: "green",
  FAILED: "red",
  WARNING: "orange",
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState([]);
  const [modules, setModules] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data } = await httpClient.get("/audit-logs/filters");
      setModules(data?.data?.modules || []);
      setStatuses(data?.data?.statuses || []);
    } catch {
      setModules([]);
      setStatuses(["SUCCESS", "FAILED", "WARNING"]);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search?.trim()) params.search = search.trim();
      if (moduleFilter) params.module = moduleFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.startDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
      if (dateRange?.[1]) params.endDate = dayjs(dateRange[1]).format("YYYY-MM-DD");

      const { data } = await httpClient.get("/audit-logs", { params });
      setLogs(data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const columns = useMemo(
    () => [
      {
        title: "Actor",
        dataIndex: "actorName",
        key: "actorName",
        render: (_, record) => (
          <div>
            <div className="font-medium text-gray-800">{record.actorName || "Unknown User"}</div>
            <div className="text-xs text-gray-500">{record.actorEmail || "-"}</div>
          </div>
        ),
      },
      {
        title: "Action",
        dataIndex: "action",
        key: "action",
      },
      {
        title: "Module",
        dataIndex: "module",
        key: "module",
        render: (value) => <Tag color="blue">{value || "N/A"}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value) => <Tag color={STATUS_COLORS[value] || "default"}>{value || "UNKNOWN"}</Tag>,
      },
      {
        title: "Timestamp",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 210,
        render: (value) => (value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-"),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Clock className="text-purple-600" />
        Audit Logs
      </h1>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <Space wrap>
          <Input
            allowClear
            placeholder="Search by actor/action"
            prefix={<Search size={14} className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />

          <Select
            allowClear
            placeholder="Filter by module"
            style={{ width: 220 }}
            value={moduleFilter}
            onChange={setModuleFilter}
            options={modules.map((module) => ({ label: module, value: module }))}
          />

          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statuses.map((status) => ({ label: status, value: status }))}
          />

          <RangePicker
            value={dateRange}
            onChange={(value) => setDateRange(value || [])}
            format="DD-MM-YYYY"
          />
        </Space>

        {error ? <Text type="danger">{error}</Text> : null}

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          locale={{ emptyText: "No audit logs found" }}
        />
      </div>
    </div>
  );
};

export default AuditLogs;
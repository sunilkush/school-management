import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { Clock, Download, RefreshCcw, Search } from "lucide-react";
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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState([]);
  const [modules, setModules] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const currentPage = pagination.current;
  const currentPageSize = pagination.pageSize;

  const buildParams = useCallback(() => {
    const params = {
      page: currentPage,
      limit: currentPageSize,
    };

    if (search?.trim()) params.search = search.trim();
    if (moduleFilter) params.module = moduleFilter;
    if (statusFilter) params.status = statusFilter;
    if (dateRange?.[0]) params.startDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
    if (dateRange?.[1]) params.endDate = dayjs(dateRange[1]).format("YYYY-MM-DD");

    return params;
  }, [search, moduleFilter, statusFilter, dateRange, currentPage, currentPageSize]);

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
      const { data } = await httpClient.get("/audit-logs", { params: buildParams() });
      setLogs(data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data?.pagination?.total || 0,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch audit logs");
      setLogs([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = buildParams();
      delete params.page;
      delete params.limit;

      const response = await httpClient.get("/audit-logs/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = dayjs().format("YYYY-MM-DD");

      link.href = url;
      link.setAttribute("download", `audit-logs-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success("Audit logs exported successfully");
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setModuleFilter(undefined);
    setStatusFilter(undefined);
    setDateRange([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Clock className="text-purple-600" />
          Audit Logs
        </h1>

        <Space>
          <Button icon={<RefreshCcw size={14} />} onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button type="primary" icon={<Download size={14} />} loading={exporting} onClick={handleExport}>
            Export CSV
          </Button>
        </Space>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <Space wrap>
          <Input
            allowClear
            placeholder="Search by actor/action/entity"
            prefix={<Search size={14} className="text-gray-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 260 }}
          />

          <Select
            allowClear
            placeholder="Filter by module"
            style={{ width: 220 }}
            value={moduleFilter}
            onChange={(value) => {
              setModuleFilter(value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            options={modules.map((module) => ({ label: module, value: module }))}
          />

          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            options={statuses.map((status) => ({ label: status, value: status }))}
          />

          <RangePicker
            value={dateRange}
            onChange={(value) => {
              setDateRange(value || []);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            format="DD-MM-YYYY"
          />
        </Space>

        {error ? <Text type="danger">{error}</Text> : null}

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          onRow={(record) => ({
            onClick: () => setSelectedLog(record),
            className: "cursor-pointer",
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={(nextPagination) => {
            setPagination((prev) => ({
              ...prev,
              current: nextPagination.current,
              pageSize: nextPagination.pageSize,
            }));
          }}
          bordered
          locale={{ emptyText: "No audit logs found" }}
        />
      </div>

      <Drawer
        title="Audit Log Details"
        placement="right"
        width={480}
        onClose={() => setSelectedLog(null)}
        open={Boolean(selectedLog)}
      >
        {selectedLog ? (
          <Space direction="vertical" size="middle" className="w-full">
            <div><Text strong>Actor:</Text> {selectedLog.actorName || "-"}</div>
            <div><Text strong>Email:</Text> {selectedLog.actorEmail || "-"}</div>
            <div><Text strong>Action:</Text> {selectedLog.action || "-"}</div>
            <div><Text strong>Module:</Text> {selectedLog.module || "-"}</div>
            <div><Text strong>Status:</Text> <Tag color={STATUS_COLORS[selectedLog.status] || "default"}>{selectedLog.status || "UNKNOWN"}</Tag></div>
            <div><Text strong>Entity Type:</Text> {selectedLog.entityType || "-"}</div>
            <div><Text strong>Entity ID:</Text> {selectedLog.entityId || "-"}</div>
            <div><Text strong>IP Address:</Text> {selectedLog.ipAddress || "-"}</div>
            <div><Text strong>User Agent:</Text> {selectedLog.userAgent || "-"}</div>
            <div><Text strong>Timestamp:</Text> {selectedLog.createdAt ? dayjs(selectedLog.createdAt).format("DD MMM YYYY, hh:mm:ss A") : "-"}</div>
            <div>
              <Text strong>Metadata:</Text>
              <pre className="bg-gray-50 p-3 mt-2 rounded border text-xs overflow-auto">
                {selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : "No metadata available"}
              </pre>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
};

export default AuditLogs;

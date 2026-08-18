import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  message,
} from "antd";
import { Clock, Download, RefreshCcw, Search } from "lucide-react";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, pill,
  toolbarRow, tableContainer, tableHeadCss,
} from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

const STATUS_PILL = {
  SUCCESS: ["var(--success-hover)", "var(--success-light)"],
  FAILED: ["var(--danger-hover)", "var(--danger-light)"],
  WARNING: ["var(--warning-hover)", "var(--warning-light)"],
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
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{record.actorName || "Unknown User"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{record.actorEmail || "-"}</div>
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
        render: (value) => <span style={pill("var(--primary)", "var(--primary-light)")}>{value || "N/A"}</span>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value) => {
          const [color, bg] = STATUS_PILL[value] || ["var(--text-muted)", "var(--surface-soft)"];
          return <span style={pill(color, bg)}>{value || "UNKNOWN"}</span>;
        },
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
    <div style={pageWrapper}>
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide activity trail for every action across the platform"
        icon={<Clock size={18} />}
        extra={
          <Space wrap>
            <Button icon={<RefreshCcw size={14} />} onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button type="primary" icon={<Download size={14} />} loading={exporting} onClick={handleExport}>
              Export CSV
            </Button>
          </Space>
        }
      />

      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={toolbarRow}>
          <Input
            allowClear
            placeholder="Search by actor/action/entity"
            prefix={<Search size={14} style={{ color: "var(--text-muted)" }} />}
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
        </div>

        {error ? <div style={{ color: "var(--danger-hover)", marginBottom: 12 }}>{error}</div> : null}

        <style>{tableHeadCss("audit-logs-tbl")}</style>
        <div className="audit-logs-tbl" style={tableContainer}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={logs}
            loading={loading}
            onRow={(record) => ({
              onClick: () => setSelectedLog(record),
              style: { cursor: "pointer" },
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
            locale={{ emptyText: "No audit logs found" }}
          />
        </div>
      </div>

      <Drawer
        title="Audit Log Details"
        placement="right"
        width={480}
        onClose={() => setSelectedLog(null)}
        open={Boolean(selectedLog)}
      >
        {selectedLog ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div><span style={{ fontWeight: 700 }}>Actor:</span> {selectedLog.actorName || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>Email:</span> {selectedLog.actorEmail || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>Action:</span> {selectedLog.action || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>Module:</span> {selectedLog.module || "-"}</div>
            <div>
              <span style={{ fontWeight: 700 }}>Status:</span>{" "}
              <span style={pill(...(STATUS_PILL[selectedLog.status] || ["var(--text-muted)", "var(--surface-soft)"]))}>
                {selectedLog.status || "UNKNOWN"}
              </span>
            </div>
            <div><span style={{ fontWeight: 700 }}>Entity Type:</span> {selectedLog.entityType || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>Entity ID:</span> {selectedLog.entityId || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>IP Address:</span> {selectedLog.ipAddress || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>User Agent:</span> {selectedLog.userAgent || "-"}</div>
            <div><span style={{ fontWeight: 700 }}>Timestamp:</span> {selectedLog.createdAt ? dayjs(selectedLog.createdAt).format("DD MMM YYYY, hh:mm:ss A") : "-"}</div>
            <div>
              <span style={{ fontWeight: 700 }}>Metadata:</span>
              <pre
                style={{
                  background: "var(--surface-soft)",
                  border: "1px solid var(--border-muted)",
                  padding: 12,
                  marginTop: 8,
                  borderRadius: 10,
                  fontSize: 12,
                  overflow: "auto",
                  color: "var(--text-primary)",
                }}
              >
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

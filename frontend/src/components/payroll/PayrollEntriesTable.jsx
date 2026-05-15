import React, { useMemo, useState } from "react";
import { Button, Input, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import WarningsList from "./WarningsList";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text } = Typography;

const PayrollEntriesTable = ({ entries, loading }) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(
      new Set((entries || []).map((row) => row.employeeId?.department).filter(Boolean))
    );
    return [
      { value: "all", label: "All departments" },
      ...uniqueDepartments.map((item) => ({ value: item, label: item })),
    ];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return (entries || []).filter((row) => {
      const name = row.employeeId?.userId?.name?.toLowerCase() || "";
      const searchHit = query ? name.includes(query.toLowerCase()) : true;
      const statusHit = status === "all" ? true : row.paymentStatus === status;
      const departmentHit = department === "all" ? true : row.employeeId?.department === department;
      return searchHit && statusHit && departmentHit;
    });
  }, [department, entries, query, status]);

  const filteredSummary = useMemo(() => {
    return filteredEntries.reduce(
      (acc, row) => {
        acc.netPay += Number(row.netPay || 0);
        acc.gross += Number(row.grossEarnings || 0);
        acc.deduction += Number(row.totalDeductions || 0);
        if (row.paymentStatus === "paid") acc.paidCount += 1;
        return acc;
      },
      { netPay: 0, gross: 0, deduction: 0, paidCount: 0 }
    );
  }, [filteredEntries]);

  const handleExportCsv = () => {
    const headers = ["Employee", "Department", "PresentDays", "WorkingDays", "LOPDays", "LateCount", "OvertimeHours", "Gross", "Deduction", "Net", "Status", "PaymentMode"];
    const rows = filteredEntries.map((row) => [
      row.employeeId?.userId?.name || "-",
      row.employeeId?.department || "-",
      row.presentDays || 0,
      row.workingDays || 0,
      row.lopDays || 0,
      row.lateCount || 0,
      row.overtimeHours || 0,
      row.grossEarnings || 0,
      row.totalDeductions || 0,
      row.netPay || 0,
      row.paymentStatus || "pending",
      row.paymentMode || "-",
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "payroll-entries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
    { title: "Department", render: (_, r) => r.employeeId?.department || "-" },
    {
      title: "Attendance",
      render: (_, r) => (
        <Text>
          {r.presentDays}/{r.workingDays} ({r.lopDays} LOP)
          <br />
          Late: {r.lateCount || 0} • OT: {r.overtimeHours || 0}h
        </Text>
      ),
    },
    { title: "Gross", dataIndex: "grossEarnings", render: (v) => formatCurrencyINR(v) },
    { title: "Deduction", dataIndex: "totalDeductions", render: (v) => formatCurrencyINR(v) },
    { title: "Net", dataIndex: "netPay", render: (v) => <Text strong>{formatCurrencyINR(v)}</Text> },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      render: (s) => <Tag color={s === "paid" ? "green" : "orange"}>{s?.toUpperCase()}</Tag>,
    },
    {
      title: "Mode",
      dataIndex: "paymentMode",
      render: (mode) => (mode ? mode.toUpperCase() : "-"),
    },
    { title: "Warnings", dataIndex: "warnings", render: (w) => <WarningsList warnings={w} /> },
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <Input.Search allowClear placeholder="Search employee" onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} />
        <Select
          value={status}
          onChange={setStatus}
          style={{ width: 180 }}
          options={[
            { value: "all", label: "All status" },
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
          ]}
        />
        <Select value={department} onChange={setDepartment} style={{ width: 220 }} options={departmentOptions} />
        <Button onClick={handleExportCsv}>Export CSV</Button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Space size={24} wrap>
          <Statistic title="Filtered Employees" value={filteredEntries.length} />
          <Statistic title="Paid in Filter" value={filteredSummary.paidCount} />
          <Statistic title="Gross (Filter)" value={formatCurrencyINR(filteredSummary.gross)} />
          <Statistic title="Deduction (Filter)" value={formatCurrencyINR(filteredSummary.deduction)} />
          <Statistic title="Net Payout (Filter)" value={formatCurrencyINR(filteredSummary.netPay)} />
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredEntries}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />
    </>
  );
};

export default PayrollEntriesTable;

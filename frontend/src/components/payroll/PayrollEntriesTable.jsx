import React, { useMemo, useState } from "react";
import { Input, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import WarningsList from "./WarningsList";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text } = Typography;

const PayrollEntriesTable = ({ entries, loading }) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filteredEntries = useMemo(() => {
    return (entries || []).filter((row) => {
      const target = query.toLowerCase();
      const name = row.employeeId?.userId?.name?.toLowerCase() || "";
      const code = row.employeeId?.employeeCode?.toLowerCase() || "";
      const dept = row.employeeId?.department?.toLowerCase() || "";
      const searchHit = query ? name.includes(target) || code.includes(target) || dept.includes(target) : true;
      const statusHit = status === "all" ? true : row.paymentStatus === status;
      return searchHit && statusHit;
    });
  }, [entries, query, status]);

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return "-";
    const digits = String(accountNumber);
    if (digits.length <= 4) return digits;
    return `XXXXXX${digits.slice(-4)}`;
  };

  const columns = [
    {
      title: "Employee",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.employeeId?.userId?.name || "-"}</Text>
          <Text type="secondary">{r.employeeId?.employeeCode || "No code"}</Text>
        </Space>
      ),
    },
    { title: "Department", render: (_, r) => r.employeeId?.department || "-" },
    { title: "Designation", render: (_, r) => r.employeeId?.designation || "-" },
    {
      title: "Attendance",
      render: (_, r) => (
        <Text>
          {r.presentDays}/{r.workingDays} ({r.lopDays} LOP, {r.paidLeaves || 0} Paid Leave)
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
      title: "Payment Details",
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text>{r.employeeId?.bankDetails?.bankName || "Bank not set"}</Text>
          <Text type="secondary">A/C {maskAccountNumber(r.employeeId?.bankDetails?.accountNumber)}</Text>
          {r.transactionRef ? (
            <Tooltip title={r.transactionRef}><Text type="secondary">Txn: {r.transactionRef}</Text></Tooltip>
          ) : (
            <Text type="secondary">Txn pending</Text>
          )}
        </Space>
      ),
    },
    { title: "Warnings", dataIndex: "warnings", render: (w) => <WarningsList warnings={w} /> },
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Search name, employee code, department" onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} />
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
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredEntries}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
      />
    </>
  );
};

export default PayrollEntriesTable;
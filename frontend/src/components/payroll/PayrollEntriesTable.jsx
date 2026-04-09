import React, { useMemo, useState } from "react";
import { Input, Select, Table, Tag, Typography } from "antd";
import WarningsList from "./WarningsList";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text } = Typography;

const PayrollEntriesTable = ({ entries, loading }) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filteredEntries = useMemo(() => {
    return (entries || []).filter((row) => {
      const name = row.employeeId?.userId?.name?.toLowerCase() || "";
      const searchHit = query ? name.includes(query.toLowerCase()) : true;
      const statusHit = status === "all" ? true : row.paymentStatus === status;
      return searchHit && statusHit;
    });
  }, [entries, query, status]);

  const columns = [
    { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
    { title: "Department", render: (_, r) => r.employeeId?.department || "-" },
    {
      title: "Attendance",
      render: (_, r) => (
        <Text>
          {r.presentDays}/{r.workingDays} ({r.lopDays} LOP)
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
    { title: "Warnings", dataIndex: "warnings", render: (w) => <WarningsList warnings={w} /> },
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
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

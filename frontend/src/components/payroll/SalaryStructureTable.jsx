import React from "react";
import { Button, Table, Tag } from "antd";
import dayjs from "dayjs";
import { formatCurrencyINR } from "../../utils/payroll";

const SalaryStructureTable = ({ data, loading, onEdit }) => {
  const columns = [
    { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || r.employeeId || "-" },
    { title: "Basic", dataIndex: "basic", render: (v) => formatCurrencyINR(v) },
    { title: "Gross", dataIndex: "grossMonthly", render: (v) => formatCurrencyINR(v) },
    { title: "From", dataIndex: "effectiveFrom", render: (v) => (v ? dayjs(v).format("DD MMM YYYY") : "-") },
    { title: "To", dataIndex: "effectiveTo", render: (v) => (v ? dayjs(v).format("DD MMM YYYY") : "-") },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "active" ? "green" : "default"}>{v}</Tag> },
    { title: "Action", render: (_, r) => <Button onClick={() => onEdit(r)}>Edit</Button> },
  ];

  return <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 8 }} />;
};

export default SalaryStructureTable;

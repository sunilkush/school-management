import React, { useMemo, useState } from "react";
import { Button, Dropdown, Input, Select, Table, message } from "antd";
import PayrollStatusTag from "./PayrollStatusTag";
import PayrollRunItemDetailDrawer from "./PayrollRunItemDetailDrawer";

const PayrollRunTable = ({ items = [], loading, onRecalculate, onApproveItem, onHoldPayment }) => {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState();
  const [status, setStatus] = useState();
  const [active, setActive] = useState(null);

  const data = useMemo(
    () => items
      .filter((item) => !q || JSON.stringify(item.employeeSnapshot || item.employeeId || {}).toLowerCase().includes(q.toLowerCase()))
      .filter((item) => !dept || item.employeeSnapshot?.department === dept)
      .filter((item) => !status || item.status === status),
    [items, q, dept, status]
  );
  const depts = [...new Set(items.map((item) => item.employeeSnapshot?.department).filter(Boolean))];

  const runAction = (handler, record, fallback) => {
    if (handler) return handler(record);
    message.info(fallback);
    return null;
  };

  const columns = [
    { title: "Employee Name", dataIndex: ["employeeSnapshot", "employeeCode"] },
    { title: "Department", dataIndex: ["employeeSnapshot", "department"] },
    { title: "Designation", dataIndex: ["employeeSnapshot", "designation"] },
    { title: "Working Days", dataIndex: ["attendanceSummary", "workingDays"] },
    { title: "Present Days", dataIndex: ["attendanceSummary", "presentDays"] },
    { title: "Paid Leaves", dataIndex: ["attendanceSummary", "paidLeaves"] },
    { title: "Unpaid Leaves", dataIndex: ["attendanceSummary", "unpaidLeaves"] },
    { title: "Payable Days", dataIndex: ["attendanceSummary", "payableDays"] },
    { title: "Gross Pay", dataIndex: "grossPay" },
    { title: "Deductions", dataIndex: "totalDeductions" },
    { title: "Net Pay", dataIndex: "netPay" },
    { title: "Payment", dataIndex: "paymentStatus", render: (value) => <PayrollStatusTag status={value} /> },
    { title: "Status", dataIndex: "status", render: (value) => <PayrollStatusTag status={value} /> },
    {
      title: "Actions",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: "view", label: "View Details" },
              { key: "recalc", label: "Recalculate Employee" },
              { key: "approve", label: "Approve Item" },
              { key: "hold", label: "Hold Payment" },
            ],
            onClick: ({ key }) => {
              if (key === "view") setActive(record);
              if (key === "recalc") runAction(onRecalculate, record, "Recalculate from cycle actions");
              if (key === "approve") runAction(onApproveItem, record, "Approve from cycle approval action");
              if (key === "hold") runAction(onHoldPayment, record, "Hold action sent");
            },
          }}
        >
          <Button>Actions</Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 md:flex-row">
        <Input.Search placeholder="Search employee" onChange={(event) => setQ(event.target.value)} />
        <Select allowClear placeholder="Department" onChange={setDept} options={depts.map((d) => ({ label: d, value: d }))} className="min-w-44" />
        <Select allowClear placeholder="Status" onChange={setStatus} options={["review", "approved", "paid", "failed"].map((s) => ({ label: s, value: s }))} className="min-w-44" />
      </div>
      <Table loading={loading} rowKey="_id" dataSource={data} scroll={{ x: 1200 }} pagination={{ pageSize: 10 }} columns={columns} />
      <PayrollRunItemDetailDrawer open={!!active} item={active} onClose={() => setActive(null)} />
    </>
  );
};

export default PayrollRunTable;

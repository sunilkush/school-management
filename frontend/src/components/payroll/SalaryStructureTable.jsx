import React from "react";
import { Button, Space, Table } from "antd";
import { EditOutlined, CheckCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DEFAULT_PAYROLL_SETTINGS, estimatePayrollDeductions, formatCurrencyINR } from "../../utils/payroll";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  success: "#22C55E", successLight: "#DCFCE7",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const StatusBadge = ({ status }) => {
  const active = status === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: active ? C.successLight : "#F1F5F9",
      color: active ? "#15803D" : C.textSub,
      border: `1px solid ${active ? "#86EFAC" : C.border}`,
    }}>
      {active
        ? <CheckCircleOutlined style={{ fontSize: 10 }} />
        : <MinusCircleOutlined style={{ fontSize: 10 }} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const AmountCell = ({ value, accent = false }) => (
  <span style={{
    fontFamily: "monospace", fontSize: 13,
    fontWeight: accent ? 800 : 600,
    color: accent ? C.primary : C.text,
  }}>
    {formatCurrencyINR(value)}
  </span>
);

const SalaryStructureTable = ({ data, loading, onEdit, settings }) => {
  const columns = [
    {
      title: "Employee",
      render: (_, r) => {
        const name = r.employeeId?.userId?.name || r.employeeId || "—";
        const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: `linear-gradient(135deg, ${C.primary}, #14B8A6)`,
              color: "#fff", fontSize: 12, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {initials}
            </div>
            <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{name}</span>
          </div>
        );
      },
    },
    {
      title: "Basic",
      dataIndex: "basic",
      render: (v) => <AmountCell value={v} />,
    },
    {
      title: "Gross",
      dataIndex: "grossMonthly",
      render: (v) => <AmountCell value={v} accent />,
    },
    {
      title: "Deductions",
      render: (_, r) => {
        const effectiveSettings = settings || DEFAULT_PAYROLL_SETTINGS;
        const { total } = estimatePayrollDeductions(r, effectiveSettings);
        return (
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "#EF4444" }}>
              {formatCurrencyINR(total)}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
              {[effectiveSettings.pfEnabled && "PF", effectiveSettings.esiEnabled && "ESI", r.professionalTaxEnabled && "PT"].filter(Boolean).join(" · ") || "None"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Validity",
      render: (_, r) => (
        <div style={{ fontSize: 12, color: C.textSub }}>
          <div>{r.effectiveFrom ? dayjs(r.effectiveFrom).format("DD MMM YYYY") : "—"}</div>
          <div style={{ color: C.textMuted }}>
            {r.effectiveTo ? `→ ${dayjs(r.effectiveTo).format("DD MMM YYYY")}` : "→ Ongoing"}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [{ text: "Active", value: "active" }, { text: "Inactive", value: "inactive" }],
      onFilter: (v, r) => r.status === v,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: "Action",
      width: 80,
      render: (_, r) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(r)}
          style={{
            borderRadius: 7, borderColor: C.primary,
            color: C.primary, background: C.primaryLighter,
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="_id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 8, showTotal: (t) => `${t} structures` }}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "No salary structures yet. Create one using the form." }}
    />
  );
};

export default SalaryStructureTable;

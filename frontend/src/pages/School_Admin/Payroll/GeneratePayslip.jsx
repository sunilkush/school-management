import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Table, Tag, Typography, message } from "antd";
import {
  CheckOutlined, EyeOutlined, FileTextOutlined, PrinterOutlined,
  ReloadOutlined, UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";
import { usePayrollCycle, usePayslip } from "../../../hooks/payrollHooks";
import PayslipFilters from "../../../components/payroll/PayslipFilters";
import PayslipPreview from "../../../components/payroll/PayslipPreview";
import { formatCurrencyINR } from "../../../utils/payroll";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageCard, pageWrapper, sectionPanel, tableHeadCss,
} from "../../../styles/pageStyles";

const { Text } = Typography;

/* ── Helpers ─────────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#7C3AED", "#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
const avatarBg  = (name = "") => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const getInitials = (name = "") => {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const STATUS_BADGE = {
  paid:    { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC", label: "Paid" },
  pending: { bg: "#FEF3C7", color: "#B45309", border: "#FDE68A", label: "Pending" },
  default: { bg: "var(--surface-soft)", color: "var(--text-muted)", border: "var(--border-muted)", label: "—" },
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const GeneratePayslip = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState();

  const month = selectedMonth.month() + 1;
  const year  = selectedMonth.year();

  const { entries, loading, isCycleMissing, refreshCycle } = usePayrollCycle(month, year);
  const {
    loading: payslipLoading, payslip, notFound, fetchPayslip, clearPayslip,
  } = usePayslip({ month, year, employeeId: selectedEmployeeId });

  useEffect(() => {
    httpClient
      .get("/employee")
      .then((res) => setEmployees(res?.data?.data || []))
      .catch(() => message.error("Employees load failed"));
  }, []);

  useEffect(() => {
    clearPayslip();
  }, [month, year, selectedEmployeeId, clearPayslip]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({
      value: e._id,
      label: `${e.userId?.name || "Employee"} (${e.designation || "Staff"})`,
    })),
    [employees],
  );

  const handleSelectEmployee = (record) => {
    const id = record.employeeId?._id;
    setSelectedEmployeeId(id);
    fetchPayslip(id);
  };

  /* ── Table columns ─────────────────────────────────────────────── */
  const entriesColumns = useMemo(() => [
    {
      title: "Employee",
      key: "employee",
      render: (_, r) => {
        const name = r.employeeId?.userId?.name || "Employee";
        const desig = r.employeeId?.designation || "Staff";
        const isSelected = r.employeeId?._id === selectedEmployeeId;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: isSelected ? "#2563EB" : avatarBg(name),
              color: "#fff", fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}>
              {isSelected ? <CheckOutlined style={{ fontSize: 12 }} /> : getInitials(name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desig}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Net Pay",
      dataIndex: "netPay",
      width: 130,
      render: (v) => (
        <span style={{ fontWeight: 800, fontSize: 14, color: "#22C55E" }}>
          {formatCurrencyINR(v)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      width: 110,
      render: (s) => {
        const cfg = STATUS_BADGE[s] || STATUS_BADGE.default;
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          }}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Payslip",
      key: "action",
      width: 130,
      render: (_, r) => {
        const isSelected = r.employeeId?._id === selectedEmployeeId;
        return (
          <Button
            size="small"
            icon={isSelected ? <CheckOutlined /> : <EyeOutlined />}
            loading={isSelected && payslipLoading}
            onClick={() => handleSelectEmployee(r)}
            style={{
              borderRadius: 8, fontWeight: 600, fontSize: 12,
              background: isSelected ? "#2563EB" : undefined,
              borderColor: isSelected ? "#2563EB" : undefined,
              color: isSelected ? "#fff" : undefined,
            }}
          >
            {isSelected ? "Loaded" : "Preview"}
          </Button>
        );
      },
    },
  ], [selectedEmployeeId, payslipLoading]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("payslip-tbl")}</style>
      <style>{`.payslip-tbl .ant-table-row.selected-row td { background: #EFF6FF !important; }`}</style>

      <PageHeader
        title="Payslip Center"
        subtitle="Select month & employee to generate and preview payslips"
        icon={<FileTextOutlined />}
        extra={
          <Button icon={<PrinterOutlined />} onClick={() => window.print()} style={{ borderRadius: 8 }}>
            Print
          </Button>
        }
      />

      {/* ── Filters toolbar ───────────────────────────────────────── */}
      <div style={{ ...sectionPanel, marginBottom: 16 }}>
        <PayslipFilters
          monthValue={selectedMonth}
          onMonthChange={(v) => v && setSelectedMonth(v)}
          employeeOptions={employeeOptions}
          employeeId={selectedEmployeeId}
          setEmployeeId={setSelectedEmployeeId}
          onRefresh={refreshCycle}
          onFetch={() => fetchPayslip()}
          onPrint={() => window.print()}
          loading={payslipLoading}
        />
      </div>

      {/* ── Two-panel layout ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

        {/* Left — Cycle Entries */}
        <div style={{ ...pageCard, padding: 0, overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-muted)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={iconWell("#2563EB", 32)}><UserOutlined style={{ fontSize: 14 }} /></div>
            <div>
              <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                Payroll Entries
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {selectedMonth.format("MMMM YYYY")} — click a row to load payslip
              </Text>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={refreshCycle}
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>

          {isCycleMissing ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                No Cycle for {selectedMonth.format("MMMM YYYY")}
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Generate the payroll cycle first from the Monthly Payroll page.
              </Text>
            </div>
          ) : (
            <Table
              className="payslip-tbl"
              rowKey="_id"
              columns={entriesColumns}
              dataSource={entries}
              loading={loading}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 480 }}
              rowClassName={(r) => r.employeeId?._id === selectedEmployeeId ? "selected-row" : ""}
              locale={{
                emptyText: (
                  <div style={{ padding: "32px 0" }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payroll entries" />
                  </div>
                ),
              }}
            />
          )}
        </div>

        {/* Right — Payslip Preview */}
        <div style={{ ...pageCard, padding: 0, overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-muted)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={iconWell("#7C3AED", 32)}><FileTextOutlined style={{ fontSize: 14 }} /></div>
            <div>
              <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                Payslip Preview
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {selectedEmployeeId ? selectedMonth.format("MMMM YYYY") : "Select an employee to preview"}
              </Text>
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {notFound && (
              <Alert
                type="warning"
                showIcon
                message="Payslip not found for selected employee / month"
                style={{ marginBottom: 16, borderRadius: 10 }}
              />
            )}
            <PayslipPreview
              payslip={payslip}
              monthLabel={selectedMonth.format("MMMM YYYY")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePayslip;

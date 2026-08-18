import React, { useEffect, useMemo, useState } from "react";
import { Alert, Form, Input, message } from "antd";
import {
  TeamOutlined, CheckCircleOutlined,
  BarChartOutlined, SearchOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import SalaryStructureForm from "../../../components/payroll/SalaryStructureForm";
import SalaryStructureTable from "../../../components/payroll/SalaryStructureTable";
import { fetchPayrollEmployees, fetchPayrollSettings, fetchPayrollStructures, savePayrollStructure } from "../../../features/payrollSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, statGrid, iconWell, tableHeadCss } from "../../../styles/pageStyles";
import { formatCurrencyINR } from "../../../utils/payroll";

const C = {
  primary: "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "#EFF6FF",
  accent: "var(--accent)", accentLight: "var(--accent-light)",
  success: "var(--success)", successLight: "var(--success-light)",
  warning: "var(--warning)", warningLight: "var(--warning-light)",
};

const SalaryStructures = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const { employees, structures, loadingStructures, savingStructure, currentSettings } = useSelector((s) => s.payroll);
  const safeEmployees  = useMemo(() => (Array.isArray(employees)  ? employees  : []), [employees]);
  const safeStructures = useMemo(() => (Array.isArray(structures) ? structures : []), [structures]);

  useEffect(() => {
    dispatch(fetchPayrollEmployees()).unwrap().catch((e) => {
      message.error(e?.message || "Employee list load failed");
    });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPayrollStructures()).unwrap().catch((e) => {
      if (e?.status !== 404) message.warning(e?.message || "Structure listing unavailable — form workflow still works.");
    });
  }, [dispatch]);

  // Real configured PF/ESI/PT rates — without this, the form preview and the deductions
  // column below would silently fall back to statutory defaults, which can look wrong for
  // any school that has actually customized its Payroll Settings.
  useEffect(() => {
    dispatch(fetchPayrollSettings()).unwrap().catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (editingId) return;
    const sel = form.getFieldValue("employeeId");
    if (!sel && safeEmployees.length) form.setFieldValue("employeeId", safeEmployees[0]._id);
  }, [editingId, safeEmployees, form]);

  const validateOverlap = (values) => {
    const from = dayjs(values.effectiveFrom);
    const to   = values.effectiveTo ? dayjs(values.effectiveTo) : null;
    return !safeStructures.some((s) => {
      if (editingId && s._id === editingId) return false;
      const empId = s.employeeId?._id || s.employeeId;
      if (empId !== values.employeeId || s.status !== "active") return false;
      const sFrom = dayjs(s.effectiveFrom);
      const sTo   = s.effectiveTo ? dayjs(s.effectiveTo) : null;
      const end   = to    || dayjs("2099-12-31");
      const sEnd  = sTo   || dayjs("2099-12-31");
      return from.startOf("day").valueOf() <= sEnd.endOf("day").valueOf()
          && sFrom.startOf("day").valueOf() <= end.endOf("day").valueOf();
    });
  };

  const handleSubmit = async (values) => {
    if (!validateOverlap(values)) {
      message.warning("Active structure overlap detected for this employee.");
      return;
    }
    const payload = {
      ...values,
      effectiveFrom: values.effectiveFrom.toISOString(),
      effectiveTo: values.effectiveTo ? values.effectiveTo.toISOString() : null,
    };
    try {
      const res = await dispatch(savePayrollStructure({ editingId, payload })).unwrap();
      message.success(res?.message || "Salary structure saved");
      setEditingId(null);
      form.resetFields();
      if (safeEmployees.length) form.setFieldValue("employeeId", safeEmployees[0]._id);
      await dispatch(fetchPayrollStructures()).unwrap();
    } catch (e) {
      message.error(e?.message || "Salary structure save failed");
    }
  };

  const onEdit = (row) => {
    setEditingId(row._id);
    form.setFieldsValue({
      ...row,
      employeeId:    row.employeeId?._id || row.employeeId,
      effectiveFrom: row.effectiveFrom ? dayjs(row.effectiveFrom) : null,
      effectiveTo:   row.effectiveTo   ? dayjs(row.effectiveTo)   : null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredStructures = useMemo(() => {
    if (!search) return safeStructures;
    return safeStructures.filter((s) =>
      (s.employeeId?.userId?.name || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [safeStructures, search]);

  const stats = useMemo(() => {
    const active = safeStructures.filter((s) => s.status === "active");
    return {
      total:      safeStructures.length,
      active:     active.length,
      totalGross: active.reduce((sum, s) => sum + (s.grossMonthly || 0), 0),
      employees:  new Set(safeStructures.map((s) => s.employeeId?._id || s.employeeId)).size,
    };
  }, [safeStructures]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("sal-str-tbl")}</style>

      <PageHeader
        title="Salary Structures"
        subtitle="Define and manage employee salary components, allowances, and deductions"
        icon={<RupeeIcon />}
      />

      {/* Stats */}
      <div style={{ ...statGrid(150), margin: "20px 0 20px" }}>
        {[
          { icon: <TeamOutlined />,        label: "Employees",         value: stats.employees,                    color: "#2563EB" },
          { icon: <CheckCircleOutlined />, label: "Active Structures", value: stats.active,                       color: "#22C55E" },
          { icon: <RupeeIcon />,           label: "Total Structures",  value: stats.total,                        color: "#14B8A6"  },
          { icon: <BarChartOutlined />,    label: "Monthly Payroll",   value: formatCurrencyINR(stats.totalGross), color: "#F59E0B", small: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--surface)", borderRadius: 14,
            border: "1px solid var(--border-muted)",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={iconWell(s.color, 42)}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: s.small ? 16 : 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!safeStructures.length && (
        <Alert
          showIcon type="info" style={{ marginBottom: 16, borderRadius: 10 }}
          message="No structures listed yet"
          description="Create a salary structure using the form below. The list will populate after structures are saved."
        />
      )}

      {/* Main 2-Panel Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, alignItems: "start" }}>

        {/* Left: Form */}
        <div>
          <SalaryStructureForm
            form={form}
            employees={safeEmployees}
            onSubmit={handleSubmit}
            submitting={savingStructure}
            editingId={editingId}
            settings={currentSettings}
          />
          {editingId && (
            <button
              onClick={() => { setEditingId(null); form.resetFields(); }}
              style={{
                marginTop: 10, width: "100%", padding: "8px 0",
                background: "transparent", border: "1px dashed var(--border-muted)",
                borderRadius: 8, cursor: "pointer", color: "var(--text-muted)",
                fontSize: 12, fontWeight: 600,
              }}
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>

        {/* Right: Table */}
        <div style={{
          background: "var(--surface)", borderRadius: 14,
          border: "1px solid var(--border-muted)",
          overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid var(--border-muted)",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>All Structures</span>
            <span style={{
              fontSize: 12, padding: "2px 9px", borderRadius: 20,
              background: C.primaryLighter, color: C.primary,
              border: `1px solid ${C.primaryLight}`, fontWeight: 600,
            }}>
              {filteredStructures.length}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <Input
                placeholder="Search employee…"
                prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200, borderRadius: 8 }}
                allowClear
              />
            </div>
          </div>
          <div className="sal-str-tbl">
            <SalaryStructureTable
              data={filteredStructures}
              loading={loadingStructures}
              onEdit={onEdit}
              settings={currentSettings}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalaryStructures;

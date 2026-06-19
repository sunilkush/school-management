import React, { useMemo } from "react";
import {
  Button, DatePicker, Form, InputNumber, Select, Switch,
} from "antd";
import {
  UserOutlined, CalendarOutlined, BankOutlined,
  PercentageOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatCurrencyINR } from "../../utils/payroll";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  success: "#22C55E", successLight: "#DCFCE7",
  danger: "#EF4444", dangerLight: "#FEE2E2",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const SectionLabel = ({ icon, title }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 12, fontWeight: 700, color: C.textSub,
    textTransform: "uppercase", letterSpacing: "0.07em",
    padding: "10px 0 8px", borderBottom: "1px solid " + C.border, marginBottom: 12,
  }}>
    <span style={{ color: C.primary }}>{icon}</span>
    {title}
  </div>
);

const AmountRow = ({ label, value, color = C.text, bold = false, separator = false }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: separator ? "8px 0 0" : "4px 0",
    borderTop: separator ? "1.5px solid " + C.border : "none",
    marginTop: separator ? 6 : 0,
  }}>
    <span style={{ fontSize: 12, color: bold ? C.text : C.textSub, fontWeight: bold ? 700 : 500 }}>{label}</span>
    <span style={{ fontSize: bold ? 14 : 13, color, fontWeight: bold ? 800 : 600, fontFamily: "monospace" }}>
      {formatCurrencyINR(value)}
    </span>
  </div>
);

const SalaryStructureForm = ({ form, employees, onSubmit, submitting, editingId }) => {
  const basic            = Form.useWatch("basic",            form) || 0;
  const hra              = Form.useWatch("hra",              form) || 0;
  const da               = Form.useWatch("da",               form) || 0;
  const specialAllowance = Form.useWatch("specialAllowance", form) || 0;
  const pfEnabled        = Form.useWatch("pfEnabled",        form);
  const esiEnabled       = Form.useWatch("esiEnabled",       form);
  const professionalTaxEnabled = Form.useWatch("professionalTaxEnabled", form);
  const effectiveFrom    = Form.useWatch("effectiveFrom",    form);

  const gross = useMemo(
    () => Number(basic) + Number(hra) + Number(da) + Number(specialAllowance),
    [basic, hra, da, specialAllowance],
  );
  const deductions = useMemo(() => {
    let d = 0;
    if (pfEnabled)            d += gross * 0.12;
    if (esiEnabled)           d += gross * 0.0075;
    if (professionalTaxEnabled) d += 200;
    return d;
  }, [gross, pfEnabled, esiEnabled, professionalTaxEnabled]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({
      value: e._id,
      label: `${e.userId?.name || e.name || "Employee"} (${e.designation || e.department || "Staff"})`,
    })),
    [employees],
  );

  const fi = { marginBottom: 12 };

  return (
    <div style={{
      background: C.surface, borderRadius: 14, border: "1px solid " + C.border,
      padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 16 }}>
        {editingId ? "✏️ Edit Salary Structure" : "➕ Create Salary Structure"}
      </div>

      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ status: "active", pfEnabled: true }}>

        {/* Employee */}
        <SectionLabel icon={<UserOutlined />} title="Employee" />
        <Form.Item name="employeeId" rules={[{ required: true, message: "Select an employee" }]} style={fi}>
          <Select
            showSearch optionFilterProp="label"
            placeholder="Search employee by name…"
            options={employeeOptions}
            size="large"
          />
        </Form.Item>

        {/* Earnings */}
        <SectionLabel icon={<BankOutlined />} title="Monthly Earnings" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Form.Item label="Basic Salary (₹)" name="basic" rules={[{ required: true }]} style={fi}>
            <InputNumber
              min={0} style={{ width: "100%" }} placeholder="0"
              formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
              parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
            />
          </Form.Item>
          <Form.Item label="HRA (₹)" name="hra" initialValue={0} style={fi}>
            <InputNumber
              min={0} style={{ width: "100%" }} placeholder="0"
              formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
              parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
            />
          </Form.Item>
          <Form.Item label="DA — Dearness Allowance (₹)" name="da" initialValue={0} style={fi}>
            <InputNumber
              min={0} style={{ width: "100%" }} placeholder="0"
              formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
              parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
            />
          </Form.Item>
          <Form.Item label="Special Allowance (₹)" name="specialAllowance" initialValue={0} style={fi}>
            <InputNumber
              min={0} style={{ width: "100%" }} placeholder="0"
              formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
              parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
            />
          </Form.Item>
        </div>

        <Form.Item label="Gross Monthly (₹)" name="grossMonthly" rules={[{ required: true }]} style={fi}>
          <InputNumber
            min={0} style={{ width: "100%" }} placeholder="Total gross monthly salary"
            formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
            parser={(v) => v.replace(/₹\s?|(,*)/g, "")}
          />
        </Form.Item>

        {/* Deductions */}
        <SectionLabel icon={<PercentageOutlined />} title="Statutory Deductions" />
        <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
          {[
            { name: "pfEnabled",              label: "PF (12%)",     color: C.primary },
            { name: "esiEnabled",             label: "ESI (0.75%)",  color: C.accent  },
            { name: "professionalTaxEnabled", label: "Prof. Tax ₹200", color: C.purple },
          ].map(({ name, label, color }) => (
            <Form.Item key={name} name={name} valuePropName="checked" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Switch size="small" style={{ background: C.border }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>{label}</span>
              </div>
            </Form.Item>
          ))}
        </div>

        {/* Dates & Status */}
        <SectionLabel icon={<CalendarOutlined />} title="Validity" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Form.Item label="Effective From" name="effectiveFrom" rules={[{ required: true }]} style={fi}>
            <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item label="Effective To (optional)" name="effectiveTo" style={fi}>
            <DatePicker
              style={{ width: "100%" }} format="DD-MM-YYYY"
              disabledDate={(d) => effectiveFrom && d.isBefore(dayjs(effectiveFrom), "day")}
            />
          </Form.Item>
        </div>

        <Form.Item label="Status" name="status" rules={[{ required: true }]} style={fi}>
          <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        </Form.Item>

        {/* Live Preview */}
        {gross > 0 && (
          <div style={{
            background: C.surfaceSoft, borderRadius: 10,
            border: "1px solid " + C.border, padding: "14px 16px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              Salary Preview
            </div>
            <AmountRow label="Basic"             value={basic} />
            <AmountRow label="HRA"               value={hra} />
            <AmountRow label="DA"                value={da} />
            <AmountRow label="Special Allowance" value={specialAllowance} />
            <AmountRow label="Gross Earnings"    value={gross}             color={C.success} bold />
            {deductions > 0 && (
              <>
                <AmountRow label="Total Deductions" value={deductions} color={C.danger} bold separator />
                <AmountRow label="Net Take-Home"     value={gross - deductions} color={C.primary} bold />
              </>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Button htmlType="reset" style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}>
            Reset
          </Button>
          <Button
            htmlType="submit"
            loading={submitting}
            icon={<CheckCircleOutlined />}
            style={{
              flex: 1, background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 8, fontWeight: 700, height: 40,
            }}
          >
            {editingId ? "Update Structure" : "Save Structure"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SalaryStructureForm;

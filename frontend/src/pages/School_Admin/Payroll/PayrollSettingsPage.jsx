import React, { useEffect } from "react";
import { Alert, Button, DatePicker, Form, Input, InputNumber, message, Select, Switch, Table, Tag } from "antd";
import { SettingOutlined, SafetyCertificateOutlined, HeartOutlined, HistoryOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../../../styles/pageStyles";
import { fetchPayrollSettings, savePayrollSettings } from "../../../features/payrollSlice";

const SectionTitle = ({ icon, color, title, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <div style={iconWell(color, 30)}>{icon}</div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{subtitle}</div>}
    </div>
  </div>
);

// Every employee's salary structure sums into this wage base the same way — components here
// are the ones a structure can actually set a non-zero value for.
const CUSTOM_COMPONENT_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "hra", label: "HRA" },
  { value: "da", label: "DA" },
  { value: "specialAllowance", label: "Special Allowance" },
];

// Statutory-default values — pre-filled so a school that just wants "the standard India
// rules" can save without changing anything, while every value stays fully editable.
const DEFAULTS = {
  pfEnabled: true,
  pfPercent: 12,
  pfWageCeiling: 15000,
  pfAppliedOnCeiling: true,
  pfApplicableOn: "basicPlusDa",
  pfCustomComponents: [],
  employerPfPercent: 12,
  epsPercent: 8.33,
  epfAdminChargesPercent: 0.5,
  edliPercent: 0.5,
  esiEnabled: true,
  esiPercent: 0.75,
  esiWageCeiling: 21000,
  esiApplicableOn: "gross",
  esiCustomComponents: [],
  employerEsiPercent: 3.25,
  professionalTaxAmount: 0,
  paidLeavePerMonth: 1,
  roundingMode: "nearest",
  payDateDayOfMonth: 1,
  overtimeRatePerHour: 0,
};

const PayrollSettingsPage = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { settingsVersions, currentSettings, loadingSettings, savingSettings } = useSelector((s) => s.payroll);
  const pfApplicableOn = Form.useWatch("pfApplicableOn", form);
  const pfCustomComponents = Form.useWatch("pfCustomComponents", form);
  const esiApplicableOn = Form.useWatch("esiApplicableOn", form);
  const esiCustomComponents = Form.useWatch("esiCustomComponents", form);

  useEffect(() => {
    dispatch(fetchPayrollSettings()).unwrap().catch((e) => {
      message.error(e?.message || "Payroll settings load failed");
    });
  }, [dispatch]);

  useEffect(() => {
    if (currentSettings) {
      form.setFieldsValue({ ...DEFAULTS, ...currentSettings, effectiveFrom: undefined });
    }
  }, [currentSettings, form]);

  const handleSubmit = async (values) => {
    const payload = { ...values, effectiveFrom: values.effectiveFrom.toISOString() };
    try {
      await dispatch(savePayrollSettings(payload)).unwrap();
      message.success("New payroll settings version saved — it will apply to any cycle generated on or after its effective date.");
      form.setFieldValue("effectiveFrom", null);
      await dispatch(fetchPayrollSettings()).unwrap();
    } catch (e) {
      message.error(e?.message || "Payroll settings save failed");
    }
  };

  const fi = { marginBottom: 12 };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" };

  const historyColumns = [
    { title: "Effective From", dataIndex: "effectiveFrom", render: (v) => dayjs(v).format("DD MMM YYYY") },
    { title: "PF", dataIndex: "pfEnabled", render: (v) => (v === false ? <Tag color="red">Off</Tag> : <Tag color="green">On</Tag>) },
    { title: "Employee PF %", dataIndex: "pfPercent" },
    { title: "PF Ceiling", dataIndex: "pfWageCeiling", render: (v) => `₹${v}` },
    { title: "ESI", dataIndex: "esiEnabled", render: (v) => (v === false ? <Tag color="red">Off</Tag> : <Tag color="green">On</Tag>) },
    { title: "Employee ESI %", dataIndex: "esiPercent" },
    { title: "ESI Ceiling", dataIndex: "esiWageCeiling", render: (v) => `₹${v}` },
    {
      title: "Status",
      render: (_, row) => (
        row._id === currentSettings?._id
          ? <Tag color="green">Currently effective</Tag>
          : <Tag>Historical</Tag>
      ),
    },
    { title: "Notes", dataIndex: "notes", render: (v) => v || "—" },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Payroll Settings"
        subtitle="Configure PF (EPF), ESI, and other statutory payroll rules for this school"
        icon={<SettingOutlined />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20, alignItems: "start" }}>
        <div style={sectionPanel}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={DEFAULTS}>
            <SectionTitle
              icon={<SafetyCertificateOutlined style={{ fontSize: 13 }} />}
              color="#2563EB"
              title="EPF (Provident Fund)"
              subtitle="Employees' Provident Funds & Miscellaneous Provisions Act, 1952"
            />
            <div style={{ ...fi, display: "flex", alignItems: "center", gap: 8 }}>
              <Form.Item name="pfEnabled" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                Enable PF for this school (single switch — applies to every employee, unless individually excluded via Employee statutory details)
              </span>
            </div>
            <div style={grid2}>
              <Form.Item label="Employee PF %" name="pfPercent" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Employer PF % (EPS + EPF)" name="employerPfPercent" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="EPS % (within employer PF)" name="epsPercent" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="PF Wage Ceiling (₹/month)" name="pfWageCeiling" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="EPF Admin Charges %" name="epfAdminChargesPercent" style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="EDLI %" name="edliPercent" style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
            </div>
            <div style={{ ...fi, display: "flex", alignItems: "center", gap: 8 }}>
              <Form.Item name="pfAppliedOnCeiling" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                Cap PF wage at the ceiling above (uncheck to apply PF on full Basic+DA)
              </span>
            </div>

            <Form.Item
              label="PF Wage Applicable On"
              name="pfApplicableOn"
              tooltip="Statutory wage base for PF — Basic+DA per the EPF Act, applied the same way to every employee at this school"
              style={fi}
            >
              <Select
                options={[
                  { value: "basic", label: "Basic only" },
                  { value: "basicPlusDa", label: "Basic + DA (statutory default)" },
                  { value: "custom", label: "Custom components" },
                ]}
              />
            </Form.Item>
            {pfApplicableOn === "custom" && (
              <Form.Item
                label="PF Wage Components"
                name="pfCustomComponents"
                rules={[{ required: true, message: "Pick at least one component — otherwise PF wage is ₹0 for every employee" }]}
                style={fi}
              >
                <Select mode="multiple" placeholder="Select components to sum for PF wage" options={CUSTOM_COMPONENT_OPTIONS} />
              </Form.Item>
            )}
            {pfApplicableOn === "custom" && !pfCustomComponents?.length && (
              <Alert type="warning" showIcon style={{ marginBottom: 14, borderRadius: 8 }}
                message="No components selected — PF wage will be ₹0 for every PF-enabled employee until you pick at least one." />
            )}

            <SectionTitle
              icon={<HeartOutlined style={{ fontSize: 13 }} />}
              color="#14B8A6"
              title="ESI (State Insurance)"
              subtitle="Employees' State Insurance Act, 1948 — rates per the 2019 revision"
            />
            <div style={{ ...fi, display: "flex", alignItems: "center", gap: 8 }}>
              <Form.Item name="esiEnabled" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                Enable ESI for this school (single switch — applies to every employee, unless individually excluded via Employee statutory details)
              </span>
            </div>
            <div style={grid2}>
              <Form.Item label="Employee ESI %" name="esiPercent" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Employer ESI %" name="employerEsiPercent" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} max={100} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="ESI Eligibility Ceiling (₹/month gross)" name="esiWageCeiling" rules={[{ required: true }]} style={fi}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Form.Item
              label="ESI Wage Applicable On"
              name="esiApplicableOn"
              tooltip="Wage base for ESI — Gross wages per the ESI Act, applied the same way to every employee at this school"
              style={fi}
            >
              <Select
                options={[
                  { value: "gross", label: "Gross wages (statutory default)" },
                  { value: "custom", label: "Custom components" },
                ]}
              />
            </Form.Item>
            {esiApplicableOn === "custom" && (
              <Form.Item
                label="ESI Wage Components"
                name="esiCustomComponents"
                rules={[{ required: true, message: "Pick at least one component — otherwise ESI wage is ₹0 for every employee" }]}
                style={fi}
              >
                <Select mode="multiple" placeholder="Select components to sum for ESI wage" options={CUSTOM_COMPONENT_OPTIONS} />
              </Form.Item>
            )}
            {esiApplicableOn === "custom" && !esiCustomComponents?.length && (
              <Alert type="warning" showIcon style={{ marginBottom: 14, borderRadius: 8 }}
                message="No components selected — ESI wage will be ₹0 for every ESI-eligible employee until you pick at least one." />
            )}

            <SectionTitle icon={<SettingOutlined style={{ fontSize: 13 }} />} color="#F59E0B" title="Other Rules" />
            <div style={grid2}>
              <Form.Item label="Professional Tax (₹/month)" name="professionalTaxAmount" style={fi}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Rounding Mode" name="roundingMode" style={fi}>
                <Select options={[{ value: "nearest", label: "Nearest rupee" }, { value: "up", label: "Round up" }, { value: "down", label: "Round down" }]} />
              </Form.Item>
              <Form.Item label="Paid Leaves / Month" name="paidLeavePerMonth" style={fi}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Overtime Rate (₹/hour)" name="overtimeRatePerHour" style={fi}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Form.Item
              label="Effective From"
              name="effectiveFrom"
              rules={[{ required: true, message: "Choose when these rates take effect" }]}
              tooltip="Payroll cycles generated on or after this date use these rates; earlier cycles keep using the previous version"
              style={fi}
            >
              <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
            </Form.Item>
            <Form.Item label="Notes (optional)" name="notes" style={fi}>
              <Input placeholder="e.g. ESI ceiling revised per latest notification" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={savingSettings} block style={{ borderRadius: 8, fontWeight: 700, height: 40 }}>
              Save as New Version
            </Button>
          </Form>
        </div>

        <div style={sectionPanel}>
          <SectionTitle icon={<HistoryOutlined style={{ fontSize: 13 }} />} color="#7C3AED" title="Settings History" subtitle="All configured versions, newest first" />
          <Table
            size="small"
            rowKey="_id"
            loading={loadingSettings}
            columns={historyColumns}
            dataSource={settingsVersions}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
};

export default PayrollSettingsPage;

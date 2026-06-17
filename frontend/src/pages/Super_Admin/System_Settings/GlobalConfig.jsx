import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Switch,
  Upload,
  Spin,
  message,
  Divider,
  InputNumber,
} from "antd";
import {
  UploadOutlined,
  SettingOutlined,
  SaveOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  SafetyOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGlobalConfig,
  updateGlobalConfig,
} from "../../../features/globalConfigSlice";
import { useTheme } from "../../../context/ThemeContext";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  iconWell,
} from "../../../styles/pageStyles";

const { Option } = Select;

/* ── Section heading helper ──────────────────────────────────────── */
function SectionHead({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={iconWell("var(--primary)", 38)}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function GlobalConfig() {
  const dispatch = useDispatch();
  const { config, loading, saving } = useSelector((s) => s.globalConfig);
  const { setThemeMode } = useTheme();

  const [form] = Form.useForm();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  /* ── Fetch config on mount ── */
  useEffect(() => {
    dispatch(fetchGlobalConfig());
  }, [dispatch]);

  /* ── Populate form when config arrives ── */
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        platformName: config.platformName ?? "",
        currency: config.currency ?? "INR",
        currencySymbol: config.currencySymbol ?? "₹",
        timezone: config.timezone ?? "Asia/Kolkata",
        theme: config.theme ?? "system",
        supportEmail: config.supportEmail ?? "",
        supportPhone: config.supportPhone ?? "",
        maintenanceMode: config.maintenanceMode ?? false,
        allowRegistration: config.allowRegistration ?? true,
        maxSchools: config.maxSchools ?? 100,
      });
      if (config.logoUrl) {
        setLogoPreview(config.logoUrl);
      }
    }
  }, [config, form]);

  /* ── Logo upload handler ── */
  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Only image files are allowed");
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2 MB");
      return Upload.LIST_IGNORE;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
    return false; // prevent automatic upload
  };

  /* ── Submit ── */
  const onFinish = async (values) => {
    try {
      const payload = { ...values };
      if (logoFile) {
        payload.logo = logoFile;
      }

      // Sync theme with local ThemeContext immediately
      if (values.theme) {
        setThemeMode(values.theme);
      }

      await dispatch(updateGlobalConfig(payload)).unwrap();
      message.success("Global configuration saved successfully");
    } catch (err) {
      message.error(err || "Failed to save configuration");
    }
  };

  return (
    <div style={pageWrapper}>
      {/* Header */}
      <PageHeader
        title="Global Configuration"
        subtitle="Platform-wide settings and defaults"
        icon={<SettingOutlined />}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
            style={{ fontWeight: 600, borderRadius: 10 }}
          >
            Save Configuration
          </Button>
        }
      />

      {/* Body */}
      <Spin spinning={loading} tip="Loading configuration...">
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          style={{ marginTop: 20 }}
        >
          {/* ── Platform Identity ── */}
          <div style={{ ...sectionPanel }}>
            <SectionHead
              icon={<GlobalOutlined />}
              title="Platform Identity"
              subtitle="Basic platform details visible to users"
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <Form.Item
                name="platformName"
                label="Platform Name"
                rules={[{ required: true, message: "Platform name is required" }]}
              >
                <Input placeholder="e.g. EduManage Pro" size="large" />
              </Form.Item>

              <Form.Item name="maxSchools" label="Maximum Schools Allowed">
                <InputNumber
                  min={1}
                  max={10000}
                  placeholder="e.g. 100"
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>

            {/* Logo upload */}
            <Form.Item label="Platform Logo">
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {logoPreview && (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid var(--border-muted)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface-soft)",
                    }}
                  >
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                )}
                {!logoPreview && (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      border: "1.5px dashed var(--border-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface-soft)",
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    <PictureOutlined style={{ fontSize: 28 }} />
                  </div>
                )}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleBeforeUpload}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>
                    {logoPreview ? "Change Logo" : "Upload Logo"}
                  </Button>
                </Upload>
                {logoPreview && (
                  <Button
                    type="link"
                    danger
                    onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                    style={{ padding: 0 }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                Accepted: PNG, JPG, SVG. Max size: 2 MB.
              </div>
            </Form.Item>
          </div>

          {/* ── Localisation ── */}
          <div style={{ ...sectionPanel }}>
            <SectionHead
              icon={<ClockCircleOutlined />}
              title="Localisation"
              subtitle="Currency, timezone, and regional preferences"
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: "Currency is required" }]}
              >
                <Select size="large" suffixIcon={<DollarOutlined />}>
                  <Option value="INR">INR — Indian Rupee</Option>
                  <Option value="USD">USD — US Dollar</Option>
                  <Option value="EUR">EUR — Euro</Option>
                  <Option value="GBP">GBP — British Pound</Option>
                  <Option value="AED">AED — UAE Dirham</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="currencySymbol"
                label="Currency Symbol"
                rules={[{ required: true, message: "Symbol is required" }]}
              >
                <Input placeholder="e.g. ₹" size="large" maxLength={4} />
              </Form.Item>

              <Form.Item
                name="timezone"
                label="Timezone"
                rules={[{ required: true, message: "Timezone is required" }]}
              >
                <Select size="large" showSearch optionFilterProp="children">
                  <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York (EST)</Option>
                  <Option value="America/Los_Angeles">America/Los_Angeles (PST)</Option>
                  <Option value="Europe/London">Europe/London (GMT)</Option>
                  <Option value="Europe/Paris">Europe/Paris (CET)</Option>
                  <Option value="Asia/Dubai">Asia/Dubai (GST)</Option>
                  <Option value="Asia/Singapore">Asia/Singapore (SGT)</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* ── Appearance ── */}
          <div style={{ ...sectionPanel }}>
            <SectionHead
              icon={<BulbOutlined />}
              title="Appearance"
              subtitle="Default theme applied across the platform"
            />
            <Form.Item
              name="theme"
              label="Default Theme"
              style={{ maxWidth: 320 }}
            >
              <Select size="large">
                <Option value="light">Light</Option>
                <Option value="dark">Dark</Option>
                <Option value="system">System Default</Option>
              </Select>
            </Form.Item>
          </div>

          {/* ── Support Contact ── */}
          <div style={{ ...sectionPanel }}>
            <SectionHead
              icon={<MailOutlined />}
              title="Support Contact"
              subtitle="Contact details shown to users who need help"
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <Form.Item
                name="supportEmail"
                label="Support Email"
                rules={[{ type: "email", message: "Enter a valid email address" }]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="support@example.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item name="supportPhone" label="Support Phone">
                <Input
                  prefix={<PhoneOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="+91 98765 43210"
                  size="large"
                />
              </Form.Item>
            </div>
          </div>

          {/* ── Platform Controls ── */}
          <div style={{ ...sectionPanel }}>
            <SectionHead
              icon={<SafetyOutlined />}
              title="Platform Controls"
              subtitle="Toggle platform-wide operational flags"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "var(--surface-soft)",
                  borderRadius: 12,
                  border: "1px solid var(--border-muted)",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                    Maintenance Mode
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    When enabled, only administrators can access the platform.
                  </div>
                </div>
                <Form.Item name="maintenanceMode" valuePropName="checked" style={{ margin: 0 }}>
                  <Switch />
                </Form.Item>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "var(--surface-soft)",
                  borderRadius: 12,
                  border: "1px solid var(--border-muted)",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                    Allow Public Registration
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    Allow new schools to self-register on the platform.
                  </div>
                </div>
                <Form.Item name="allowRegistration" valuePropName="checked" style={{ margin: 0 }}>
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* ── Save footer ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              padding: "16px 0 8px",
            }}
          >
            <Button
              onClick={() => {
                if (config) {
                  form.setFieldsValue({
                    platformName: config.platformName ?? "",
                    currency: config.currency ?? "INR",
                    currencySymbol: config.currencySymbol ?? "₹",
                    timezone: config.timezone ?? "Asia/Kolkata",
                    theme: config.theme ?? "system",
                    supportEmail: config.supportEmail ?? "",
                    supportPhone: config.supportPhone ?? "",
                    maintenanceMode: config.maintenanceMode ?? false,
                    allowRegistration: config.allowRegistration ?? true,
                    maxSchools: config.maxSchools ?? 100,
                  });
                  setLogoPreview(config.logoUrl || null);
                  setLogoFile(null);
                }
              }}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              style={{ fontWeight: 600, borderRadius: 10, minWidth: 160 }}
            >
              Save Configuration
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
}

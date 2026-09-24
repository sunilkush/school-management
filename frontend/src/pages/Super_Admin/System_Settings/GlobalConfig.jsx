import { useEffect, useState } from "react";
import {
  Alert, Button, Collapse, Form, Input, InputNumber, Select, Skeleton, Switch, Tag, Upload, message,
} from "antd";
import { CreditCardOutlined, FileTextOutlined, PictureOutlined, SaveOutlined, SettingOutlined, UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchGlobalConfig, updateGlobalConfig } from "../../../features/globalConfigSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell } from "../../../styles/pageStyles";

/**
 * Global settings — the platform-wide details, grouped by what actually uses them.
 *
 * The page saved, but saving did damage: the secret fields cannot be shown, so they were sent back
 * blank and the blank replaced what was stored — every save erased the Razorpay key secret, the
 * SMTP password and the SMS key. The logo was sent inside a JSON body and never stored. And most of
 * the switches were read by nothing: e-mail and SMS go out with the server's .env settings,
 * maintenance mode and the school limit are not enforced anywhere.
 *
 * So the settings something uses come first, each saying what uses it, and the rest are kept
 * together under a heading that says plainly they have no effect yet.
 */

const SECRET_LABEL = { razorpayKeySecret: "hasRazorpayKeySecret", razorpayWebhookSecret: "hasRazorpayWebhookSecret", smtpPassword: "hasSmtpPassword", smsApiKey: "hasSmsApiKey" };

const valuesFrom = (c = {}) => ({
  platformName: c.platformName ?? "",
  supportEmail: c.supportEmail ?? "",
  supportPhone: c.supportPhone ?? "",
  currencySymbol: c.currencySymbol ?? "₹",
  razorpayKeyId: c.razorpayKeyId ?? "",
  razorpayKeySecret: "",
  razorpayWebhookSecret: "",
  maxSchools: c.maxSchools ?? null,
  currency: c.currency ?? "INR",
  timezone: c.timezone ?? "Asia/Kolkata",
  theme: c.theme ?? "light",
  maintenanceMode: Boolean(c.maintenanceMode),
  allowRegistration: c.allowRegistration ?? true,
  smtpHost: c.smtpHost ?? "",
  smtpPort: c.smtpPort ?? null,
  smtpUser: c.smtpUser ?? "",
  smtpPassword: "",
  smtpFromEmail: c.smtpFromEmail ?? "",
  smtpFromName: c.smtpFromName ?? "",
  smsProvider: c.smsProvider ?? "none",
  smsApiKey: "",
  smsSenderId: c.smsSenderId ?? "",
  paymentGateway: c.paymentGateway ?? "none",
});

const Panel = ({ icon, title, usedBy, children }) => (
  <div className="section-panel">
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
      <div style={iconWell("var(--primary)", 36)}>{icon}</div>
      <div>
        <div className="u-title">{title}</div>
        <div className="u-meta-md">{usedBy}</div>
      </div>
    </div>
    {children}
  </div>
);

const grid = (min) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: "0 16px" });

/** A secret: never shown, blank keeps what is saved, and removing it is a separate, undoable step. */
const SecretField = ({ name, label, saved, clearing, onToggleClear, placeholder }) => (
  <Form.Item
    label={label}
    extra={saved ? (
      clearing ? (
        <span>Will be removed when you save · <Button type="link" size="small" style={{ padding: 0 }} onClick={onToggleClear}>Keep it</Button></span>
      ) : (
        <span><Tag color="success" style={{ marginRight: 6 }}>Saved</Tag>Leave blank to keep it · <Button type="link" size="small" danger style={{ padding: 0 }} onClick={onToggleClear}>Remove</Button></span>
      )
    ) : "Not set"}
  >
    <Form.Item name={name} noStyle>
      <Input.Password placeholder={saved ? "Type a new one to replace it" : placeholder} autoComplete="new-password" disabled={clearing} />
    </Form.Item>
  </Form.Item>
);

const Toggle = ({ name, title, note }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
    <div className="u-grow">
      <div className="u-strong">{title}</div>
      <div className="u-meta">{note}</div>
    </div>
    <Form.Item name={name} valuePropName="checked" noStyle><Switch /></Form.Item>
  </div>
);

export default function GlobalConfig() {
  const dispatch = useDispatch();
  const { config, loading, saving, error } = useSelector((s) => s.globalConfig || {});
  const [form] = Form.useForm();
  const [dirty, setDirty] = useState(false);
  const [clearing, setClearing] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => { dispatch(fetchGlobalConfig()); }, [dispatch]);

  const reset = () => {
    form.setFieldsValue(valuesFrom(config || {}));
    setClearing([]);
    setLogoFile(null);
    setLogoPreview(config?.logoUrl || null);
    setRemoveLogo(false);
    setDirty(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (config) reset(); }, [config]);

  const toggleClear = (secret) => {
    setClearing((list) => (list.includes(secret) ? list.filter((s) => s !== secret) : [...list, secret]));
    form.setFieldValue(secret, "");
    setDirty(true);
  };

  const pickLogo = (file) => {
    if (!file.type.startsWith("image/")) { message.error("Pick an image file"); return Upload.LIST_IGNORE; }
    if (file.size > 2 * 1024 * 1024) { message.error("The logo has to be under 2 MB"); return Upload.LIST_IGNORE; }
    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
    setDirty(true);
    return false;
  };

  const save = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (e) {
      form.scrollToField(e?.errorFields?.[0]?.name, { behavior: "smooth", block: "center" });
      return;
    }
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key in SECRET_LABEL && !String(value).trim()) return;      // blank secret = keep
      data.append(key, typeof value === "string" ? value.trim() : String(value));
    });
    if (clearing.length) data.append("clearSecrets", clearing.join(","));
    if (logoFile) data.append("logo", logoFile);
    else if (removeLogo) data.append("removeLogo", "true");

    try {
      await dispatch(updateGlobalConfig(data)).unwrap();
      message.success("Settings saved");
    } catch (e) {
      message.error(typeof e === "string" ? e : "Could not save the settings");
    }
  };

  const watched = Form.useWatch([], form) || {};
  const contact = [watched.supportEmail, watched.supportPhone].filter(Boolean).join("  ·  ");

  if (!config && loading) {
    return <div className="page-wrapper"><PageHeader title="Global settings" icon={<SettingOutlined />} /><div className="section-panel"><Skeleton active paragraph={{ rows: 8 }} /></div></div>;
  }
  if (!config && error) {
    return (
      <div className="page-wrapper">
        <PageHeader title="Global settings" icon={<SettingOutlined />} />
        <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => dispatch(fetchGlobalConfig())}>Try again</Button>} />
      </div>
    );
  }

  const secret = (name, label, placeholder) => (
    <SecretField
      name={name} label={label} placeholder={placeholder}
      saved={Boolean(config?.[SECRET_LABEL[name]])}
      clearing={clearing.includes(name)}
      onToggleClear={() => toggleClear(name)}
    />
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Global settings"
        subtitle="Platform-wide details — each group says what uses it"
        icon={<SettingOutlined />}
        extra={<Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!dirty} onClick={save}>Save</Button>}
      />

      <Form form={form} layout="vertical" requiredMark={false} onValuesChange={() => setDirty(true)}>
        <Panel icon={<FileTextOutlined />} title="Invoices" usedBy="Printed on the invoices schools receive for their plan.">
          <div style={grid(240)}>
            <Form.Item name="platformName" label="Platform name" rules={[{ required: true, whitespace: true, message: "The invoices need a name at the top" }]}>
              <Input placeholder="School Management System" maxLength={80} />
            </Form.Item>
            <Form.Item name="currencySymbol" label="Currency symbol" rules={[{ required: true, whitespace: true, message: "Enter a symbol, e.g. ₹" }]}>
              <Input placeholder="₹" maxLength={4} style={{ maxWidth: 120 }} />
            </Form.Item>
            <Form.Item name="supportEmail" label="Support email" rules={[{ type: "email", message: "That is not an email address" }]}>
              <Input placeholder="billing@yourcompany.in" />
            </Form.Item>
            <Form.Item name="supportPhone" label="Support phone">
              <Input placeholder="+91 98765 43210" />
            </Form.Item>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Top of an invoice</div>
          <div style={{ padding: "12px 16px", borderRadius: 12, border: "1px dashed var(--border-muted)", background: "var(--surface-soft)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{watched.platformName || "School Management System"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{contact || "No contact details — add a support email or phone"}</div>
          </div>
        </Panel>

        <Panel icon={<CreditCardOutlined />} title="Online plan payments — Razorpay" usedBy="Used when a school pays for its plan online. Left empty, the keys in the server's .env file are used.">
          <div style={grid(260)}>
            <Form.Item name="razorpayKeyId" label="Key ID">
              <Input placeholder="rzp_live_XXXXXXXXXXXX" autoComplete="off" />
            </Form.Item>
            {secret("razorpayKeySecret", "Key secret", "Paste the key secret")}
            {secret("razorpayWebhookSecret", "Webhook secret", "From Razorpay → Webhooks")}
          </div>
        </Panel>

        <Collapse
          style={{ marginBottom: 16, background: "var(--surface)" }}
          items={[{
            key: "unused",
            label: (
              <span>
                <strong>Saved, but not used yet</strong>
                <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>logo, limits, maintenance mode, email, SMS</span>
              </span>
            ),
            children: (
              <>
                <Alert
                  type="info" showIcon className="u-mb-4"
                  message="Nothing in the app reads these yet"
                  description="Changing them has no effect today. E-mails and SMS are sent with the server's .env settings, and maintenance mode, public registration and the school limit are not enforced."
                />

                <div style={{ fontWeight: 700, margin: "4px 0 8px" }}>General</div>
                <Form.Item label="Logo">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, border: "1px solid var(--border-muted)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-soft)", overflow: "hidden" }}>
                      {logoPreview ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <PictureOutlined style={{ color: "var(--text-muted)", fontSize: 22 }} />}
                    </div>
                    <Upload accept="image/*" showUploadList={false} beforeUpload={pickLogo}>
                      <Button icon={<UploadOutlined />}>{logoPreview ? "Change" : "Upload"}</Button>
                    </Upload>
                    {logoPreview && (
                      <Button type="link" danger onClick={() => { setLogoPreview(null); setLogoFile(null); setRemoveLogo(Boolean(config?.logoUrl)); setDirty(true); }}>Remove</Button>
                    )}
                  </div>
                </Form.Item>
                <div style={grid(200)}>
                  <Form.Item name="maxSchools" label="School limit"><InputNumber min={0} className="u-full" placeholder="No limit" /></Form.Item>
                  <Form.Item name="currency" label="Currency"><Select options={[{ value: "INR", label: "INR — Indian rupee" }]} /></Form.Item>
                  <Form.Item name="timezone" label="Time zone">
                    <Select showSearch options={["Asia/Kolkata", "UTC", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles"].map((z) => ({ value: z, label: z }))} />
                  </Form.Item>
                  <Form.Item name="theme" label="Default theme">
                    <Select options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "Follow the device" }]} />
                  </Form.Item>
                </div>
                <Toggle name="maintenanceMode" title="Maintenance mode" note="Meant to let only administrators in." />
                <Toggle name="allowRegistration" title="Public registration" note="Meant to let new schools sign themselves up." />

                <div style={{ fontWeight: 700, margin: "16px 0 8px" }}>Email (SMTP)</div>
                <div style={grid(220)}>
                  <Form.Item name="smtpHost" label="Host"><Input placeholder="smtp.gmail.com" /></Form.Item>
                  <Form.Item name="smtpPort" label="Port"><InputNumber min={1} max={65535} className="u-full" placeholder="587" /></Form.Item>
                  <Form.Item name="smtpUser" label="Username"><Input autoComplete="off" /></Form.Item>
                  {secret("smtpPassword", "Password", "SMTP password")}
                  <Form.Item name="smtpFromEmail" label="From email" rules={[{ type: "email", message: "That is not an email address" }]}><Input placeholder="noreply@yourcompany.in" /></Form.Item>
                  <Form.Item name="smtpFromName" label="From name"><Input placeholder="School Management" /></Form.Item>
                </div>

                <div style={{ fontWeight: 700, margin: "16px 0 8px" }}>SMS</div>
                <div style={grid(220)}>
                  <Form.Item name="smsProvider" label="Provider">
                    <Select options={[{ value: "none", label: "None" }, { value: "twilio", label: "Twilio" }, { value: "msg91", label: "MSG91" }, { value: "textlocal", label: "TextLocal" }]} />
                  </Form.Item>
                  {secret("smsApiKey", "API key", "Provider API key")}
                  <Form.Item name="smsSenderId" label="Sender ID"><Input maxLength={11} placeholder="SCHOOL" /></Form.Item>
                </div>

                <div style={{ fontWeight: 700, margin: "16px 0 8px" }}>Payment gateway</div>
                <Form.Item name="paymentGateway" label="Gateway" extra="Plan payments always go through Razorpay today, whatever is picked here." style={{ maxWidth: 320, marginBottom: 0 }}>
                  <Select options={[{ value: "none", label: "None" }, { value: "razorpay", label: "Razorpay" }, { value: "cashfree", label: "Cashfree" }, { value: "stripe", label: "Stripe" }]} />
                </Form.Item>
              </>
            ),
          }]}
        />
      </Form>

      {dirty && (
        <div style={{
          position: "sticky", bottom: 16, zIndex: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          padding: "12px 16px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border-muted)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
        }}>
          <span style={{ flex: 1, color: "var(--text-secondary)" }}>You have unsaved changes</span>
          <Button onClick={reset} disabled={saving}>Undo changes</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>Save</Button>
        </div>
      )}
    </div>
  );
}

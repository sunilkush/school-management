import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Alert, Button, Drawer, Form, Input, Popconfirm, Radio, Space, Spin, Tag, Tooltip, Typography, message } from "antd";
import {
  ApiOutlined, CheckCircleFilled, CopyOutlined, CreditCardOutlined, ExclamationCircleFilled, LinkOutlined, PoweroffOutlined, SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  activateSchoolGateway, deactivateSchoolGateway, fetchSchoolGateways, saveSchoolGateway, testSchoolGateway,
} from "../../features/paymentGatewaySlice";
import { iconWell } from "../../styles/pageStyles";

const { Text } = Typography;

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success("Copied");
  } catch {
    message.info(text);
  }
};

/**
 * School Admin → Settings → Online Payment Gateway.
 *
 * Every supported Indian gateway is listed; the school saves credentials for any of them, but only
 * one is ever active. Activating another disables the current one — its keys stay saved for later.
 * Parents pay fees online only through the active gateway, into the school's own merchant account.
 */
const PaymentGatewaySettings = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [state, setState] = useState({ loading: true, gateways: [], active: null, error: null });
  const [editing, setEditing] = useState(null); // provider being configured
  const [busy, setBusy] = useState(null); // `${action}:${provider}`

  const load = useCallback(async () => {
    try {
      const data = await dispatch(fetchSchoolGateways()).unwrap();
      setState({ loading: false, gateways: data?.gateways || [], active: data?.active || null, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err }));
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const gateway = state.gateways.find((g) => g.provider === editing);
  const activeGateway = state.gateways.find((g) => g.isActive);

  const openEditor = (g) => setEditing(g.provider);

  // Fill the form once the drawer (and so the Form) is mounted for the chosen gateway. Secrets are
  // never sent back, so their inputs always start empty.
  useEffect(() => {
    if (!editing) return;
    const g = state.gateways.find((x) => x.provider === editing);
    if (!g) return;
    form.resetFields();
    form.setFieldsValue({
      mode: g.mode || "test",
      credentials: Object.fromEntries(g.fields.map((f) => [f.key, f.secret ? "" : g.publicValues?.[f.key] || ""])),
    });
    // Only when switching gateway — not on every reload of the list, which would wipe typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const withBusy = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    withBusy(`save:${editing}`, async () => {
      try {
        const values = await form.validateFields();
        const res = await dispatch(saveSchoolGateway({ provider: editing, ...values })).unwrap();
        message.success(res?.message || "Saved");
        await load();
        form.setFieldsValue({
          credentials: Object.fromEntries(gateway.fields.filter((f) => f.secret).map((f) => [f.key, ""])),
        });
      } catch (err) {
        if (err?.errorFields) return;
        message.error(err);
      }
    });

  const test = (provider) =>
    withBusy(`test:${provider}`, async () => {
      try {
        const result = await dispatch(testSchoolGateway(provider)).unwrap();
        (result?.ok ? message.success : message.error)(result?.message);
      } catch (err) {
        message.error(err);
      }
      await load();
    });

  const activate = (provider) =>
    withBusy(`activate:${provider}`, async () => {
      try {
        const res = await dispatch(activateSchoolGateway(provider)).unwrap();
        message.success(res?.message);
        await load();
      } catch (err) {
        message.error(err);
      }
    });

  const deactivate = (provider) =>
    withBusy(`deactivate:${provider}`, async () => {
      try {
        const res = await dispatch(deactivateSchoolGateway(provider)).unwrap();
        message.success(res?.message);
        await load();
      } catch (err) {
        message.error(err);
      }
    });

  if (state.loading) return <div style={{ padding: 24, textAlign: "center" }}><Spin /></div>;
  if (state.error) return <Alert type="error" showIcon message={state.error} action={<Button size="small" onClick={load}>Retry</Button>} />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={iconWell("var(--warning)", 36)}><CreditCardOutlined /></div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Online Payment Gateway</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Parents pay fees online through one gateway at a time. Money goes straight to your school's merchant account.
          </div>
        </div>
      </div>

      {activeGateway ? (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
          message={
            <span>
              Online payment is <b>on</b> — parents pay through <b>{activeGateway.label}</b>
              {activeGateway.usesMode ? ` (${activeGateway.mode === "live" ? "Live" : "Test mode"})` : ""}.
            </span>
          }
          description={activeGateway.usesMode && activeGateway.mode !== "live" ? "Test mode uses the gateway's sandbox — no real money is collected. Switch to Live before parents pay." : undefined}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
          message="Online payment is off"
          description="Configure a gateway below and activate it. Until then parents can only pay at the school office."
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {state.gateways.map((g) => {
          const isOther = Boolean(state.active) && !g.isActive;
          return (
            <div
              key={g.provider}
              style={{
                border: `1.5px solid ${g.isActive ? "var(--success)" : "var(--border-muted)"}`,
                background: g.isActive ? "var(--success-light)" : "var(--surface)",
                borderRadius: 16,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{g.label}</div>
                {g.isActive ? (
                  <Tag color="success" icon={<CheckCircleFilled />}>Active</Tag>
                ) : g.complete ? (
                  <Tag>Disabled</Tag>
                ) : g.configured ? (
                  <Tag color="warning">Incomplete</Tag>
                ) : (
                  <Tag color="default" style={{ opacity: 0.7 }}>Not set up</Tag>
                )}
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", minHeight: 36 }}>
                {g.configured ? (
                  <>
                    {g.usesMode && <div>Mode: <b>{g.mode === "live" ? "Live" : "Test"}</b></div>}
                    {g.lastTest ? (
                      <div style={{ color: g.lastTest.ok ? "var(--success-hover)" : "var(--danger)" }}>
                        {g.lastTest.ok ? <CheckCircleFilled /> : <ExclamationCircleFilled />} {g.lastTest.message}
                        <span style={{ color: "var(--text-muted)" }}> · {dayjs(g.lastTest.at).format("DD MMM, HH:mm")}</span>
                      </div>
                    ) : (
                      <div>Connection not tested yet</div>
                    )}
                  </>
                ) : (
                  <div>Add your {g.label} merchant credentials to use it.</div>
                )}
              </div>

              <Space wrap size={6}>
                <Button size="small" icon={<SettingOutlined />} onClick={() => openEditor(g)}>
                  {g.configured ? "Edit" : "Set up"}
                </Button>
                {g.complete && (
                  <Button size="small" icon={<ApiOutlined />} loading={busy === `test:${g.provider}`} onClick={() => test(g.provider)}>
                    Test
                  </Button>
                )}
                {g.isActive ? (
                  <Popconfirm
                    title={`Disable ${g.label}?`}
                    description="Online fee payment will be off until a gateway is activated. Keys stay saved."
                    okText="Disable"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => deactivate(g.provider)}
                  >
                    <Button size="small" danger icon={<PoweroffOutlined />} loading={busy === `deactivate:${g.provider}`}>Disable</Button>
                  </Popconfirm>
                ) : (
                  g.complete && (
                    <Popconfirm
                      title={`Use ${g.label} for online fees?`}
                      description={isOther ? `${activeGateway.label} will be disabled. Its keys stay saved.` : "Parents will pay online through this gateway."}
                      okText="Activate"
                      onConfirm={() => activate(g.provider)}
                    >
                      <Button size="small" type="primary" loading={busy === `activate:${g.provider}`}>Activate</Button>
                    </Popconfirm>
                  )
                )}
              </Space>
            </div>
          );
        })}
      </div>

      <Drawer
        title={gateway ? `${gateway.label} settings` : ""}
        open={Boolean(gateway)}
        onClose={() => setEditing(null)}
        width={480}
        footer={
          gateway && (
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              {gateway.complete && (
                <Button icon={<ApiOutlined />} loading={busy === `test:${gateway.provider}`} onClick={() => test(gateway.provider)}>
                  Test connection
                </Button>
              )}
              <Button type="primary" loading={busy === `save:${gateway.provider}`} onClick={save}>Save</Button>
            </Space>
          )
        }
      >
        {gateway && (
          <>
            {gateway.isActive && (
              <Alert type="info" showIcon style={{ marginBottom: 16 }} message="This gateway is active. Changes apply to the next payment." />
            )}
            <Form form={form} layout="vertical">
              {gateway.usesMode && (
                <Form.Item name="mode" label="Mode" extra="Test mode uses the gateway's sandbox with test keys.">
                  <Radio.Group optionType="button" buttonStyle="solid" options={[{ label: "Test", value: "test" }, { label: "Live", value: "live" }]} />
                </Form.Item>
              )}
              {gateway.fields.map((f) => {
                const saved = gateway.filledFields.includes(f.key);
                return (
                  <Form.Item
                    key={f.key}
                    name={["credentials", f.key]}
                    label={f.label}
                    extra={f.help}
                    rules={f.required && !(f.secret && saved) ? [{ required: true, message: `${f.label} is required` }] : []}
                  >
                    {f.secret ? (
                      <Input.Password placeholder={saved ? "Saved — leave blank to keep" : f.placeholder} autoComplete="new-password" />
                    ) : (
                      <Input placeholder={f.placeholder} autoComplete="off" />
                    )}
                  </Form.Item>
                );
              })}
            </Form>

            <div style={{ background: "var(--surface-soft)", borderRadius: 12, padding: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Webhook URL</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                Add this in your {gateway.label} dashboard so payments are confirmed even if a parent closes the browser.
              </div>
              <Space.Compact style={{ width: "100%" }}>
                <Input readOnly value={gateway.webhookUrl} size="small" />
                <Tooltip title="Copy">
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(gateway.webhookUrl)} />
                </Tooltip>
              </Space.Compact>
              {gateway.docsUrl && (
                <div style={{ marginTop: 10 }}>
                  <a href={gateway.docsUrl} target="_blank" rel="noreferrer"><LinkOutlined /> {gateway.label} integration docs</a>
                </div>
              )}
            </div>

            <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 12 }}>
              Keys are stored encrypted and are never shown again after saving.
            </Text>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default PaymentGatewaySettings;

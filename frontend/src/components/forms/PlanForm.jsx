import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Checkbox, Divider, Form, Input, InputNumber, Segmented, Space, Switch, Tag, Tooltip,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
} from "../../features/subscriptionPlanSlice.js";
import { DURATION_PRESETS, PLAN_LIMITS, PLAN_MODULES } from "../../constants/planModules.js";

/**
 * Build or edit a subscription plan.
 *
 * The old form asked for the modules one at a time — add a card, pick the module from a dropdown,
 * then type a "Limit Key" like `maxStudents` from memory — so a plan with eight modules meant eight
 * cards and eight chances to mistype a key nothing validated. Here the whole catalogue is a list of
 * tick boxes, and the caps live in one place, which is also the only place the backend reads them
 * from. Per-module limits an older plan already carries are kept as they are.
 */

const CATEGORIES = ["Starter", "Premium", "Enterprise", "Custom"];

const money = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-IN") : "0");

const sectionTitle = (text, hint) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{text}</div>
    {hint && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
  </div>
);

const PlanForm = ({ initialValues, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.subscriptionPlans);

  const isEdit = Boolean(initialValues?._id);
  const [modules, setModules] = useState([]);
  const [isTrial, setIsTrial] = useState(false);
  const [error, setError] = useState(null);

  /* Per-module limits are shown on the plan card but nothing enforces them, so the form does not
     ask for them — it just carries forward whatever an existing plan already has. */
  const keptModuleLimits = useMemo(() => {
    const kept = {};
    (initialValues?.features || []).forEach((f) => {
      if (f?.module && f.limits && Object.keys(f.limits).length) kept[f.module] = f.limits;
    });
    return kept;
  }, [initialValues]);

  useEffect(() => {
    setError(null);
    if (initialValues) {
      const allowed = (initialValues.features || [])
        .filter((f) => f?.module && f.allowed !== false)
        .map((f) => f.module);
      setModules(allowed);
      setIsTrial(Boolean(initialValues.isTrialPlan));
      form.setFieldsValue({
        name: initialValues.name,
        category: initialValues.category || "Starter",
        price: initialValues.price,
        durationInDays: initialValues.durationInDays,
        isTrialPlan: Boolean(initialValues.isTrialPlan),
        trialDurationInDays: initialValues.trialDurationInDays ?? undefined,
        limits: initialValues.limits || {},
        isActive: initialValues.isActive !== false,
      });
    } else {
      form.resetFields();
      setModules([]);
      setIsTrial(false);
    }
  }, [initialValues, form]);

  const price = Form.useWatch("price", form);
  const durationInDays = Form.useWatch("durationInDays", form);

  const onFinish = async (values) => {
    setError(null);
    const payload = {
      ...values,
      trialDurationInDays: values.isTrialPlan ? values.trialDurationInDays ?? null : null,
      features: modules.map((module) => ({
        module,
        allowed: true,
        limits: keptModuleLimits[module] || {},
      })),
    };

    try {
      if (isEdit) {
        await dispatch(updateSubscriptionPlan({ id: initialValues._id, formData: payload })).unwrap();
      } else {
        await dispatch(createSubscriptionPlan(payload)).unwrap();
      }
      onClose();
    } catch (e) {
      // The slice rejects with a plain message string, so a thrown object is the unusual case.
      const text = typeof e === "string" ? e : e?.message || e?.response?.data?.message;
      setError(text || "The plan could not be saved. Please try again.");
    }
  };

  const allModuleKeys = PLAN_MODULES.map((m) => m.key);
  const allOn = modules.length === allModuleKeys.length;

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ category: "Starter", isActive: true, isTrialPlan: false, limits: {} }}
      onFinish={onFinish}
    >
      {error && <Alert type="error" showIcon message={error} className="u-mb-4" />}

      {/* ── the plan itself ── */}
      {sectionTitle("Plan")}
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Give the plan a name" }]}
      >
        <Input size="large" placeholder="Starter, Premium, Enterprise…" autoFocus />
      </Form.Item>

      <Form.Item label="Category" name="category">
        <Segmented options={CATEGORIES} />
      </Form.Item>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Form.Item
          label="Price"
          name="price"
          rules={[{ required: true, message: "Set a price (0 for a free plan)" }]}
          style={{ flex: "1 1 180px" }}
        >
          <InputNumber
            min={0}
            size="large"
            className="u-full"
            prefix="₹"
            formatter={(v) => (v === undefined || v === "" ? "" : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
            parser={(v) => (v || "").replace(/,/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Billing period"
          name="durationInDays"
          rules={[{ required: true, message: "How many days does the plan run for?" }]}
          style={{ flex: "1 1 180px" }}
        >
          <InputNumber min={1} size="large" className="u-full" addonAfter="days" />
        </Form.Item>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: -8, marginBottom: 12 }}>
        {DURATION_PRESETS.map((p) => (
          <Tag.CheckableTag
            key={p.days}
            checked={Number(durationInDays) === p.days}
            onChange={() => form.setFieldValue("durationInDays", p.days)}
            style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12 }}
          >
            {p.label} · {p.days}d
          </Tag.CheckableTag>
        ))}
      </div>

      {Number(price) >= 0 && Number(durationInDays) > 0 && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          A school pays <strong>₹{money(price)}</strong> every <strong>{durationInDays}</strong> days
          {Number(durationInDays) >= 28 && (
            <> — about ₹{money(Math.round((Number(price) / Number(durationInDays)) * 30))} a month</>
          )}
          .
        </div>
      )}

      <Form.Item name="isTrialPlan" valuePropName="checked" style={{ marginBottom: isTrial ? 8 : 0 }}>
        <Checkbox onChange={(e) => setIsTrial(e.target.checked)}>
          This is a trial plan
        </Checkbox>
      </Form.Item>

      {isTrial && (
        <Form.Item
          label="Trial length"
          name="trialDurationInDays"
          rules={[{ required: true, message: "How long does the trial last?" }]}
          style={{ maxWidth: 220 }}
        >
          <InputNumber min={1} className="u-full" addonAfter="days" />
        </Form.Item>
      )}

      <Divider />

      {/* ── modules ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        {sectionTitle(
          "What the plan includes",
          `${modules.length} of ${allModuleKeys.length} modules switched on`,
        )}
        <Button
          type="link"
          size="small"
          onClick={() => setModules(allOn ? [] : allModuleKeys)}
        >
          {allOn ? "Clear all" : "Select all"}
        </Button>
      </div>

      <Checkbox.Group
        value={modules}
        onChange={setModules}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, width: "100%" }}
      >
        {PLAN_MODULES.map((m) => {
          const on = modules.includes(m.key);
          return (
            <label
              key={m.key}
              style={{
                display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
                padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${on ? "var(--primary)" : "var(--border-muted)"}`,
                background: on ? "var(--primary-light)" : "transparent",
              }}
            >
              <Checkbox value={m.key} />
              <span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {m.key}
                </span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {m.description}
                </span>
              </span>
            </label>
          );
        })}
      </Checkbox.Group>

      <Divider />

      {/* ── limits ── */}
      {sectionTitle("Limits", "Leave a box empty and the plan does not cap it")}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {PLAN_LIMITS.map((l) => (
          <Form.Item key={l.key} label={l.label} name={["limits", l.key]} style={{ marginBottom: 0 }}>
            <InputNumber min={0} placeholder="Unlimited" className="u-full" />
          </Form.Item>
        ))}
      </div>

      <Divider />

      {/* ── status and actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
          <Switch checkedChildren="Live" unCheckedChildren="Draft" />
        </Form.Item>
        <Tooltip title="A draft plan stays out of the list schools can be put on">
          <span className="u-meta">Schools can be put on a live plan</span>
        </Tooltip>

        <Space style={{ marginLeft: "auto" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? "Save changes" : "Create plan"}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default PlanForm;

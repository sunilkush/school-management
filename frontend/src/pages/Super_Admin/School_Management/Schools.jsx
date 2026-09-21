import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert, Button, Checkbox, Drawer, Empty, Form, Input, Modal, Popconfirm, Progress, Segmented, Select,
  Skeleton, Switch, Table, Tag, Upload, message,
} from "antd";
import {
  ApartmentOutlined, BarChartOutlined, CrownOutlined, DeleteOutlined, EditOutlined, PlusOutlined,
  ReloadOutlined, SearchOutlined, SwapOutlined, UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import apiClient from "../../../api/httpClient";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchSubscriptionPlans } from "../../../features/subscriptionPlanSlice";
import { getBoards } from "../../../features/boardSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { avatarStyle, modalTitle } from "../../../styles/pageStyles";

/**
 * Schools — every school on the platform, whether it can sign in, and whose subscription needs
 * looking at.
 *
 * The page used to be a grid of cards showing each school's plan price but not whether that plan
 * had run out, so finding the schools to chase meant opening them one by one. Delete sat beside
 * Edit on every card behind a one-click confirm, and removed only the school record. Creating a
 * school blanked the whole list behind a spinner, and the new school did not appear until a reload.
 *
 * Now the list says what state each school's subscription is in, "Needs attention" gathers the
 * ones to act on, sign-in is a switch on the row, and everything else about a school — details,
 * plan, report, delete — is in one drawer.
 */

const DAY = "D MMM YYYY";
const SOON_DAYS = 30;
const errorText = (e, fallback) => e?.response?.data?.message || e?.message || fallback;
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";

/**
 * Where a school's subscription stands. "Expired" is worked out from the end date as well as the
 * stored status, because the stored one is only brought up to date by a nightly job.
 */
function subscriptionState(sub) {
  if (!sub?.status) return { key: "none", label: "No plan", color: "warning", attention: true };
  const daysLeft = dayjs(sub.endDate).startOf("day").diff(dayjs().startOf("day"), "day");
  if (sub.status === "cancelled") return { key: "cancelled", label: "Cancelled", color: "default", attention: true, daysLeft };
  if (sub.status === "suspended") return { key: "suspended", label: "Suspended", color: "warning", attention: true, daysLeft };
  if (sub.status === "expired" || daysLeft < 0) return { key: "expired", label: "Expired", color: "error", attention: true, daysLeft };
  const trial = sub.status === "trial";
  if (daysLeft <= SOON_DAYS) {
    return { key: "ending", label: daysLeft === 0 ? "Ends today" : `Ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, color: "orange", attention: true, daysLeft, trial };
  }
  return { key: trial ? "trial" : "active", label: trial ? "Trial" : "Active", color: trial ? "processing" : "success", attention: false, daysLeft, trial };
}

const SchoolMark = ({ school, size = 38 }) => (school.logo ? (
  <img src={school.logo} alt="" width={size} height={size} style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border-muted)" }} />
) : (
  <div style={{ ...avatarStyle(school.name, size), borderRadius: 10 }}>{initials(school.name)}</div>
));

const Section = ({ title, extra, children }) => (
  <div style={{ padding: "14px 0", borderTop: "1px solid var(--border-muted)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ flex: 1, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
      {extra}
    </div>
    {children}
  </div>
);

const Fact = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, padding: "4px 0", fontSize: 13 }}>
    <span style={{ color: "var(--text-muted)" }}>{label}</span>
    <span style={{ color: "var(--text-primary)", wordBreak: "break-word" }}>{children || <span style={{ color: "var(--text-muted)" }}>—</span>}</span>
  </div>
);

/* ─────────────────────────── subscription ─────────────────────────── */
const SubscriptionPanel = ({ school, plans, onChanged }) => {
  const [sub, setSub] = useState(undefined);        // undefined = loading, null = none
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [newPlanId, setNewPlanId] = useState(null);
  const [trial, setTrial] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await apiClient.get(`/super-admin/billing/schools/${school._id}/subscription`);
      setSub(res?.data?.data || null);
    } catch (e) {
      if (e?.response?.status === 404) setSub(null);       // no plan yet — not an error
      else { setSub(null); setLoadError(errorText(e, "Could not load the subscription")); }
    }
  }, [school._id]);

  useEffect(() => { setSub(undefined); setNewPlanId(null); setTrial(false); load(); }, [load]);

  // Plans made for another school are not offered here.
  const offered = plans.filter((p) => p.isActive !== false && (!p.customForSchoolId || String(p.customForSchoolId) === String(school._id)));
  const planLabel = (p) => `${p.name} · ${rupees(p.price)} / ${p.durationInDays} days`;
  const picked = offered.find((p) => p._id === newPlanId);

  const run = async (key, request, done) => {
    setBusy(key);
    try {
      await request();
      message.success(done);
      setNewPlanId(null);
      setTrial(false);
      await load();
      onChanged();
    } catch (e) {
      message.error(errorText(e, "That did not work"));
    } finally {
      setBusy(null);
    }
  };
  const base = `/super-admin/billing/schools/${school._id}`;

  if (sub === undefined) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (loadError) {
    return <Alert type="error" showIcon message={loadError} action={<Button size="small" onClick={load}>Try again</Button>} />;
  }

  if (!sub) {
    const days = picked ? (trial ? picked.trialDurationInDays || picked.durationInDays : picked.durationInDays) : 0;
    return (
      <div>
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="No plan yet" description="Pick the plan this school is on." />
        <Select
          style={{ width: "100%" }} placeholder="Pick a plan" value={newPlanId || undefined} onChange={setNewPlanId}
          options={offered.map((p) => ({ value: p._id, label: planLabel(p) }))}
          notFoundContent="No active plans — create one under Subscription Plans"
        />
        {picked && (
          <>
            <Checkbox style={{ marginTop: 10 }} checked={trial} onChange={(e) => setTrial(e.target.checked)}>Start as a trial</Checkbox>
            <div style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 12px" }}>
              Runs {dayjs().format(DAY)} – {dayjs().add(days, "day").format(DAY)} ({days} days)
            </div>
            <Button
              type="primary" block icon={<CrownOutlined />} loading={busy === "assign"}
              onClick={() => run("assign", () => apiClient.post(`${base}/assign-plan`, { planId: picked._id, isTrial: trial }), `${picked.name} started for ${school.name}`)}
            >
              Start {picked.name}{trial ? " as a trial" : ""}
            </Button>
          </>
        )}
      </div>
    );
  }

  const state = subscriptionState(sub);
  const start = dayjs(sub.startDate);
  const end = dayjs(sub.endDate);
  const total = Math.max(1, end.diff(start, "day"));
  const used = Math.min(total, Math.max(0, dayjs().diff(start, "day")));
  const renewedEnd = (end.isAfter(dayjs()) ? end : dayjs()).add(sub.snapshot?.durationInDays || 0, "day");
  const currentPrice = Number(sub.snapshot?.price ?? sub.planId?.price ?? 0);
  const changeTo = offered.filter((p) => p._id !== (sub.planId?._id || sub.planId));
  const upgrade = picked ? Number(picked.price) >= currentPrice : true;

  return (
    <div>
      <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-soft)", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{sub.planId?.name || "Plan"}</span>
          <Tag color={state.color}>{state.label}</Tag>
          {sub.status === "trial" && state.key === "ending" && <Tag color="processing">Trial</Tag>}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {rupees(currentPrice)} for {sub.snapshot?.durationInDays} days · {start.format(DAY)} – {end.format(DAY)}
        </div>
        {["cancelled", "suspended"].includes(state.key) && (
          <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>Its users cannot sign in until it is reactivated.</div>
        )}
        {!["cancelled", "suspended"].includes(state.key) && (
          <>
            <Progress percent={Math.round((used / total) * 100)} showInfo={false} size="small" strokeColor={state.attention ? "var(--warning)" : "var(--primary)"} style={{ margin: "8px 0 0" }} />
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {state.key === "expired" ? `Ended ${Math.abs(state.daysLeft ?? 0)} days ago — its users cannot sign in until it is renewed` : `${state.daysLeft} days left`}
            </div>
          </>
        )}
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Payment: {sub.paymentStatus || "—"}</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <Popconfirm
          title={`Renew ${sub.planId?.name || "the plan"}?`}
          description={`Adds ${sub.snapshot?.durationInDays} days — it will run until ${renewedEnd.format(DAY)}.`}
          okText="Renew"
          onConfirm={() => run("renew", () => apiClient.post(`${base}/renew`), `Renewed until ${renewedEnd.format(DAY)}`)}
        >
          <Button type="primary" icon={<ReloadOutlined />} loading={busy === "renew"}>Renew</Button>
        </Popconfirm>
        {["suspended", "cancelled"].includes(sub.status) ? (
          <Popconfirm
            title="Make the subscription active again?"
            description={state.daysLeft != null && state.daysLeft < 0 ? "Its end date has passed, so it also needs renewing before anyone can sign in." : "Its users can sign in again."}
            okText="Reactivate"
            onConfirm={() => run("reactivate", () => apiClient.post(`${base}/reactivate`), "Subscription active again")}
          >
            <Button loading={busy === "reactivate"}>Reactivate</Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Suspend the subscription?"
            description="Everyone at the school is signed out and cannot sign in until you reactivate it."
            okText="Suspend"
            onConfirm={() => run("suspend", () => apiClient.post(`${base}/suspend`), "Subscription suspended")}
          >
            <Button loading={busy === "suspend"}>Suspend</Button>
          </Popconfirm>
        )}
        {sub.status !== "cancelled" && (
          <Popconfirm
            title="Cancel the subscription?"
            description="Everyone at the school is signed out and cannot sign in until you reactivate it or start a plan."
            okText="Cancel subscription" cancelText="Keep it" okButtonProps={{ danger: true }}
            onConfirm={() => run("cancel", () => apiClient.post(`${base}/cancel`), "Subscription cancelled")}
          >
            <Button danger loading={busy === "cancel"}>Cancel subscription</Button>
          </Popconfirm>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Move to another plan</div>
      <Select
        style={{ width: "100%" }} placeholder="Pick a plan" value={newPlanId || undefined} onChange={setNewPlanId} allowClear
        options={changeTo.map((p) => ({ value: p._id, label: planLabel(p) }))}
        notFoundContent="No other active plan"
      />
      {picked && (
        <>
          <div style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0" }}>
            {upgrade ? "Upgrade" : "Downgrade"} to {picked.name}: starts today and runs until {dayjs().add(picked.durationInDays, "day").format(DAY)}.
            Days left on the current plan are not carried over.
          </div>
          <Popconfirm
            title={`${upgrade ? "Upgrade" : "Downgrade"} to ${picked.name}?`} okText={upgrade ? "Upgrade" : "Downgrade"}
            onConfirm={() => run("change", () => apiClient.post(`${base}/change-plan`, { planId: picked._id, action: upgrade ? "upgrade" : "downgrade" }), `Moved to ${picked.name}`)}
          >
            <Button block icon={<SwapOutlined />} loading={busy === "change"}>{upgrade ? "Upgrade" : "Downgrade"} to {picked.name}</Button>
          </Popconfirm>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────── add / edit ─────────────────────────── */
const SchoolForm = ({ open, school, boards, plans, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const editing = Boolean(school);

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    setLogoFile(null);
    setLogoPreview(school?.logo || null);
    form.resetFields();
    form.setFieldsValue(editing
      ? { name: school.name, email: school.email, phone: school.phone, website: school.website, address: school.address }
      : { isActive: true, boards: [] });
  }, [open, school, editing, form]);

  const pickLogo = ({ file }) => {
    if (!file) return;
    if (file.size > 50 * 1024) { message.error("The logo has to be 50 KB or smaller"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    let values;
    try { values = await form.validateFields(); } catch { return; }
    const data = new FormData();
    ["name", "email", "phone", "website", "address"].forEach((k) => {
      if (values[k] != null) data.append(k, String(values[k]).trim());
    });
    if (!editing) {
      (values.boards || []).forEach((b) => data.append("boards", b));
      if (values.subscriptionPlan) data.append("subscriptionPlan", values.subscriptionPlan);
      data.append("isActive", values.isActive ? "true" : "false");
    }
    if (logoFile) data.append("logo", logoFile);

    setSaving(true);
    setServerError(null);
    try {
      const res = editing
        ? await apiClient.post(`/school/update/${school._id}`, data)
        : await apiClient.post("/school/register", data);
      message.success(editing ? `${values.name} saved` : `${values.name} added`);
      onSaved(res?.data?.data?._id || school?._id);
    } catch (e) {
      setServerError(errorText(e, editing ? "Could not save the school" : "Could not add the school"));
    } finally {
      setSaving(false);
    }
  };

  const offered = plans.filter((p) => p.isActive !== false && !p.customForSchoolId);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
      title={modalTitle(editing ? <EditOutlined /> : <PlusOutlined />, editing ? `Edit ${school.name}` : "Add a school", editing ? "Contact details and logo" : "Name and email are all that is needed to start")}
      footer={(
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={save}>{editing ? "Save" : "Add school"}</Button>
        </div>
      )}
    >
      {serverError && <Alert type="error" showIcon message={serverError} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="name" label="School name" rules={[{ required: true, whitespace: true, message: "Enter the school's name" }]}>
          <Input placeholder="Sunrise Public School" maxLength={120} />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: "Enter the school's email" }, { type: "email", message: "That is not an email address" }]}>
          <Input placeholder="office@sunrise.edu.in" />
        </Form.Item>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 12px" }}>
          <Form.Item name="phone" label="Phone"><Input placeholder="+91 98765 43210" /></Form.Item>
          <Form.Item name="website" label="Website"><Input placeholder="https://sunrise.edu.in" /></Form.Item>
        </div>
        <Form.Item name="address" label="Address"><Input.TextArea rows={2} placeholder="Street, city, state" /></Form.Item>

        {!editing && (
          <>
            <Form.Item name="boards" label="Boards" extra="The first one you pick is the school's main board.">
              <Select mode="multiple" placeholder="CBSE, ICSE…" optionFilterProp="label" options={boards.map((b) => ({ value: b._id, label: b.name }))} />
            </Form.Item>
            <Form.Item name="subscriptionPlan" label="Plan" extra="Optional — you can start a plan later from the school.">
              <Select allowClear placeholder="No plan yet" options={offered.map((p) => ({ value: p._id, label: `${p.name} · ${rupees(p.price)} / ${p.durationInDays} days` }))} />
            </Form.Item>
            <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 12 }}>
              <Checkbox>Let the school sign in straight away</Checkbox>
            </Form.Item>
          </>
        )}

        <Form.Item label="Logo" extra="PNG or JPG, 50 KB at most." style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {logoPreview && <img src={logoPreview} alt="" width={48} height={48} style={{ borderRadius: 10, objectFit: "cover", border: "1px solid var(--border-muted)" }} />}
            <Upload accept="image/*" showUploadList={false} beforeUpload={() => false} onChange={pickLogo}>
              <Button icon={<UploadOutlined />}>{logoPreview ? "Change logo" : "Upload logo"}</Button>
            </Upload>
          </div>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

/* ─────────────────────────── delete ─────────────────────────── */
const DeleteSchool = ({ school, onClose, onDeleted, onSwitchOff }) => {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState(null);
  useEffect(() => { setTyped(""); setRefusal(null); }, [school]);
  const matches = school && typed.trim().toLowerCase() === school.name.trim().toLowerCase();

  const remove = async () => {
    setBusy(true);
    try {
      await apiClient.delete(`/school/delete/${school._id}`);
      message.success(`${school.name} deleted`);
      onDeleted();
    } catch (e) {
      setRefusal(errorText(e, "Could not delete the school"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(school)}
      onCancel={onClose}
      centered
      title={school && `Delete ${school.name}?`}
      okText="Delete school"
      okButtonProps={{ danger: true, disabled: !matches || Boolean(refusal), loading: busy }}
      onOk={remove}
    >
      {refusal ? (
        <Alert
          type="warning" showIcon message="This school was not deleted" description={refusal}
          action={school?.isActive && <Button size="small" onClick={() => onSwitchOff(school)}>Switch it off</Button>}
        />
      ) : (
        <>
          <p style={{ color: "var(--text-secondary)" }}>
            Only a school nobody has used yet can be deleted — one with users, students, classes or billing records is kept, and can be switched off instead.
          </p>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Type <strong>{school?.name}</strong> to confirm</div>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} onPressEnter={() => matches && remove()} autoFocus />
        </>
      )}
    </Modal>
  );
};

/* ────────────────────────────────── page ────────────────────────────────── */
const Schools = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { schools = [], loading, error } = useSelector((s) => s.school || {});
  const { plans = [] } = useSelector((s) => s.subscriptionPlans || {});
  const boards = useSelector((s) => s.boards?.boards || []);

  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  // Other pages link here as ?open=<schoolId> (open that school) or ?add=1 (start adding one).
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState(() => params.get("open"));
  const [formFor, setFormFor] = useState(() => (params.get("add") ? { school: null } : null));      // null | { school: null } (add) | { school } (edit)
  useEffect(() => {
    if (params.get("open") || params.get("add")) setParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  const reload = useCallback(() => dispatch(fetchSchools()), [dispatch]);
  useEffect(() => {
    reload();
    dispatch(fetchSubscriptionPlans());
    dispatch(getBoards());
  }, [dispatch, reload]);

  const rows = useMemo(() => (Array.isArray(schools) ? schools : []).map((s) => ({ ...s, sub: subscriptionState(s.subscription) })), [schools]);
  const counts = useMemo(() => ({
    all: rows.length,
    attention: rows.filter((s) => s.isActive && s.sub.attention).length,
    off: rows.filter((s) => !s.isActive).length,
  }), [rows]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((s) => (view === "attention" ? s.isActive && s.sub.attention : view === "off" ? !s.isActive : true))
      .filter((s) => !q || [s.name, s.address, s.email, s.phone].some((v) => String(v || "").toLowerCase().includes(q)));
    const endOf = (s) => (s.subscription?.endDate ? dayjs(s.subscription.endDate).valueOf() : Number.MAX_SAFE_INTEGER);
    return [...list].sort(sort === "newest"
      ? (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      : sort === "ending"
        ? (a, b) => endOf(a) - endOf(b)
        : (a, b) => a.name.localeCompare(b.name));
  }, [rows, view, search, sort]);

  const open = rows.find((s) => s._id === openId) || null;

  const setSignIn = (school, on) => {
    Modal.confirm({
      title: on ? `Switch ${school.name} on?` : `Switch ${school.name} off?`,
      content: on
        ? "Its staff, students and parents can sign in again."
        : "Nobody at the school can sign in until it is switched back on. Its records are kept.",
      okText: on ? "Switch on" : "Switch off",
      okButtonProps: on ? {} : { danger: true },
      centered: true,
      onOk: async () => {
        setToggling(school._id);
        try {
          await apiClient.put(`/school/${on ? "activate" : "deactivate"}/${school._id}`);
          message.success(`${school.name} switched ${on ? "on" : "off"}`);
          await reload();
        } catch (e) {
          message.error(errorText(e, "Could not change sign-in"));
        } finally {
          setToggling(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "School",
      key: "school",
      render: (_, s) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <SchoolMark school={s} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
              {[s.address, s.email].filter(Boolean).join(" · ") || "No contact details"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Boards",
      key: "boards",
      render: (_, s) => (s.boards?.length
        ? s.boards.map((b) => <Tag key={b._id}>{b.name}</Tag>)
        : <span style={{ color: "var(--text-muted)" }}>—</span>),
    },
    {
      title: "Subscription",
      key: "subscription",
      render: (_, s) => (
        <div>
          <Tag color={s.sub.color}>{s.sub.label}</Tag>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {s.subscriptionPlan?.name ? `${s.subscriptionPlan.name}${s.subscription?.endDate ? ` · until ${dayjs(s.subscription.endDate).format(DAY)}` : ""}` : "Pick a plan in the school"}
          </div>
        </div>
      ),
    },
    {
      title: "Sign-in",
      key: "signin",
      width: 110,
      render: (_, s) => (
        <span onClick={(e) => e.stopPropagation()} role="presentation">
          <Switch checked={Boolean(s.isActive)} loading={toggling === s._id} checkedChildren="On" unCheckedChildren="Off" onChange={(on) => setSignIn(s, on)} aria-label={`Sign-in for ${s.name}`} />
        </span>
      ),
    },
  ];

  const segment = (key, label) => ({ value: key, label: `${label} ${counts[key]}` });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Schools"
        subtitle="Every school on the platform — who can sign in, and whose subscription needs attention"
        icon={<ApartmentOutlined />}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setFormFor({ school: null })}>Add school</Button>}
      />

      <div className="section-panel">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <Segmented
            value={view}
            onChange={setView}
            options={[segment("all", "All"), segment("attention", "Needs attention"), segment("off", "Switched off")]}
          />
          <Input
            allowClear prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by name, city, email or phone"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ flex: "1 1 240px", maxWidth: 360 }}
          />
          <Select
            value={sort} onChange={setSort} style={{ width: 200 }} aria-label="Sort"
            options={[
              { value: "name", label: "Name A–Z" },
              { value: "ending", label: "Plan ends soonest" },
              { value: "newest", label: "Newest first" },
            ]}
          />
        </div>

        {view === "attention" && counts.attention > 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
            Schools that are on, with no plan, or a plan that has ended, is ending within {SOON_DAYS} days, or was suspended or cancelled.
          </div>
        )}

        {error && (
          <Alert type="error" showIcon style={{ marginBottom: 12 }} message={typeof error === "string" ? error : "Could not load the schools"}
            action={<Button size="small" onClick={reload}>Try again</Button>} />
        )}

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={shown}
          loading={loading}
          size="middle"
          scroll={{ x: 760 }}
          pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
          onRow={(s) => ({ onClick: () => setOpenId(s._id), style: { cursor: "pointer" } })}
          locale={{
            emptyText: loading ? " " : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={search || view !== "all"
                  ? (view === "attention" && !search ? "Nothing needs attention" : "No school matches")
                  : "No schools yet"}
              >
                {!search && view === "all" && <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormFor({ school: null })}>Add the first school</Button>}
              </Empty>
            ),
          }}
        />
      </div>

      {/* ── one school ── */}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        width={520}
        title={open && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SchoolMark school={open} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{open.name}</div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>
                {open.isActive ? "Can sign in" : "Switched off — nobody can sign in"} · added {dayjs(open.createdAt).format(DAY)}
              </div>
            </div>
          </div>
        )}
      >
        {open && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14 }}>
              <span style={{ flex: 1, color: "var(--text-secondary)" }}>Sign-in</span>
              <Switch checked={Boolean(open.isActive)} loading={toggling === open._id} checkedChildren="On" unCheckedChildren="Off" onChange={(on) => setSignIn(open, on)} />
            </div>

            <Section title="Details" extra={<Button size="small" icon={<EditOutlined />} onClick={() => setFormFor({ school: open })}>Edit</Button>}>
              <Fact label="Email">{open.email}</Fact>
              <Fact label="Phone">{open.phone}</Fact>
              <Fact label="Website">{open.website && <a href={open.website} target="_blank" rel="noreferrer">{open.website}</a>}</Fact>
              <Fact label="Address">{open.address}</Fact>
              <Fact label="Boards">
                {open.boards?.length ? open.boards.map((b) => <Tag key={b._id}>{b.name}</Tag>) : null}
              </Fact>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate("/dashboard/superadmin/academics/boards")}>Change boards</Button>
            </Section>

            <Section title="Subscription">
              <SubscriptionPanel school={open} plans={plans} onChanged={reload} />
            </Section>

            <Section title="Reports">
              <Button icon={<BarChartOutlined />} onClick={() => navigate(`/dashboard/superadmin/reports/schools?school=${open._id}`)}>
                Students, class by class
              </Button>
            </Section>

            <Section title="Delete">
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                For a school added by mistake. A school that has been used is switched off instead.
              </div>
              <Button danger icon={<DeleteOutlined />} onClick={() => setDeleting(open)}>Delete school</Button>
            </Section>
          </>
        )}
      </Drawer>

      <SchoolForm
        open={Boolean(formFor)}
        school={formFor?.school || null}
        boards={boards}
        plans={plans}
        onClose={() => setFormFor(null)}
        onSaved={async (id) => {
          setFormFor(null);
          await reload();
          if (id) setOpenId(id);
        }}
      />

      <DeleteSchool
        school={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={async () => { setDeleting(null); setOpenId(null); await reload(); }}
        onSwitchOff={(s) => { setDeleting(null); setSignIn(s, false); }}
      />
    </div>
  );
};

export default Schools;

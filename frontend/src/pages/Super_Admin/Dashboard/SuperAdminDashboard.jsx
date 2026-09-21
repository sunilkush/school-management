import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Empty, Skeleton, Table, Tag, Tooltip } from "antd";
import {
  AppstoreOutlined, ArrowRightOutlined, AuditOutlined, BankOutlined, BarChartOutlined, CheckCircleFilled,
  ClockCircleOutlined, CloseCircleOutlined, DashboardOutlined, ExclamationCircleOutlined, FileTextOutlined,
  PieChartOutlined, PlusOutlined, ReloadOutlined, RightOutlined, SettingOutlined, StopOutlined, TeamOutlined,
  WalletOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { avatarStyle, iconWell } from "../../../styles/pageStyles";

/**
 * Platform overview — the Super Admin's home: what needs doing first, then how the platform stands.
 *
 * The page it replaces looked busy but said little that was true: "Revenue" was the fees schools
 * collect from their own students, "Expiring soon" counted switched-off schools, plan counts only
 * knew plans named "Premium" or "Standard", every school's health was 100% or 0%, the "System
 * health" panel was fixed numbers, and the row menu's Renew and Suspend did nothing. Two of its
 * quick actions led to pages that do not exist.
 *
 * Everything shown now comes from GET /dashboard/platform, and everything that can be acted on
 * links to the page where it is done.
 */

const SCHOOLS = "/dashboard/superadmin/schools";
const REVENUE = "/dashboard/superadmin/revenue";
const money = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;
/** ₹950, ₹12K, ₹1.2L, ₹3.4Cr — written out, because browsers disagree on compact Indian notation ("12T" in some). */
const compactMoney = (n) => {
  const v = Math.round(Number(n || 0));
  const short = (x) => String(Number(x.toFixed(1)));
  if (v >= 1e7) return `₹${short(v / 1e7)}Cr`;
  if (v >= 1e5) return `₹${short(v / 1e5)}L`;
  if (v >= 1e3) return `₹${short(v / 1e3)}K`;
  return `₹${v}`;
};
const count = (n) => Number(n || 0).toLocaleString("en-IN");
const day = (d) => dayjs(d).format("D MMM YYYY");
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";

/* Plan states are statuses, so they wear status colours — always beside their written label. */
const PLAN = {
  active: { text: "Active", tag: "success", color: "var(--success)", means: "running normally" },
  trial: { text: "Trial", tag: "processing", color: "var(--primary)", means: "on a trial" },
  ending: { text: "Ending soon", tag: "orange", color: "var(--warning)", means: "end within 30 days" },
  expired: { text: "Expired", tag: "error", color: "var(--danger)", means: "locked out until renewed" },
  suspended: { text: "Suspended", tag: "warning", color: "var(--purple)", means: "locked out by you" },
  cancelled: { text: "Cancelled", tag: "default", color: "var(--text-muted)", means: "locked out by you" },
  none: { text: "No plan", tag: "warning", color: "var(--cyan)", means: "not billed yet" },
};
const PLAN_ORDER = ["active", "trial", "ending", "expired", "suspended", "cancelled", "none"];

const planTag = (plan) => {
  const label = plan.state === "ending"
    ? (plan.daysLeft <= 0 ? "Ends today" : `Ends in ${plural(plan.daysLeft, "day")}`)
    : PLAN[plan.state]?.text;
  return <Tag color={PLAN[plan.state]?.tag} style={{ marginInlineEnd: 0 }}>{label}</Tag>;
};

/* Hover and focus states cannot be written inline. */
const CSS = `
  .pov-lift { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
  .pov-lift:hover { transform: translateY(-2px); box-shadow: var(--shadow-strong); }
  .pov-lift:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .pov-tile .pov-go { opacity: 0; transform: translateX(-4px); transition: opacity .18s ease, transform .18s ease; }
  .pov-tile:hover .pov-go, .pov-tile:focus-visible .pov-go { opacity: 1; transform: none; }
  .pov-shortcut:hover { border-color: var(--primary) !important; }
  .pov-attn:hover { background: var(--surface-soft); }
  @media (max-width: 560px) {
    .pov-attn { flex-wrap: wrap; }
    .pov-attn .pov-attn-action { width: 100%; }
  }
`;

/* ─────────────────────────── pieces ─────────────────────────── */
const Tile = ({ label, value, note, icon, color, onClick, tone }) => {
  const Tag_ = onClick ? "button" : "div";
  return (
    <Tag_
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={onClick ? "pov-lift pov-tile" : undefined}
      className="section-panel" style={{ marginBottom: 0, padding: "18px 20px", textAlign: "left", width: "100%", cursor: onClick ? "pointer" : "default", font: "inherit", color: "inherit", borderTop: `3px solid ${color}`, display: "flex", flexDirection: "column", gap: 6 }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={iconWell(color, 34)}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
        {onClick && <ArrowRightOutlined className="pov-go" style={{ color: "var(--text-muted)", fontSize: 12 }} />}
      </span>
      <span style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>{value}</span>
      <span style={{ fontSize: 12, color: tone === "warn" ? "var(--danger)" : "var(--text-muted)", fontWeight: tone === "warn" ? 600 : 400 }}>{note}</span>
    </Tag_>
  );
};

const Panel = ({ icon, color = "var(--primary)", title, extra, children, style }) => (
  <div className="section-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      {icon && <span style={iconWell(color, 32)}>{icon}</span>}
      {/* The title keeps its line; badges and links wrap under it on a narrow screen. */}
      <div style={{ flex: "1 1 180px", minWidth: 0, fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{title}</div>
      {extra}
    </div>
    {children}
  </div>
);

const LinkButton = ({ children, onClick }) => (
  <Button type="link" size="small" onClick={onClick} style={{ paddingInline: 0, fontWeight: 600 }}>
    {children} <RightOutlined style={{ fontSize: 10 }} />
  </Button>
);

/** One thing to act on, worded as what is wrong and what it means. */
function describe(item) {
  switch (item.kind) {
    case "expired":
      return {
        icon: <CloseCircleOutlined />, color: "var(--danger)", urgent: true,
        title: `Plan expired ${item.daysAgo === 0 ? "today" : `${plural(item.daysAgo, "day")} ago`}`,
        detail: "Its users are locked out. The School Admin can still pay the renewal from Billing.",
        action: "Open school",
      };
    case "suspended":
    case "cancelled":
      return {
        icon: <StopOutlined />, color: "var(--purple)", urgent: true,
        title: `Subscription ${item.kind}`,
        detail: "Nobody at the school can sign in until it is reactivated.",
        action: "Open school",
      };
    case "overdue":
      return {
        icon: <FileTextOutlined />, color: "var(--danger)", urgent: true,
        title: `Invoice ${item.invoiceNumber} is ${plural(item.overdueDays, "day")} overdue`,
        detail: `${money(item.amount)} unpaid.`,
        action: "Open invoices",
      };
    case "ending":
      return {
        icon: <ClockCircleOutlined />, color: "var(--warning)",
        title: item.daysLeft <= 0 ? "Plan ends today" : `Plan ends in ${plural(item.daysLeft, "day")}`,
        detail: `On ${day(item.endDate)}. A renewal invoice goes out 7 days before.`,
        action: "Open school",
      };
    default:
      return {
        icon: <ExclamationCircleOutlined />, color: "var(--cyan)",
        title: "No plan",
        detail: "The school is not billed for anything yet.",
        action: "Open school",
      };
  }
}

/** A round top for the axis: 1, 2 or 5 times a power of ten. */
const niceCeiling = (value) => {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value);
  return step * power;
};

/** Plan payments by month: one series, so one colour and no legend; amounts labelled on the bars. */
const MonthlyColumns = ({ months }) => {
  const top = niceCeiling(Math.max(...months.map((m) => m.total)));
  const HEIGHT = 170;
  const lastIndex = months.length - 1;
  return (
    <div role="img" aria-label={months.map((m) => `${m.label}: ${money(m.total)}`).join(", ")} style={{ display: "flex", gap: 10 }}>
      {/* axis */}
      <div aria-hidden style={{ position: "relative", width: 40, height: HEIGHT, flexShrink: 0 }}>
        {[1, 0.5, 0].map((f) => (
          <span key={f} style={{ position: "absolute", right: 0, top: `${(1 - f) * 100}%`, transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>
            {compactMoney(top * f)}
          </span>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ position: "relative", height: HEIGHT }}>
          {[1, 0.5].map((f) => (
            <div key={f} aria-hidden style={{ position: "absolute", left: 0, right: 0, top: `${(1 - f) * 100}%`, borderTop: "1px dashed var(--border-muted)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTop: "1px solid var(--border)" }} aria-hidden />
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${months.length}, 1fr)`, alignItems: "end" }}>
            {months.map((m, i) => (
              <Tooltip key={m.label} title={`${m.label}: ${money(m.total)}`}>
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", cursor: "default" }}>
                  {m.total > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, whiteSpace: "nowrap" }}>
                      {compactMoney(m.total)}
                    </span>
                  )}
                  <div style={{
                    width: "min(40px, 60%)", height: `${(m.total / top) * 100}%`, minHeight: m.total ? 4 : 0,
                    background: "var(--primary)", borderRadius: "4px 4px 0 0", opacity: i === lastIndex ? 1 : 0.85,
                  }}
                  />
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${months.length}, 1fr)`, marginTop: 8 }}>
          {months.map((m, i) => (
            <div key={m.label} style={{ textAlign: "center", fontSize: 12, color: i === lastIndex ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === lastIndex ? 700 : 400 }}>
              {m.label.split(" ")[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** All schools in one bar, split by plan state — the list below it is the legend. */
const PlanSplit = ({ plans }) => {
  const total = PLAN_ORDER.reduce((sum, key) => sum + (plans[key] || 0), 0);
  if (!total) return null;
  return (
    <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 14, background: "var(--surface)" }}>
      {PLAN_ORDER.filter((key) => plans[key] > 0).map((key) => (
        <Tooltip key={key} title={`${PLAN[key].text}: ${plans[key]}`}>
          <span style={{ width: `${(plans[key] / total) * 100}%`, background: PLAN[key].color }} />
        </Tooltip>
      ))}
    </div>
  );
};

const SchoolMark = ({ name, logo, size = 36 }) => (logo ? (
  <img src={logo} alt="" width={size} height={size} style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
) : (
  <div style={{ ...avatarStyle(name, size), borderRadius: 10 }}>{initials(name)}</div>
));

/* ────────────────────────────────── page ────────────────────────────────── */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/dashboard/platform", fresh ? { noCache: true } : undefined);
      setData(res?.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load the overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openSchool = (id) => navigate(`${SCHOOLS}?open=${id}`);
  const attention = data?.attention || [];
  const shownAttention = showAll ? attention : attention.slice(0, 6);
  const urgentCount = attention.filter((a) => describe(a).urgent).length;
  const billing = data?.billing;

  const schoolRows = useMemo(
    () => [...(data?.schoolRows || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  const columns = [
    {
      title: "School",
      key: "school",
      render: (_, s) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <SchoolMark name={s.name} logo={s.logo} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>
              {s.address || "No address"}
            </div>
          </div>
        </div>
      ),
    },
    { title: "Students", key: "students", align: "right", render: (_, s) => <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{count(s.students)}</span> },
    { title: "Teachers", key: "teachers", align: "right", render: (_, s) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{count(s.teachers)}</span> },
    {
      title: "Plan",
      key: "plan",
      render: (_, s) => (
        <div>
          {planTag(s.plan)}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {s.plan.name ? `${s.plan.name}${s.plan.endDate ? ` · until ${day(s.plan.endDate)}` : ""}` : "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Sign-in",
      key: "signin",
      render: (_, s) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: s.isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.isActive ? "var(--success)" : "var(--text-muted)" }} />
          {s.isActive ? "On" : "Off"}
        </span>
      ),
    },
  ];

  const SHORTCUTS = [
    { label: "Add a school", icon: <PlusOutlined />, color: "var(--primary)", to: `${SCHOOLS}?add=1` },
    { label: "Plans", icon: <AppstoreOutlined />, color: "var(--accent)", to: "/dashboard/superadmin/subscriptions" },
    { label: "Invoices & payments", icon: <FileTextOutlined />, color: "var(--success)", to: REVENUE },
    { label: "School reports", icon: <BarChartOutlined />, color: "var(--purple)", to: "/dashboard/superadmin/reports/schools" },
    { label: "Global settings", icon: <SettingOutlined />, color: "var(--cyan)", to: "/dashboard/superadmin/settings/global" },
    { label: "Audit logs", icon: <AuditOutlined />, color: "var(--warning)", to: "/dashboard/superadmin/settings/audit" },
  ];

  const twoColumns = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 16, marginBottom: 16 };

  return (
    <div className="page-wrapper">
      <style>{CSS}</style>
      <PageHeader
        title="Platform overview"
        subtitle={data ? `What needs doing, and how the platform stands — updated ${dayjs(data.generatedAt).format("h:mm A")}` : "What needs doing, and how the platform stands"}
        icon={<DashboardOutlined />}
        extra={(
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button icon={<ReloadOutlined />} loading={loading && Boolean(data)} onClick={() => load(true)}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${SCHOOLS}?add=1`)}>Add school</Button>
          </div>
        )}
      />

      {error && (
        <Alert
          type="error" showIcon style={{ margin: "16px 0" }} message={error}
          action={<Button size="small" onClick={() => load(true)}>Try again</Button>}
        />
      )}

      {!data && loading ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16, marginBottom: 16 }}>
            {[0, 1, 2, 3].map((i) => <div key={i} className="section-panel is-last"><Skeleton active paragraph={{ rows: 1 }} /></div>)}
          </div>
          <div className="section-panel"><Skeleton active paragraph={{ rows: 6 }} /></div>
        </div>
      ) : data && (
        <div style={{ marginTop: 16 }}>
          {/* ── headline numbers ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16, marginBottom: 16 }}>
            <Tile
              label="Schools" value={count(data.schools.total)} icon={<BankOutlined />} color="var(--primary)"
              onClick={() => navigate(SCHOOLS)}
              note={`${data.schools.on} can sign in${data.schools.off ? ` · ${data.schools.off} switched off` : ""}`}
            />
            <Tile
              label="Students" value={count(data.students)} icon={<TeamOutlined />} color="var(--accent)"
              note={`active, with ${plural(data.teachers, "teacher")}`}
            />
            <Tile
              label="Collected this year" value={money(billing.collectedThisYear)} icon={<RupeeIcon />} color="var(--success)"
              onClick={() => navigate(REVENUE)}
              note={`${plural(billing.paymentsThisYear, "plan payment")} since ${day(billing.financialYearStart)}`}
            />
            <Tile
              label="Outstanding" value={money(billing.outstanding)} icon={<WalletOutlined />}
              color={billing.overdueInvoices ? "var(--danger)" : "var(--warning)"}
              onClick={() => navigate(REVENUE)}
              tone={billing.overdueInvoices ? "warn" : undefined}
              note={billing.openInvoices
                ? `${plural(billing.openInvoices, "unpaid invoice")}${billing.overdueInvoices ? ` · ${billing.overdueInvoices} overdue` : ""}`
                : "Nothing unpaid"}
            />
          </div>

          {/* ── needs attention ── */}
          <Panel
            style={{ marginBottom: 16 }}
            icon={attention.length ? <WarningOutlined /> : <CheckCircleFilled />}
            color={attention.length ? (urgentCount ? "var(--danger)" : "var(--warning)") : "var(--success)"}
            title="Needs your attention"
            extra={attention.length > 0 && (
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {urgentCount > 0 && <Tag color="error" style={{ marginInlineEnd: 0 }}>{urgentCount} urgent</Tag>}
                {attention.length - urgentCount > 0 && <Tag color="warning" style={{ marginInlineEnd: 0 }}>{attention.length - urgentCount} coming up</Tag>}
              </span>
            )}
          >
            {attention.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", padding: "14px 16px", borderRadius: 12, background: "var(--success-light)" }}>
                <CheckCircleFilled style={{ color: "var(--success)", fontSize: 18 }} />
                Nothing needs attention — every school that can sign in is on a running plan, and no invoice is overdue.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {shownAttention.map((item) => {
                  const d = describe(item);
                  return (
                    <div
                      key={`${item.kind}-${item.invoiceId || item.schoolId}`}
                      className="pov-attn"
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12,
                        border: "1px solid var(--border-muted)", borderLeft: `4px solid ${d.color}`, transition: "background .15s ease",
                      }}
                    >
                      <span style={{ ...iconWell(d.color, 34), borderRadius: "50%" }}>{d.icon}</span>
                      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                        <div style={{ color: "var(--text-primary)", lineHeight: 1.4 }}>
                          <strong>{item.schoolName}</strong> — {d.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{d.detail}</div>
                      </div>
                      <Button
                        className="pov-attn-action"
                        type={d.urgent ? "primary" : "default"}
                        onClick={() => (item.kind === "overdue" ? navigate(REVENUE) : openSchool(item.schoolId))}
                      >
                        {d.action}
                      </Button>
                    </div>
                  );
                })}
                {attention.length > 6 && (
                  <Button type="link" style={{ paddingInline: 0, alignSelf: "flex-start" }} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show fewer" : `Show all ${attention.length}`}
                  </Button>
                )}
              </div>
            )}
          </Panel>

          {/* ── money and plans ── */}
          <div style={twoColumns}>
            <Panel icon={<RupeeIcon />} color="var(--success)" title="Plan payments" extra={<LinkButton onClick={() => navigate(REVENUE)}>Invoices & payments</LinkButton>}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                Last 6 months · <strong style={{ color: "var(--text-primary)" }}>{money(billing.monthly.reduce((sum, m) => sum + m.total, 0))}</strong> in all
              </div>
              <MonthlyColumns months={billing.monthly} />
            </Panel>

            <Panel icon={<PieChartOutlined />} color="var(--purple)" title="Plans" extra={<LinkButton onClick={() => navigate(SCHOOLS)}>All schools</LinkButton>}>
              <PlanSplit plans={data.plans} />
              {PLAN_ORDER
                .filter((key) => data.plans[key] > 0 || ["active", "ending", "expired"].includes(key))
                .map((key) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border-muted)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: PLAN[key].color, flexShrink: 0 }} />
                    <span style={{ width: 96, fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{PLAN[key].text}</span>
                    <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>{PLAN[key].means}</span>
                    <strong style={{ fontSize: 16, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{data.plans[key]}</strong>
                  </div>
                ))}
            </Panel>
          </div>

          {/* ── schools ── */}
          <Panel
            style={{ marginBottom: 16 }}
            icon={<BankOutlined />}
            title={<span>Schools <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>{schoolRows.length}</span></span>}
            extra={<LinkButton onClick={() => navigate(SCHOOLS)}>Manage schools</LinkButton>}
          >
            <div className="pov-table data-table" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-muted)" }}>
              <Table
                rowKey="_id"
                size="middle"
                columns={columns}
                dataSource={schoolRows}
                pagination={{ pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
                scroll={{ x: 720 }}
                onRow={(s) => ({ onClick: () => openSchool(s._id), style: { cursor: "pointer" } })}
                locale={{
                  emptyText: (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No schools yet">
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${SCHOOLS}?add=1`)}>Add the first school</Button>
                    </Empty>
                  ),
                }}
              />
            </div>
          </Panel>

          {/* ── payments and shortcuts ── */}
          <div style={{ ...twoColumns, marginBottom: 0 }}>
            <Panel icon={<WalletOutlined />} color="var(--success)" title="Latest plan payments" extra={<LinkButton onClick={() => navigate("/dashboard/superadmin/payments")}>All payments</LinkButton>}>
              {data.recentPayments.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No plan payments yet" />
              ) : data.recentPayments.map((p, i) => (
                <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--border-muted)" : "none" }}>
                  <SchoolMark name={p.schoolName} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.schoolName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{day(p.paymentDate)}</div>
                  </div>
                  <Tag style={{ marginInlineEnd: 0 }}>{p.paymentMode}</Tag>
                  <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", minWidth: 80, textAlign: "right" }}>{money(p.amount)}</strong>
                </div>
              ))}
            </Panel>

            <Panel icon={<AppstoreOutlined />} color="var(--accent)" title="Shortcuts">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {SHORTCUTS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => navigate(s.to)}
                    className="pov-lift pov-shortcut"
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 12, cursor: "pointer",
                      border: "1px solid var(--border-muted)", background: "var(--surface)", color: "var(--text-primary)",
                      font: "inherit", fontWeight: 600, fontSize: 13, textAlign: "left",
                    }}
                  >
                    <span style={iconWell(s.color, 32)}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

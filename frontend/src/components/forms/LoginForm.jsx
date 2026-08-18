import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetState, verify2FALogin } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox, Modal } from "antd";
import {
  MailOutlined, LockOutlined, ArrowRightOutlined,
  SafetyCertificateOutlined, CheckCircleFilled,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import logo from "/logo.png";
import { School2, BookOpen, CalendarDays, Users, Award } from "lucide-react";

const roleRoutes = {
  "super admin":         "/dashboard/superadmin",
  "school admin":        "/dashboard/schooladmin",
  principal:             "/dashboard/principal",
  "vice principal":      "/dashboard/viceprincipal",
  "subject coordinator": "/dashboard/subjectcoordinator",
  student:               "/dashboard/student",
  parent:                "/dashboard/parent",
  teacher:               "/dashboard/teacher",
  accountant:            "/dashboard/accountant",
  staff:                 "/dashboard/staff",
  "support staff":       "/dashboard/staff",
  librarian:             "/dashboard/librarian",
  "hostel warden":       "/dashboard/hostelwarden",
  "transport manager":   "/dashboard/transportmanager",
  "exam coordinator":    "/dashboard/examcoordinator",
  receptionist:          "/dashboard/receptionist",
  "it support":          "/dashboard/itsupport",
  counselor:             "/dashboard/counselor",
  security:              "/dashboard/security",
  "sports teacher":      "/dashboard/sportsteacher",
  "lab technician":      "/dashboard/labtechnician",
  "medical officer":     "/dashboard/medicalofficer",
  "class teacher":       "/dashboard/classteacher",
};

const schema = z.object({
  email:    z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const FEATURES = [
  { Icon: BookOpen,    color: "#60A5FA", bg: "rgba(96,165,250,0.15)",  title: "Student Management",  desc: "Admissions, attendance, grades & progress" },
  { Icon: Award,       color: "#34D399", bg: "rgba(52,211,153,0.15)",  title: "Fee Collection",       desc: "Invoices, payments & financial reports" },
  { Icon: CalendarDays,color: "#A78BFA", bg: "rgba(167,139,250,0.15)", title: "Smart Timetables",     desc: "Auto-scheduling for classes and exams" },
  { Icon: Users,       color: "#FB923C", bg: "rgba(251,146,60,0.15)",  title: "Instant Notifications",desc: "SMS, email & in-app alerts for all roles" },
];

const STATS = [
  { v: "10K+",  l: "Students"  },
  { v: "500+",  l: "Educators" },
  { v: "99.9%", l: "Uptime"    },
  { v: "50+",   l: "Schools"   },
];

const LoginForm = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const emailRef  = useRef(null);
  const { loading, error, requiresTwoFactor, twoFactorUserId } = useSelector((s) => s.auth);

  const [mounted,     setMounted]     = useState(false);
  const [shake,       setShake]       = useState(false);
  const [subWarning,  setSubWarning]  = useState(null);
  const [pendingNav,  setPendingNav]  = useState(null);
  const [otpValue,    setOtpValue]    = useState("");
  const [otpError,    setOtpError]    = useState("");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!error) return;
    setShake(true);
    const t1 = setTimeout(() => setShake(false), 600);
    const t2 = setTimeout(() => dispatch(resetState()), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [error, dispatch]);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const clearError = () => { if (error) dispatch(resetState()); };

  const onSubmit = async (values) => {
    try {
      const res = await dispatch(loginUser(values)).unwrap();
      // If 2FA is required, show OTP input — navigation happens after OTP
      if (res?.requiresTwoFactor) return;
      const role = typeof res?.user?.role === "string"
        ? res.user.role.toLowerCase()
        : res?.user?.role?.name?.toLowerCase();
      const dest = roleRoutes[role] || "/dashboard";
      if (res?.subscriptionWarning) {
        setSubWarning(res.subscriptionWarning);
        setPendingNav(dest);
      } else {
        navigate(dest, { replace: true });
      }
    } catch { /* handled via Redux error state */ }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) { setOtpError("Enter the 6-digit OTP"); return; }
    try {
      const res = await dispatch(verify2FALogin({ userId: twoFactorUserId, otp: otpValue })).unwrap();
      // After 2FA, user data is fetched by the auth initialization
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setOtpError(err || "Invalid OTP");
      setOtpValue("");
    }
  };

  const showError = typeof error === "string"
    && !error.toLowerCase().includes("token")
    && !error.toLowerCase().includes("unauthorized");

  return (
    <div className="lf-root">
      <style>{CSS}</style>

      <div className="lf-layout">

        {/* ────── LEFT: branding panel ────── */}
        <aside className="lf-left" aria-hidden="true">
          <div className="lf-bg-dots" />
          <div className="lf-blob lf-b1" />
          <div className="lf-blob lf-b2" />
          <div className="lf-blob lf-b3" />

          <div className="lf-left-inner">
            {/* Brand mark */}
            <div className="lf-brand">
              <div className="lf-brand-logo-wrap">
                <img src={logo} alt="" className="lf-brand-logo" />
              </div>
            </div>

            {/* Hero */}
            <div className="lf-hero">
              <div className="lf-platform-badge">
                <School2 size={11} />
                All-in-One Platform
              </div>
              <h1 className="lf-headline">
                The smarter way to <span className="lf-hl-grad">run your school</span>
              </h1>
              <p className="lf-tagline">
                All roles, all modules — one unified platform built for modern schools.
              </p>
            </div>

            {/* Feature cards — 2×2 grid */}
            <div className="lf-feat-grid">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="lf-feat-card" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}>
                  <div className="lf-feat-ico" style={{ background: f.bg, color: f.color }}>
                    <f.Icon size={16} />
                  </div>
                  <div>
                      <div className="lf-feat-title">{f.title}</div>
                  <div className="lf-feat-desc">{f.desc}</div>
                  </div>
                
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="lf-stats">
              {STATS.map((s, i) => (
                <div key={s.l} className="lf-stat">
                  {i > 0 && <div className="lf-stat-sep" />}
                  <div className="lf-stat-v">{s.v}</div>
                  <div className="lf-stat-l">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="lf-quote">
              <div className="lf-quote-body">
                <span className="lf-quote-mark">"</span>
                <p className="lf-quote-text">
                  EduManage cut our admin time by 60%. Fee collection, attendance — everything just works.
                </p>
              </div>
              <div className="lf-quote-footer">
                <div className="lf-quote-avatar">P</div>
                <div className="lf-quote-meta">
                  <div className="lf-quote-author">Principal, Delhi Public School</div>
                  <div className="lf-quote-stars">★★★★★</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ────── RIGHT: form panel ────── */}
        <main className="lf-right">
          {/* Mobile logo — shown only on small screens */}
          <div className="lf-mob-brand">
            <img src={logo} alt="" className="lf-mob-logo" />
          </div>

          {/* Login card */}
          <div className={`lf-card${mounted ? " lf-card--in" : ""}${shake ? " lf-card--shake" : ""}`}>
            <div className="lf-stripe" aria-hidden="true" />

            <div className="lf-card-body">
              <div className="lf-card-head">
                <div className="lf-portal-badge">
                  <SafetyCertificateOutlined style={{ fontSize: 12 }} />
                  School Portal
                </div>
                <h2 className="lf-card-title">{requiresTwoFactor ? "Verify Identity" : "Sign In"}</h2>
                <p className="lf-card-sub">{requiresTwoFactor ? "Enter the 6-digit code sent to your email" : "Sign in to access your dashboard"}</p>
              </div>

              {/* ── 2FA OTP form ── */}
              {requiresTwoFactor && (
                <form onSubmit={handleOtpSubmit} style={{ padding: "8px 0" }}>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>A one-time code was sent to your registered email address.</p>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                      placeholder="000000"
                      autoFocus
                      style={{
                        width: "100%", textAlign: "center", fontSize: 28, letterSpacing: "0.4em",
                        padding: "12px", border: `1.5px solid ${otpError ? "var(--danger)" : "#d1d5db"}`,
                        borderRadius: 8, fontFamily: "monospace", outline: "none",
                      }}
                    />
                    {otpError && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{otpError}</p>}
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={otpValue.length !== 6}
                    size="large"
                    block
                    style={{ marginBottom: 8 }}
                  >
                    Verify & Sign In
                  </Button>
                  <Button
                    type="link"
                    block
                    onClick={() => { dispatch(resetState()); setOtpValue(""); setOtpError(""); }}
                  >
                    Back to login
                  </Button>
                </form>
              )}

              <Form layout="vertical" onFinish={handleSubmit(onSubmit)} noValidate style={{ display: requiresTwoFactor ? "none" : undefined }}>

                <Form.Item
                  label="Email address"
                  validateStatus={errors.email ? "error" : ""}
                  help={errors.email?.message}
                  className="lf-fi"
                  htmlFor="lf-email"
                >
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="lf-email"
                        ref={emailRef}
                        size="large"
                        prefix={<MailOutlined className="lf-pfx" />}
                        placeholder="you@school.edu"
                        autoComplete="email"
                        inputMode="email"
                        className={`lf-inp${errors.email ? " lf-inp--err" : ""}`}
                        onChange={(e) => { clearError(); field.onChange(e); }}
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  validateStatus={errors.password ? "error" : ""}
                  help={errors.password?.message}
                  className="lf-fi"
                  htmlFor="lf-pw"
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        id="lf-pw"
                        size="large"
                        prefix={<LockOutlined className="lf-pfx" />}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className={`lf-inp${errors.password ? " lf-inp--err" : ""}`}
                        onChange={(e) => { clearError(); field.onChange(e); }}
                      />
                    )}
                  />
                </Form.Item>

                <div className="lf-meta-row">
                  <Controller
                    name="remember"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        className="lf-chk"
                        onChange={(e) => { clearError(); field.onChange(e.target.checked); }}
                      >
                        Remember me
                      </Checkbox>
                    )}
                  />
                  <Link to="/forgot-password" className="lf-forgot">Forgot password?</Link>
                </div>

                {showError && (
                  <div className="lf-err" role="alert" aria-live="assertive">
                    <span style={{ fontSize: 15, flexShrink: 0 }}>⚠</span>
                    {error}
                  </div>
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  icon={!loading ? <ArrowRightOutlined /> : undefined}
                  iconPosition="end"
                  className="lf-btn"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </Form>

              <div className="lf-trust-row">
                {["SSL Encrypted", "Role-Based Access", "2FA Ready"].map((t) => (
                  <span key={t} className="lf-trust-badge">
                    <CheckCircleFilled style={{ fontSize: 10, color: "var(--success)" }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="lf-card-foot">
              <span className="lf-foot-dot" aria-hidden="true" />
              Secured with 256-bit encryption
              <span style={{ margin: "0 7px", opacity: 0.35 }}>·</span>
              © {new Date().getFullYear()} EduManage
            </div>
          </div>

          <p className="lf-help-text">
            Need help?{" "}
            <Link to="/support" className="lf-help-link">Contact support</Link>
          </p>
        </main>
      </div>

      {/* ── Subscription expiry warning modal ── */}
      <Modal
        open={!!subWarning}
        closable={false}
        maskClosable={false}
        footer={null}
        centered
        width={420}
        styles={{ body: { padding: 0 } }}
      >
        {subWarning && (
          <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: subWarning.daysLeft <= 7 ? "var(--danger-light)" : "var(--warning-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              border: `2px solid ${subWarning.daysLeft <= 7 ? "#FECACA" : "var(--warning-light)"}`,
            }}>
              <ExclamationCircleFilled style={{
                fontSize: 28,
                color: subWarning.daysLeft <= 7 ? "var(--danger)" : "var(--warning)",
              }} />
            </div>

            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
              Subscription Expiring Soon
            </div>

            <div style={{
              display: "inline-block",
              background: subWarning.daysLeft <= 7 ? "var(--danger-light)" : "var(--warning-light)",
              border: `1px solid ${subWarning.daysLeft <= 7 ? "#FECACA" : "var(--warning-light)"}`,
              borderRadius: 99,
              padding: "4px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: subWarning.daysLeft <= 7 ? "var(--danger-hover)" : "var(--warning-hover)",
              marginBottom: 14,
            }}>
              {subWarning.daysLeft} {subWarning.daysLeft === 1 ? "day" : "days"} remaining
            </div>

            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, margin: "0 0 20px" }}>
              Your school's subscription will expire on{" "}
              <strong style={{ color: "var(--text)" }}>
                {new Date(subWarning.endDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </strong>
              . Please contact your administrator to renew before the deadline to avoid service interruption.
            </p>

            <Button
              type="primary"
              block
              size="large"
              style={{
                borderRadius: 10, height: 44, fontWeight: 700,
                background: "linear-gradient(135deg, var(--primary) 0%, var(--info) 100%)",
                border: "none",
                boxShadow: "var(--shadow-primary)",
              }}
              onClick={() => {
                setSubWarning(null);
                navigate(pendingNav, { replace: true });
              }}
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LoginForm;

/* ─────────────────────────────────────────────────────────────
   Scoped CSS
   Uses the same CSS variables defined in index.css so light/
   dark mode switch happens automatically without any extra logic.
───────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  /* ── Root / layout ── */
  .lf-root {
    min-height: 100vh;
    background: var(--surface-page);
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .lf-layout { display: flex; min-height: 100vh; }

  /* ── Left panel ── */
  .lf-left {
    display: none;
    flex: 0 0 52%;
    position: relative;
    background: linear-gradient(160deg, #0D1526 0%, #111827 45%, #0F1F33 100%);
    overflow: hidden;
    padding: 48px 52px;
    flex-direction: column;
    justify-content: center;
  }
  @media (min-width: 1024px) { .lf-left { display: flex; } }

  /* subtle dot grid */
  .lf-bg-dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
    background-size: 26px 26px;
    pointer-events: none;
  }

  /* ambient blobs */
  .lf-blob {
    position: absolute; border-radius: 50%;
    filter: blur(120px); pointer-events: none;
    animation: lfBlobDrift 22s ease-in-out infinite;
  }
  .lf-b1 { width: 480px; height: 480px; background: rgba(37,99,235,0.18); top: -160px; left: -100px; }
  .lf-b2 { width: 320px; height: 320px; background: rgba(20,184,166,0.14); bottom: -80px; right: -40px; animation-delay: 9s; }
  .lf-b3 { width: 240px; height: 240px; background: rgba(139,92,246,0.10); top: 42%; left: 52%; animation-delay: 16s; }
  @keyframes lfBlobDrift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(18px,-22px) scale(1.04); }
    66%     { transform: translate(-14px,16px) scale(0.97); }
  }

  .lf-left-inner { position: relative; z-index: 1; max-width: 480px; display: flex; flex-direction: column; gap: 22px; }

  /* brand */
  .lf-brand { display: flex; align-items: center; }
  .lf-brand-logo-wrap {
    width: 110px; height: 110px; border-radius: 20px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
  }
  .lf-brand-logo { height: 100px; width: 100px; object-fit: contain; filter: brightness(0) invert(1); }

  /* platform badge above headline */
  .lf-platform-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(99,102,241,0.14); border: 1px solid rgba(99,102,241,0.3);
    border-radius: 99px; padding: 4px 12px;
    font-size: 11px; font-weight: 600; color: #A5B4FC; letter-spacing: 0.04em;
    margin-bottom: 12px;
  }

  /* headline */
  .lf-headline {
    font-size: 36px; font-weight: 900;
    color: #F1F5F9; line-height: 1.18; margin: 0 0 10px; letter-spacing: -0.8px;
  }
  .lf-hl-grad {
    background: linear-gradient(100deg, #60A5FA 0%, #34D399 55%, var(--accent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .lf-tagline { color: #94A3B8; font-size: 13.5px; line-height: 1.7; margin: 0; }

  /* feature 2×2 grid */
  .lf-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .lf-feat-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 14px;
    animation: lfFeatIn 0.45s ease both;
    transition: background 0.2s, border-color 0.2s;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .lf-feat-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
  @keyframes lfFeatIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lf-feat-ico {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 9px; flex-shrink: 0;
  }
  .lf-feat-title { font-size: 12.5px; font-weight: 700; color: #E2E8F0; margin-bottom: 3px; }
  .lf-feat-desc  { font-size: 11px; color: var(--text-secondary); line-height: 1.5; }

  /* stats bar */
  .lf-stats {
    display: flex;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; overflow: hidden;
  }
  .lf-stat { flex: 1; padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 3px; position: relative; }
  .lf-stat-sep { position: absolute; left: 0; top: 20%; height: 60%; width: 1px; background: rgba(255,255,255,0.08); }
  .lf-stat-v { font-size: 18px; font-weight: 800; color: #F8FAFC; line-height: 1; }
  .lf-stat-l { font-size: 9px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; }

  /* testimonial */
  .lf-quote {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 16px 18px;
  }
  .lf-quote-body { position: relative; margin-bottom: 12px; }
  .lf-quote-mark {
    font-size: 52px; line-height: 1;
    color: rgba(99,102,241,0.45); font-family: Georgia, serif;
    position: absolute; top: -12px; left: -2px; pointer-events: none;
  }
  .lf-quote-text { color: #CBD5E1; font-size: 13px; line-height: 1.65; margin: 0; padding-left: 22px; font-style: italic; }
  .lf-quote-footer { display: flex; align-items: center; gap: 10px; }
  .lf-quote-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--purple), var(--accent));
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .lf-quote-meta { flex: 1; }
  .lf-quote-author { font-size: 12px; font-weight: 600; color: #94A3B8; }
  .lf-quote-stars  { font-size: 11px; color: var(--warning); letter-spacing: 1px; margin-top: 2px; }

  /* ── Right panel ── */
  .lf-right {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 20px;
    background: var(--surface-page);
    min-height: 100vh;
  }

  /* mobile brand */
  .lf-mob-brand { display: flex; justify-content: center; align-items: center; margin-bottom: 28px; }
  @media (min-width: 1024px) { .lf-mob-brand { display: none; } }
  .lf-mob-logo { height: 100px; border-radius: 8px; filter: none; }
  [data-theme="dark"] .lf-mob-logo { filter: brightness(0) invert(1); }

  /* ── Card ── */
  .lf-card {
    width: 100%; max-width: 430px;
    background: var(--surface);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-strong);
    overflow: hidden;
    opacity: 0;
    transform: translateY(18px) scale(0.985);
    transition: opacity 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.22,1,0.36,1);
  }
  .lf-card--in    { opacity: 1; transform: translateY(0) scale(1); }
  .lf-card--shake { animation: lfShake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both; }
  @keyframes lfShake {
    10%,90% { transform: translateX(-3px); }
    20%,80% { transform: translateX(5px); }
    30%,50%,70% { transform: translateX(-6px); }
    40%,60%     { transform: translateX(6px); }
    100%        { transform: translateX(0); }
  }

  /* top accent stripe — matches primary + accent colours */
  .lf-stripe {
    height: 4px;
    background: linear-gradient(90deg, var(--primary) 0%, #60A5FA 55%, var(--accent) 100%);
  }

  /* ── Card body ── */
  .lf-card-body { padding: 30px 34px 20px; }

  /* portal badge */
  .lf-portal-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--primary-light);
    border: 1px solid rgba(37,99,235,0.2);
    border-radius: 99px; padding: 4px 12px;
    font-size: 12px; font-weight: 700;
    color: var(--primary); letter-spacing: 0.03em;
    margin-bottom: 16px;
  }

  .lf-card-head  { margin-bottom: 26px; }
  .lf-card-title { font-size: 24px; font-weight: 900; color: var(--text-primary); margin: 0 0 5px; letter-spacing: -0.5px; }
  .lf-card-sub   { color: var(--text-muted); font-size: 14px; margin: 0; }

  /* ── Form ── */
  .lf-fi.ant-form-item { margin-bottom: 18px; }
  .lf-fi .ant-form-item-label > label {
    font-size: 13px !important; font-weight: 600 !important;
    color: var(--text-primary) !important; height: auto !important;
  }
  .lf-fi .ant-form-item-explain-error {
    font-size: 12px !important; color: var(--danger) !important; margin-top: 4px !important;
  }

  /* inputs */
  .lf-inp.ant-input-affix-wrapper,
  .lf-inp.ant-input {
    background: var(--surface-soft) !important;
    border: 1.5px solid var(--border) !important;
    border-radius: var(--radius-md) !important;
    color: var(--text-primary) !important;
    font-size: 14px !important;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s !important;
  }
  .lf-inp.ant-input-affix-wrapper:hover,
  .lf-inp.ant-input:hover {
    border-color: var(--primary) !important;
    background: var(--surface) !important;
  }
  .lf-inp.ant-input-affix-wrapper-focused,
  .lf-inp.ant-input-affix-wrapper:focus-within,
  .lf-inp.ant-input:focus {
    border-color: var(--primary) !important;
    background: var(--surface) !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
    outline: none !important;
  }
  .lf-inp--err.ant-input-affix-wrapper,
  .lf-inp--err.ant-input {
    border-color: var(--danger) !important;
    background: var(--danger-light) !important;
  }
  .lf-inp--err.ant-input-affix-wrapper:focus-within {
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
  }
  .lf-inp .ant-input { background: transparent !important; color: var(--text-primary) !important; font-size: 14px !important; }
  .lf-inp .ant-input::placeholder { color: var(--text-muted) !important; }
  .lf-pfx { color: var(--primary) !important; font-size: 15px !important; opacity: 0.75; margin-right: 3px; }
  .lf-inp .ant-input-password-icon.anticon { color: var(--text-muted) !important; font-size: 15px; }
  .lf-inp .ant-input-password-icon.anticon:hover { color: var(--primary) !important; }

  /* remember / forgot */
  .lf-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .lf-chk.ant-checkbox-wrapper { color: var(--text-secondary) !important; font-size: 13.5px !important; user-select: none; }
  .lf-chk .ant-checkbox-inner  { border-color: var(--border) !important; border-radius: 5px !important; }
  .lf-chk .ant-checkbox-checked .ant-checkbox-inner { background: var(--primary) !important; border-color: var(--primary) !important; }
  .lf-chk .ant-checkbox-checked::after { border-color: var(--primary) !important; }
  .lf-forgot {
    font-size: 13.5px !important; font-weight: 600 !important;
    color: var(--primary) !important; text-decoration: none !important;
    transition: color 0.15s !important;
  }
  .lf-forgot:hover { color: var(--primary-hover) !important; text-decoration: underline !important; }

  /* error banner */
  .lf-err {
    display: flex; align-items: center; gap: 9px;
    background: var(--danger-light);
    border: 1px solid rgba(239,68,68,0.25);
    border-left: 3px solid var(--danger);
    border-radius: var(--radius-sm);
    padding: 11px 14px;
    color: var(--danger); font-size: 13.5px; font-weight: 500;
    margin-bottom: 16px;
    animation: lfErrSlide 0.28s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes lfErrSlide {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* submit */
  .lf-btn.ant-btn-primary {
    height: 48px !important; border-radius: var(--radius-md) !important;
    font-weight: 700 !important; font-size: 15px !important;
    border: none !important; letter-spacing: 0.1px !important;
    background: linear-gradient(135deg, var(--primary) 0%, var(--info) 100%) !important;
    box-shadow: var(--shadow-primary) !important;
    transition: transform 0.18s ease, box-shadow 0.18s ease !important;
  }
  .lf-btn.ant-btn-primary:not(:disabled):hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 24px rgba(37,99,235,0.40) !important;
    background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary) 100%) !important;
  }
  .lf-btn.ant-btn-primary:not(:disabled):active {
    transform: translateY(0) scale(0.98) !important;
    box-shadow: var(--shadow-primary) !important;
  }
  .lf-btn.ant-btn-primary:focus-visible {
    outline: 3px solid rgba(37,99,235,0.4) !important; outline-offset: 2px !important;
  }

  /* trust badges */
  .lf-trust-row {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; margin-top: 18px; flex-wrap: wrap;
  }
  .lf-trust-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; color: var(--text-secondary);
    background: var(--surface-soft); border: 1px solid var(--border);
    border-radius: 99px; padding: 3px 10px;
  }

  /* card footer */
  .lf-card-foot {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 12px 34px 15px;
    border-top: 1px solid var(--border-muted);
    color: var(--text-muted); font-size: 11.5px;
  }
  .lf-foot-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
    animation: lfDotPulse 3s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes lfDotPulse {
    0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
    50%     { box-shadow: 0 0 0 6px rgba(34,197,94,0.05); }
  }

  /* help */
  .lf-help-text { margin-top: 18px; font-size: 13px; color: var(--text-muted); }
  .lf-help-link { color: var(--primary) !important; font-weight: 600; text-decoration: none !important; }
  .lf-help-link:hover { text-decoration: underline !important; }

  /* ── Mobile adjustments ── */
  @media (max-width: 480px) {
    .lf-card { border-radius: var(--radius-lg); }
    .lf-card-body { padding: 24px 20px 16px; }
    .lf-card-foot { padding: 11px 20px 14px; }
    .lf-card-title { font-size: 21px; }
    .lf-trust-badge { font-size: 10.5px; padding: 3px 8px; }
  }
`;

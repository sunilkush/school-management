import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { currentUser, leaveTwoFactor, loginUser, resetState, verify2FALogin } from "../../features/authSlice";
import { BILLING_PAGE, SIGNED_OUT_REASON_KEY } from "../../api/httpClient";
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
  // Why the last session was ended (school switched off, subscription suspended…), shown once.
  const [signedOutReason] = useState(() => {
    try {
      const reason = window.sessionStorage.getItem(SIGNED_OUT_REASON_KEY);
      window.sessionStorage.removeItem(SIGNED_OUT_REASON_KEY);
      return reason;
    } catch {
      return null;
    }
  });

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
      // An expired plan's School Admin is let in to the billing page only.
      if (res?.billingOnly) { navigate(BILLING_PAGE, { replace: true }); return; }
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
    let res;
    try {
      res = await dispatch(verify2FALogin({ userId: twoFactorUserId, otp: otpValue })).unwrap();
    } catch (err) {
      setOtpError(err || "Invalid OTP");
      setOtpValue("");
      return;
    }
    // The code step returns tokens but no user, and nothing loaded one: every protected page saw
    // "no user" and sent the person back here. Load them, then go to their own dashboard.
    try {
      const me = await dispatch(currentUser()).unwrap();
      const role = String(typeof me?.role === "string" ? me.role : me?.role?.name || "").toLowerCase();
      navigate(res?.billingOnly ? BILLING_PAGE : roleRoutes[role] || "/dashboard", { replace: true });
    } catch {
      window.location.assign(res?.billingOnly ? BILLING_PAGE : "/dashboard");
    }
  };

  const showError = typeof error === "string"
    && !error.toLowerCase().includes("token")
    && !error.toLowerCase().includes("unauthorized");

  return (
    <div className="lf-root">
      
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
                        padding: "12px", border: `1.5px solid ${otpError ? "var(--danger)" : "var(--border)"}`,
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
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: "4px 0 0" }}>
                    No code? It can take a minute. Otherwise go back and sign in again for a new one.
                  </p>
                  <Button
                    type="link"
                    block
                    onClick={() => { dispatch(leaveTwoFactor()); setOtpValue(""); setOtpError(""); }}
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

                {signedOutReason && !showError && (
                  <div className="lf-err" role="alert" aria-live="assertive">
                    <span style={{ fontSize: 15, flexShrink: 0 }}>⚠</span>
                    You were signed out. {signedOutReason}
                  </div>
                )}

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
              border: `2px solid ${subWarning.daysLeft <= 7 ? "var(--danger-light)" : "var(--warning-light)"}`,
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
              border: `1px solid ${subWarning.daysLeft <= 7 ? "var(--danger-light)" : "var(--warning-light)"}`,
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
   Uses the same CSS variables defined in styles/main.scss so light/
   dark mode switch happens automatically without any extra logic.
───────────────────────────────────────────────────────────── */

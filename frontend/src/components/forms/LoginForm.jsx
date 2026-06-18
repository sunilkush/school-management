import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetState } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox } from "antd";
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import logo from "/logo.png";

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
};

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const features = [
  "Multi-role access — Students, Teachers, Admin & more",
  "Real-time analytics, fee tracking & smart reports",
  "Enterprise-grade security with 99.9% uptime",
];

const stats = [
  { value: "10K+", label: "Students" },
  { value: "500+", label: "Educators" },
  { value: "99.9%", label: "Uptime" },
];

const LoginForm = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values) => {
    try {
      const res  = await dispatch(loginUser(values)).unwrap();
      const role = typeof res?.user?.role === "string"
        ? res.user.role.toLowerCase()
        : res?.user?.role?.name?.toLowerCase();
      navigate(roleRoutes[role] || "/dashboard", { replace: true });
    } catch { /* handled via Redux */ }
  };

  const clearError = () => { if (error) dispatch(resetState()); };

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => dispatch(resetState()), 4000);
    return () => clearTimeout(t);
  }, [error, dispatch]);

  const showError =
    typeof error === "string" &&
    !error.toLowerCase().includes("token") &&
    !error.toLowerCase().includes("unauthorized");

  return (
    <div className="lp-root">
      {/* ── Animated background ── */}
      <div className="lp-bg">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-grid" />
      </div>

      <div className="lp-layout">

        {/* ════════════════ LEFT BRANDING PANEL ════════════════ */}
        <aside className="lp-left">
          <div className="lp-left-inner">

            <div className="lp-brand-logo-wrap">
              <img src={logo} alt="Logo" className="lp-brand-logo" />
            </div>

            <h1 className="lp-headline">
              Smart School.<br />
              <span className="lp-headline-grad">Smarter Management.</span>
            </h1>
            <p className="lp-tagline">
              The all-in-one platform trusted by thousands of educators,
              administrators, and students every day.
            </p>

            <ul className="lp-features">
              {features.map((f, i) => (
                <li key={i} className="lp-feature" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
                  <CheckCircleFilled className="lp-check-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="lp-stats">
              {stats.map((s, i) => (
                <div key={s.label} className="lp-stat" style={{ animationDelay: `${0.5 + i * 0.08}s` }}>
                  <span className="lp-stat-val">{s.value}</span>
                  <span className="lp-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div className="lp-trust">
              <span className="lp-trust-dot" />
              <span>Secure · Reliable · Always-on</span>
            </div>
          </div>
        </aside>

        {/* ════════════════ RIGHT FORM PANEL ════════════════ */}
        <main className="lp-right">

          {/* Mobile-only logo */}
          <div className="lp-mob-logo">
            <img src={logo} alt="Logo" className="lp-brand-logo lp-brand-logo-mob" />
          </div>

          {/* Card */}
          <div className={`lp-card${visible ? " lp-card--in" : ""}`}>

            {/* Rainbow top bar */}
            <div className="lp-card-bar" />

            <div className="lp-card-body">
              <div className="lp-card-head">
                <h2 className="lp-card-title">Welcome back</h2>
                <p className="lp-card-sub">Sign in to your school portal</p>
              </div>

              <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>

                {/* Email */}
                <Form.Item
                  label="Email address"
                  validateStatus={errors.email ? "error" : ""}
                  help={errors.email?.message}
                  className="lp-fi"
                >
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        size="large"
                        prefix={<MailOutlined className="lp-pfx" />}
                        placeholder="you@school.com"
                        autoComplete="email"
                        className="lp-inp"
                        onChange={(e) => { clearError(); field.onChange(e); }}
                      />
                    )}
                  />
                </Form.Item>

                {/* Password */}
                <Form.Item
                  label="Password"
                  validateStatus={errors.password ? "error" : ""}
                  help={errors.password?.message}
                  className="lp-fi"
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        size="large"
                        prefix={<LockOutlined className="lp-pfx" />}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="lp-inp"
                        onChange={(e) => { clearError(); field.onChange(e); }}
                      />
                    )}
                  />
                </Form.Item>

                {/* Remember + Forgot */}
                <div className="lp-row">
                  <Controller
                    name="remember"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        className="lp-chk"
                        onChange={(e) => { clearError(); field.onChange(e.target.checked); }}
                      >
                        Remember me
                      </Checkbox>
                    )}
                  />
                  <Link to="/forgot-password" className="lp-forgot">
                    Forgot password?
                  </Link>
                </div>

                {/* Error */}
                {showError && (
                  <div className="lp-err">{error}</div>
                )}

                {/* Submit */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  icon={!loading ? <ArrowRightOutlined /> : undefined}
                  iconPosition="end"
                  className="lp-btn"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </Form>
            </div>

            <p className="lp-footer">
              © {new Date().getFullYear()} School Management System. All rights reserved.
            </p>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      <style>{`
        /* ── Root ── */
        .lp-root {
          min-height: 100vh;
          background: #070714;
          overflow: hidden;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ── Animated BG ── */
        .lp-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

        .lp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,.06) 1px, transparent 1px);
          background-size: 44px 44px;
        }

        .lp-orb {
          position: absolute; border-radius: 50%; filter: blur(90px);
          animation: orbDrift 12s ease-in-out infinite;
        }
        .lp-orb-1 {
          width: 640px; height: 640px;
          background: radial-gradient(circle, rgba(109,40,217,.45), transparent 68%);
          top: -200px; left: -180px; animation-delay: 0s;
        }
        .lp-orb-2 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(6,182,212,.28), transparent 68%);
          bottom: -160px; left: 32%; animation-delay: 4s;
        }
        .lp-orb-3 {
          width: 440px; height: 440px;
          background: radial-gradient(circle, rgba(236,72,153,.22), transparent 68%);
          top: 25%; right: -130px; animation-delay: 7.5s;
        }
        @keyframes orbDrift {
          0%,100% { transform: translate(0,0); }
          25%  { transform: translate(24px,-32px); }
          50%  { transform: translate(-18px, 22px); }
          75%  { transform: translate(28px, 10px); }
        }

        /* ── Layout ── */
        .lp-layout {
          display: flex; min-height: 100vh;
          width: 100%; position: relative; z-index: 1;
        }

        /* ── Left panel ── */
        .lp-left {
          flex: 0 0 52%; display: none;
          padding: 64px 56px; flex-direction: column;
          justify-content: center; position: relative;
        }
        .lp-left::after {
          content: ''; position: absolute; right: 0; top: 8%; height: 84%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,.09) 25%, rgba(255,255,255,.09) 75%, transparent);
        }
        @media (min-width: 1024px) { .lp-left { display: flex; } }

        .lp-left-inner { max-width: 460px; }

        .lp-brand-logo-wrap {
          margin-bottom: 44px;
          animation: slideRight .6s .05s ease both;
        }
        .lp-brand-logo { height: 54px; filter: brightness(0) invert(1); }

        .lp-headline {
          font-size: 42px; font-weight: 900; color: #fff;
          line-height: 1.18; margin: 0 0 14px;
          animation: slideRight .6s .12s ease both;
        }
        .lp-headline-grad {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 55%, #f472b6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-tagline {
          color: rgba(255,255,255,.52); font-size: 14.5px; line-height: 1.72;
          margin: 0 0 38px;
          animation: slideRight .6s .18s ease both;
        }

        /* Features */
        .lp-features { list-style: none; padding: 0; margin: 0 0 40px; display: flex; flex-direction: column; gap: 14px; }
        .lp-feature {
          display: flex; align-items: center; gap: 12px;
          color: rgba(255,255,255,.7); font-size: 13.5px; line-height: 1.5;
          animation: slideRight .6s ease both; opacity: 0;
        }
        .lp-check-icon { color: #a78bfa; font-size: 17px; flex-shrink: 0; }

        /* Stats */
        .lp-stats {
          display: flex; gap: 0; margin-bottom: 28px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 14px; overflow: hidden;
          animation: slideRight .6s ease both; opacity: 0;
        }
        .lp-stat {
          flex: 1; padding: 18px 22px;
          display: flex; flex-direction: column; gap: 4px;
          position: relative;
          animation: fadeUp .5s ease both; opacity: 0;
        }
        .lp-stat + .lp-stat::before {
          content: ''; position: absolute; left: 0; top: 18%; height: 64%;
          width: 1px; background: rgba(255,255,255,.09);
        }
        .lp-stat-val { color: #fff; font-size: 22px; font-weight: 800; line-height: 1; }
        .lp-stat-lbl {
          color: rgba(255,255,255,.42); font-size: 11px;
          text-transform: uppercase; letter-spacing: .9px; font-weight: 500;
        }

        /* Trust badge */
        .lp-trust {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 99px; padding: 7px 15px;
          color: rgba(255,255,255,.65); font-size: 12px; font-weight: 600;
          animation: slideRight .6s .6s ease both; opacity: 0;
        }
        .lp-trust-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,.3);
          flex-shrink: 0;
          animation: pulse 2.5s ease infinite;
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(74,222,128,.3); }
          50% { box-shadow: 0 0 0 5px rgba(74,222,128,.12); }
        }

        /* ── Right panel ── */
        .lp-right {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 20px;
        }

        .lp-mob-logo {
          display: flex; justify-content: center; margin-bottom: 24px;
        }
        .lp-brand-logo-mob { height: 50px; }
        @media (min-width: 1024px) { .lp-mob-logo { display: none; } }

        /* ── Card ── */
        .lp-card {
          width: 100%; max-width: 430px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 22px; overflow: hidden;
          backdrop-filter: blur(28px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,.04),
            0 28px 56px rgba(0,0,0,.55),
            0 0 80px rgba(99,102,241,.12);
          opacity: 0; transform: translateY(18px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .lp-card--in { opacity: 1; transform: translateY(0); }

        /* Animated rainbow top bar */
        .lp-card-bar {
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #06b6d4, #6366f1);
          background-size: 300% 100%;
          animation: barShimmer 4s linear infinite;
        }
        @keyframes barShimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        .lp-card-body { padding: 32px 36px 8px; }

        .lp-card-head { margin-bottom: 28px; }
        .lp-card-title {
          font-size: 24px; font-weight: 800; color: #fff;
          margin: 0 0 5px; line-height: 1.2;
        }
        .lp-card-sub { color: rgba(255,255,255,.42); font-size: 13px; margin: 0; }

        /* Form item labels */
        .lp-fi.ant-form-item { margin-bottom: 18px; }
        .lp-fi .ant-form-item-label > label {
          color: rgba(255,255,255,.68) !important;
          font-size: 12.5px !important; font-weight: 600 !important;
          height: auto !important;
        }
        .lp-fi .ant-form-item-explain-error {
          color: #f87171 !important; font-size: 12px !important; margin-top: 4px !important;
        }

        /* Inputs */
        .lp-inp.ant-input-affix-wrapper,
        .lp-inp.ant-input {
          background: rgba(255,255,255,.07) !important;
          border: 1.5px solid rgba(255,255,255,.12) !important;
          border-radius: 11px !important; color: #fff !important;
          transition: border-color .22s, box-shadow .22s, background .22s !important;
        }
        .lp-inp.ant-input-affix-wrapper:hover,
        .lp-inp.ant-input:hover {
          border-color: rgba(129,140,248,.55) !important;
          background: rgba(255,255,255,.09) !important;
        }
        .lp-inp.ant-input-affix-wrapper-focused,
        .lp-inp.ant-input-affix-wrapper:focus-within,
        .lp-inp.ant-input:focus {
          border-color: #818cf8 !important;
          background: rgba(129,140,248,.09) !important;
          box-shadow: 0 0 0 3px rgba(129,140,248,.18) !important;
        }
        .lp-inp .ant-input {
          background: transparent !important; color: #fff !important;
        }
        .lp-inp .ant-input::placeholder { color: rgba(255,255,255,.22) !important; }
        .lp-pfx { color: rgba(255,255,255,.35) !important; margin-right: 6px; }
        .lp-inp .ant-input-password-icon.anticon { color: rgba(255,255,255,.35) !important; }
        .lp-inp .ant-input-password-icon.anticon:hover { color: rgba(255,255,255,.65) !important; }

        /* Remember / Forgot row */
        .lp-row {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 22px;
        }
        .lp-chk.ant-checkbox-wrapper {
          color: rgba(255,255,255,.52) !important; font-size: 13px !important;
        }
        .lp-chk .ant-checkbox-inner {
          background: rgba(255,255,255,.08) !important;
          border-color: rgba(255,255,255,.22) !important;
          border-radius: 5px !important;
        }
        .lp-chk .ant-checkbox-checked .ant-checkbox-inner {
          background: #6366f1 !important; border-color: #6366f1 !important;
        }
        .lp-forgot {
          font-size: 13px; color: #818cf8 !important; font-weight: 600;
          text-decoration: none; transition: color .2s;
        }
        .lp-forgot:hover { color: #a5b4fc !important; text-decoration: underline; }

        /* Error banner */
        .lp-err {
          background: rgba(239,68,68,.1);
          border: 1px solid rgba(239,68,68,.28);
          border-radius: 10px; padding: 10px 14px;
          color: #fca5a5; font-size: 13px; margin-bottom: 18px;
          animation: fadeUp .3s ease;
        }

        /* Submit button */
        .lp-btn.ant-btn-primary {
          height: 48px !important; border-radius: 11px !important;
          font-weight: 700 !important; font-size: 15px !important;
          border: none !important; letter-spacing: .3px !important;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%) !important;
          box-shadow: 0 6px 22px rgba(99,102,241,.42) !important;
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease !important;
        }
        .lp-btn.ant-btn-primary:not(:disabled):hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 30px rgba(99,102,241,.55) !important;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%) !important;
        }
        .lp-btn.ant-btn-primary:not(:disabled):active {
          transform: translateY(0) !important;
        }
        .lp-btn.ant-btn-loading {
          opacity: .85 !important;
        }

        /* Card footer */
        .lp-footer {
          text-align: center; margin: 0;
          padding: 18px 36px 22px;
          color: rgba(255,255,255,.22); font-size: 11.5px;
        }

        /* ── Keyframes ── */
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;

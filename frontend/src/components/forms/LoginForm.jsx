import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetState } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox } from "antd";
import { MailOutlined, LockOutlined, ArrowRightOutlined } from "@ant-design/icons";
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
  email:    z.string({ required_error: "Email is required" }).min(1, "Email is required").email("Enter a valid email address"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const LoginForm = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
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
      <div className="lp-layout">

        {/* ══ LEFT — dark branding panel ══ */}
        <aside className="lp-left">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />

          <div className="lp-left-inner">
            {/* Logo */}
            <div className="lp-logo-wrap">
              <img src={logo} alt="Logo" className="lp-logo-img" />
              <span className="lp-logo-name">EduManage</span>
            </div>

            {/* Headline */}
            <h1 className="lp-headline">
              One platform for<br />
              <span className="lp-hl-accent">every school role</span>
            </h1>
            <p className="lp-tagline">
              Manage students, staff, fees, attendance, and reports — all from a single, secure dashboard.
            </p>

            {/* Dashboard mockup */}
            <div className="lp-mock">
              <div className="lp-mock-topbar">
                <div className="lp-mock-search" />
                <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
                  <div className="lp-mock-notif" />
                  <div className="lp-mock-avatar" />
                </div>
              </div>

              <div className="lp-mock-cards">
                {[
                  { label: "Students", val: "10,482", clr: "#A78BFA" },
                  { label: "Teachers", val: "542", clr: "#38BDF8" },
                  { label: "Fee Collected", val: "₹4.2M", clr: "#34D399" },
                  { label: "Attendance", val: "94.8%", clr: "#FBBF24" },
                ].map((c) => (
                  <div key={c.label} className="lp-mock-card">
                    <div className="lp-mock-card-dot" style={{ background: c.clr }} />
                    <div className="lp-mock-card-val" style={{ color: c.clr }}>{c.val}</div>
                    <div className="lp-mock-card-lbl">{c.label}</div>
                  </div>
                ))}
              </div>

              <div className="lp-mock-chart">
                <div className="lp-mock-chart-title">Monthly Attendance</div>
                <div className="lp-mock-bars">
                  {[55, 72, 63, 88, 79, 91, 84, 76, 93, 68, 85, 90].map((h, i) => (
                    <div key={i} className="lp-mock-bar-wrap">
                      <div
                        className="lp-mock-bar"
                        style={{
                          height: `${h}%`,
                          background: i === 11
                            ? "linear-gradient(180deg,#7C3AED,#A855F7)"
                            : "rgba(167,139,250,0.2)",
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="lp-mock-list">
                {["Fee payment received — Class 10A", "New student enrolled — Priya S.", "Exam schedule updated — Board Prep"].map((txt, i) => (
                  <div key={i} className="lp-mock-row">
                    <div className="lp-mock-row-dot" />
                    <span className="lp-mock-row-txt">{txt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="lp-stats">
              {[{ v: "10K+", l: "Students" }, { v: "500+", l: "Educators" }, { v: "99.9%", l: "Uptime" }].map((s) => (
                <div key={s.l} className="lp-stat">
                  <span className="lp-stat-v">{s.v}</span>
                  <span className="lp-stat-l">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ══ RIGHT — login form ══ */}
        <main className="lp-right">
          <div className="lp-mob-logo">
            <img src={logo} alt="Logo" className="lp-logo-img" style={{ height: 40 }} />
            <span className="lp-logo-name" style={{ color: "#0F172A" }}>EduManage</span>
          </div>

          <div className={`lp-card${mounted ? " lp-card--in" : ""}`}>
            <div className="lp-stripe" />

            <div className="lp-card-body">
              <div className="lp-card-head">
                <h2 className="lp-card-title">Welcome back</h2>
                <p className="lp-card-sub">Sign in to your school portal</p>
              </div>

              <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
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
                        placeholder="Enter your email id"
                        autoComplete="email"
                        className="lp-inp"
                        onChange={(e) => { clearError(); field.onChange(e); }}
                      />
                    )}
                  />
                </Form.Item>

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
                  <Link to="/forgot-password" className="lp-forgot">Forgot password?</Link>
                </div>

                {showError && <div className="lp-err">{error}</div>}

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

              <div className="lp-trust">
                <span className="lp-trust-dot" />
                <span>Secured with 256-bit encryption</span>
              </div>
            </div>

            <p className="lp-footer">
              © {new Date().getFullYear()} School Management System. All rights reserved.
            </p>
          </div>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        .lp-root {
          min-height: 100vh;
          background: #F1F5F9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .lp-layout { display: flex; min-height: 100vh; }

        /* ══ LEFT PANEL ══ */
        .lp-left {
          display: none;
          flex: 0 0 54%;
          position: relative;
          background: #0D0F1A;
          overflow: hidden;
          padding: 44px 52px;
          flex-direction: column;
          justify-content: center;
        }
        @media (min-width: 1024px) { .lp-left { display: flex; } }

        .lp-blob {
          position: absolute; border-radius: 50%; filter: blur(110px);
          pointer-events: none; animation: blobFloat 18s ease-in-out infinite;
        }
        .lp-blob-1 { width: 480px; height: 480px; background: rgba(124,58,237,0.25); top: -160px; left: -130px; animation-delay: 0s; }
        .lp-blob-2 { width: 360px; height: 360px; background: rgba(6,182,212,0.15); bottom: -100px; right: -80px; animation-delay: 7s; }
        .lp-blob-3 { width: 260px; height: 260px; background: rgba(16,185,129,0.12); top: 45%; left: 58%; animation-delay: 13s; }
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0); }
          33% { transform: translate(18px,-22px); }
          66% { transform: translate(-14px,16px); }
        }

        .lp-left-inner { position: relative; z-index: 1; max-width: 500px; }

        .lp-logo-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
        .lp-logo-img { height: 38px; border-radius: 8px; }
        .lp-logo-name { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -.3px; }

        .lp-headline {
          font-size: 36px; font-weight: 900; color: #F8FAFC;
          line-height: 1.18; margin: 0 0 12px;
        }
        .lp-hl-accent {
          background: linear-gradient(135deg,#A78BFA 0%,#38BDF8 55%,#34D399 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-tagline { color: #94A3B8; font-size: 13.5px; line-height: 1.7; margin: 0 0 24px; }

        /* ── Mockup ── */
        .lp-mock {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 12px;
          margin-bottom: 24px;
          animation: mockIn .7s .15s ease both;
        }
        @keyframes mockIn {
          from { opacity: 0; transform: translateY(18px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lp-mock-topbar {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 7px; padding: 6px 10px; margin-bottom: 8px;
        }
        .lp-mock-search { height: 6px; width: 110px; border-radius: 3px; background: rgba(255,255,255,0.09); }
        .lp-mock-notif { width: 18px; height: 18px; border-radius: 4px; background: rgba(255,255,255,0.07); }
        .lp-mock-avatar { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#06B6D4); }

        .lp-mock-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin-bottom: 8px; }
        .lp-mock-card {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 7px; padding: 7px;
        }
        .lp-mock-card-dot { width: 5px; height: 5px; border-radius: 50%; margin-bottom: 4px; opacity: .85; }
        .lp-mock-card-val { font-size: 10px; font-weight: 800; line-height: 1; margin-bottom: 2px; }
        .lp-mock-card-lbl { font-size: 7.5px; color: #475569; text-transform: uppercase; letter-spacing: .5px; }

        .lp-mock-chart { background: rgba(255,255,255,0.03); border-radius: 7px; padding: 7px 9px 5px; margin-bottom: 7px; }
        .lp-mock-chart-title { font-size: 8px; color: #64748B; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 7px; }
        .lp-mock-bars { display: flex; align-items: flex-end; gap: 3px; height: 38px; }
        .lp-mock-bar-wrap { flex: 1; display: flex; align-items: flex-end; height: 100%; }
        .lp-mock-bar { width: 100%; border-radius: 2px 2px 0 0; animation: barGrow .5s ease both; }
        @keyframes barGrow { from { height: 0 !important; } }

        .lp-mock-list { display: flex; flex-direction: column; gap: 5px; }
        .lp-mock-row { display: flex; align-items: center; gap: 6px; }
        .lp-mock-row-dot { width: 5px; height: 5px; border-radius: 50%; background: #7C3AED; flex-shrink: 0; }
        .lp-mock-row-txt { font-size: 9px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .lp-stats {
          display: flex;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px; overflow: hidden;
        }
        .lp-stat { flex: 1; padding: 13px 14px; display: flex; flex-direction: column; gap: 3px; position: relative; }
        .lp-stat + .lp-stat::before {
          content: ''; position: absolute; left: 0; top: 20%; height: 60%;
          width: 1px; background: rgba(255,255,255,0.07);
        }
        .lp-stat-v { font-size: 17px; font-weight: 800; color: #F8FAFC; line-height: 1; }
        .lp-stat-l { font-size: 9.5px; color: #64748B; text-transform: uppercase; letter-spacing: .7px; }

        /* ══ RIGHT PANEL ══ */
        .lp-right {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 20px; background: #F1F5F9;
        }

        .lp-mob-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
        @media (min-width: 1024px) { .lp-mob-logo { display: none; } }

        /* ── Card ── */
        .lp-card {
          width: 100%; max-width: 420px;
          background: #fff; border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px rgba(0,0,0,.04), 0 20px 40px rgba(0,0,0,.07);
          overflow: hidden;
          opacity: 0; transform: translateY(14px);
          transition: opacity .4s ease, transform .4s ease;
        }
        .lp-card--in { opacity: 1; transform: translateY(0); }

        .lp-stripe {
          height: 4px;
          background: linear-gradient(90deg,#7C3AED 0%,#A855F7 35%,#38BDF8 70%,#34D399 100%);
        }

        .lp-card-body { padding: 30px 34px 18px; }

        .lp-card-head { margin-bottom: 24px; }
        .lp-card-title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
        .lp-card-sub { color: #94A3B8; font-size: 13px; margin: 0; }

        .lp-fi.ant-form-item { margin-bottom: 16px; }
        .lp-fi .ant-form-item-label > label {
          color: #475569 !important; font-size: 12.5px !important;
          font-weight: 600 !important; height: auto !important;
        }
        .lp-fi .ant-form-item-explain-error {
          color: #EF4444 !important; font-size: 12px !important; margin-top: 3px !important;
        }

        .lp-inp.ant-input-affix-wrapper,
        .lp-inp.ant-input {
          background: #F8FAFC !important; border: 1.5px solid #E2E8F0 !important;
          border-radius: 10px !important; color: #0F172A !important; transition: all .2s !important;
        }
        .lp-inp.ant-input-affix-wrapper:hover,
        .lp-inp.ant-input:hover { border-color: #C4B5FD !important; background: #fff !important; }
        .lp-inp.ant-input-affix-wrapper-focused,
        .lp-inp.ant-input-affix-wrapper:focus-within,
        .lp-inp.ant-input:focus {
          border-color: #7C3AED !important; background: #fff !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,.12) !important;
        }
        .lp-inp .ant-input { background: transparent !important; color: #0F172A !important; }
        .lp-inp .ant-input::placeholder { color: #CBD5E1 !important; }
        .lp-pfx { color: #C4B5FD !important; margin-right: 6px; }
        .lp-inp .ant-input-password-icon.anticon { color: #94A3B8 !important; }
        .lp-inp .ant-input-password-icon.anticon:hover { color: #7C3AED !important; }

        .lp-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .lp-chk.ant-checkbox-wrapper { color: #64748B !important; font-size: 13px !important; }
        .lp-chk .ant-checkbox-inner { border-color: #CBD5E1 !important; border-radius: 5px !important; }
        .lp-chk .ant-checkbox-checked .ant-checkbox-inner { background: #7C3AED !important; border-color: #7C3AED !important; }
        .lp-forgot { font-size: 13px; color: #7C3AED !important; font-weight: 600; text-decoration: none; transition: color .2s; }
        .lp-forgot:hover { color: #6D28D9 !important; text-decoration: underline; }

        .lp-err {
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 8px; padding: 10px 14px;
          color: #DC2626; font-size: 13px; margin-bottom: 14px;
          animation: errIn .25s ease;
        }
        @keyframes errIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lp-btn.ant-btn-primary {
          height: 46px !important; border-radius: 10px !important;
          font-weight: 700 !important; font-size: 14.5px !important;
          border: none !important; letter-spacing: .2px !important;
          background: linear-gradient(135deg,#7C3AED 0%,#A855F7 100%) !important;
          box-shadow: 0 4px 18px rgba(124,58,237,.35) !important;
          transition: transform .2s ease, box-shadow .2s ease !important;
        }
        .lp-btn.ant-btn-primary:not(:disabled):hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 26px rgba(124,58,237,.45) !important;
          background: linear-gradient(135deg,#6D28D9 0%,#9333EA 100%) !important;
        }
        .lp-btn.ant-btn-primary:not(:disabled):active { transform: translateY(0) !important; }

        .lp-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 7px; margin-top: 18px; color: #94A3B8; font-size: 12px;
        }
        .lp-trust-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #10B981;
          box-shadow: 0 0 0 3px rgba(16,185,129,.2);
          animation: trustPulse 2.8s ease infinite;
        }
        @keyframes trustPulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,.2); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,.08); }
        }

        .lp-footer {
          text-align: center; margin: 0;
          padding: 12px 34px 18px;
          color: #CBD5E1; font-size: 11px;
          border-top: 1px solid #F1F5F9;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;

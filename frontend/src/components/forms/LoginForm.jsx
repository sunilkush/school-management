import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetState } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Checkbox, Typography, Alert } from "antd";
import { MailOutlined, LockOutlined, ArrowRightOutlined } from "@ant-design/icons";
import logo from "/logo.png";

const { Text, Title } = Typography;

const roleRoutes = {
  "super admin":        "/dashboard/superadmin",
  "school admin":       "/dashboard/schooladmin",
  principal:            "/dashboard/principal",
  "vice principal":     "/dashboard/viceprincipal",
  "subject coordinator":"/dashboard/subjectcoordinator",
  student:              "/dashboard/student",
  parent:               "/dashboard/parent",
  teacher:              "/dashboard/teacher",
  accountant:           "/dashboard/accountant",
  staff:                "/dashboard/staff",
  "support staff":      "/dashboard/staff",
  librarian:            "/dashboard/librarian",
  "hostel warden":      "/dashboard/hostelwarden",
  "transport manager":  "/dashboard/transportmanager",
  "exam coordinator":   "/dashboard/examcoordinator",
  receptionist:         "/dashboard/receptionist",
  "it support":         "/dashboard/itsupport",
  counselor:            "/dashboard/counselor",
  security:             "/dashboard/security",
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

/* ── Stat tiles shown on the branding panel ── */
const stats = [
  { value: "10K+", label: "Students enrolled" },
  { value: "500+", label: "Teachers onboarded" },
  { value: "99.9%", label: "Uptime guaranteed" },
];

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values) => {
    try {
      const res = await dispatch(loginUser(values)).unwrap();
      const role =
        typeof res?.user?.role === "string"
          ? res.user.role.toLowerCase()
          : res?.user?.role?.name?.toLowerCase();
      navigate(roleRoutes[role] || "/dashboard", { replace: true });
    } catch {
      // error is handled via Redux state
    }
  };

  const onValuesChange = () => { if (error) dispatch(resetState()); };

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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── LEFT: Branding panel (hidden on mobile) ── */}
      <div
        style={{
          flex: "0 0 45%",
          display: "none",
          background: "linear-gradient(145deg, #4f1bb5 0%, #7c3aed 45%, #06b6d4 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "48px 40px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        className="login-brand-panel"
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", top: -100, right: -100,
        }} />
        <div style={{
          position: "absolute", width: 250, height: 250, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)", bottom: 60, left: -60,
        }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <img src={logo} style={{ height: 40, filter: "brightness(0) invert(1)" }} alt="Logo" />
        </div>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Title
            level={2}
            style={{ color: "#fff", margin: "0 0 12px", lineHeight: 1.25, fontWeight: 800 }}
          >
            The modern school management platform
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6 }}>
            Manage students, staff, fees, exams, and more — all in one place.
          </Text>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, marginTop: 36, flexWrap: "wrap" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badge */}
        <div
          style={{
            position: "relative", zIndex: 1,
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.12)", borderRadius: 99,
            padding: "8px 16px", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
            boxShadow: "0 0 0 3px rgba(74,222,128,0.3)",
          }} />
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600 }}>
            Secure · Reliable · Always-on
          </Text>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          background: "var(--bg)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobile-only logo */}
          <div className="login-mobile-logo" style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src={logo}
              style={{ height: 36, filter: "var(--logo)", margin: "0 auto" }}
              alt="Logo"
            />
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <Title level={3} style={{ margin: "0 0 6px", color: "var(--text-primary)", fontWeight: 800 }}>
              Welcome back
            </Title>
            <Text style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Sign in to your account to continue
            </Text>
          </div>

          {/* Form */}
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>

            {/* Email */}
            <Form.Item
              label={<span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: 13 }}>Email address</span>}
              validateStatus={errors.email ? "error" : ""}
              help={errors.email?.message}
              style={{ marginBottom: 20 }}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    size="large"
                    prefix={<MailOutlined style={{ color: "var(--text-muted)" }} />}
                    placeholder="you@school.com"
                    autoComplete="email"
                    onChange={(e) => { onValuesChange(); field.onChange(e); }}
                    style={{ borderRadius: 10 }}
                  />
                )}
              />
            </Form.Item>

            {/* Password */}
            <Form.Item
              label={<span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: 13 }}>Password</span>}
              validateStatus={errors.password ? "error" : ""}
              help={errors.password?.message}
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    size="large"
                    prefix={<LockOutlined style={{ color: "var(--text-muted)" }} />}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onChange={(e) => { onValuesChange(); field.onChange(e); }}
                    style={{ borderRadius: 10 }}
                  />
                )}
              />
            </Form.Item>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => { onValuesChange(); field.onChange(e.target.checked); }}
                    style={{ color: "var(--text-secondary)", fontSize: 13 }}
                  >
                    Remember me
                  </Checkbox>
                )}
              />
              <Link
                to="/forgot-password"
                style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Error */}
            {showError && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 20, borderRadius: 10 }}
              />
            )}

            {/* Submit */}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={!loading && <ArrowRightOutlined />}
              iconPosition="end"
              style={{
                height: 46,
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "none",
                boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
              }}
            >
              Sign In
            </Button>
          </Form>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
              © {new Date().getFullYear()} School Management System. All rights reserved.
            </Text>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .login-brand-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;

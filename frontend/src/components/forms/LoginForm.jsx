import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetState } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import {
  Layout,
  Row,
  Col,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Card,
  Alert,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import logo from "/logo.png";
const { Text } = Typography;
const { Content } = Layout;

const roleRoutes = {
  "super admin": "/dashboard/superadmin",
  "school admin": "/dashboard/schooladmin",
  principal: "/dashboard/principal",
  "vice principal": "/dashboard/viceprincipal",
  "subject coordinator": "/dashboard/subjectcoordinator",
  student: "/dashboard/student",
  parent: "/dashboard/parent",
  teacher: "/dashboard/teacher",
  accountant: "/dashboard/accountant",
  staff: "/dashboard/staff",
  "support staff": "/dashboard/staff",
  librarian: "/dashboard/librarian",
  "hostel warden": "/dashboard/hostelwarden",
  "transport manager": "/dashboard/transportmanager",
  "exam coordinator": "/dashboard/examcoordinator",
  receptionist: "/dashboard/receptionist",
  "it support": "/dashboard/itsupport",
  counselor: "/dashboard/counselor",
  security: "/dashboard/security",
};


const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  // 🔥 FINAL LOGIN HANDLER
  const onSubmit = async (values) => {
    try {
      const res = await dispatch(loginUser(values)).unwrap();

      const role =
        typeof res?.user?.role === "string"
          ? res.user.role.toLowerCase()
          : res?.user?.role?.name?.toLowerCase();

      const target = roleRoutes[role] || "/dashboard";

      navigate(target, { replace: true }); // ✅ direct redirect
    } catch (err) {
      console.log("Login failed:", err);
    }
  };

  // 🔥 Safe error reset (NOT on unmount)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(resetState());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onValuesChange = () => {
    if (error) dispatch(resetState());
  };

  const showError =
    typeof error === "string" &&
    !error.toLowerCase().includes("token") &&
    !error.toLowerCase().includes("unauthorized");

  return (
    <Layout style={{ minHeight: "100vh",color: "var(--text-primary)" }}>
      <Content>
        <Row style={{ minHeight: "100vh", margin: "0 auto" }}>
          <Col
            xs={24}
            md={24}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <Card
              style={{
                width: "100%",
                maxWidth: 420,
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                borderRadius: 12,
                background: "var(--cardBg)",
                
              }}
              variant="borderless"
            >
              
               <img src={logo} style={{width:'150px',margin:"10px auto",filter:"var(--logo)"}}/>

             {/*  <Title level={3} style={{color: "var(--text-primary)"}}>Welcome Back 👋</Title> */}
              <Text type="secondary" style={{color: "var(--text-primary)",margin:"10px 0px"}}>
                Login to continue to your dashboard
              </Text>

              <Form
                layout="vertical"
                style={{ marginTop: 24 }}
                onFinish={handleSubmit(onSubmit)}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ display: "block", marginBottom: 8, color: "var(--text-primary)" }}>
                    Email Address
                  </Text>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        size="large"
                        prefix={<MailOutlined />}
                        placeholder="admin@example.com"
                        status={errors.email ? "error" : ""}
                        onChange={(event) => {
                          onValuesChange();
                          field.onChange(event);
                        }}
                      />
                    )}
                  />
                  {errors.email && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      {errors.email.message}
                    </Text>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text style={{ display: "block", marginBottom: 8, color: "var(--text-primary)" }}>
                    Password
                  </Text>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        size="large"
                        prefix={<LockOutlined />}
                        placeholder="••••••••"
                        status={errors.password ? "error" : ""}
                        onChange={(event) => {
                          onValuesChange();
                          field.onChange(event);
                        }}
                      />
                    )}
                  />
                  {errors.password && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      {errors.password.message}
                    </Text>
                  )}
                </div>

                <Row justify="space-between" align="middle">
                  <Controller
                    name="remember"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onChange={(event) => {
                          onValuesChange();
                          field.onChange(event.target.checked);
                        }}
                        style={{color: "var(--text-primary)"}}
                      >
                        Remember me
                      </Checkbox>
                    )}
                  />
                  <Link to="/forgot-password" style={{color: "var(--text-primary)"}}>
                    Forgot password?
                  </Link>
                </Row>

                {showError && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  Sign In
                </Button>

              
              </Form>

              
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LoginForm;
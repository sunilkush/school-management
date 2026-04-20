import { useEffect } from "react";
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

const { Title, Text } = Typography;
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

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  // 🔥 FINAL LOGIN HANDLER
  const onFinish = async (values) => {
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
    <Layout style={{ minHeight: "100vh",color: "var(--color-text)" }}>
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
                boxShadow: "0 16px 32px rgba(33,37,41,0.12)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                background: "var(--card)",
               
              }}
              variant="borderless"
            >
              <Title level={3} style={{color: "var(--color-text)"}}>Welcome Back 👋</Title>
              <Text type="secondary" style={{color: "var(--color-text)"}}>
                Login to continue to your dashboard
              </Text>

              <Form
                layout="vertical"
                style={{ marginTop: 24 }}
                onFinish={onFinish}
                onValuesChange={onValuesChange}
              >
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Invalid email" },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<MailOutlined />}
                    placeholder="admin@example.com"
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: "Password is required" }]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                  />
                </Form.Item>

                <Row justify="space-between" align="middle">
                  <Form.Item name="remember" valuePropName="checked" style={{color: "var(--color-text)"}}>
                    <Checkbox style={{color: "var(--color-text)"}}>Remember me</Checkbox>
                  </Form.Item>
                  <Link to="/forgot-password" style={{color: "var(--color-text)"}}>
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
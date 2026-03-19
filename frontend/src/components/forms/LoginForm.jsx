import { useEffect, useState } from "react";
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

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, user } = useSelector((state) => state.auth);

  const [navigated, setNavigated] = useState(false);

  const roleName = user?.role?.name?.toLowerCase();

  // ✅ Role-based redirect (safe)
  useEffect(() => {
    if (roleName && !navigated) {
      const roleRoutes = {
        "super admin": "/dashboard/superadmin",
        "school admin": "/dashboard/schooladmin",
        student: "/dashboard/student",
        parent: "/dashboard/parent",
        teacher: "/dashboard/teacher",
        accountant: "/dashboard/accountant",
        staff: "/dashboard/staff",
      };

      if (roleRoutes[roleName]) {
        setNavigated(true);
        navigate(roleRoutes[roleName]);
      }
    }
  }, [roleName, navigate, navigated]);

  // ✅ Submit
  const onFinish = (values) => {
    dispatch(loginUser(values));
  };

  // ✅ Clear error on typing
  const onValuesChange = () => {
    if (error) dispatch(resetState());
  };

  // ✅ Hide "No token found" type errors
  const showError =
    error &&
    !error.toLowerCase().includes("token") &&
    !error.toLowerCase().includes("unauthorized");

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
              }}
              variant="borderless"
            >
              {/* Header */}
              <Title level={3} style={{ marginBottom: 0 }}>
                Welcome Back 👋
              </Title>
              <Text type="secondary">
                Login to continue to your dashboard
              </Text>

              {/* Form */}
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
                  <Form.Item name="remember" valuePropName="checked">
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>
                  <Link to="/forgot-password">Forgot password?</Link>
                </Row>

                {/* ✅ Error (filtered) */}
                {showError && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                {/* Submit */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  Sign In
                </Button>

                {/* Google */}
                <Button block size="large" style={{ marginTop: 12 }}>
                  Sign in with Google
                </Button>
              </Form>

              {/* Footer */}
              <Text
                style={{
                  display: "block",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                Don’t have an account? <Link to="/register">Sign up</Link>
              </Text>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LoginForm;
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, resetAuthState } from "../../features/authSlice";
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

  const onFinish = (values) => dispatch(login(values));
  const onValuesChange = () => error && dispatch(resetAuthState());

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content>
        <Row style={{ minHeight: "100vh",margin:"0px auto"}}>
          {/* LEFT BRAND PANEL */}
          
          {/* RIGHT LOGIN PANEL */}
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
              bordered={false}
            >
              <Title level={3} style={{ marginBottom: 0 }}>
                Welcome Back 👋
              </Title>
              <Text type="secondary">
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
                  <Form.Item name="remember" valuePropName="checked">
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>
                  <Link to="/forgot-password">Forgot password?</Link>
                </Row>

                {error && (
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

                <Button block size="large" style={{ marginTop: 12 }}>
                  Sign in with Google
                </Button>
              </Form>

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

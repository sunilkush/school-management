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
import logo from "../../assets/logo.png";

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

      const path = roleRoutes[roleName];
      if (path) {
        setNavigated(true);
        navigate(path);
      }
    }
  }, [roleName, navigate, navigated]);

  const onFinish = (values) => {
    dispatch(login(values));
  };

  const onValuesChange = () => {
    if (error) dispatch(resetAuthState());
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content>
        <Row
          align="middle"
          justify="center"
          style={{ minHeight: "100vh" }}
        >
          <Col xs={22} sm={16} md={10} lg={8}>
            <Card bordered={false} style={{ textAlign: "center" }}>
              {/* Logo */}
              <img
                src={logo}
                alt="Logo"
                style={{ height: 28, marginBottom: 16 }}
              />

              <Title level={3} style={{ marginBottom: 4 }}>
                Welcome Back
              </Title>
              <Text type="secondary">
                Please enter your login details
              </Text>

              <Form
                layout="vertical"
                style={{ marginTop: 24, textAlign: "left" }}
                onFinish={onFinish}
                onValuesChange={onValuesChange}
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Invalid email" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter email"
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Password is required" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter password"
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
                  block
                  loading={loading}
                >
                  Sign In
                </Button>

                <Button block style={{ marginTop: 12 }}>
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
                Don’t have an account?{" "}
                <Link to="/register">Sign up</Link>
              </Text>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LoginForm;

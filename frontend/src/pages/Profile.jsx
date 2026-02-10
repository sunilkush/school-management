import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tag,
  Space,
  Dropdown,
  Grid,
} from "antd";

import {
  MoreOutlined,
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  FolderOutlined,
  SettingOutlined,
  EditOutlined,
  RightOutlined,
} from "@ant-design/icons";

import userProfile from "../assets/userProfile.png";
import AttendanceCalendar from "./AttendanceCalendar";
import { useDispatch, useSelector } from "react-redux";
import { currentUser } from "../features/authSlice";

const { Title, Text } = Typography;
const { Content } = Layout;
const { useBreakpoint } = Grid;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");

  const screens = useBreakpoint();

  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  return (
    <Layout style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Content
        style={{
          padding: screens.xs ? 12 : 24,
          maxWidth: 1400,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* ================= Header ================= */}
        <Card>
          <Row
            justify="space-between"
            align={screens.xs ? "top" : "middle"}
            gutter={[16, 16]}
          >
            <Col xs={24} md={16}>
              <Space
                size={screens.xs ? "middle" : "large"}
                wrap
                align="center"
              >
                <Avatar size={screens.xs ? 50 : 64} src={userProfile} />

                <div>
                  <Title
                    level={screens.xs ? 5 : 4}
                    style={{ marginBottom: 4, textTransform: "capitalize" }}
                  >
                    {user?.name}
                  </Title>

                  <Tag color={user?.isActive ? "green" : "red"}>
                    {user?.isActive ? "Active" : "Inactive"}
                  </Tag>
                </div>

                {!screens.xs && (
                  <Space size="large" wrap>
                    <div>
                      <Text type="secondary">Last Clocked In</Text>
                      <br />
                      <Text>A few seconds ago</Text>
                    </div>
                    <div>
                      <Text type="secondary">Last Messaged</Text>
                      <br />
                      <Text>2 days ago</Text>
                    </div>
                    <div>
                      <Text type="secondary">Employee ID</Text>
                      <br />
                      <Text>#123456</Text>
                    </div>
                  </Space>
                )}
              </Space>
            </Col>

            <Col xs={24} md={8} style={{ textAlign: screens.xs ? "left" : "right" }}>
              <Space>
                <Dropdown
                  menu={{
                    items: [{ key: "1", label: "More Actions" }],
                  }}
                >
                  <Button icon={<MoreOutlined />} />
                </Dropdown>

                <Button type="primary" icon={<MailOutlined />}>
                  Send Email
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* ================= Tabs ================= */}
        <Card style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarGutter={screens.xs ? 12 : 32}
            items={[
              {
                key: "profile",
                label: (
                  <Space size={4}>
                    <UserOutlined /> Profile
                  </Space>
                ),
              },
              {
                key: "attendance",
                label: (
                  <Space size={4}>
                    <CalendarOutlined /> Attendance
                  </Space>
                ),
              },
              {
                key: "tasks",
                label: (
                  <Space size={4}>
                    <CheckSquareOutlined /> Tasks
                  </Space>
                ),
              },
              {
                key: "messages",
                label: (
                  <Space size={4}>
                    <MessageOutlined /> Messages
                  </Space>
                ),
              },
              {
                key: "files",
                label: (
                  <Space size={4}>
                    <FolderOutlined /> Files
                  </Space>
                ),
              },
              {
                key: "settings",
                label: (
                  <Space size={4}>
                    <SettingOutlined /> Settings
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        {/* ================= Profile Tab ================= */}
        {activeTab === "profile" && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Left */}
            <Col xs={24} lg={16}>
              <Card
                title="Personal Information"
                extra={<Button icon={<EditOutlined />}>Edit</Button>}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Text type="secondary">Full Name</Text>
                    <br />
                    <Text>{user?.name}</Text>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Text type="secondary">Gender</Text>
                    <br />
                    <Text>Male</Text>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Text type="secondary">Marital Status</Text>
                    <br />
                    <Text>Single</Text>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Text type="secondary">Religion</Text>
                    <br />
                    <Text>-</Text>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Text type="secondary">Birth Date</Text>
                    <br />
                    <Text>-</Text>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Text type="secondary">Blood Group</Text>
                    <br />
                    <Text>-</Text>
                  </Col>
                </Row>
              </Card>

              <Card
                title="Address Information"
                extra={<Button icon={<EditOutlined />}>Edit</Button>}
                style={{ marginTop: 16 }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={18}>
                    <Text type="secondary">Residential Address</Text>
                    <br />
                    <Text>-</Text>
                  </Col>

                  <Col xs={24} md={6}>
                    <Button type="link">
                      View on Map <RightOutlined />
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Right */}
            <Col xs={24} lg={8}>
              <Card
                title="Contact Information"
                extra={<Button icon={<EditOutlined />}>Edit</Button>}
              >
                <Text type="secondary">Phone</Text>
                <br />
                <Tag color="blue">{user?.phone}</Tag>

                <br />
                <br />

                <Text type="secondary">Email</Text>
                <br />
                <Tag color="blue">{user?.email}</Tag>
              </Card>

              <Card title="Student Overview" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Text type="secondary">Role</Text>
                    <br />
                    <Text>{user?.role?.name}</Text>
                  </Col>

                  <Col xs={12}>
                    <Text type="secondary">Status</Text>
                    <br />
                    <Text>Full Time</Text>
                  </Col>
                </Row>

                <Button type="link" style={{ padding: 0, marginTop: 12 }}>
                  View Contract <RightOutlined />
                </Button>
              </Card>
            </Col>
          </Row>
        )}

        {/* ================= Attendance ================= */}
        {activeTab === "attendance" && (
          <Card style={{ marginTop: 16 }}>
            <AttendanceCalendar />
          </Card>
        )}

        {activeTab === "tasks" && (
          <Card style={{ marginTop: 16 }}>Tasks Section</Card>
        )}

        {activeTab === "messages" && (
          <Card style={{ marginTop: 16 }}>Messages Section</Card>
        )}

        {activeTab === "files" && (
          <Card style={{ marginTop: 16 }}>Files Section</Card>
        )}

        {activeTab === "settings" && (
          <Card style={{ marginTop: 16 }}>Settings Section</Card>
        )}
      </Content>
    </Layout>
  );
};

export default Profile;

import { useState } from "react";
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
import { useEffect } from "react";
import { currentUser } from "../features/authSlice";
const { Title, Text } = Typography;
const { Content } = Layout;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");
  
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  return (
    <Layout style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        {/* ================= Header ================= */}
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="large">
                <Avatar size={64} src={userProfile} />
                <div>
                  <Title level={4} style={{ marginBottom: 4, textTransform: "capitalize" }}>
                   {user?.name}
                  </Title>
                  <Tag color={`${user?.isActive ? "green" : "red"}`}>{user?.isActive ? "Active" : "Inactive"}</Tag>
                </div>

                <Space size="large">
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
              </Space>
            </Col>

            <Col>
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
            items={[
              {
                key: "profile",
                label: (
                  <Space>
                    <UserOutlined /> Profile
                  </Space>
                ),
              },
              {
                key: "attendance",
                label: (
                  <Space>
                    <CalendarOutlined /> Attendance
                  </Space>
                ),
              },
              {
                key: "tasks",
                label: (
                  <Space>
                    <CheckSquareOutlined /> Tasks
                  </Space>
                ),
              },
              {
                key: "messages",
                label: (
                  <Space>
                    <MessageOutlined /> Messages
                  </Space>
                ),
              },
              {
                key: "files",
                label: (
                  <Space>
                    <FolderOutlined /> Files
                  </Space>
                ),
              },
              {
                key: "settings",
                label: (
                  <Space>
                    <SettingOutlined /> Settings
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        {/* ================= Profile Tab ================= */}
        {activeTab === "profile" && (
          <Row gutter={16} style={{ marginTop: 16 }}>
            {/* Left */}
            <Col span={16}>
              <Card
                title="Personal Information"
                extra={<Button icon={<EditOutlined />}>Edit</Button>}
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text type="secondary">Full Name</Text>
                    <br />
                    <Text>Sumit Kumar</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Gender</Text>
                    <br />
                    <Text>Male</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Marital Status</Text>
                    <br />
                    <Text>Single</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Religion</Text>
                    <br />
                    <Text>Muslim</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Birth Date</Text>
                    <br />
                    <Text>10/06/2000</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Blood Group</Text>
                    <br />
                    <Text>O+</Text>
                  </Col>
                </Row>
              </Card>

              <Card
                title="Address Information"
                extra={<Button icon={<EditOutlined />}>Edit</Button>}
                style={{ marginTop: 16 }}
              >
                <Row justify="space-between">
                  <Col span={18}>
                    <Text type="secondary">Residential Address</Text>
                    <br />
                    <Text>
                      4517 Washington Ave. Manchester, Kentucky 110033
                    </Text>
                  </Col>
                  <Col>
                    <Button type="link">
                      View on Map <RightOutlined />
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Right */}
            <Col span={8}>
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
                  <Col span={12}>
                    <Text type="secondary">Role</Text>
                    <br />
                    <Text>{user?.role?.name}</Text>
                  </Col>
                  <Col span={12}>
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

        {activeTab === "tasks" && <Card style={{ marginTop: 16 }}>Tasks Section</Card>}
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

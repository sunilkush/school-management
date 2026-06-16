import { useState, useEffect } from "react";
import { Button, Col, Row, Space, Tabs, Grid } from "antd";
import {
  CalendarOutlined, CheckSquareOutlined, EditOutlined, FolderOutlined,
  MailOutlined, MessageOutlined, SettingOutlined, UserOutlined,
} from "@ant-design/icons";
import AttendanceCalendar from "./AttendanceCalendar";
import { useDispatch, useSelector } from "react-redux";
import { currentUser } from "../features/authSlice";
import PageHeader from "../components/layout/PageHeader";
import { avatarColor, pageCard, pageWrapper, pill, sectionPanel } from "../styles/pageStyles";

const { useBreakpoint } = Grid;

const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 14, color: value ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 500 }}>{value || "—"}</div>
  </div>
);

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");
  const screens = useBreakpoint();

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  const initials = (user?.name || "U").charAt(0).toUpperCase();
  const { bg: avatarBg, color: avatarFg } = avatarColor(user?.name || "U");

  return (
    <>
      <PageHeader
        title={user?.name || "My Profile"}
        subtitle={`${user?.role?.name || "Staff"} · ${user?.school?.name || "School"}`}
        icon={<UserOutlined />}
        extra={
          <Space>
            <Button icon={<MailOutlined />} type="primary">Send Email</Button>
            <Button icon={<EditOutlined />}>Edit Profile</Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        {/* Avatar hero card */}
        <div style={{ ...pageCard, marginBottom: 20, padding: screens.xs ? "20px 16px" : "24px 28px" }}>
          <Space size={screens.xs ? 16 : 20} align="center" wrap>
            <div style={{
              width: screens.xs ? 56 : 72,
              height: screens.xs ? 56 : 72,
              borderRadius: "50%",
              background: avatarBg,
              color: avatarFg,
              fontWeight: 800,
              fontSize: screens.xs ? 22 : 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              border: `3px solid ${avatarFg}30`,
              boxShadow: `0 4px 16px ${avatarFg}20`,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: screens.xs ? 17 : 21, color: "var(--text-primary)", marginBottom: 8, textTransform: "capitalize" }}>
                {user?.name || "—"}
              </div>
              <Space size={6} wrap>
                <span style={pill(user?.isActive ? "#059669" : "#dc2626", user?.isActive ? "#d1fae5" : "#fee2e2")}>
                  {user?.isActive ? "Active" : "Inactive"}
                </span>
                {user?.role?.name && <span style={pill("#7c3aed", "#ede9fe")}>{user.role.name}</span>}
                {user?.school?.name && <span style={pill("#0284c7", "#e0f2fe")}>{user.school.name}</span>}
              </Space>
            </div>
            {!screens.xs && (
              <Space size={28} wrap style={{ marginLeft: 12 }}>
                {user?.email && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{user.email}</div>
                  </div>
                )}
                {user?.phone && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{user.phone}</div>
                  </div>
                )}
              </Space>
            )}
          </Space>
        </div>

        {/* Tab bar */}
        <div style={{ ...pageCard, marginBottom: 20 }}>
          <div style={{ padding: "0 24px" }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabBarGutter={screens.xs ? 12 : 28}
              items={[
                { key: "profile",    label: <Space size={4}><UserOutlined />Profile</Space> },
                { key: "attendance", label: <Space size={4}><CalendarOutlined />Attendance</Space> },
                { key: "tasks",      label: <Space size={4}><CheckSquareOutlined />Tasks</Space> },
                { key: "messages",   label: <Space size={4}><MessageOutlined />Messages</Space> },
                { key: "files",      label: <Space size={4}><FolderOutlined />Files</Space> },
                { key: "settings",   label: <Space size={4}><SettingOutlined />Settings</Space> },
              ]}
            />
          </div>
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <div style={{ ...sectionPanel, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Personal Information</div>
                  <Button size="small" icon={<EditOutlined />}>Edit</Button>
                </div>
                <Row gutter={[24, 4]}>
                  <Col xs={24} sm={12}><InfoRow label="Full Name" value={user?.name} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Gender" value={null} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Marital Status" value={null} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Religion" value={null} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Birth Date" value={null} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Blood Group" value={null} /></Col>
                </Row>
              </div>
              <div style={sectionPanel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Address Information</div>
                  <Button size="small" icon={<EditOutlined />}>Edit</Button>
                </div>
                <InfoRow label="Residential Address" value={null} />
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div style={{ ...sectionPanel, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Contact Information</div>
                  <Button size="small" icon={<EditOutlined />}>Edit</Button>
                </div>
                <InfoRow label="Phone" value={user?.phone} />
                <InfoRow label="Email" value={user?.email} />
              </div>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 20 }}>Overview</div>
                <Row gutter={[16, 4]}>
                  <Col xs={12}><InfoRow label="Role" value={user?.role?.name} /></Col>
                  <Col xs={12}><InfoRow label="Status" value={user?.isActive ? "Active" : "Inactive"} /></Col>
                  <Col xs={24}><InfoRow label="School" value={user?.school?.name} /></Col>
                </Row>
              </div>
            </Col>
          </Row>
        )}

        {activeTab === "attendance" && (
          <div style={pageCard}>
            <div style={{ padding: 24 }}><AttendanceCalendar /></div>
          </div>
        )}

        {["tasks", "messages", "files", "settings"].map((tab) =>
          activeTab === tab ? (
            <div key={tab} style={{ ...sectionPanel, padding: "56px 24px", textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} section coming soon
              </div>
            </div>
          ) : null
        )}
      </div>
    </>
  );
};

export default Profile;

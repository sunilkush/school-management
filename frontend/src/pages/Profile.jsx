import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Col, Row, Space, Tabs, Grid, Spin, message,
  Form, Input, Modal,
} from "antd";
import {
  CalendarOutlined, CheckSquareOutlined, EditOutlined, FolderOutlined,
  LockOutlined, MailOutlined, MessageOutlined, PhoneOutlined,
  SaveOutlined, SettingOutlined, UserOutlined, CameraOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import AttendanceCalendar from "./AttendanceCalendar";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, currentUser, updateUser } from "../features/authSlice";
import PageHeader from "../components/layout/PageHeader";
import { avatarColor, pageCard, pageWrapper, pill, sectionPanel } from "../styles/pageStyles";

const { useBreakpoint } = Grid;

const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>
    <div style={{ color: value ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 500 }}>{value || "—"}</div>
  </div>
);

const Profile = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user }   = useSelector((state) => state.auth);
  const [activeTab, setActiveTab]       = useState("profile");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [pwdLoading, setPwdLoading]     = useState(false);
  const fileInputRef = useRef(null);
  const [editForm]   = Form.useForm();
  const [pwdForm]    = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  /* sync edit form when user data loads */
  useEffect(() => {
    if (user && editing) {
      editForm.setFieldsValue({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    }
  }, [user, editing, editForm]);

  const initials   = (user?.name || "U").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const { bg: avatarBg, color: avatarFg } = avatarColor(user?.name || "U");
  const avatarSize = screens.xs ? 56 : 80;

  /* ── Photo upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { message.error("Please select an image file"); return; }
    try {
      setUploadingPhoto(true);
      await dispatch(updateUser({ name: user?.name || "", email: user?.email || "", phone: user?.phone, avatarFile: file })).unwrap();
      message.success("Profile photo updated!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  /* ── Edit profile ── */
  const openEdit = () => {
    editForm.setFieldsValue({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
    setEditing(true);
  };

  const handleSaveProfile = async (values) => {
    setSaving(true);
    try {
      await dispatch(updateUser({ name: values.name, email: values.email, phone: values.phone })).unwrap();
      message.success("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("New password and confirm password do not match");
      return;
    }
    setPwdLoading(true);
    try {
      await dispatch(changePassword({ oldPassword: values.currentPassword, newPassword: values.newPassword })).unwrap();
      message.success("Password changed successfully!");
      pwdForm.resetFields();
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={user?.name || "My Profile"}
        subtitle={`${user?.role?.name || "Staff"} · ${user?.school?.name || "School"}`}
        icon={<UserOutlined />}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={openEdit}>Edit Profile</Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        {/* ── Avatar hero ── */}
        <div style={{ ...pageCard, marginBottom: 20, padding: screens.xs ? "20px 16px" : "24px 28px" }}>
          <Space size={screens.xs ? 16 : 20} align="center" wrap>
            <div
              style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
              onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              title="Click to change photo"
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", objectFit: "cover", border: `3px solid ${avatarFg}30`, boxShadow: `0 4px 16px ${avatarFg}20`, display: "block" }} />
              ) : (
                <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: avatarBg, color: avatarFg, fontWeight: 800, fontSize: screens.xs ? 22 : 30, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${avatarFg}30`, boxShadow: `0 4px 16px ${avatarFg}20` }}>
                  {initials}
                </div>
              )}
              {uploadingPhoto ? (
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Spin size="small" />
                </div>
              ) : (
                <div style={{ position: "absolute", bottom: 0, right: 0, width: screens.xs ? 22 : 26, height: screens.xs ? 22 : 26, borderRadius: "50%", background: "var(--primary,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
                  <CameraOutlined style={{ color: "#fff", fontSize: screens.xs ? 10 : 12 }} />
                </div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: screens.xs ? 17 : 21, color: "var(--text-primary)", marginBottom: 8, textTransform: "capitalize" }}>
                {user?.name || "—"}
              </div>
              <Space size={6} wrap>
                <span style={pill(user?.isActive ? "#22C55E" : "#EF4444", user?.isActive ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)")}>
                  {user?.isActive ? "Active" : "Inactive"}
                </span>
                {user?.role?.name   && <span style={pill("#14B8A6", "rgba(20,184,166,0.2)")}>{user.role.name}</span>}
                {user?.school?.name && <span style={pill("#2563EB", "#e0f2fe")}>{user.school.name}</span>}
              </Space>
            </div>

            {!screens.xs && (
              <Space size={28} wrap style={{ marginLeft: 12 }}>
                {user?.email && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</div>
                    <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>{user.email}</div>
                  </div>
                )}
                {user?.phone && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone</div>
                    <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>{user.phone}</div>
                  </div>
                )}
              </Space>
            )}
          </Space>
        </div>

        {/* ── Tabs ── */}
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

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <div style={{ ...sectionPanel, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Personal Information</div>
                  <Button size="small" icon={<EditOutlined />} onClick={openEdit}>Edit</Button>
                </div>
                <Row gutter={[24, 4]}>
                  <Col xs={24} sm={12}><InfoRow label="Full Name" value={user?.name} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Email"     value={user?.email} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Phone"     value={user?.phone} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Role"      value={user?.role?.name} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="Status"    value={user?.isActive ? "Active" : "Inactive"} /></Col>
                  <Col xs={24} sm={12}><InfoRow label="School"    value={user?.school?.name} /></Col>
                </Row>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div style={{ ...sectionPanel, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Contact</div>
                <InfoRow label="Phone" value={user?.phone} />
                <InfoRow label="Email" value={user?.email} />
              </div>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Overview</div>
                <Row gutter={[16, 4]}>
                  <Col xs={12}><InfoRow label="Role"   value={user?.role?.name} /></Col>
                  <Col xs={12}><InfoRow label="Status" value={user?.isActive ? "Active" : "Inactive"} /></Col>
                  <Col xs={24}><InfoRow label="School" value={user?.school?.name} /></Col>
                </Row>
              </div>
            </Col>
          </Row>
        )}

        {/* ── Attendance tab ── */}
        {activeTab === "attendance" && (
          <div style={pageCard}>
            <div style={{ padding: 24 }}><AttendanceCalendar /></div>
          </div>
        )}

        {/* ── Settings tab → change password ── */}
        {activeTab === "settings" && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div style={sectionPanel}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LockOutlined style={{ color: "var(--primary)", fontSize: 16 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Change Password</div>
                    <div style={{ color: "var(--text-muted)" }}>Update your account password</div>
                  </div>
                </div>
                <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
                  <Form.Item
                    label="Current Password"
                    name="currentPassword"
                    rules={[{ required: true, message: "Enter your current password" }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Current password" autoComplete="current-password" />
                  </Form.Item>
                  <Form.Item
                    label="New Password"
                    name="newPassword"
                    rules={[
                      { required: true, message: "Enter a new password" },
                      { min: 6, message: "Password must be at least 6 characters" },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="New password" autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item
                    label="Confirm Password"
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                      { required: true, message: "Confirm your new password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                          return Promise.reject(new Error("Passwords do not match"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" autoComplete="new-password" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={pwdLoading} icon={<SaveOutlined />} block>
                    Update Password
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        )}

        {/* ── Tasks tab ── */}
        {activeTab === "tasks" && (
          <div style={{ ...sectionPanel, padding: "56px 24px", textAlign: "center" }}>
            <CheckSquareOutlined style={{ fontSize: 40, color: "var(--primary)", marginBottom: 16 }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 8 }}>My Tasks</div>
            <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>View and manage all tasks assigned to you</div>
            <Button type="primary" icon={<CheckSquareOutlined />} onClick={() => navigate("../tasks", { relative: "path" })}>
              Go to My Tasks
            </Button>
          </div>
        )}

        {/* ── Coming soon tabs ── */}
        {["messages", "files"].map((tab) =>
          activeTab === tab ? (
            <div key={tab} style={{ ...sectionPanel, padding: "56px 24px", textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)" }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} section coming soon
              </div>
            </div>
          ) : null
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal
        open={editing}
        onCancel={() => setEditing(false)}
        footer={null}
        title={
          <Space>
            <UserOutlined style={{ color: "var(--primary)" }} />
            Edit Profile
          </Space>
        }
        width={480}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveProfile} style={{ marginTop: 16 }}>
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
            <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter your email" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Button block onClick={() => setEditing(false)} icon={<CloseOutlined />}>Cancel</Button>
            </Col>
            <Col span={12}>
              <Button block type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>Save Changes</Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default Profile;

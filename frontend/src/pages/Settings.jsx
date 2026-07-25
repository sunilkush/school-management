import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { updateUser, changePassword } from "../features/authSlice";
import { fetchGlobalConfig, updateGlobalConfig } from "../features/globalConfigSlice";
import {
  Row,
  Col,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Upload,
  message,
  InputNumber,
} from "antd";
import {
  UserOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  NotificationOutlined,
  DatabaseOutlined,
  UploadOutlined,
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import PageHeader from "../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../styles/pageStyles";

const Settings = () => {
  const dispatch = useDispatch();
  const { themeMode, setThemeMode } = useTheme();

  const { user } = useSelector((state) => state.auth || {});
  const { config } = useSelector((state) => state.globalConfig || {});
  const isSuperAdmin = user?.role?.name === "Super Admin";

  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    theme: "light",

    currentPassword: "",
    newPassword: "",
    confirmPassword: "",

    smsKey: "",
    approvalRequired: true,
    maxSchools: 10,
    appName: "",
    maintenance: false,
  });

  useEffect(() => {
    if (isSuperAdmin) dispatch(fetchGlobalConfig());
  }, [dispatch, isSuperAdmin]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      theme: themeMode || "light",
    }));
  }, [themeMode]);

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!config) return;

    setForm((prev) => ({
      ...prev,
      smsKey: config.smsApiKey || "",
      approvalRequired: config.allowRegistration ?? true,
      maxSchools: config.maxSchools ?? 10,
      appName: config.platformName || "",
      maintenance: config.maintenanceMode ?? false,
    }));
  }, [config]);

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "theme") {
      setThemeMode(value);
    }
  };

  const handleSave = async () => {
    const wantsPasswordChange =
      form.newPassword || form.confirmPassword || form.currentPassword;

    if (wantsPasswordChange) {
      if (!form.currentPassword) {
        return message.error("Current password is required");
      }
      if (!form.newPassword) {
        return message.error("New password is required");
      }
      if (form.newPassword !== form.confirmPassword) {
        return message.error("New password and confirm password do not match");
      }
    }

    try {
      await dispatch(
        updateUser({
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          ...(avatarFile ? { avatarFile } : {}),
        })
      ).unwrap();

      if (wantsPasswordChange) {
        await dispatch(
          changePassword({
            oldPassword: form.currentPassword,
            newPassword: form.newPassword,
          })
        ).unwrap();

        setForm((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

      if (isSuperAdmin) {
        await dispatch(
          updateGlobalConfig({
            platformName: form.appName,
            maxSchools: form.maxSchools,
            maintenanceMode: form.maintenance,
            allowRegistration: form.approvalRequired,
            smsApiKey: form.smsKey,
          })
        ).unwrap();
      }

      message.success("Settings saved successfully");
    } catch (error) {
      message.error(typeof error === "string" ? error : error?.message || "Failed to save settings");
    }
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    message.info("Sensitive fields reset");
  };

  const SectionPanel = ({ icon, title, color, children }) => (
    <div style={{ ...sectionPanel, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={iconWell(color, 36)}>{icon}</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={pageWrapper}>
      <PageHeader
        title={`${user?.role?.name || "User"} Settings`}
        subtitle="Manage your account preferences and security"
        icon={<SettingOutlined />}
      />

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <SectionPanel icon={<UserOutlined />} title="Profile Settings" color="#2563EB">
            <Form layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Full Name">
                    <Input
                      value={form.fullName}
                      onChange={(e) =>
                        updateField("fullName", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Email">
                    <Input
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Phone Number">
                    <Input
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Profile Image">
                    <Upload
                      maxCount={1}
                      listType="picture"
                      beforeUpload={(file) => { setAvatarFile(file); return false; }}
                      onRemove={() => setAvatarFile(null)}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />}>Upload</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </SectionPanel>
        </Col>

        <Col xs={24} lg={12}>
          <SectionPanel icon={<SettingOutlined />} title="Preferences" color="#7C3AED">
            <Form layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Theme">
                    <Select
                      value={form.theme}
                      onChange={(value) => updateField("theme", value)}
                      options={[
                        { value: "light", label: "Light Theme" },
                        { value: "dark", label: "Dark Theme" },
                        { value: "system", label: "System Default" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </SectionPanel>
        </Col>

        <Col xs={24} lg={12}>
          <SectionPanel icon={<SafetyCertificateOutlined />} title="Security" color="#DC2626">
            <Form layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Current Password">
                    <Input.Password
                      value={form.currentPassword}
                      onChange={(e) =>
                        updateField("currentPassword", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="New Password">
                    <Input.Password
                      value={form.newPassword}
                      onChange={(e) =>
                        updateField("newPassword", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Confirm Password">
                    <Input.Password
                      value={form.confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </SectionPanel>
        </Col>

        {isSuperAdmin && (
          <Col xs={24} lg={12}>
            <SectionPanel icon={<NotificationOutlined />} title="Communication (Platform)" color="#F59E0B">
              <Form layout="vertical">
                <Row gutter={12}>
                  <Col xs={24}>
                    <Form.Item label="SMS Gateway API Key">
                      <Input
                        value={form.smsKey}
                        onChange={(e) => updateField("smsKey", e.target.value)}
                        placeholder="Configured in Global Config"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </SectionPanel>
          </Col>
        )}

        {isSuperAdmin && (
          <Col xs={24} lg={12}>
            <SectionPanel icon={<DatabaseOutlined />} title="Platform Settings" color="#14B8A6">
              <Form layout="vertical">
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Application Name">
                      <Input
                        value={form.appName}
                        onChange={(e) => updateField("appName", e.target.value)}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Max Allowed Schools">
                      <InputNumber
                        min={1}
                        style={{ width: "100%" }}
                        value={form.maxSchools}
                        onChange={(value) =>
                          updateField("maxSchools", value || 1)
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Allow New School Self-Registration">
                      <Switch
                        checked={form.approvalRequired}
                        onChange={(value) =>
                          updateField("approvalRequired", value)
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Maintenance Mode">
                      <Switch
                        checked={form.maintenance}
                        onChange={(value) => updateField("maintenance", value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </SectionPanel>
          </Col>
        )}
      </Row>

      <Space style={{ justifyContent: "flex-end", width: "100%", marginTop: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={resetForm}>
          Reset
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          Save Settings
        </Button>
      </Space>
    </div>
  );
};

export default Settings;

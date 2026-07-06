import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../features/authSlice";
import { fetchRoles } from "../features/roleSlice";
import { fetchSchools } from "../features/schoolSlice";
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
  ToolOutlined,
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
  const { roles = [] } = useSelector((state) => state.role || {});
  const { schools = [] } = useSelector((state) => state.school || {});

  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    theme: "light",
    language: "english",
    notifications: true,
    timezone: "Asia/Kolkata",

    defaultRole: "",
    academicYear: "",
    approvalRequired: true,
    maxSchools: 10,

    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,

    emailNotif: true,
    whatsappSupport: false,
    smsKey: "",
    emailSignature: "",

    autoBackup: false,
    backupFreq: "Daily",

    appName: "SchoolPro",
    maintenance: false,
  });

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

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
      defaultRole: user?.role?.name || "",
    }));
  }, [user]);

  const academicYearOptions = useMemo(() => {
    const values = schools
      ?.map((school) => {
        if (typeof school?.academicYear === "string") return school.academicYear;
        if (school?.academicYear?.name) return school.academicYear.name;
        if (school?.academicYear?.title) return school.academicYear.title;
        return null;
      })
      .filter(Boolean);

    return [...new Set(values)].map((year) => ({
      value: year,
      label: year,
    }));
  }, [schools]);

  const roleOptions = useMemo(() => {
    return (roles || []).map((role) => ({
      value: role?.name,
      label: role?.name,
    }));
  }, [roles]);

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
    try {
      if (
        form.newPassword ||
        form.confirmPassword ||
        form.currentPassword
      ) {
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

      await dispatch(
        updateUser({
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          ...(avatarFile ? { avatarFile } : {}),
        })
      ).unwrap();

      message.success("Settings saved successfully");
    } catch (error) {
      message.error(error?.message || typeof error === "string" ? error : "Failed to save settings");
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
        subtitle="Manage your account preferences, security and system configuration"
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

                <Col xs={24} md={12}>
                  <Form.Item label="Language">
                    <Select
                      value={form.language}
                      onChange={(value) => updateField("language", value)}
                      options={[
                        { value: "english", label: "English" },
                        { value: "hindi", label: "Hindi" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Timezone">
                    <Select
                      value={form.timezone}
                      onChange={(value) => updateField("timezone", value)}
                      options={[
                        { value: "Asia/Kolkata", label: "Asia/Kolkata" },
                        { value: "UTC", label: "UTC" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Enable Notifications">
                    <Switch
                      checked={form.notifications}
                      onChange={(value) =>
                        updateField("notifications", value)
                      }
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

                <Col xs={24} md={12}>
                  <Form.Item label="Enable Two-Factor Authentication">
                    <Switch
                      checked={form.twoFactor}
                      onChange={(value) => updateField("twoFactor", value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </SectionPanel>
        </Col>

        <Col xs={24} lg={12}>
          <SectionPanel icon={<NotificationOutlined />} title="Communication" color="#F59E0B">
            <Form layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Enable Email Notifications">
                    <Switch
                      checked={form.emailNotif}
                      onChange={(value) => updateField("emailNotif", value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Enable WhatsApp Support">
                    <Switch
                      checked={form.whatsappSupport}
                      onChange={(value) =>
                        updateField("whatsappSupport", value)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="SMS API Key">
                    <Input
                      value={form.smsKey}
                      onChange={(e) => updateField("smsKey", e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Email Signature">
                    <Input.TextArea
                      value={form.emailSignature}
                      onChange={(e) =>
                        updateField("emailSignature", e.target.value)
                      }
                      rows={3}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </SectionPanel>
        </Col>

        <Col xs={24} lg={12}>
          <SectionPanel icon={<DatabaseOutlined />} title="School & Backup" color="#14B8A6">
            <Form layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Default Role">
                    <Select
                      value={form.defaultRole}
                      onChange={(value) => updateField("defaultRole", value)}
                      options={roleOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Academic Year">
                    <Select
                      value={form.academicYear}
                      onChange={(value) => updateField("academicYear", value)}
                      options={academicYearOptions}
                      allowClear
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
                  <Form.Item label="Enable Approval for New Schools">
                    <Switch
                      checked={form.approvalRequired}
                      onChange={(value) =>
                        updateField("approvalRequired", value)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Auto Backup">
                    <Switch
                      checked={form.autoBackup}
                      onChange={(value) => updateField("autoBackup", value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Backup Frequency">
                    <Select
                      value={form.backupFreq}
                      onChange={(value) => updateField("backupFreq", value)}
                      options={[
                        { value: "Daily", label: "Daily" },
                        { value: "Weekly", label: "Weekly" },
                        { value: "Monthly", label: "Monthly" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </SectionPanel>
        </Col>

        <Col xs={24} lg={12}>
          <SectionPanel icon={<ToolOutlined />} title="System Settings" color="#0891B2">
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
                  <Form.Item label="Logo">
                    <Upload maxCount={1} beforeUpload={() => false}>
                      <Button icon={<UploadOutlined />}>Upload</Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col xs={24}>
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

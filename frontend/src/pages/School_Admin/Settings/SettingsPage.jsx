import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, updateUser } from "../../../features/authSlice";
import { fetchRoles } from "../../../features/roleSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import apiClient from "../../../api/httpClient";

import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Upload,
  Card,
  Row,
  Col,
  Tabs,
  message,
  Typography,
  Space,
  Spin,
} from "antd";

import {
  UploadOutlined,
  SaveOutlined,
  ReloadOutlined,
  UserOutlined,
  SettingOutlined,
  BankOutlined,
  LockOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const DEFAULT_SETTINGS = {
  theme: "system",
  language: "english",
  timezone: "UTC",
  notifications: true,
  autoBackup: true,
  backupFreq: "Weekly",
};

const Settings = () => {
  const dispatch = useDispatch();
  const { themeMode, setThemeMode } = useTheme();

  const { user } = useSelector((state) => state.auth || {});
  const { roles = [], loading: roleLoading } = useSelector((state) => state.role || {});
  const { schools = [], loading: schoolLoading } = useSelector((state) => state.school || {});

  const [form] = Form.useForm();
  const [razorpayForm] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [isRazorpaySaving, setIsRazorpaySaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeSchools = Array.isArray(schools) ? schools : [];

  const localStorageKey = useMemo(() => {
    const userId = user?._id || user?.id;
    return userId ? `schooladmin-settings-${userId}` : "schooladmin-settings";
  }, [user]);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

  useEffect(() => {
    const loadRazorpayConfig = async () => {
      try {
        const res = await apiClient.get("/payments/razorpay/config");
        const config = res?.data?.data || {};

        razorpayForm.setFieldsValue({
          keyId: config.keyId || "",
          keySecret: "",
          accountId: config.accountId || "",
          isEnabled: Boolean(config.isEnabled),
        });
      } catch (error) {
          return error.message
      }
    };

    loadRazorpayConfig();
  }, [razorpayForm]);

  const availableRoles = useMemo(() => {
    return safeRoles
      .filter((role) => role?.name)
      .map((role) => role.name);
  }, [safeRoles]);

  const availableAcademicYears = useMemo(() => {
    return [
      ...new Set(
        safeSchools
          .map((school) => {
            if (typeof school?.academicYear === "string") return school.academicYear;
            if (school?.academicYear?.name) return school.academicYear.name;
            if (school?.academicYear?.title) return school.academicYear.title;
            return null;
          })
          .filter(Boolean)
      ),
    ];
  }, [safeSchools]);

  useEffect(() => {
    if (!user) return;

    let storedSettings = {};
    try {
      const raw = localStorage.getItem(localStorageKey);
      storedSettings = raw ? JSON.parse(raw) : {};
    } catch {
      storedSettings = {};
    }

    form.setFieldsValue({
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      defaultRole: user?.role?.name || "",
      academicYear: storedSettings?.academicYear || availableAcademicYears?.[0],
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      theme: storedSettings?.theme || themeMode || "system",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [user, form, localStorageKey, availableAcademicYears, themeMode]);

  useEffect(() => {
    form.setFieldValue("theme", themeMode);
  }, [themeMode, form]);

  const handleSave = async (values) => {
    setIsSaving(true);

    try {
      const shouldChangePassword =
        values.currentPassword || values.newPassword || values.confirmPassword;

      const jobs = [
        dispatch(
          updateUser({
            name: values.fullName,
            email: values.email,
            phone: values.phone,
            ...(avatarFile ? { avatarFile } : {}),
          })
        ).unwrap(),
      ];

      if (shouldChangePassword) {
        if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
          throw new Error("To change password, fill current, new and confirm password fields.");
        }

        if (values.newPassword !== values.confirmPassword) {
          throw new Error("New password and confirm password must be same.");
        }

        jobs.push(
          dispatch(
            changePassword({
              oldPassword: values.currentPassword,
              newPassword: values.newPassword,
            })
          ).unwrap()
        );
      }

      await Promise.all(jobs);

      const {
        // eslint-disable-next-line no-unused-vars
        fullName,
        // eslint-disable-next-line no-unused-vars
        email,
        // eslint-disable-next-line no-unused-vars
        phone,
        // eslint-disable-next-line no-unused-vars
        currentPassword,
        // eslint-disable-next-line no-unused-vars
        newPassword,
        // eslint-disable-next-line no-unused-vars
        confirmPassword,
        ...settingsToPersist
      } = values;

      localStorage.setItem(localStorageKey, JSON.stringify(settingsToPersist));
      setThemeMode(values.theme);

      form.setFieldsValue({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      message.success("Settings updated successfully!");
    } catch (error) {
      message.error(error?.message || "Unable to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!user) return;

    localStorage.removeItem(localStorageKey);
    form.resetFields();

    form.setFieldsValue({
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      defaultRole: user?.role?.name || "",
      academicYear: availableAcademicYears?.[0],
      ...DEFAULT_SETTINGS,
      theme: themeMode || "system",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    message.info("Settings reset to default values.");
  };

  const handleRazorpaySave = async (values) => {
    setIsRazorpaySaving(true);

    try {
      await apiClient.put("/payments/razorpay/config", values);
      message.success("Razorpay settings saved successfully.");
      razorpayForm.setFieldValue("keySecret", "");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Unable to save Razorpay settings."
      );
    } finally {
      setIsRazorpaySaving(false);
    }
  };

  const isLoading = roleLoading || schoolLoading;

  const tabItems = [
    {
      key: "profile",
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: "Full name is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter full name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Enter phone number" />
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
      ),
    },
    {
      key: "preferences",
      label: (
        <span>
          <SettingOutlined /> Preferences
        </span>
      ),
      children: (
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Theme" name="theme">
              <Select
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System Default" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Language" name="language">
              <Select
                options={[
                  { value: "english", label: "English" },
                  { value: "hindi", label: "Hindi" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Timezone" name="timezone">
              <Select
                showSearch
                optionFilterProp="label"
                options={[
                  { value: "UTC", label: "UTC" },
                  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
                  { value: "America/New_York", label: "America/New_York" },
                  { value: "America/Chicago", label: "America/Chicago" },
                  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Notifications"
              name="notifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: "school",
      label: (
        <span>
          <BankOutlined /> School
        </span>
      ),
      children: (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Default Role" name="defaultRole">
              <Select
                placeholder="Select role"
                allowClear
                options={availableRoles.map((roleName) => ({
                  value: roleName,
                  label: roleName,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Academic Year" name="academicYear">
              <Select
                placeholder="Select academic year"
                allowClear
                options={availableAcademicYears.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Card title="Razorpay Integration" size="small">
              <Form
                form={razorpayForm}
                layout="vertical"
                onFinish={handleRazorpaySave}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Razorpay Key ID"
                      name="keyId"
                      rules={[{ required: true, message: "Key ID is required" }]}
                    >
                      <Input placeholder="rzp_live_xxxxxxxx" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Razorpay Key Secret"
                      name="keySecret"
                      extra="Leave blank to keep existing secret."
                    >
                      <Input.Password placeholder="Enter new key secret (optional)" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Razorpay Account ID" name="accountId">
                      <Input placeholder="acc_xxxxxxxx" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Enable Razorpay payment for this school"
                      name="isEnabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>

                  <Col
                    xs={24}
                    md={12}
                    style={{ display: "flex", justifyContent: "flex-end", alignItems: "end" }}
                  >
                    <Button
                      type="primary"
                      onClick={() => razorpayForm.submit()}
                      loading={isRazorpaySaving}
                    >
                      Save Razorpay Settings
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "security",
      label: (
        <span>
          <LockOutlined /> Security
        </span>
      ),
      children: (
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Current Password" name="currentPassword">
              <Input.Password autoComplete="current-password" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="New Password" name="newPassword">
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Confirm password must match new password")
                    );
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <div style={{
              background: "#f8fafc", border: "1px dashed #d1d5db",
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              color: "#6b7280", fontSize: 13,
            }}>
              <LockOutlined />
              <span><strong>Two-Factor Authentication</strong> — Coming soon. You will be able to secure your account with an authenticator app.</span>
            </div>
          </Col>
        </Row>
      ),
    },
    {
      key: "backup",
      label: (
        <span>
          <DatabaseOutlined /> Backup
        </span>
      ),
      children: (
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Auto Backup" name="autoBackup" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Backup Frequency" name="backupFreq">
              <Select
                options={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                  { value: "Monthly", label: "Monthly" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <div style={{
              background: "#f8fafc", border: "1px dashed #d1d5db",
              borderRadius: 10, padding: "12px 16px",
              color: "#6b7280", fontSize: 13,
            }}>
              <DatabaseOutlined style={{ marginRight: 8 }} />
              Backup preferences are saved locally. Automated cloud backups are managed by your system administrator.
            </div>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: 20, margin: "0 auto" }}>
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <SettingOutlined /> Settings
        </Title>
        <Text type="secondary">
          Manage your account, system and preferences
        </Text>
      </Card>

      <Spin spinning={isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Card>
            <Tabs defaultActiveKey="profile" tabPosition="left" items={tabItems} />
          </Card>

          <Card style={{ marginTop: 20 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={isSaving}
              >
                Save Changes
              </Button>
            </Space>
          </Card>
        </Form>
      </Spin>
    </div>
  );
};

export default Settings;
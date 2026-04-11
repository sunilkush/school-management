/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, updateUser } from "../../../features/authSlice";
import { fetchRoles } from "../../../features/roleSlice";
import { fetchSchools } from "../../../features/schoolSlice";

import {
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
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

const { Option } = Select;
const { Title, Text } = Typography;

const DEFAULT_SETTINGS = {
  theme: "system",
  language: "english",
  timezone: "UTC",
  notifications: true,
  approvalRequired: true,
  maxSchools: 10,
  twoFactor: false,
  autoBackup: true,
  backupFreq: "Weekly",
};

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { roles, loading: roleLoading } = useSelector((state) => state.role);
  const { schools, loading: schoolLoading } = useSelector((state) => state.school);

  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const { themeMode, setThemeMode } = useTheme();

  const localStorageKey = useMemo(() => {
    const userId = user?._id || user?.id;
    return userId ? `schooladmin-settings-${userId}` : "schooladmin-settings";
  }, [user]);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;

    const storedSettings = (() => {
      try {
        const data = localStorage.getItem(localStorageKey);
        return data ? JSON.parse(data) : {};
      } catch {
        return {};
      }
    })();

    const availableYears = (schools || [])
      .map((s) => s?.academicYear)
      .filter(Boolean);

    form.setFieldsValue({
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      defaultRole: user?.role?.name || "",
      academicYear: storedSettings?.academicYear || availableYears[0],
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      theme: storedSettings?.theme || themeMode,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [user, form, schools, localStorageKey]);


  useEffect(() => {
    form.setFieldValue("theme", themeMode);
  }, [themeMode, form]);

  const availableRoles = useMemo(
    () => (roles || []).filter((r) => r?.name).map((r) => r.name),
    [roles]
  );

  const availableAcademicYears = useMemo(
    () => [...new Set((schools || []).map((s) => s?.academicYear).filter(Boolean))],
    [schools]
  );

  const handleSave = async (values) => {
    setIsSaving(true);

    try {
      const profilePromise = dispatch(
        updateUser({
          name: values.fullName,
          email: values.email,
          phone: values.phone,
        })
      ).unwrap();

      const shouldChangePassword =
        values.currentPassword || values.newPassword || values.confirmPassword;

      const jobs = [profilePromise];

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
        fullName,
        email,
        phone,
        currentPassword,
        newPassword,
        confirmPassword,
        ...settingsToPersist
      } = values;

      localStorage.setItem(localStorageKey, JSON.stringify(settingsToPersist));
      setThemeMode(values.theme);
      form.setFieldsValue({ currentPassword: "", newPassword: "", confirmPassword: "" });

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
      ...DEFAULT_SETTINGS,
      theme: themeMode,
      academicYear: availableAcademicYears[0],
    });

    message.info("Settings reset to default values.");
  };

  const isLoading = roleLoading || schoolLoading;

  return (
    <div style={{ padding: 20, margin: "0 auto" }}>
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <Title level={3}>
          <SettingOutlined /> Settings
        </Title>
        <Text type="secondary">Manage your account, system and preferences</Text>
      </Card>

      <Spin spinning={isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Card>
            <Tabs defaultActiveKey="profile" tabPosition="left" style={{ minHeight: 400 }}>
              <Tabs.TabPane
                tab={
                  <span>
                    <UserOutlined /> Profile
                  </span>
                }
                key="profile"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Full Name" name="fullName" rules={[{ required: true }]}>
                      <Input prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Phone" name="phone">
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Profile Image">
                      <Upload maxCount={1} listType="picture" beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <SettingOutlined /> Preferences
                  </span>
                }
                key="preferences"
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item label="Theme" name="theme">
                      <Select>
                        <Option value="light">Light</Option>
                        <Option value="dark">Dark</Option>
                        <Option value="system">System Default</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Language" name="language">
                      <Select>
                        <Option value="english">English</Option>
                        <Option value="hindi">Hindi</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Timezone" name="timezone">
                      <Select showSearch optionFilterProp="children">
                        <Option value="UTC">UTC</Option>
                        <Option value="Asia/Kolkata">Asia/Kolkata</Option>
                        <Option value="America/New_York">America/New_York</Option>
                        <Option value="America/Chicago">America/Chicago</Option>
                        <Option value="America/Los_Angeles">America/Los_Angeles</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item name="notifications" valuePropName="checked">
                      <Switch /> Enable Notifications
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <BankOutlined /> School
                  </span>
                }
                key="school"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Default Role" name="defaultRole">
                      <Select placeholder="Select role" allowClear>
                        {availableRoles.map((roleName) => (
                          <Option key={roleName} value={roleName}>
                            {roleName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Academic Year" name="academicYear">
                      <Select placeholder="Select academic year" allowClear>
                        {availableAcademicYears.map((year) => (
                          <Option key={year} value={year}>
                            {year}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item name="approvalRequired" valuePropName="checked">
                      <Switch /> Approval Required
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Max Schools" name="maxSchools">
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <LockOutlined /> Security
                  </span>
                }
                key="security"
              >
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
                    <Form.Item name="twoFactor" valuePropName="checked">
                      <Switch /> Enable 2FA
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <DatabaseOutlined /> Backup
                  </span>
                }
                key="backup"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="autoBackup" valuePropName="checked">
                      <Switch /> Auto Backup
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Backup Frequency" name="backupFreq">
                      <Select>
                        <Option value="Daily">Daily</Option>
                        <Option value="Weekly">Weekly</Option>
                        <Option value="Monthly">Monthly</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Tabs.TabPane>
            </Tabs>
          </Card>

          <Card style={{ marginTop: 20 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>

              <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={isSaving}>
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
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../../features/authSlice";
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

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);

  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user?.name,
        email: user?.email,
        phone: user?.phone,
        defaultRole: user?.role?.name,
        theme: "light",
        language: "english",
        timezone: "Asia/Kolkata",
        notifications: true,
        approvalRequired: true,
        maxSchools: 10,
        twoFactor: false,
        autoBackup: true,
        backupFreq: "Weekly",
      });
    }
  }, [user, form]);

  const handleSave = (values) => {
    dispatch(
      updateUser({
        name: values.fullName,
        email: values.email,
        phone: values.phone,
      })
    );
    message.success("Settings updated successfully!");
  };

  return (
    <div style={{ padding: 20, margin: "0 auto" }}>
      
      {/* HEADER */}
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <Title level={3}>
          <SettingOutlined /> Settings
        </Title>
        <Text type="secondary">
          Manage your account, system and preferences
        </Text>
      </Card>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        
        <Card>
          <Tabs
            defaultActiveKey="profile"
            tabPosition="left"
            style={{ minHeight: 400 }}
          >
            {/* PROFILE TAB */}
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
                    <Upload maxCount={1} listType="picture">
                      <Button icon={<UploadOutlined />}>Upload</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>

            {/* PREFERENCES */}
            <Tabs.TabPane
              tab={
                <span>
                  <SettingOutlined /> Preferences
                </span>
              }
              key="preferences"
            >
              <Row gutter={16}>
                <Col md={8}>
                  <Form.Item label="Theme" name="theme">
                    <Select>
                      <Option value="light">Light</Option>
                      <Option value="dark">Dark</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item label="Language" name="language">
                    <Select>
                      <Option value="english">English</Option>
                      <Option value="hindi">Hindi</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item label="Timezone" name="timezone">
                    <Select>
                      <Option value="Asia/Kolkata">Asia/Kolkata</Option>
                      <Option value="UTC">UTC</Option>
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

            {/* SCHOOL */}
            <Tabs.TabPane
              tab={
                <span>
                  <BankOutlined /> School
                </span>
              }
              key="school"
            >
              <Row gutter={16}>
                <Col md={12}>
                  <Form.Item label="Default Role" name="defaultRole">
                    <Select>
                      {roles.map((r) => (
                        <Option key={r._id} value={r.name}>
                          {r.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col md={12}>
                  <Form.Item label="Academic Year" name="academicYear">
                    <Select>
                      {schools.map((s) => (
                        <Option key={s._id} value={s.academicYear}>
                          {s.academicYear}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col md={12}>
                  <Form.Item name="approvalRequired" valuePropName="checked">
                    <Switch /> Approval Required
                  </Form.Item>
                </Col>

                <Col md={12}>
                  <Form.Item label="Max Schools" name="maxSchools">
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>

            {/* SECURITY */}
            <Tabs.TabPane
              tab={
                <span>
                  <LockOutlined /> Security
                </span>
              }
              key="security"
            >
              <Row gutter={16}>
                <Col md={8}>
                  <Form.Item label="Current Password" name="currentPassword">
                    <Input.Password />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item label="New Password" name="newPassword">
                    <Input.Password />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item label="Confirm Password" name="confirmPassword">
                    <Input.Password />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="twoFactor" valuePropName="checked">
                    <Switch /> Enable 2FA
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>

            {/* BACKUP */}
            <Tabs.TabPane
              tab={
                <span>
                  <DatabaseOutlined /> Backup
                </span>
              }
              key="backup"
            >
              <Row gutter={16}>
                <Col md={12}>
                  <Form.Item name="autoBackup" valuePropName="checked">
                    <Switch /> Auto Backup
                  </Form.Item>
                </Col>

                <Col md={12}>
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

        {/* FOOTER */}
        <Card style={{ marginTop: 20 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<ReloadOutlined />} htmlType="reset">
              Reset
            </Button>

            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
              Save Changes
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default Settings;
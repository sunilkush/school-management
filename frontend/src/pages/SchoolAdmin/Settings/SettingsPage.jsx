import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../../features/authSlice";
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
  Collapse,
  message,
  Typography,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Panel } = Collapse;
const { Title } = Typography;

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
        notifications: true,
        timezone: "Asia/Kolkata",
        approvalRequired: true,
        maxSchools: 10,
        twoFactor: false,
        emailNotif: true,
        smsKey: "",
        emailSignature: "",
        whatsappSupport: false,
        autoBackup: true,
        backupFreq: "Weekly",
        appName: "SchoolPro",
        maintenance: false,
      });
    }
  }, [user, form]);

  const handleSave = (values) => {
    dispatch(updateProfile({ name: values.fullName, email: values.email, phone: values.phone }));
    message.success("Settings saved successfully!");
  };

  return (
    <div className="p-6 w-full mx-auto">
      <Title level={2} className="text-blue-700 mb-6">{user?.role?.name} Settings</Title>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Collapse defaultActiveKey={["profile"]} ghost>
          {/* Profile Settings */}
          <Panel header="👤 Profile Settings" key="profile" style={{background:"white",border:"1px soild #dcdcdc"}}>
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Full Name"
                    name="fullName"
                    rules={[{ required: true, message: "Enter full name" }]}
                  >
                    <Input placeholder="Full Name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, type: "email", message: "Enter valid email" }]}
                  >
                    <Input placeholder="Email" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Phone" name="phone">
                    <Input placeholder="Phone Number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Profile Picture">
                    <Upload maxCount={1}>
                      <Button icon={<UploadOutlined />}>Upload</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Panel>

          {/* Preferences */}
          <Panel header="⚙️ Preferences" key="preferences" style={{background:"white",border:"1px soild #dcdcdc"}}>
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="Theme" name="theme">
                    <Select>
                      <Option value="light">Light</Option>
                      <Option value="dark">Dark</Option>
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
                    <Select>
                      <Option value="Asia/Kolkata">Asia/Kolkata</Option>
                      <Option value="UTC">UTC</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Enable Notifications" name="notifications" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Panel>

          {/* School Management */}
          <Panel header="🏫 School Management" key="school" style={{background:"white",border:"1px soild #dcdcdc"}}>
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Default Role" name="defaultRole">
                    <Select placeholder="Select role">
                      {roles.map((role) => (
                        <Option key={role._id} value={role.name}>
                          {role.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Academic Year" name="academicYear">
                    <Select placeholder="Select Academic Year">
                      {schools.map((school) => (
                        <Option key={school._id} value={school.academicYear}>
                          {school.academicYear}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Enable Approval for New Schools" name="approvalRequired" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Max Allowed Schools" name="maxSchools">
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Panel>

          {/* Security */}
          <Panel header="🔐 Security" key="security" style={{background:"white",border:"1px soild #dcdcdc"}}>
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="Current Password" name="currentPassword">
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="New Password" name="newPassword">
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Confirm Password" name="confirmPassword">
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Enable 2FA" name="twoFactor" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Panel>

          {/* Communication */}
          <Panel header="📢 Communication" key="communication" style={{background:"white",border:"1px soild #dcdcdc"}}>
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Enable Email Notifications" name="emailNotif" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="SMS API Key" name="smsKey">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Email Signature" name="emailSignature">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Enable WhatsApp Support" name="whatsappSupport" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Panel>

          {/* Backup & System */}
          <Panel header="💾 Backup & System" key="backup" style={{background:"white",border:"1px soild #dcdcdc"}}>
            <Card bordered={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Enable Auto Backup" name="autoBackup" valuePropName="checked">
                    <Switch />
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
                <Col xs={24} md={12}>
                  <Form.Item label="App Name" name="appName">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Maintenance Mode" name="maintenance" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Panel>
        </Collapse>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="default" htmlType="reset">
            Reset
          </Button>
          <Button type="primary" htmlType="submit">
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;

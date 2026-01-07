import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addSchool, resetSchoolState } from "../../features/schoolSlice";
import {
  Card,
  Form,
  Input,
  Checkbox,
  Button,
  Upload,
  Row,
  Col,
  Typography,
  Divider,
  message,
} from "antd";
import { UploadOutlined, BankOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const AddSchoolForm = () => {
  const dispatch = useDispatch();
  const { loading, error, message: successMessage, success } = useSelector(
    (state) => state.school
  );

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  /* ==================== RESET STATE ==================== */
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(resetSchoolState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  /* ==================== LOGO HANDLER ==================== */
  const handleLogoChange = ({ file }) => {
    if (!file) return;

    if (file.size > 50 * 1024) {
      message.error("Logo size must be less than or equal to 50KB");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  /* ==================== SUBMIT ==================== */
  const onFinish = (values) => {
    const payload = {
      ...values,
      logo: logoFile || null,
    };
    dispatch(addSchool(payload));
  };

  /* ==================== UI ==================== */
  return (
    <Card
      className="rounded-2xl shadow-sm"
      style={{ maxWidth: 900, margin: "0 auto" }}
    >
      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 mb-2">
        <BankOutlined style={{ fontSize: 28, color: "#1677ff" }} />
        <div>
          <Title level={4} className="!mb-0">
            Add New School
          </Title>
          <Text type="secondary">
            Create and manage a school under the system
          </Text>
        </div>
      </div>

      <Divider />

      {/* ===== FEEDBACK ===== */}
      {error && (
        <Text type="danger" className="block mb-3">
          {error}
        </Text>
      )}
      {success && (
        <Text type="success" className="block mb-3">
          {successMessage || "School added successfully!"}
        </Text>
      )}

      {/* ===== FORM ===== */}
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ isActive: true }}
      >
        {/* ===== BASIC INFO ===== */}
        <Title level={5}>Basic Information</Title>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item
              label="School Name"
              name="name"
              rules={[{ required: true, message: "Please enter school name" }]}
            >
              <Input placeholder="e.g. Delhi Public School" />
            </Form.Item>
          </Col>

          <Col md={12}>
            <Form.Item
              label="Contact Email"
              name="email"
              rules={[
                { required: true, message: "Please enter contact email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input placeholder="school@email.com" />
            </Form.Item>
          </Col>
        </Row>

        {/* ===== CONTACT INFO ===== */}
        <Title level={5}>Contact Details</Title>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item label="Phone Number" name="phone">
              <Input placeholder="Contact number" />
            </Form.Item>
          </Col>

          <Col md={12}>
            <Form.Item label="Website" name="website">
              <Input placeholder="https://schoolwebsite.com" />
            </Form.Item>
          </Col>

          <Col md={24}>
            <Form.Item label="Address" name="address">
              <Input.TextArea rows={2} placeholder="School address" />
            </Form.Item>
          </Col>
        </Row>

        {/* ===== STATUS ===== */}
        <Title level={5}>Status</Title>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>School is Active</Checkbox>
        </Form.Item>

        {/* ===== BRANDING ===== */}
        <Title level={5}>Branding</Title>

        <Form.Item label="School Logo (Max 50 KB)">
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleLogoChange}
          >
            <Button icon={<UploadOutlined />}>Upload Logo</Button>
          </Upload>

          {logoPreview && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={logoPreview}
                alt="Logo Preview"
                width={56}
                height={56}
                style={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Text type="secondary">Logo Preview</Text>
            </div>
          )}
        </Form.Item>

        <Divider />

        {/* ===== ACTION ===== */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full"
          >
            {loading ? "Saving School..." : "Create School"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddSchoolForm;

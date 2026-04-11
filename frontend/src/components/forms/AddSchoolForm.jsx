import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addSchool, resetSchoolState } from "../../features/schoolSlice";
import { getBoards } from "../../features/boardSlice";
import {fetchSubscriptionPlans} from "../../features/subscriptionPlanSlice";
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
  Select,
} from "antd";
import { UploadOutlined, BankOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;

const AddSchoolForm = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { loading, error, message: successMessage, success } = useSelector(
    (state) => state.school
  );
   const boards = useSelector((state) => state.boards?.boards || []);
   const { plans} = useSelector((state) => state.subscriptionPlans);
  /* ==================== FETCH BOARDS ==================== */
  useEffect(() => {
    dispatch(getBoards());
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);
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
  useEffect(() => {
  if (success) {
    form.resetFields();
    setLogoFile(null);
    setLogoPreview(null);
    message.success("School created successfully!");

    const timer = setTimeout(() => {
      dispatch(resetSchoolState());
    }, 3000);

    return () => clearTimeout(timer);
  }

  if (error) {
    message.error(error);
  }
}, [success, error, dispatch, form]);
  /* ==================== UI ==================== */
  return (
    <Card
      className="rounded-2xl shadow-sm"
      style={{ maxWidth: 900, margin: "0 auto" }}
    >
      

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
        form={form}
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
      
          {/* ===== CONFIGURATION ===== */}
        <Title level={5}>Configuration</Title>
        <Row gutter={16}>
          <Col md={12}>
            <Form.Item label="Exam Board" name="boards">
               <Select mode="multiple" placeholder="Select boards">
                {boards.map((board) => (
                  <Select.Option key={board._id} value={board._id}>
                    {board.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col md={12}>
            <Form.Item label="Subscription Plan" name="subscriptionPlan">
              <Select placeholder="Select plan">
                {plans.map((plan) => (
                  <Select.Option key={plan._id} value={plan._id}>
                    {plan.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

        </Row>
        <Row>
          <Col md={12}>
           {/* ===== STATUS ===== */}
        <Title level={5}>Status</Title>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>School is Active</Checkbox>
        </Form.Item></Col>
          <Col md={12}>
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
        </Form.Item></Col>
        </Row>
       
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

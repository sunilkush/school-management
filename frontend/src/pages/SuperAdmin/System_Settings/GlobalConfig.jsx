import React, { useState } from "react";
import { Card } from "antd";
import { Input, Select, Upload, Button, Form } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

const GlobalConfig = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    defaultAcademicYear: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    logo: null,
  });

  const handleChange = (value, name) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = ({ file }) => {
    setFormData({ ...formData, logo: file });
  };

  const handleSubmit = () => {
    console.log("Submitted Data:", formData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">🌍 Global Configuration</h1>

      <Card className="shadow-lg rounded-xl p-4">
        <Form layout="vertical" onFinish={handleSubmit} className="space-y-4">
          <Form.Item label="School Name">
            <Input
              placeholder="Enter School Name"
              value={formData.schoolName}
              onChange={(e) => handleChange(e.target.value, "schoolName")}
              className="!py-2"
            />
          </Form.Item>

          <Form.Item label="Default Academic Year">
            <Input
              placeholder="2025-2026"
              value={formData.defaultAcademicYear}
              onChange={(e) => handleChange(e.target.value, "defaultAcademicYear")}
              className="!py-2"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Currency">
              <Select
                value={formData.currency}
                onChange={(val) => handleChange(val, "currency")}
                className="w-full"
              >
                <Option value="INR">INR (₹)</Option>
                <Option value="USD">USD ($)</Option>
                <Option value="EUR">EUR (€)</Option>
                <Option value="GBP">GBP (£)</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Timezone">
              <Select
                value={formData.timezone}
                onChange={(val) => handleChange(val, "timezone")}
                className="w-full"
              >
                <Option value="Asia/Kolkata">Asia/Kolkata</Option>
                <Option value="UTC">UTC</Option>
                <Option value="America/New_York">America/New_York</Option>
                <Option value="Europe/London">Europe/London</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Date Format">
            <Select
              value={formData.dateFormat}
              onChange={(val) => handleChange(val, "dateFormat")}
            >
              <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
              <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
              <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Theme">
            <Select
              value={formData.theme}
              onChange={(val) => handleChange(val, "theme")}
            >
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
              <Option value="auto">Auto</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Upload Logo">
            <Upload beforeUpload={() => false} onChange={handleFileChange}>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            className="bg-blue-600 hover:!bg-blue-700 px-6 py-2 rounded-md"
          >
            Save Configuration
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default GlobalConfig;

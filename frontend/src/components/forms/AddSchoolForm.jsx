import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addSchool, resetSchoolState } from "../../features/schoolSlice";
import { Form, Input, Checkbox, Button, Upload, message as antdMessage } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const AddSchoolForm = () => {
  const dispatch = useDispatch();
  const { loading, error, message: successMessage, success } = useSelector((state) => state.school);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(resetSchoolState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const handleLogoChange = ({ file }) => {
    if (file) {
      if (file.size > 50 * 1024) {
        antdMessage.error("Logo size must be less than or equal to 50KB");
        setLogoFile(null);
        setLogoPreview(null);
      } else {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      }
    }
  };

  const onFinish = (values) => {
    if (logoFile) {
      values.logo = logoFile;
    }
    dispatch(addSchool(values));
  };

  return (
    <div className="overflow-y-auto ">
      
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ isActive: false }}
      >
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{successMessage || 'School added successfully!'}</div>}

        <Form.Item
          label="School Name"
          name="name"
          rules={[{ required: true, message: 'Please enter school name' }]}
        >
          <Input placeholder="Enter school name" />
        </Form.Item>

        <Form.Item
          label="Contact Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter contact email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input placeholder="Enter address" />
        </Form.Item>

        <Form.Item label="Phone Number" name="phone">
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item label="Website" name="website">
          <Input placeholder="Enter website URL" />
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Is Active</Checkbox>
        </Form.Item>

        <Form.Item label="Logo (Max 50 KB)">
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={() => false} // prevent auto upload
            onChange={handleLogoChange}
          >
            <Button icon={<UploadOutlined />}>Select Logo</Button>
          </Upload>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo Preview"
              width={50}
              height={50}
              className="mt-2 rounded border"
            />
          )}
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!!logoFile && logoFile.size > 50 * 1024}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Add School'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddSchoolForm;

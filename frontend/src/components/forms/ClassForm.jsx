import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  Select,
  Button,
  Space,
  Typography,
} from "antd";
import {
  createClass,
  updateClass,
} from "../../features/classSlice";

const { Title, Text } = Typography;

const CLASS_OPTIONS = [
  "1st","2nd","3rd","4th","5th","6th",
  "7th","8th","9th","10th","11th","12th",
];

const ClassForm = ({ onClose, onSuccess, initialData }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.class);

  // ✅ Set initial values for edit
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        schoolId: initialData.schoolId,
        academicYearId: initialData.academicYearId,
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  // ✅ Submit handler
  const handleFinish = async (values) => {
    try {
      if (initialData?._id) {
        await dispatch(
          updateClass({
            id: initialData._id,
            classData: values,
          })
        ).unwrap();
      } else {
        await dispatch(createClass(values)).unwrap();
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Class save failed:", error);
    }
  };

  return (
    <div className="max-w-md">
      {/* Header */}
      <div className="mb-4">
        <Title level={4} className="!mb-1">
          {initialData ? "Update Class" : "Create New Class"}
        </Title>
        <Text type="secondary">
          Define academic class for your school
        </Text>
      </div>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        autoComplete="off"
      >
        {/* Class Name */}
        <Form.Item
          label="Class Name"
          name="name"
          rules={[
            { required: true, message: "Please select a class" },
          ]}
        >
          <Select
            size="large"
            placeholder="Select Class"
            options={CLASS_OPTIONS.map((cls) => ({
              label: cls,
              value: cls,
            }))}
          />
        </Form.Item>

        {/* Action Buttons */}
        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onClose}>
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {initialData ? "Update Class" : "Create Class"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ClassForm;

import { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Select,
  Card,
  Space,
  Divider,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
} from "../../features/subscriptionPlanSlice.js";

const { Title, Text } = Typography;

const PlanForm = ({ initialValues, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.subscriptionPlans);

  const moduleOptions = [
    "Schools",
    "Users",
    "Teachers",
    "Students",
    "Parents",
    "Classes",
    "Subjects",
    "Exams",
    "Attendance",
    "Finance",
    "Fees",
    "Reports",
    "Hostel",
    "Transport",
    "Assignments",
    "Timetable",
    "Notifications",
    "Expenses",
    "Library",
    "Books",
    "IssuedBooks",
    "Rooms",
    "Routes",
    "Vehicles",
  ];

  // 🔹 Prefill for edit
  useEffect(() => {
    if (initialValues) {
      const features =
        initialValues.features?.map((f) => ({
          module: f.module,
          allowed: f.allowed ?? true,
          limitKey: f.limits ? Object.keys(f.limits)[0] : "",
          limitValue: f.limits ? Object.values(f.limits)[0] : undefined,
        })) || [];

      form.setFieldsValue({ ...initialValues, features });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  // 🔹 Submit
  const onFinish = (values) => {
    const features =
      values.features?.map((f) => ({
        module: f.module,
        allowed: f.allowed ?? true,
        limits: f.limitKey ? { [f.limitKey]: f.limitValue } : {},
      })) || [];

    const payload = { ...values, features };

    if (initialValues?._id) {
      dispatch(
        updateSubscriptionPlan({
          id: initialValues._id,
          formData: payload,
        })
      );
    } else {
      dispatch(createSubscriptionPlan(payload));
    }

    onClose();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {/* PLAN DETAILS */}
      <Card>
        <Title level={4}>Plan Details</Title>

        <Form.Item
          label="Plan Name"
          name="name"
          rules={[{ required: true, message: "Plan name is required" }]}
        >
          <Input size="large" placeholder="Premium / Enterprise / Starter" />
        </Form.Item>

        <Space size="large" style={{ display: "flex" }}>
          <Form.Item
            label="Price (₹)"
            name="price"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={1} size="large" className="w-full" />
          </Form.Item>

          <Form.Item
            label="Duration (Days)"
            name="durationInDays"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={1} size="large" className="w-full" />
          </Form.Item>
        </Space>
      </Card>

      <Divider />

      {/* FEATURES */}
      <Form.List name="features">
        {(fields, { add, remove }) => (
          <Card
            title="Features & Modules"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={add}>
                Add Module
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {fields.map(({ key, name }) => (
                <Card
                  key={key}
                  size="small"
                  type="inner"
                  title={`Module ${name + 1}`}
                  extra={
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  }
                >
                  <Space size="large" style={{ display: "flex" }}>
                    <Form.Item
                      label="Module"
                      name={[name, "module"]}
                      rules={[{ required: true }]}
                      style={{ flex: 2 }}
                    >
                      <Select
                        placeholder="Select module"
                        options={moduleOptions.map((m) => ({
                          label: m,
                          value: m,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Allowed"
                      name={[name, "allowed"]}
                      valuePropName="checked"
                      style={{ flex: 1 }}
                    >
                      <Switch />
                    </Form.Item>
                  </Space>

                  <Space size="large" style={{ display: "flex" }}>
                    <Form.Item
                      label="Limit Key"
                      name={[name, "limitKey"]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="e.g. maxStudents" />
                    </Form.Item>

                    <Form.Item
                      label="Limit Value"
                      name={[name, "limitValue"]}
                      style={{ flex: 1 }}
                    >
                      <InputNumber className="w-full" />
                    </Form.Item>
                  </Space>
                </Card>
              ))}

              {fields.length === 0 && (
                <Text type="secondary">
                  No modules added yet. Click “Add Module” to begin.
                </Text>
              )}
            </Space>
          </Card>
        )}
      </Form.List>

      <Divider />

      {/* STATUS & ACTIONS */}
      <Card>
        <Form.Item
          label="Plan Status"
          name="isActive"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Space style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={() => form.resetFields()}>Reset</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? "Update Plan" : "Create Plan"}
          </Button>
        </Space>
      </Card>
    </Form>
  );
};

export default PlanForm;

import { useEffect } from "react";
import { Form, Input, InputNumber, Switch, Button, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createSubscriptionPlan, updateSubscriptionPlan } from "../../features/subscriptionPlanSlice.js";

const PlanForm = ({ initialValues, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.subscriptionPlans);

  const moduleOptions = [
    "Schools", "Users", "Teachers", "Students", "Parents", "Classes", "Subjects", "Exams",
    "Attendance", "Finance", "Settings", "Fees", "Reports", "Hostel", "Transport", "Assignments",
    "Timetable", "Notifications", "Expenses", "Library", "Books", "IssuedBooks", "Rooms",
    "Routes", "Vehicles",
  ];

  useEffect(() => {
    if (initialValues) {
      const features = Array.isArray(initialValues.features)
        ? initialValues.features.map(f => ({
            module: f.module || "",
            allowed: f.allowed ?? true,
            limitKey: f.limits ? Object.keys(f.limits)[0] : "",
            limitValue: f.limits ? Object.values(f.limits)[0] : undefined,
          }))
        : [];

      form.setFieldsValue({ ...initialValues, features });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    const formattedFeatures = values.features?.map(f => ({
      module: f.module,
      allowed: f.allowed ?? true,
      limits: f.limitKey ? { [f.limitKey]: f.limitValue } : {},
    })) || [];

    const payload = { ...values, features: formattedFeatures };

    if (initialValues?._id) {
      dispatch(updateSubscriptionPlan({ id: initialValues._id, formData: payload }));
    } else {
      dispatch(createSubscriptionPlan(payload));
    }

    onClose();
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2">
      <Form form={form} layout="vertical" onFinish={handleFinish} className="space-y-2">
        <Form.Item label="Plan Name" name="name" rules={[{ required: true }]}>
          <Input size="large" placeholder="Premium Plan" className="rounded-md" />
        </Form.Item>

        <Form.Item label="Price (₹)" name="price" rules={[{ required: true }]}>
          <InputNumber className="w-full rounded-md" size="large" min={1} />
        </Form.Item>

        <Form.Item label="Duration (Days)" name="durationInDays" rules={[{ required: true }]}>
          <InputNumber className="w-full rounded-md" size="large" min={1} />
        </Form.Item>

        {/* Features / Modules */}
        <Form.List name="features">
          {(fields, { add, remove }) => (
            <>
              <div className="flex justify-between items-center my-1">
                <h2 className="font-semibold text-base">Features / Modules</h2>
                <Button type="primary" onClick={() => add()} className="text-sm py-1 px-2">
                  + Add Module
                </Button>
              </div>

              <div className="space-y-1">
                {fields.map(({ key, name }) => (
                  <div key={key} className="border rounded-lg bg-gray-50 p-2 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      <Form.Item
                        label="Module"
                        name={[name, "module"]}
                        rules={[{ required: true, message: "Select a module" }]}
                        className="mb-1"
                      >
                        <Select
                          placeholder="Select Module"
                          size="large"
                          options={moduleOptions.map(m => ({ label: m, value: m }))}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Allowed"
                        name={[name, "allowed"]}
                        valuePropName="checked"
                        className="mb-1"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item label="Limit Key" name={[name, "limitKey"]} className="mb-1">
                        <Input size="large" placeholder="maxStudents / maxTeachers / etc." className="rounded-md" />
                      </Form.Item>

                      <Form.Item label="Limit Value" name={[name, "limitValue"]} className="mb-1">
                        <InputNumber size="large" className="w-full rounded-md" placeholder="e.g. 500" />
                      </Form.Item>
                    </div>

                    <div className="flex justify-end mt-1">
                      <Button danger onClick={() => remove(name)} className="rounded-md text-sm py-1 px-2">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Form.List>

        <Form.Item name="isActive" label="Active" valuePropName="checked" className="mb-1">
          <Switch />
        </Form.Item>

        <div className="flex justify-end gap-1 mt-2">
          <Button onClick={() => form.resetFields()} className="rounded-md text-sm py-1 px-2">
            Reset
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} className="rounded-md text-sm py-1 px-2">
            {initialValues ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PlanForm;

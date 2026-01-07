import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Typography,
} from "antd";

import { createSubject, updateSubject } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";

const { Option } = Select;
const { Title, Text } = Typography;

const SubjectForm = ({ isOpen, onClose, editData = null }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { users = [], user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.subject);
  const { activeYear } = useSelector((state) => state.academicYear);

  const schoolId = user?.school?._id;
  const roleName = user?.role?.name;

  // 🔹 Fetch teachers & academic year
  useEffect(() => {
    if (roleName === "School Admin" && schoolId) {
      dispatch(fetchAllUser({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, roleName, schoolId]);

  // 🔹 Prefill on edit
  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        name: editData.name,
        category: editData.category,
        type: editData.type,
        assignedTeachers: editData.assignedTeachers?.map((t) => t._id),
        maxMarks: editData.maxMarks,
        passMarks: editData.passMarks,
        isActive: editData.isActive ?? true,
      });
    }
  }, [editData, form]);

 const teachers = users.filter(
  (u) =>
    u.role?.name?.toLowerCase() === "teacher" && u.isActive === true
);

  const SUBJECTS = [
    "English",
    "Mathematics",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence",
    "Data Science",
    "Economics",
    "Business Studies",
  ];

  const onFinish = (values) => {
    let payload = { ...values };

    if (roleName === "Super Admin") {
      payload.isGlobal = true;
    } else {
      payload.isGlobal = false;
      payload.schoolId = schoolId;
      payload.academicYearId = activeYear?._id;
    }

    if (editData?._id) {
      dispatch(updateSubject({ subjectId: editData._id, subjectData: payload }));
    } else {
      dispatch(createSubject(payload));
    }

    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={620}
      destroyOnClose
      title={
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            {editData ? "Edit Subject" : "Create Subject"}
          </Title>
          <Text type="secondary">
            {roleName === "Super Admin"
              ? "Global subject available for all schools"
              : "Subject for your school & academic year"}
          </Text>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        {/* Subject Name */}
        <Form.Item
          label="Subject Name"
          name="name"
          rules={[{ required: true, message: "Subject name is required" }]}
        >
          {roleName === "Super Admin" ? (
            <Select placeholder="Select subject">
              {SUBJECTS.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          ) : (
            <Input placeholder="Enter subject name" />
          )}
        </Form.Item>

        {/* Category & Type */}
        <Space style={{ display: "flex" }} size="large">
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select category">
              {["Core", "Elective", "Language", "Practical"].map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select type">
              {["Theory", "Practical", "Both"].map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Space>

        {/* Marks */}
        <Space style={{ display: "flex" }} size="large">
          <Form.Item label="Max Marks" name="maxMarks" style={{ flex: 1 }}>
            <InputNumber
              min={0}
              className="w-full"
              placeholder="e.g. 100"
            />
          </Form.Item>

          <Form.Item label="Pass Marks" name="passMarks" style={{ flex: 1 }}>
            <InputNumber
              min={0}
              className="w-full"
              placeholder="e.g. 33"
            />
          </Form.Item>
        </Space>

        {/* Assign Teachers */}
        {roleName === "School Admin" && (
          <Form.Item label="Assign Teachers" name="assignedTeachers">
            <Select
              mode="multiple"
              placeholder="Select teachers"
              allowClear
            >
              {teachers.map((t) => (
                <Option key={t._id} value={t._id}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Actions */}
        <Form.Item>
          <Space style={{ justifyContent: "flex-end", width: "100%" }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {editData ? "Update Subject" : "Create Subject"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SubjectForm;

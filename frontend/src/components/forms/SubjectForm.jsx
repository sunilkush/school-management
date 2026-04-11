import React, { useEffect, useMemo, useCallback } from "react";
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

const { Title, Text } = Typography;

// ✅ Static data outside component — never re-initialized on render
const SUBJECTS = [
  "English", "Hindi", "Mathematics", "EVS", "General Knowledge", "Computer",
  "Drawing", "Moral Science", "Science", "Social Science", "Sanskrit",
  "Physical Education", "Art & Craft", "Music", "Physics", "Chemistry",
  "Biology", "History", "Geography", "Civics", "Information Technology",
  "Economics", "Political Science", "Accountancy", "Business Studies",
  "Sociology", "Psychology", "Philosophy", "Environmental Science",
  "Foreign Language", "Informatics Practices", "Physical Science",
  "Life Science", "Health Education", "Moral Education", "Work Education",
  "Home Science", "Financial Literacy", "Entrepreneurship", "Legal Studies",
  "Media Studies", "Film Studies", "Dance", "Drama", "Public Speaking",
  "Debate", "Robotics", "Artificial Intelligence", "Data Science",
];

const CATEGORIES = ["Core", "Elective", "Language", "Practical"];
const TYPES = ["Theory", "Practical", "Both"];
const STATUS_OPTIONS = [
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
];

// ✅ Reusable option builder — eliminates all inline .map() JSX repetition
const toOptions = (items) =>
  items.map((item) => ({ value: item, label: item }));

const SubjectForm = ({ isOpen, onClose, editData = null }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { users = [], user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.subject);
  const { activeYear } = useSelector((state) => state.academicYear);

  const schoolId = user?.school?._id;
  const roleName = user?.role?.name;
  const isSuperAdmin = roleName === "Super Admin";
  const isSchoolAdmin = roleName === "School Admin";

  // ✅ Fetch required data when modal opens for this school
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser(schoolId));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId]);

  // ✅ Populate form when editing; reset when creating
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      form.setFieldsValue({
        name: editData.name,
        category: editData.category,
        type: editData.type,
        assignedTeachers: editData.assignedTeachers?.map((t) => t._id) ?? [],
        maxMarks: editData.maxMarks,
        passMarks: editData.passMarks,
        isActive: editData.isActive ?? true,
      });
    } else {
      form.resetFields(); // ✅ Clear stale values when switching create → edit
    }
  }, [editData, isOpen, form]);

  // ✅ Memoized teacher list — only recomputes when users list changes
  const teachers = useMemo(
    () =>
      users
        .filter((u) => u.role?.name?.toLowerCase() === "teacher" && u.isActive)
        .map((t) => ({ value: t._id, label: t.name })),
    [users]
  );

  // ✅ Stable submit handler
  const onFinish = useCallback(
    (values) => {
      const payload = {
        ...values,
        isGlobal: isSuperAdmin,
        ...(!isSuperAdmin && {
          schoolId,
          academicYearId: activeYear?._id,
        }),
      };

      if (editData?._id) {
        dispatch(updateSubject({ subjectId: editData._id, subjectData: payload }));
      } else {
        dispatch(createSubject(payload));
      }

      onClose();
    },
    [dispatch, editData, isSuperAdmin, schoolId, activeYear, onClose]
  );

  const modalTitle = (
    <div>
      <Title level={4} style={{ marginBottom: 0 }}>
        {editData ? "Edit Subject" : "Create Subject"}
      </Title>
      <Text type="secondary">
        {isSuperAdmin
          ? "Global subject available for all schools"
          : "Subject for your school & academic year"}
      </Text>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={620}
      destroyOnClose
      title={modalTitle}
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
          rules={[{ required: true, message: "Please select or enter a subject name" }]}
        >
          {isSuperAdmin ? (
            <Select
              placeholder="Select subject"
              options={toOptions(SUBJECTS)}
              showSearch
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          ) : (
            <Input placeholder="Enter subject name" />
          )}
        </Form.Item>

        {/* Category & Type */}
        <Space size="large" style={{ display: "flex" }}>
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select category" options={toOptions(CATEGORIES)} />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Please select a type" }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Select type" options={toOptions(TYPES)} />
          </Form.Item>
        </Space>

        {/* Max Marks & Pass Marks */}
        <Space size="large" style={{ display: "flex" }}>
          <Form.Item label="Max Marks" name="maxMarks" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Pass Marks" name="passMarks" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Space>

        {/* Assign Teachers — School Admin only */}
        {isSchoolAdmin && (
          <Form.Item label="Assign Teachers" name="assignedTeachers">
            <Select
              mode="multiple"
              placeholder="Select teachers"
              allowClear
              options={teachers}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        )}

        {/* Status — edit mode only */}
        {editData && (
          <Form.Item label="Status" name="isActive">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        )}

        {/* Actions */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ justifyContent: "flex-end", width: "100%" }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editData ? "Update Subject" : "Create Subject"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SubjectForm;
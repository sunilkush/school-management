import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Modal, Input, Select, Form, InputNumber, Button as AntBtn } from "antd";
import { createSubject, updateSubject } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";

const { Option } = Select;

const SubjectForm = ({ isOpen, onClose, editData = null }) => {
  const dispatch = useDispatch();
  const { users = [], user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.subject);
  const { activeYear } = useSelector((state) => state.academicYear);

  const schoolId = user?.school?._id || "";
  const roleName = user?.role?.name || "";

  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    assignedTeachers: [],
    schoolId: schoolId || "",
    academicYearId: activeYear?._id || "",
    maxMarks: "",
    passMarks: "",
    isActive: true,
    createdByRole: roleName || "",
  });

  // Prefill when editing
  useEffect(() => {
    if (editData) {
      const updated = {
        name: editData.name || "",
        category: editData.category || "",
        type: editData.type || "",
        assignedTeachers: editData.assignedTeachers?.map((t) => t._id) || [],
        schoolId: editData.schoolId?._id || schoolId,
        academicYearId: editData.academicYearId?._id || activeYear?._id || "",
        maxMarks: editData.maxMarks || "",
        passMarks: editData.passMarks || "",
        isActive: editData.isActive ?? true,
        createdByRole: roleName,
      };
      setFormData(updated);
      form.setFieldsValue(updated);
    }
  }, [editData, form, schoolId, activeYear, roleName]);

  // Fetch Teachers
  useEffect(() => {
    if (roleName === "School Admin" && schoolId) {
      dispatch(fetchAllUser({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId, roleName]);

  // assign academic year
  useEffect(() => {
    if (activeYear?._id) {
      setFormData((prev) => ({ ...prev, academicYearId: activeYear._id }));
    }
  }, [activeYear]);

  const teachers = users?.filter((u) => u.role?.name?.toLowerCase() === "teacher");

  const SubjectList = [
    "English",
    "Science",
    "History",
    "Geography",
    "Art",
    "Physical Education",
    "Computer Science",
    "Music",
    "Economics",
    "Psychology",
    "Sociology",
    "Political Science",
    "Philosophy",
    "Biology",
    "Chemistry",
    "Physics",
    "Mathematics",
    "Business Studies",
    "Accounting",
    "Statistics",
    "Environmental Science",
    "Information Technology",
    "Data Science",
    "Artificial Intelligence",
    "Web Development",
    "Graphic Design",
    "Digital Marketing",
    "Project Management",
    "Finance",
    "Marketing",
    "Animation",
    "Music Production",
    "Film Studies",
    "Creative Writing",
    "Social Work",
  ];

  const handleSubmit = (values) => {
    let payload = { ...values };

    if (roleName === "Super Admin") {
      payload.isGlobal = true;
      delete payload.schoolId;
      delete payload.academicYearId;
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
      className="rounded-xl"
      width={600}
    >
      <h2 className="text-xl font-semibold mb-4">
        {editData
          ? "Edit Subject"
          : roleName === "Super Admin"
          ? "Create Global Subject"
          : "Create School Subject"}
      </h2>

      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onFinish={handleSubmit}
        className="grid grid-cols-2 gap-4"
      >
        {/* Name */}
        <div className="col-span-2">
          <Form.Item label="Subject Name" name="name" rules={[{ required: true }]}>
            {roleName === "Super Admin" ? (
              <Select placeholder="Select Subject">
                {SubjectList.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            ) : (
              <Input placeholder="Enter Subject Name" />
            )}
          </Form.Item>
        </div>

        {/* Category */}
        <Form.Item label="Category" name="category" rules={[{ required: true }]}>
          <Select placeholder="Select Category">
            {["Core", "Elective", "Language", "Practical", "Optional"].map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Type */}
        <Form.Item label="Type" name="type" rules={[{ required: true }]}>
          <Select placeholder="Select Type">
            {["Theory", "Practical", "Both"].map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Max Marks */}
        <Form.Item label="Max Marks" name="maxMarks">
          <InputNumber className="w-full" placeholder="e.g. 100" />
        </Form.Item>

        {/* Pass Marks */}
        <Form.Item label="Pass Marks" name="passMarks">
          <InputNumber className="w-full" placeholder="e.g. 33" />
        </Form.Item>

        {/* Teachers - only for admin */}
        {roleName === "School Admin" && (
          <div className="col-span-2">
            <Form.Item label="Assign Teachers" name="assignedTeachers">
              <Select mode="multiple" placeholder="Select Teachers">
                {teachers?.map((t) => (
                  <Option key={t._id} value={t._id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        )}

        {/* Buttons */}
        <div className="col-span-2 flex justify-end gap-3 mt-2">
          <AntBtn onClick={onClose}>Cancel</AntBtn>

          <AntBtn
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-blue-600 px-4"
          >
            {editData ? "Update Subject" : "Create Subject"}
          </AntBtn>
        </div>
      </Form>
    </Modal>
  );
};

export default SubjectForm;

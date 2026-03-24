import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Space,
  InputNumber,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { createClass, updateClass } from "../../features/classSlice";
import { fetchSections } from "../../features/sectionSlice.js";
import { fetchAllSubjects } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";

const { Option } = Select;
const { Text } = Typography;

const ClassFormSA = ({ initialData, onSuccess, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { sectionList = [] } = useSelector((s) => s.section);
  const { subjects = [] } = useSelector((s) => s.subject);
  const { users = [], user } = useSelector((s) => s.auth);

  const schoolId = user?.school?._id;
  const role = user?.role?.name;

  // 🔥 LocalStorage se academic year
  const [academicYear, setAcademicYear] = useState(null);

  useEffect(() => {
    try {
      const savedYear = localStorage.getItem("academicYear");
      if (savedYear) {
        setAcademicYear(JSON.parse(savedYear));
      }
    } catch (err) {
      console.error("Invalid academicYear in localStorage", err);
    }
  }, []);



  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchSections({ schoolId }));
    dispatch(fetchAllSubjects({ schoolId }));
    dispatch(fetchAllUser(schoolId));
  }, [schoolId, dispatch]);

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (!initialData || !academicYear) return;

    form.setFieldsValue({
      name: initialData.name || "",
      code: initialData.code || "",
      academicYearId:
        initialData.academicYearId?._id || academicYear?._id || "",

      isGlobal: initialData.isGlobal ?? false,
      isActive: initialData.isActive ?? true,

      sections:
        initialData.sections?.map((s) => ({
          sectionId: s.sectionId?._id || "",
          teacherId: s.teacherId?._id || "",
        })) || [{ sectionId: "", teacherId: "" }],

      subjects:
        initialData.subjects?.map((s) => ({
          subjectId: s.subjectId?._id || "",
          teacherId: s.teacherId?._id || "",
          periodPerWeek: s.periodPerWeek || 1,
          isCompulsory: s.isCompulsory ?? true,
        })) || [
          {
            subjectId: "",
            teacherId: "",
            periodPerWeek: 1,
            isCompulsory: true,
          },
        ],
    });
  }, [initialData, academicYear, form]);

  /* ================= SUBMIT ================= */
  const onFinish = async (values) => {
    const payload = {
      ...values,
      schoolId,
      academicYearId: academicYear?._id, // 🔥 always from localStorage
      schoolClassId: initialData?._id,
    };

    try {
      if (initialData) {
        await dispatch(
          updateClass({
            id: initialData._id,
            data: payload,
          })
        ).unwrap();
      } else {
        await dispatch(createClass(payload)).unwrap();
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          isActive: true,
          sections: [{ sectionId: "", teacherId: "" }],
          subjects: [
            {
              subjectId: "",
              teacherId: "",
              periodPerWeek: 1,
              isCompulsory: true,
            },
          ],
        }}
      >
        <Divider orientation="left">Class Information</Divider>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item name="name" label="Class Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col md={12}>
            <Form.Item name="code" label="Class Code">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item name="academicYearId" label="Academic Year">
              <Select disabled value={academicYear?._id}>
                {academicYear && (
                  <Option value={academicYear._id}>
                    {academicYear.name}
                  </Option>
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 🔥 baaki code same */}
      </Form>
    </Card>
  );
};

export default ClassFormSA;
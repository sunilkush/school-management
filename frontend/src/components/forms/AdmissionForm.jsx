import React, { useEffect, useState } from "react";
import {
  Tabs,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  InputNumber,
  message,
} from "antd";

import { useDispatch, useSelector } from "react-redux";

import {
  fetchLastRegisteredStudent,
  createStudent,
} from "../../features/studentSlice";
import { fetchAllClasses } from "../../features/classSlice";

const { TabPane } = Tabs;
const { TextArea } = Input;

const AdmissionForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { lastStudent, registrationNumber } = useSelector(
    (state) => state.students
  );
  const { user } = useSelector((state) => state.auth);
  const { classList = [] } = useSelector((state) => state.class);

  const schoolId = user?.school?._id;
  const academicYear = JSON.parse(
    localStorage.getItem("selectedAcademicYear") || "{}"
  );
  const academicYearId = academicYear?._id;

  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
      dispatch(fetchAllClasses({ schoolId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (registrationNumber) {
      form.setFieldsValue({
        registrationNumber,
        role: "student",
      });
    }
  }, [registrationNumber, form]);

  const handleClassChange = (classId) => {
    const selectedClass = classList.find((c) => c._id === classId);
    setSections(selectedClass?.sections || []);
    form.setFieldsValue({ sectionId: undefined });
  };

  const onFinish = async (values) => {
    const payload = {
      ...values,
      schoolId,
      academicYearId,
      admissionDate: values.admissionDate?.format("YYYY-MM-DD"),
      dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
    };

    const res = await dispatch(createStudent(payload));
    if (res?.payload?.success) {
      message.success("Student admitted successfully");
      form.resetFields();
      dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
    } else {
      message.error("Admission failed");
    }
  };

  return (
    <Card title="Student Admission Form">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Tabs defaultActiveKey="student">

          {/* ================= STUDENT INFO ================= */}
          <TabPane tab="Student Info" key="student">
            <Row gutter={16}>
              <Col md={8}>
                <Form.Item name="studentName" label="Student Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                  <Input.Password maxLength={6} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="classId" label="Class" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select Class"
                    onChange={handleClassChange}
                    options={classList.map((c) => ({
                      label: c.name,
                      value: c._id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="sectionId" label="Section" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select Section"
                    disabled={!sections.length}
                    options={sections.map((s) => ({
                      label: s.name,
                      value: s._id,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="registrationNumber" label="Registration No" style={{ marginBottom: "0px" }}>
                  <Input disabled />
                </Form.Item>
                {lastStudent && (
                  <small className="text-red-500">
                    Last Reg No: {lastStudent.registrationNumber}
                  </small>
                )}
              </Col>

              <Col md={8}>
                <Form.Item name="admissionDate" label="Admission Date" rules={[{ required: true }]}>
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="feeDiscount" label="Fee Discount (%)">
                  <InputNumber className="w-full" />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true }]}>
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* ================= OTHER INFO ================= */}
          <TabPane tab="Other Info" key="other">
            <Row gutter={16}>
              <Col md={8}>
                <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="birthFormId" label="Birth Form ID / NIC">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="orphan" label="Orphan">
                  <Select options={[{ value: "Yes" }, { value: "No" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender" }]}>
                  <Select options={[{ value: "Male" }, { value: "Female" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="caste" label="Caste">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item
                  name="religion"
                  label="Religion"
                  rules={[{ required: true, message: "Please select religion" }]}
                >
                  <Select placeholder="Select Religion">
                    {["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"].map((r) => (
                      <Select.Option key={r} value={r}>
                        {r}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item
                  name="bloodGroup"
                  label="Blood Group"
                  rules={[{ required: true, message: "Please select blood group" }]}
                >
                  <Select placeholder="Select Blood Group">
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-","Rh"].map((bg) => (
                      <Select.Option key={bg} value={bg}>
                        {bg}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="previousSchool" label="Previous School">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="siblings" label="Total Siblings">
                  <InputNumber className="w-full" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="address" label="Address">
                  <TextArea rows={3} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="notes" label="Additional Notes">
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* ================= FATHER INFO ================= */}
          <TabPane tab="Father Info" key="father">
            <Row gutter={16}>
              <Col md={8}>
                <Form.Item name="fatherName" label="Father Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="fatherNID" label="Father NID">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="fatherOccupation" label="Occupation">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="fatherMobile" label="Mobile" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="fatherEducation" label="Education">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="fatherIncome" label="Income">
                  <InputNumber className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* ================= MOTHER INFO ================= */}
          <TabPane tab="Mother Info" key="mother">
            <Row gutter={16}>
              <Col md={8}>
                <Form.Item name="motherName" label="Mother Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="motherNID" label="Mother NID">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="motherOccupation" label="Occupation">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="motherMobile" label="Mobile" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="motherEducation" label="Education">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="motherIncome" label="Income">
                  <InputNumber className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

        </Tabs>

        <div className="flex justify-end mt-6">
          <Button type="primary" htmlType="submit">
            Submit Admission
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default AdmissionForm;

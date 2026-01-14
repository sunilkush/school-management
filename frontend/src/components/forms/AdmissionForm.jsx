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

  const { lastStudent = [], registrationNumber } = useSelector(
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
        registrationNumber: registrationNumber,
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
    <Card >
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
                <Form.Item name="email" label="Student Email" rules={[{ required: true, type: "email" }]}>
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
                <Form.Item name="registrationNumber" label="Registration No" style={{ margin: 0 }}>
                  <Input disabled value={registrationNumber} />
                </Form.Item>
                {lastStudent && (
                  <small className="text-red-400">
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
                <Form.Item name="mobileNumber" label="Student Mobile" rules={[{ required: true }]}>
                  <Input maxLength={10} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="smsMobile" label="SMS Mobile">
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
                <Form.Item name="birthFormId" label="Birth Form ID">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="orphan" label="Orphan">
                  <Select options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                  <Select options={[{ value: "Male" }, { value: "Female" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="cast" label="Caste">
                  <Input />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="religion" label="Religion">
                  <Select options={["Hindu", "Muslim", "Christian", "Sikh", "Other"].map(r => ({ value: r }))} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="bloodGroup" label="Blood Group">
                  <Select options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => ({ value: b }))} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="osc" label="OSC">
                  <Select options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="siblings" label="Siblings">
                  <InputNumber className="w-full" />
                </Form.Item>
              </Col>

              <Col md={24}>
                <Form.Item name="identificationMark" label="Identification Mark">
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="family" label="Family Info">
                  <TextArea rows={3} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="disease" label="Disease">
                  <TextArea rows={3} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="address" label="Address">
                  <TextArea rows={3} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="notes" label="Notes">
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* ================= FATHER INFO ================= */}
          <TabPane tab="Father Info" key="father">
            <Row gutter={16}>
              <Col md={8}><Form.Item name="fatherName" label="Father Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="fatherMobile" label="Father Mobile" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="fatherEmail" label="Father Email"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="fatherOccupation" label="Occupation"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="fatherEducation" label="Education"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="fatherIncome" label="Income"><InputNumber className="w-full" /></Form.Item></Col>
            </Row>
          </TabPane>

          {/* ================= MOTHER INFO ================= */}
          <TabPane tab="Mother Info" key="mother">
            <Row gutter={16}>
              <Col md={8}><Form.Item name="motherName" label="Mother Name"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="motherMobile" label="Mother Mobile"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="motherEmail" label="Mother Email"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="motherOccupation" label="Occupation"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="motherEducation" label="Education"><Input /></Form.Item></Col>
              <Col md={8}><Form.Item name="motherIncome" label="Income"><InputNumber className="w-full" /></Form.Item></Col>
            </Row>
          </TabPane>

        </Tabs>

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Button type="primary" htmlType="submit">
            Submit Admission
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default AdmissionForm;

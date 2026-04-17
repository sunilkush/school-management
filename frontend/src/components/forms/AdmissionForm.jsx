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
  Modal,
} from "antd";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchLastRegisteredStudent,
  createStudent,
} from "../../features/studentSlice";
import { getClassData } from "../../features/schoolClassSlice";
import Title from "antd/es/skeleton/Title";


const { TabPane } = Tabs;
const { TextArea } = Input;

const renderCredentialLine = (label, creds) => {
  if (!creds) return null;

  return (
    <div key={label} style={{ marginBottom: 12 }}>
      <strong>{label}</strong>
      <div>Login ID: {creds.loginId || "-"}</div>
      <div>Password: {creds.password || "Already exists (unchanged)"}</div>
    </div>
  );
};

const AdmissionForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const tabKeys = ["student", "other", "father", "mother"];
  const [activeTab, setActiveTab] = useState("student");
  const currentIndex = tabKeys.indexOf(activeTab);

  const nextTab = () => {
    if (currentIndex < tabKeys.length - 1) {
      setActiveTab(tabKeys[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    if (currentIndex > 0) {
      setActiveTab(tabKeys[currentIndex - 1]);
    }
  };
  const { lastStudent = [], registrationNumber } = useSelector(
    (state) => state.students
  );
  const { user } = useSelector((state) => state.auth);
  const { schoolClasses = [] } = useSelector(
    (state) => state.schoolClass || {}
  );

  const schoolId = user?.school?._id;
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);
  const academicYearId = selectedAcademicYear?._id;

  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
      dispatch(getClassData({ schoolId,academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (registrationNumber) {
      form.setFieldsValue({
        registrationNumber: registrationNumber,
      });
    }
  }, [registrationNumber, form]);


  const handleClassChange = (schoolClassId) => {
    const selectedClass = schoolClasses.find((c) => c._id === schoolClassId);
    setSections(selectedClass?.sections || []);
    form.setFieldsValue({ sectionId: undefined });
  };

  const onFinish = async (values) => {
    if (!schoolId || !academicYearId) {
      message.error("Please select an academic year before submitting admission.");
      return;
    }

    try {
      const payload = {
        studentData: {
          name: values.studentName,
          email: values.email,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          gender: values.gender,
          address: values.address,
          bloodGroup: values.bloodGroup,
        },

        fatherData: {
          name: values.fatherName,
          email: values.fatherEmail,
          mobile: values.fatherMobile,
        },

        motherData: {
          name: values.motherName,
          email: values.motherEmail,
          mobile: values.motherMobile,
        },

        schoolId,
        academicYearId,
        schoolClassId: values.schoolClassId,
        sectionId: values.sectionId,
      };

      const res = await dispatch(createStudent(payload));

      if (res?.meta?.requestStatus === "fulfilled") {
        message.success("Student admitted successfully");

        const credentials = res?.payload?.credentials;
        if (credentials) {
          Modal.success({
            title: "Login Credentials",
            width: 560,
            content: (
              <div style={{ marginTop: 12 }}>
                {renderCredentialLine("Student", credentials.student)}
                {renderCredentialLine("Father", credentials.father)}
                {renderCredentialLine("Mother", credentials.mother)}
              </div>
            ),
          });
        }

        form.resetFields();
        dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
      } else {
        message.error(res?.payload || "Admission failed");
      }
    } catch (err) {
      message.error("Something went wrong", err.message);
    }
  };

  return (
    <Card >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
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
                <Form.Item name="schoolClassId" label="Class" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select Class"
                    onChange={handleClassChange}
                    options={schoolClasses.map((c) => ({
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
                  <Select options={[{ value: "Yes" }, { value: "No" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                  <Select options={[{ value: "Male" }, { value: "Female" }]} />
                </Form.Item>
              </Col>

              <Col md={8}>
                <Form.Item name="cast" label="Caste">
                  <Select options={["General", "OBC", "SC", "ST", "Other"].map(c => ({ value: c }))} />
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

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          {/* Previous Button */}
          <Button
            disabled={currentIndex === 0}
            onClick={prevTab}
          >
            Previous
          </Button>

          {/* Next / Submit */}
          {currentIndex < tabKeys.length - 1 ? (
            <Button type="primary" onClick={nextTab}>
              Next
            </Button>
          ) : (
            <Button type="primary" htmlType="submit">
              Submit Admission
            </Button>
          )}
        </div>
      </Form>
    </Card>
  );
};

export default AdmissionForm;

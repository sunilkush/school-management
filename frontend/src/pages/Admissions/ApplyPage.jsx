import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert, Button, DatePicker, Form, Input, Result, Select, Space, Spin, Steps, Typography, message,
} from "antd";
import { SolutionOutlined, CopyOutlined } from "@ant-design/icons";

import { publicGet, publicPost } from "../../api/publicClient";
import PublicShell from "./PublicShell";
import DocumentUploader from "./DocumentUploader";

const { Title, Text, Paragraph } = Typography;

const RELATIONSHIPS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
];

export default function ApplyPage() {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);

  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolsError, setSchoolsError] = useState(null);

  const [schoolId, setSchoolId] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [application, setApplication] = useState(null);
  const [alreadyExisted, setAlreadyExisted] = useState(false);

  useEffect(() => {
    publicGet("/public/admissions/schools")
      .then(({ data }) => setSchools(data || []))
      .catch((err) => setSchoolsError(err.message))
      .finally(() => setLoadingSchools(false));
  }, []);

  const chooseSchool = async (id) => {
    setSchoolId(id);
    setSchoolInfo(null);
    if (!id) return;
    setLoadingInfo(true);
    try {
      const { data } = await publicGet(`/public/admissions/schools/${id}`);
      setSchoolInfo(data);
    } catch (err) {
      message.error(err.message);
      setSchoolId(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  const submit = async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ...values,
        schoolId,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
      };
      const { data, status } = await publicPost("/public/admissions/apply", payload);
      // 201 = created, 200 = an identical application already existed and the original was
      // returned, so the applicant never ends up holding two different reference numbers.
      setAlreadyExisted(status === 200);
      setApplication(data);
      setStep(2);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSchoolName = useMemo(
    () => schools.find((s) => s._id === schoolId)?.name,
    [schools, schoolId]
  );

  const copyReference = () => {
    navigator.clipboard?.writeText(application.applicationNumber)
      .then(() => message.success("Reference number copied"))
      .catch(() => message.info(`Your reference is ${application.applicationNumber}`));
  };

  return (
    <PublicShell
      title="Apply for admission"
      subtitle="Fill the form once — you'll get a reference number to track your application."
      wide
    >
      <Steps
        size="small"
        current={step}
        items={[{ title: "School" }, { title: "Details" }, { title: "Submitted" }]}
        style={{ marginBottom: 28 }}
      />

      {step === 0 && (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {schoolsError && <Alert type="error" showIcon message={schoolsError} />}
          {loadingSchools ? (
            <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>
          ) : schools.length === 0 && !schoolsError ? (
            <Alert
              type="info"
              showIcon
              message="No schools are accepting online applications right now"
              description="Please check back later, or contact the school directly."
            />
          ) : (
            <>
              <div>
                <Text strong>Which school are you applying to?</Text>
                <Select
                  showSearch
                  size="large"
                  placeholder="Search for your school"
                  style={{ width: "100%", marginTop: 8 }}
                  value={schoolId}
                  onChange={chooseSchool}
                  loading={loadingInfo}
                  optionFilterProp="label"
                  options={schools.map((s) => ({ value: s._id, label: s.name }))}
                />
              </div>
              {schoolInfo && (
                <Alert
                  type="success"
                  showIcon
                  message={`${schoolInfo.school.name} is accepting applications`}
                  description={
                    schoolInfo.classes.length
                      ? `Open classes: ${schoolInfo.classes.join(", ")}`
                      : "Class list is not published — you can type the class you want on the next step."
                  }
                />
              )}
              <Button
                type="primary"
                size="large"
                block
                disabled={!schoolInfo}
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            </>
          )}
        </Space>
      )}

      {step === 1 && (
        <Form form={form} layout="vertical" onFinish={submit} requiredMark="optional">
          {submitError && (
            <Alert type="error" showIcon message={submitError} style={{ marginBottom: 16 }} />
          )}

          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Student
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px", marginTop: 12 }}>
            <Form.Item name="studentName" label="Student's full name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Aarav Sharma" />
            </Form.Item>
            <Form.Item name="applyingClass" label="Class applying for" rules={[{ required: true, message: "Required" }]}>
              {schoolInfo?.classes?.length ? (
                <Select
                  showSearch
                  placeholder="Select class"
                  options={schoolInfo.classes.map((c) => ({ value: c, label: c }))}
                />
              ) : (
                <Input placeholder="Class 6" />
              )}
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of birth">
              <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select
                allowClear
                placeholder="Select"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Form.Item>
          </div>

          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Parent / Guardian
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px", marginTop: 12 }}>
            <Form.Item name="parentName" label="Parent / guardian name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Meera Sharma" />
            </Form.Item>
            <Form.Item
              name="parentPhone"
              label="Mobile number"
              rules={[
                { required: true, message: "Required" },
                { pattern: /^[0-9+\-() ]{6,20}$/, message: "Enter a valid phone number" },
              ]}
              extra="You'll need this number to track the application."
            >
              <Input placeholder="9876543210" inputMode="tel" />
            </Form.Item>
            <Form.Item name="parentEmail" label="Email" rules={[{ type: "email", message: "Enter a valid email" }]}>
              <Input placeholder="you@example.com" inputMode="email" />
            </Form.Item>
            <Form.Item name="relationship" label="Relationship" initialValue="father">
              <Select options={RELATIONSHIPS} />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="House, street, city, PIN" />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Previous school <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px", marginTop: 12 }}>
            <Form.Item name="previousSchool" label="School name">
              <Input placeholder="Modern Public School" />
            </Form.Item>
            <Form.Item name="previousClass" label="Last class attended">
              <Input placeholder="Class 5" />
            </Form.Item>
          </div>

          <Space style={{ marginTop: 8 }}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit application
            </Button>
          </Space>
        </Form>
      )}

      {step === 2 && application && (
        <>
          <Result
            status="success"
            icon={<SolutionOutlined />}
            title="Application submitted"
            subTitle={`${application.studentName} — ${application.applyingClass}${selectedSchoolName ? ` at ${selectedSchoolName}` : ""}`}
          />

          <div
            style={{
              background: "var(--surface-soft)",
              border: "1px solid var(--border-muted)",
              borderRadius: 18,
              padding: "20px 22px",
              textAlign: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>
              Your reference number
            </Text>
            <Title level={3} style={{ margin: "8px 0 4px", letterSpacing: ".04em" }}>
              {application.applicationNumber}
            </Title>
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyReference}>
              Copy
            </Button>
            <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
              Save this. You'll need it along with your mobile number to check your status at{" "}
              <Link to="/admissions/track">Track application</Link>.
            </Paragraph>
          </div>

          {alreadyExisted && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="We already had an application for this student, so we've shown you the original."
            />
          )}

          <DocumentUploader
            applicationNumber={application.applicationNumber}
            phone={form.getFieldValue("parentPhone")}
            documents={application.documents}
            onUploaded={setApplication}
          />
        </>
      )}
    </PublicShell>
  );
}

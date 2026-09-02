import { useState } from "react";
import { Alert, Button, Descriptions, Form, Input, Result, Steps, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { publicGet } from "../../api/publicClient";
import PublicShell from "./PublicShell";
import DocumentUploader from "./DocumentUploader";

const { Text } = Typography;

/* The happy path through AdmissionInquiry.status. `rejected` and `waitlist` sit outside it and
   are shown as their own result instead of a step. */
const PIPELINE = [
  { key: "new", title: "Received", note: "We have your application" },
  { key: "contacted", title: "Contacted", note: "The school has reached out" },
  { key: "visit_scheduled", title: "Visit / test", note: "A school visit is scheduled" },
  { key: "docs_submitted", title: "Documents", note: "Documents received" },
  { key: "approved", title: "Approved", note: "Offer made" },
  { key: "enrolled", title: "Enrolled", note: "Admission complete" },
];

const OFF_PIPELINE = {
  rejected: { status: "error", title: "Application not accepted", text: "The school could not offer a place this time. Please contact them directly if you have questions." },
  waitlist: { status: "warning", title: "You're on the waitlist", text: "A place isn't available yet. The school will contact you if one opens up." },
};

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function TrackPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [phone, setPhone] = useState("");

  const lookup = async ({ applicationNumber, phone: enteredPhone }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await publicGet("/public/admissions/track", {
        applicationNumber: applicationNumber.trim(),
        phone: enteredPhone.trim(),
      });
      setApplication(data);
      setPhone(enteredPhone.trim());
    } catch (err) {
      setApplication(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const offPipeline = application ? OFF_PIPELINE[application.status] : null;
  const stepIndex = application ? PIPELINE.findIndex((s) => s.key === application.status) : -1;

  return (
    <PublicShell
      title="Track your application"
      subtitle="Enter the reference number you received and the mobile number you applied with."
      wide={Boolean(application)}
    >
      <Form form={form} layout="vertical" onFinish={lookup} requiredMark={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 16px" }}>
          <Form.Item
            name="applicationNumber"
            label="Reference number"
            rules={[{ required: true, message: "Enter your reference number" }]}
          >
            <Input placeholder="ADM-2026-XXXXXX" autoCapitalize="characters" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Registered mobile number"
            rules={[{ required: true, message: "Enter the mobile number you applied with" }]}
          >
            <Input placeholder="9876543210" inputMode="tel" />
          </Form.Item>
        </div>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading} block>
          Check status
        </Button>
      </Form>

      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 20 }} />}

      {application && (
        <div style={{ marginTop: 28 }}>
          <Descriptions
            column={1}
            size="small"
            bordered
            items={[
              { key: "ref", label: "Reference", children: <Text strong>{application.applicationNumber}</Text> },
              { key: "student", label: "Student", children: application.studentName },
              { key: "class", label: "Class applied for", children: application.applyingClass },
              { key: "submitted", label: "Submitted on", children: fmt(application.submittedAt) },
              {
                key: "status",
                label: "Current status",
                children: (
                  <Tag color={offPipeline ? (application.status === "rejected" ? "error" : "warning") : "processing"}>
                    {String(application.status).replace(/_/g, " ").toUpperCase()}
                  </Tag>
                ),
              },
            ]}
          />

          {offPipeline ? (
            <Result
              status={offPipeline.status}
              title={offPipeline.title}
              subTitle={offPipeline.text}
              style={{ paddingBottom: 0 }}
            />
          ) : (
            <Steps
              direction="vertical"
              size="small"
              current={stepIndex < 0 ? 0 : stepIndex}
              style={{ marginTop: 24 }}
              items={PIPELINE.map((s) => ({ title: s.title, description: s.note }))}
            />
          )}

          {!offPipeline && (
            <DocumentUploader
              applicationNumber={application.applicationNumber}
              phone={phone}
              documents={application.documents}
              onUploaded={setApplication}
            />
          )}
        </div>
      )}
    </PublicShell>
  );
}

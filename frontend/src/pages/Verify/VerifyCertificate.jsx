import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Result, Spin, Descriptions, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function VerifyCertificate() {
  const { certificateNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
    fetch(`${apiBase}/certificates/verify/${encodeURIComponent(certificateNumber)}`)
      .then((res) => res.json())
      .then((json) => setResult(json.data))
      .catch(() => setError("Could not reach the verification service. Please try again later."))
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F1F5F9", padding: 24,
    }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 24px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}><Spin size="large" /></div>
        ) : error ? (
          <Result status="warning" title="Verification Unavailable" subTitle={error} />
        ) : result?.valid ? (
          <Result
            status="success"
            icon={<SafetyCertificateOutlined />}
            title="Certificate Verified Genuine"
            subTitle={`Issued by ${result.schoolName || "the school"}`}
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Certificate No">{result.certificateNumber}</Descriptions.Item>
              <Descriptions.Item label="Type">{result.certificateType}</Descriptions.Item>
              <Descriptions.Item label="Student Name">{result.studentName}</Descriptions.Item>
              <Descriptions.Item label="Class / Section">{[result.className, result.sectionName].filter(Boolean).join(" - ") || "—"}</Descriptions.Item>
              <Descriptions.Item label="Issue Date">{fmt(result.issueDate)}</Descriptions.Item>
            </Descriptions>
          </Result>
        ) : (
          <Result
            status="error"
            title={result?.status === "Revoked" ? "Certificate Revoked" : "Certificate Not Found"}
            subTitle={
              result?.status === "Revoked"
                ? "This certificate has been revoked by the issuing school and is no longer valid."
                : "No certificate matches this number. Please check the number and try again."
            }
          >
            {result?.status === "Revoked" && (
              <Text type="secondary" style={{ fontSize: 12 }}>Certificate No: {result.certificateNumber}</Text>
            )}
          </Result>
        )}
      </div>
    </div>
  );
}

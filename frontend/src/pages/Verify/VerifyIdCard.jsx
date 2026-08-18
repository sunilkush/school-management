import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Result, Spin, Descriptions, Avatar, Flex } from "antd";
import dayjs from "dayjs";

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function VerifyIdCard() {
  const { cardNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
    fetch(`${apiBase}/id-cards/verify/${encodeURIComponent(cardNumber)}`)
      .then((res) => res.json())
      .then((json) => setResult(json.data))
      .catch(() => setError("Could not reach the verification service. Please try again later."))
      .finally(() => setLoading(false));
  }, [cardNumber]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--surface-soft)", padding: 24,
    }}>
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "32px 24px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}><Spin size="large" /></div>
        ) : error ? (
          <Result status="warning" title="Verification Unavailable" subTitle={error} />
        ) : result?.valid ? (
          <Result
            status="success"
            title="ID Card Verified Genuine"
            subTitle={`Issued by ${result.schoolName || "the school"}`}
          >
            <Flex align="center" gap={16} style={{ marginBottom: 16 }}>
              {result.photoUrl
                ? <Avatar src={result.photoUrl} size={72} />
                : <Avatar size={72} style={{ background: "var(--primary)" }}>{(result.fullName || "?")[0]?.toUpperCase()}</Avatar>}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{result.fullName}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{result.roleLine || "—"}</div>
              </div>
            </Flex>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Card No">{result.cardNumber}</Descriptions.Item>
              <Descriptions.Item label="Holder Type">{result.holderType}</Descriptions.Item>
              <Descriptions.Item label="Valid Until">{fmt(result.validUntil)}</Descriptions.Item>
            </Descriptions>
          </Result>
        ) : (
          <Result
            status="error"
            title={result?.status === "Inactive" ? "ID Card Deactivated" : "ID Card Not Found"}
            subTitle={
              result?.status === "Inactive"
                ? "This ID card has been deactivated by the issuing school and is no longer valid."
                : "No ID card matches this number. Please check the number and try again."
            }
          />
        )}
      </div>
    </div>
  );
}

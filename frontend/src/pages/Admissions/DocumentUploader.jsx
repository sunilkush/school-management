import { useState } from "react";
import { Alert, Button, List, Select, Space, Typography, Upload, message } from "antd";
import { InboxOutlined, PaperClipOutlined } from "@ant-design/icons";

import { publicUpload } from "../../api/publicClient";

const { Text } = Typography;

// Mirrors DOC_TYPES in backend/src/controllers/publicAdmission.controllers.js — anything not in
// that list is stored as "other", so keep the two in step.
const DOC_TYPES = [
  { value: "photo", label: "Student photograph" },
  { value: "birth_certificate", label: "Birth certificate" },
  { value: "prev_marksheet", label: "Previous marksheet" },
  { value: "transfer_certificate", label: "Transfer certificate" },
  { value: "address_proof", label: "Address proof" },
  { value: "id_proof", label: "ID proof (Aadhaar etc.)" },
  { value: "other", label: "Other" },
];

// Must not exceed uploadPublicAdmissionDocs' limit in backend/src/middlewares/multer.middleware.js.
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 5;

export default function DocumentUploader({ applicationNumber, phone, documents = [], onUploaded }) {
  const [fileList, setFileList] = useState([]);
  const [docType, setDocType] = useState("birth_certificate");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const beforeUpload = (file) => {
    if (file.size > MAX_BYTES) {
      message.error(`${file.name} is larger than 2 MB`);
      return Upload.LIST_IGNORE;
    }
    return false; // collect locally; we send them ourselves below
  };

  const send = async () => {
    if (!fileList.length) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("phone", phone || "");
      body.append("docType", docType);
      fileList.forEach((f) => body.append("documents", f.originFileObj || f));

      const { data } = await publicUpload(`/public/admissions/documents/${applicationNumber}`, body);
      setFileList([]);
      message.success("Documents uploaded");
      onUploaded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 24, borderTop: "1px solid var(--border-muted)", paddingTop: 20 }}>
      <Text strong>Supporting documents</Text>
      <br />
      <Text type="secondary" style={{ fontSize: 13 }}>
        Optional now — you can add them later from the tracking page. Up to {MAX_FILES} files, 2 MB
        each (JPG, PNG, PDF, DOC, XLS).
      </Text>

      {documents.length > 0 && (
        <List
          size="small"
          style={{ marginTop: 12 }}
          dataSource={documents}
          renderItem={(d) => (
            <List.Item>
              <Space size={8}>
                <PaperClipOutlined style={{ color: "var(--text-muted)" }} />
                <Text style={{ fontSize: 13 }}>{d.originalName}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {DOC_TYPES.find((t) => t.value === d.docType)?.label || d.docType}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      )}

      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} />}

      <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 14 }}>
        <Select
          value={docType}
          onChange={setDocType}
          options={DOC_TYPES}
          style={{ width: "100%" }}
          aria-label="Document type"
        />

        <Upload.Dragger
          multiple
          maxCount={MAX_FILES}
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={({ fileList: next }) => setFileList(next.slice(0, MAX_FILES))}
          onRemove={(file) => setFileList((prev) => prev.filter((f) => f.uid !== file.uid))}
          style={{ borderRadius: 18, background: "var(--surface-soft)" }}
        >
          <p style={{ margin: 0 }}>
            <InboxOutlined style={{ fontSize: 28, color: "var(--primary)" }} />
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Click or drag files here</p>
        </Upload.Dragger>

        <Button
          type="primary"
          block
          loading={uploading}
          disabled={!fileList.length}
          onClick={send}
        >
          Upload {fileList.length ? `${fileList.length} file${fileList.length > 1 ? "s" : ""}` : "documents"}
        </Button>
      </Space>
    </div>
  );
}

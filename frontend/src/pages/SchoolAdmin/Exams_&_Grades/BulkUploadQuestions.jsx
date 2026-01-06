// BulkUploadQuestions.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch } from "react-redux";
import { bulkCreateQuestions } from "../../../features/questionSlice";
import {
  Card,
  Upload,
  Button,
  Table,
  message,
  Typography,
  Space,
} from "antd";
import { UploadOutlined, CloudUploadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const BulkUploadQuestions = () => {
  const [preview, setPreview] = useState([]);
  const dispatch = useDispatch();

  const handleFileChange = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        message.error("Excel file is empty");
        return;
      }

      setPreview(jsonData);
      message.success("File parsed successfully");
    };

    reader.readAsArrayBuffer(file);
    return false; // prevent auto upload
  };

  const handleUpload = () => {
    if (!preview.length) {
      message.warning("Please upload an Excel file first");
      return;
    }

    dispatch(bulkCreateQuestions({ questions: preview }));
    message.success("Questions uploaded successfully");
    setPreview([]);
  };

  const columns =
    preview.length > 0
      ? Object.keys(preview[0]).map((key) => ({
          title: key.toUpperCase(),
          dataIndex: key,
          key,
        }))
      : [];

  return (
    <Card style={{ maxWidth: 900, margin: "auto" }}>
      <Title level={3}>📥 Bulk Upload Questions</Title>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Upload
          beforeUpload={handleFileChange}
          accept=".xlsx,.xls"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Select Excel File</Button>
        </Upload>

        <Text type="secondary">
          Upload an Excel file with question data (MCQ / descriptive).
        </Text>

        {preview.length > 0 && (
          <>
            <Title level={5}>Preview (First 5 Records)</Title>

            <Table
              columns={columns}
              dataSource={preview.slice(0, 5)}
              rowKey={(_, index) => index}
              size="small"
              bordered
              pagination={false}
              scroll={{ x: true }}
            />

            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleUpload}
            >
              Upload Questions
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
};

export default BulkUploadQuestions;

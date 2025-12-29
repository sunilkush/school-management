import React, { useState } from "react";
import {
  Card,
  Typography,
  List,
  Tag,
  Button,
  Modal,
  Upload,
  Space,
  Divider,
  message,
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const StudentHomework = () => {
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [open, setOpen] = useState(false);

  // 🔹 Dummy Data (API se aayega)
  const homeworkList = [
    {
      id: 1,
      subject: "Mathematics",
      title: "Algebra Practice",
      description: "Solve questions from chapter 3",
      dueDate: "2025-01-05",
      status: "Pending",
    },
    {
      id: 2,
      subject: "Science",
      title: "Physics Assignment",
      description: "Write short notes on Motion",
      dueDate: "2025-01-02",
      status: "Submitted",
    },
  ];

  const openDetails = (hw) => {
    setSelectedHomework(hw);
    setOpen(true);
  };

  const handleUpload = () => {
    message.success("Homework submitted successfully");
    setOpen(false);
  };

  const statusColor = (status) => {
    if (status === "Submitted") return "green";
    if (status === "Late") return "red";
    return "orange";
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Title level={3}>📘 My Homework</Title>

      <List
        itemLayout="vertical"
        dataSource={homeworkList}
        renderItem={(item) => (
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <FileTextOutlined />
                <Text strong>{item.subject}</Text>
              </Space>

              <Title level={5}>{item.title}</Title>

              <Space>
                <ClockCircleOutlined />
                <Text type="secondary">Due: {item.dueDate}</Text>
              </Space>

              <Tag color={statusColor(item.status)}>
                {item.status}
              </Tag>

              <Button
                type="link"
                onClick={() => openDetails(item)}
              >
                View Details
              </Button>
            </Space>
          </Card>
        )}
      />

      {/* 🔹 Homework Detail Modal */}
      <Modal
        open={open}
        title="Homework Details"
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {selectedHomework && (
          <>
            <Text strong>Subject:</Text> {selectedHomework.subject}
            <br />
            <Text strong>Title:</Text> {selectedHomework.title}
            <br />
            <Text strong>Description:</Text>
            <p>{selectedHomework.description}</p>

            <Divider />

            {selectedHomework.status !== "Submitted" && (
              <>
                <Upload>
                  <Button icon={<UploadOutlined />}>
                    Upload Homework
                  </Button>
                </Upload>

                <Button
                  type="primary"
                  block
                  style={{ marginTop: 16 }}
                  onClick={handleUpload}
                >
                  Submit Homework
                </Button>
              </>
            )}

            {selectedHomework.status === "Submitted" && (
              <Tag color="green">Already Submitted</Tag>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default StudentHomework;

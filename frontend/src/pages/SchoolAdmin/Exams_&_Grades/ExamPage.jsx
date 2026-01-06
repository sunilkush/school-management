import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Modal,
  Card,
  Tag,
  Typography,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import CreateExam from "./CreateExam";

const { Title, Text } = Typography;

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [editingExam, setEditingExam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* -------------------- HANDLERS -------------------- */

  const handleSaveExam = (formData) => {
    if (editingExam) {
      setExams((prev) =>
        prev.map((exam) =>
          exam.key === editingExam.key
            ? { ...formData, key: exam.key }
            : exam
        )
      );
      message.success("Exam updated successfully");
    } else {
      setExams((prev) => [
        ...prev,
        { ...formData, key: Date.now().toString() },
      ]);
      message.success("Exam created successfully");
    }

    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleDelete = (key) => {
    setExams((prev) => prev.filter((exam) => exam.key !== key));
    message.success("Exam deleted");
  };

  /* -------------------- TABLE COLUMNS -------------------- */

  const columns = [
    {
      title: "Exam Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "examType",
      key: "examType",
      render: (type) => (
        <Tag color="blue">{type?.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
    },
    {
      title: "Total Marks",
      dataIndex: "totalMarks",
      key: "totalMarks",
    },
    {
      title: "Passing Marks",
      dataIndex: "passingMarks",
      key: "passingMarks",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color =
          status === "published"
            ? "green"
            : status === "completed"
            ? "purple"
            : "orange";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingExam(record);
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this exam?"
            description="This action cannot be undone"
            onConfirm={() => handleDelete(record.key)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* -------------------- UI -------------------- */

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      {/* 🔹 HEADER */}
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          📘 Exams Management
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Exam
        </Button>
      </Space>

      {/* 🔹 TABLE / EMPTY STATE */}
      <Table
        columns={columns}
        dataSource={exams}
        rowKey="key"
        bordered
        pagination={{ pageSize: 5 }}
        locale={{
          emptyText: (
            <Empty
              description="No exams found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />

      {/* 🔹 MODAL */}
      <Modal
        title={editingExam ? "Edit Exam" : "Create Exam"}
        open={isModalOpen}
        footer={null}
        destroyOnClose
        onCancel={() => {
          setIsModalOpen(false);
          setEditingExam(null);
        }}
        width={900}
      >
        <CreateExam
          initialData={editingExam}
          onSave={handleSaveExam}
        />
      </Modal>
    </Card>
  );
};

export default ExamsPage;

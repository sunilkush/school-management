// ExamsPage.jsx
import React, { useState } from "react";
import { Table, Button, Space, Popconfirm, message, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import CreateExam from "./CreateExam";

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [editingExam, setEditingExam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveExam = (formData) => {
    if (editingExam) {
      setExams((prev) =>
        prev.map((exam) => (exam.key === editingExam.key ? { ...formData, key: exam.key } : exam))
      );
      message.success("Exam updated!");
    } else {
      setExams((prev) => [...prev, { ...formData, key: Date.now().toString() }]);
      message.success("Exam added!");
    }
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleDelete = (key) => {
    setExams((prev) => prev.filter((exam) => exam.key !== key));
    message.success("Exam deleted!");
  };

  const columns = [
    { title: "Title", dataIndex: "title" },
    { title: "Type", dataIndex: "examType" },
    { title: "Start", dataIndex: "startTime" },
    { title: "End", dataIndex: "endTime" },
    { title: "Total Marks", dataIndex: "totalMarks" },
    { title: "Passing Marks", dataIndex: "passingMarks" },
    { title: "Status", dataIndex: "status" },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => { setEditingExam(record); setIsModalOpen(true); }} />
          <Popconfirm title="Delete this exam?" onConfirm={() => handleDelete(record.key)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Exams Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Exam
        </Button>
      </div>

      <Table dataSource={exams} columns={columns} rowKey="key" />

      <Modal
        title={editingExam ? "Edit Exam" : "Create Exam"}
        open={isModalOpen}
        footer={null}
        onCancel={() => { setIsModalOpen(false); setEditingExam(null); }}
        width={800}
      >
        <CreateExam
          initialData={editingExam}
          onSave={handleSaveExam}
        />
      </Modal>
    </div>
  );
};

export default ExamsPage;

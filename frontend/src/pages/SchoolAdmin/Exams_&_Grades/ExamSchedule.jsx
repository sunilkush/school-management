import React, { useState } from "react";
import { Calendar, Badge, Modal, Form, Input, DatePicker, Select, Button, Popconfirm } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const ExamSchedule = () => {
  const [exams, setExams] = useState([
    {
      id: 1,
      subject: "Mathematics",
      date: dayjs("2025-10-05"),
      type: "Midterm",
    },
    {
      id: 2,
      subject: "Science",
      date: dayjs("2025-10-12"),
      type: "Final",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form] = Form.useForm();

  // Handle add/edit exam
  const handleOk = () => {
    form.validateFields().then((values) => {
      const newExam = {
        id: editingExam ? editingExam.id : Date.now(),
        subject: values.subject,
        type: values.type,
        date: values.date,
      };

      if (editingExam) {
        setExams((prev) => prev.map((exam) => (exam.id === editingExam.id ? newExam : exam)));
      } else {
        setExams((prev) => [...prev, newExam]);
      }

      setIsModalOpen(false);
      setEditingExam(null);
      form.resetFields();
    });
  };

  // Delete exam
  const handleDelete = (id) => {
    setExams((prev) => prev.filter((exam) => exam.id !== id));
  };

  // Render exams inside calendar cells
  const dateCellRender = (value) => {
    const dayExams = exams.filter((exam) => exam.date.isSame(value, "day"));

    return (
      <ul className="events">
        {dayExams.map((exam) => (
          <li key={exam.id}>
            <Badge
              status={exam.type === "Midterm" ? "processing" : "error"}
              text={
                <span
                  onClick={() => {
                    setEditingExam(exam);
                    form.setFieldsValue({
                      subject: exam.subject,
                      type: exam.type,
                      date: exam.date,
                    });
                    setIsModalOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {exam.subject}
                </span>
              }
            />
            <Popconfirm
              title="Delete exam?"
              onConfirm={() => handleDelete(exam.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <Button
        type="primary"
        onClick={() => {
          setEditingExam(null);
          form.resetFields();
          setIsModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add Exam
      </Button>

      <Calendar dateCellRender={dateCellRender} />

      {/* Add/Edit Exam Modal */}
      <Modal
        title={editingExam ? "Edit Exam" : "Add Exam"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingExam(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Please enter subject" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="type"
            label="Exam Type"
            rules={[{ required: true, message: "Please select exam type" }]}
          >
            <Select placeholder="Select type">
              <Option value="Midterm">Midterm</Option>
              <Option value="Final">Final</Option>
              <Option value="Quiz">Quiz</Option>
              <Option value="Practical">Practical</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Exam Date"
            rules={[{ required: true, message: "Please select date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamSchedule;

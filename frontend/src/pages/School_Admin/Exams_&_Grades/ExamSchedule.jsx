import React, { useState } from "react";
import {
  Calendar,
  Badge,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
  Space,
  Tag,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const examTypeColor = {
  Midterm: "blue",
  Final: "red",
  Quiz: "green",
  Practical: "orange",
};

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

  /* ---------------- ADD / EDIT ---------------- */
  const handleOk = () => {
    form.validateFields().then((values) => {
      const payload = {
        id: editingExam ? editingExam.id : Date.now(),
        subject: values.subject,
        type: values.type,
        date: values.date,
      };

      if (editingExam) {
        setExams((prev) =>
          prev.map((e) => (e.id === editingExam.id ? payload : e))
        );
      } else {
        setExams((prev) => [...prev, payload]);
      }

      setIsModalOpen(false);
      setEditingExam(null);
      form.resetFields();
    });
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = (id) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  /* ---------------- CALENDAR CELL ---------------- */
  const dateCellRender = (value) => {
    const dayExams = exams.filter((e) =>
      e.date.isSame(value, "day")
    );

    if (!dayExams.length) return null;

    return (
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        {dayExams.map((exam) => (
          <Card
            key={exam.id}
            size="small"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setEditingExam(exam);
              form.setFieldsValue(exam);
              setIsModalOpen(true);
            }}
          >
            <Space direction="vertical" size={2}>
              <Text strong>{exam.subject}</Text>
              <Tag color={examTypeColor[exam.type]}>
                {exam.type}
              </Tag>
              <Popconfirm
                title="Delete this exam?"
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDelete(exam.id);
                }}
              >
                <Button
                  size="small"
                  danger
                  type="link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <Card bordered={false}>
      {/* 🔹 HEADER */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4}>📅 Exam Schedule</Title>
          <Text type="secondary">
            Plan, edit & manage exams (Principal View)
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() => {
              setEditingExam(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            + Add Exam
          </Button>
        </Col>
      </Row>

      {/* 🔹 CALENDAR */}
      <Card style={{ marginTop: 16 }}>
        <Calendar dateCellRender={dateCellRender} />
      </Card>

      {/* 🔹 MODAL */}
      <Modal
        title={editingExam ? "Edit Exam" : "Add Exam"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingExam(null);
          form.resetFields();
        }}
        okText="Save"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter subject name" />
          </Form.Item>

          <Form.Item
            label="Exam Type"
            name="type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select exam type">
              <Option value="Midterm">Midterm</Option>
              <Option value="Final">Final</Option>
              <Option value="Quiz">Quiz</Option>
              <Option value="Practical">Practical</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Exam Date"
            name="date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ExamSchedule;

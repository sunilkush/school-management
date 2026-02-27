import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Checkbox,
  message,
  InputNumber,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

// 🔹 Dummy user context (replace from auth)
const currentUser = {
  role: "Super Admin", // or "School Admin"
  schoolId: "school1",
};

// Dummy data (replace with API)
const fetchBoards = async () => [
  { _id: "b1", name: "CBSE" },
  { _id: "b2", name: "ICSE" },
];

const fetchClasses = async () => [
  { _id: "c1", name: "Class 1" },
  { _id: "c2", name: "Class 2" },
];

const fetchSubjects = async () => [
  { _id: "s1", name: "Mathematics" },
  { _id: "s2", name: "Science" },
];

const fetchChapters = async () => [
  {
    _id: "1",
    chapterNo: 1,
    name: "Algebra",
    boardName: "CBSE",
    className: "Class 1",
    subjectName: "Mathematics",
    isGlobal: true,
  },
];

const ChaptersTopics = () => {
  const [chapters, setChapters] = useState([]);
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [form] = Form.useForm();

  const isSuperAdmin = currentUser.role === "Super Admin";

  // 🔹 Load initial data
  useEffect(() => {
    const loadData = async () => {
      setChapters(await fetchChapters());
      setBoards(await fetchBoards());
      setClasses(await fetchClasses());
      setSubjects(await fetchSubjects());
    };
    loadData();
  }, []);

  const handleAddChapter = () => {
    form.resetFields();
    setChapterModalVisible(true);
  };

  const handleChapterSubmit = (values) => {
    const board = boards.find((b) => b._id === values.boardId)?.name;
    const cls = classes.find((c) => c._id === values.classId)?.name;
    const subject = subjects.find((s) => s._id === values.subjectId)?.name;

    // 🔥 ownership logic (VERY IMPORTANT)
    const payload = {
      ...values,
      createdByRole: currentUser.role,
      schoolId: values.isGlobal ? null : currentUser.schoolId,
    };

    const newChapter = {
      _id: Date.now().toString(),
      ...payload,
      boardName: board,
      className: cls,
      subjectName: subject,
    };

    setChapters((prev) => [...prev, newChapter]);
    message.success("Chapter added successfully!");
    setChapterModalVisible(false);
  };

  const chapterColumns = [
    { title: "Chapter No", dataIndex: "chapterNo", key: "chapterNo" },
    { title: "Chapter Name", dataIndex: "name", key: "name" },
    { title: "Board", dataIndex: "boardName", key: "boardName" },
    { title: "Class", dataIndex: "className", key: "className" },
    { title: "Subject", dataIndex: "subjectName", key: "subjectName" },
    {
      title: "Global",
      dataIndex: "isGlobal",
      key: "isGlobal",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Actions",
      key: "actions",
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} type="primary" size="small">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} danger size="small">
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title="Chapters Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddChapter}>
            Add Chapter
          </Button>
        }
      >
        <Table dataSource={chapters} columns={chapterColumns} rowKey="_id" />
      </Card>

      {/* 🔥 Chapter Modal */}
      <Modal
        title="Add Chapter"
        open={chapterModalVisible}
        onCancel={() => setChapterModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleChapterSubmit}>
          <Form.Item
            label="Chapter Name"
            name="name"
            rules={[{ required: true, message: "Please input chapter name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Chapter No"
            name="chapterNo"
            rules={[{ required: true, message: "Please input chapter number!" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Board"
            name="boardId"
            rules={[{ required: true, message: "Please select board!" }]}
          >
            <Select placeholder="Select Board">
              {(boards || []).map((b) => (
                <Select.Option key={b._id} value={b._id}>
                  {b.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Class"
            name="classId"
            rules={[{ required: true, message: "Please select class!" }]}
          >
            <Select placeholder="Select Class">
              {(classes || []).map((c) => (
                <Select.Option key={c._id} value={c._id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subjectId"
            rules={[{ required: true, message: "Please select subject!" }]}
          >
            <Select placeholder="Select Subject">
              {(subjects || []).map((s) => (
                <Select.Option key={s._id} value={s._id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 🔥 Only Super Admin can create global */}
          {isSuperAdmin && (
            <Form.Item name="isGlobal" valuePropName="checked">
              <Checkbox>Global (Super Admin)</Checkbox>
            </Form.Item>
          )}

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChaptersTopics;
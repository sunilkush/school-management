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
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

// 🔹 Redux actions
import { getBoards } from "../../../features/boardSlice.js";
import { fetchAllClasses } from "../../../features/classSlice.js";
import { fetchAllSubjects } from "../../../features/subjectSlice.js";
import {
  fetchVisibleChapters,
  createChapterThunk,
  updateChapterThunk,
  deleteChapterThunk,
} from "../../../features/chapterSlice.js";

// 🔹 auth
import { currentUser } from "../../../features/authSlice.js";

const ChaptersTopics = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { user } = useSelector((state) => state.auth);

  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const isSuperAdmin = user?.role?.name === "Super Admin";

  // ================= REDUX STATE =================

  const boardsState = useSelector((state) => state.boards);
const boards = boardsState?.boards || [];
const boardLoading = boardsState?.loading || false;

const classState = useSelector((state) => state.class);
const classList = classState?.classList || [];

const subjectState = useSelector((state) => state.subject);
const subjects = subjectState?.subjects || [];
  const { chapters, loading: chapterLoading } = useSelector(
    (state) => state.chapters
  );

  // ================= LOAD USER (REFRESH SAFE) =================

  useEffect(() => {
    if (!user) {
      dispatch(currentUser());
    }
  }, [dispatch, user]);

  // ================= LOAD MASTER DATA =================

  useEffect(() => {
    dispatch(getBoards());
    dispatch(fetchAllClasses());
    dispatch(fetchAllSubjects());
  }, [dispatch]);

  // ================= LOAD CHAPTERS (RBAC SAFE) =================

  useEffect(() => {
    if (!user) return; // ⭐ VERY IMPORTANT

    dispatch(
      fetchVisibleChapters({
        schoolId: isSuperAdmin ? undefined : user?.schoolId,
      })
    );
  }, [dispatch, user, isSuperAdmin]);

  // ================= HANDLERS =================

  const handleAddChapter = () => {
    setEditingChapter(null);
    form.resetFields();
    setChapterModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingChapter(record);
    form.setFieldsValue({
      ...record,
      boardId: record.boardId?._id || record.boardId,
      classId: record.classId?._id || record.classId,
      subjectId: record.subjectId?._id || record.subjectId,
    });
    setChapterModalVisible(true);
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteChapterThunk(id));
    if (!res.error) message.success("Chapter deleted");
    else message.error(res.payload);
  };

  // ✅ FINAL FIXED SUBMIT
  const handleChapterSubmit = async (values) => {
    if (!user) {
      message.error("User not loaded yet");
      return;
    }

    const payload = {
      ...values,
      schoolId: values.isGlobal ? null : user?.schoolId,
    };

    let res;

    if (editingChapter) {
      res = await dispatch(
        updateChapterThunk({ id: editingChapter._id, payload })
      );
      if (!res.error) message.success("Chapter updated");
    } else {
      res = await dispatch(createChapterThunk(payload));
      if (!res.error) message.success("Chapter created");
    }

    if (!res.error) {
      setChapterModalVisible(false);
      form.resetFields();
    } else {
      message.error(res.payload);
    }
  };

  // ================= TABLE =================

  const chapterColumns = [
    { title: "Chapter No", dataIndex: "chapterNo" },
    { title: "Chapter Name", dataIndex: "name" },
    { title: "Board", dataIndex: ["boardId", "name"] },
    { title: "Class", dataIndex: ["classId", "name"] },
    { title: "Subject", dataIndex: ["subjectId", "name"] },
    {
      title: "Global",
      dataIndex: "isGlobal",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>

          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // ================= UI =================

  return (
    <div className="p-4">
      <Card
        title="Chapters Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddChapter}
          >
            Add Chapter
          </Button>
        }
      >
        <Spin spinning={chapterLoading}>
          <Table dataSource={chapters} columns={chapterColumns} rowKey="_id" />
        </Spin>
      </Card>

      <Modal
        title={editingChapter ? "Edit Chapter" : "Add Chapter"}
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
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Chapter No"
            name="chapterNo"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Board"
            name="boardId"
            rules={[{ required: true }]}
          >
            <Select loading={boardLoading} placeholder="Select Board">
              {boards?.map((b) => (
                <Select.Option key={b._id} value={b._id}>
                  {b.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Class"
            name="classId"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Class">
              {classList?.map((c) => (
                <Select.Option key={c._id} value={c._id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subjectId"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Subject">
              {subjects?.map((s) => (
                <Select.Option key={s._id} value={s._id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
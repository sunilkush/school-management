import React, { useState, useEffect, useMemo, useRef } from "react";
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

// Redux
import { getBoards } from "../../../features/boardSlice.js";
import { fetchAllClasses } from "../../../features/classSlice.js";
import { fetchAllSubjects } from "../../../features/subjectSlice.js";
import {
  fetchVisibleChapters,
  createChapterThunk,
  updateChapterThunk,
  deleteChapterThunk,
} from "../../../features/chapterSlice.js";
import { currentUser } from "../../../features/authSlice.js";

const { Search } = Input;

const ChaptersTopics = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const hasFetchedRef = useRef(false);

  const { user } = useSelector((state) => state.auth);
  const { chapters, loading: chapterLoading } = useSelector(
    (state) => state.chapters
  );

  const boards = useSelector((state) => state.boards?.boards || []);
  const boardLoading = useSelector((state) => state.boards?.loading);

  const classList = useSelector((state) => state.class?.classList || []);
  const subjects = useSelector((state) => state.subject?.subjects || []);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const isSuperAdmin = user?.role?.name === "Super Admin";

  // ================= USER =================
  useEffect(() => {
    if (!user) dispatch(currentUser());
  }, [dispatch, user]);

  // ================= MASTER DATA =================
  useEffect(() => {
    dispatch(getBoards());
    dispatch(fetchAllClasses());
    dispatch(fetchAllSubjects());
  }, [dispatch]);

  // ================= CHAPTERS =================
  useEffect(() => {
    if (!user || hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    dispatch(
      fetchVisibleChapters({
        schoolId: isSuperAdmin ? undefined : user?.schoolId,
      })
    );
  }, [dispatch, user, isSuperAdmin]);

  // ================= FILTERED DATA =================

  const filteredClasses = useMemo(() => {
    if (!selectedBoard) return classList;
    return classList.filter((c) => c.boardId === selectedBoard);
  }, [selectedBoard, classList]);

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    return subjects.filter((s) => s.classId === selectedClass);
  }, [selectedClass, subjects]);

  // ================= HANDLERS =================

  const handleAddChapter = () => {
    setEditingChapter(null);
    form.resetFields();
    setSelectedBoard(null);
    setSelectedClass(null);
    setChapterModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingChapter(record);

    setSelectedBoard(record?.board?._id);
    setSelectedClass(record?.class?._id);

    form.setFieldsValue({
      ...record,
      boardId: record?.board?._id,
      classId: record?.class?._id,
      subjectId: record?.subject?._id,
    });

    setChapterModalVisible(true);
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteChapterThunk(id));

    if (!res.error) message.success("Chapter deleted");
    else message.error(res.payload);
  };

  const handleChapterSubmit = async (values) => {
    if (!user) return message.error("User not loaded");

    const payload = {
      ...values,
      schoolId: values.isGlobal ? null : user?.schoolId,
    };

    let res;

    if (editingChapter) {
      res = await dispatch(
        updateChapterThunk({
          id: editingChapter._id,
          payload,
        })
      );
    } else {
      res = await dispatch(createChapterThunk(payload));
    }

    if (!res.error) {
      message.success(editingChapter ? "Chapter updated" : "Chapter created");
      setChapterModalVisible(false);
      form.resetFields();
    } else {
      message.error(res.payload);
    }
  };

  // ================= TREE DATA =================

  const treeData = useMemo(() => {
    if (!chapters?.length) return [];

    const boardMap = {};

    chapters.forEach((ch) => {
      const boardName = ch?.board?.name || "Unknown Board";
      const className = ch?.class?.name || "Unknown Class";
      const subjectName = ch?.subject?.name || "Unknown Subject";

      if (!boardMap[boardName]) {
        boardMap[boardName] = {
          key: `board-${boardName}`,
          title: boardName,
          type: "board",
          children: [],
        };
      }

      let classNode = boardMap[boardName].children.find(
        (c) => c.title === className
      );

      if (!classNode) {
        classNode = {
          key: `class-${boardName}-${className}`,
          title: className,
          type: "class",
          children: [],
        };

        boardMap[boardName].children.push(classNode);
      }

      let subjectNode = classNode.children.find(
        (s) => s.title === subjectName
      );

      if (!subjectNode) {
        subjectNode = {
          key: `subject-${boardName}-${className}-${subjectName}`,
          title: subjectName,
          type: "subject",
          children: [],
        };

        classNode.children.push(subjectNode);
      }

      subjectNode.children.push({
        ...ch,
        key: ch._id,
        title: ch.name,
        type: "chapter",
      });
    });

    return Object.values(boardMap);
  }, [chapters]);

  // ================= TABLE =================

  const columns = [
    {
      title: "Board / Class / Subject / Chapter",
      dataIndex: "title",
      render: (text, record) => {
        if (record.type === "board")
          return <span style={{ fontWeight: 700 }}>{text}</span>;

        if (record.type === "class")
          return <span style={{ paddingLeft: 20 }}>📚 {text}</span>;

        if (record.type === "subject")
          return <span style={{ paddingLeft: 40 }}>📘 {text}</span>;

        return <span style={{ paddingLeft: 60 }}>📖 {text}</span>;
      },
    },

    {
      title: "Chapter No",
      render: (_, r) => (r.type === "chapter" ? r.chapterNo || "-" : "-"),
    },

    {
      title: "Subject",
      render: (_, r) =>
        r.type === "chapter" ? r?.subject?.name || "-" : "-",
    },

    {
      title: "Global",
      render: (_, r) =>
        r.type === "chapter" ? (r.isGlobal ? "Yes" : "No") : "-",
    },

    {
      title: "Actions",
      render: (_, record) =>
        record.type === "chapter" ? (
          <Space>
            <Button
              icon={<EditOutlined />}
              type="primary"
              size="small"
              onClick={() => handleEdit(record)}
            />

            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
              onClick={() => handleDelete(record._id)}
            />
          </Space>
        ) : null,
    },
  ];

  // ================= UI =================

  return (
    <div style={{ padding: 20 }}>
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
        <Search
          placeholder="Search chapters..."
          style={{ width: 300, marginBottom: 20 }}
          onChange={(e) =>
            dispatch(
              fetchVisibleChapters({
                search: e.target.value,
              })
            )
          }
        />

        <Spin spinning={chapterLoading}>
          <Table
            columns={columns}
            dataSource={treeData}
            rowKey="key"
            pagination={false}
            expandable={{
              childrenColumnName: "children",
            }}
          />
        </Spin>
      </Card>

      {/* ================= MODAL ================= */}

      <Modal
        title={editingChapter ? "Edit Chapter" : "Add Chapter"}
        open={chapterModalVisible}
        width={650}
        onCancel={() => setChapterModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleChapterSubmit}>
          <Form.Item
            label="Board"
            name="boardId"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              loading={boardLoading}
              placeholder="Select Board"
              onChange={(value) => {
                setSelectedBoard(value);
                form.setFieldsValue({ classId: null, subjectId: null });
              }}
            >
              {boards.map((b) => (
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
            <Select
              showSearch
              placeholder="Select Class"
              disabled={!selectedBoard}
              onChange={(value) => {
                setSelectedClass(value);
                form.setFieldsValue({ subjectId: null });
              }}
            >
              {filteredClasses.map((c) => (
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
            <Select
              showSearch
              placeholder="Select Subject"
              disabled={!selectedClass}
            >
              {filteredSubjects.map((s) => (
                <Select.Option key={s._id} value={s._id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Chapter Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter chapter name" />
          </Form.Item>

          <Form.Item
            label="Chapter Number"
            name="chapterNo"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          {isSuperAdmin && (
            <Form.Item name="isGlobal" valuePropName="checked">
              <Checkbox>Make Global (All Schools)</Checkbox>
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
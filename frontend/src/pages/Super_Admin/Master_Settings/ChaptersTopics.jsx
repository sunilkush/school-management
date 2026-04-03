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
import { getBoardClass } from "../../../features/boardClassSlice.js";
import { getAllSubjects } from "../../../features/subjectSlice.js";
import {
  fetchVisibleChapters,
  createChapterThunk,
  updateChapterThunk,
  deleteChapterThunk,
} from "../../../features/chapterSlice.js";

const { Search } = Input;

const ChaptersTopics = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const hasFetchedRef = useRef(false);
  const searchTimeout = useRef();

  const { user } = useSelector((state) => state.auth);
  const { chapters, loading: chapterLoading } = useSelector(
    (state) => state.chapters
  );

  const boards = useSelector((state) => state.boards?.boards || []);
  const boardLoading = useSelector((state) => state.boards?.loading);
  const boardClass = useSelector((state) => state.boardClass?.boardClass || []);
  const subjects = useSelector((state) => state.subject?.subjects || []);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const isSuperAdmin = user?.role?.name === "Super Admin";

  // ================= MASTER DATA =================
  useEffect(() => {
    dispatch(getBoards());
    dispatch(getAllSubjects({}));
  }, [dispatch]);

  // ================= FETCH CLASSES BY BOARD =================
  useEffect(() => {
    if (selectedBoard) {
      dispatch(getBoardClass({ boardId: selectedBoard }));
    }
  }, [dispatch, selectedBoard]);

  // ================= FETCH CHAPTERS =================
  useEffect(() => {
    if (!user || hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    dispatch(
      fetchVisibleChapters({
        schoolId: isSuperAdmin ? undefined : user?.schoolId,
      })
    );
  }, [dispatch, user, isSuperAdmin]);

  // ================= FILTERED =================
  const filteredClasses = useMemo(() => {
    if (!selectedBoard) return boardClass;

    return boardClass.filter(
      (c) =>
        String(c.boardId?._id || c.boardId) === String(selectedBoard)
    );
  }, [selectedBoard, boardClass]);

 

  // ================= SEARCH =================
  const handleSearch = (value) => {
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      dispatch(fetchVisibleChapters({ search: value }));
    }, 400);
  };

  useEffect(() => {
    return () => clearTimeout(searchTimeout.current);
  }, []);

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
      name: record?.name,
      chapterNo: record?.chapterNo,
      description: record?.description,
      isGlobal: record?.isGlobal,
      boardId: record?.board?._id,
      schoolClassId: record?.class?._id,
      subjectId: record?.subject?._id,
    });

    setChapterModalVisible(true);
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteChapterThunk(id));
    if (!res.error) message.success("Chapter deleted");
    else message.error(res.payload);
  };

  const handleSubmit = async (values) => {
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
      message.success(editingChapter ? "Updated" : "Created");
      setChapterModalVisible(false);
      form.resetFields();
    } else {
      message.error(res.payload);
    }
  };

  // ================= TREE =================
  const treeData = useMemo(() => {
    if (!chapters?.length) return [];

    const map = {};

    chapters.forEach((ch) => {
      const b = ch?.board?.name || "Unknown Board";
      const c = ch?.class?.name || "Unknown Class";
      const s = ch?.subject?.name || "Unknown Subject";

      if (!map[b]) map[b] = { key: b, title: b, children: [] };

      let classNode = map[b].children.find((x) => x.title === c);
      if (!classNode) {
        classNode = { key: b + c, title: c, children: [] };
        map[b].children.push(classNode);
      }

      let subjectNode = classNode.children.find((x) => x.title === s);
      if (!subjectNode) {
        subjectNode = { key: b + c + s, title: s, children: [] };
        classNode.children.push(subjectNode);
      }

      subjectNode.children.push({
        key: ch._id,
        title: ch.name,
        type: "chapter",
        ...ch,
      });
    });

    return Object.values(map);
  }, [chapters]);

  // ================= TABLE =================
  const columns = [
    {
      title: "Structure",
      dataIndex: "title",
      render: (text, r) => {
        if (!r.type) return <b>{text}</b>;
        return <span style={{ paddingLeft: 40 }}>📖 {text}</span>;
      },
    },
    {
      title: "No",
      render: (_, r) => (r.type === "chapter" ? r.chapterNo : "-"),
    },
    {
      title: "Subject",
      render: (_, r) =>
        r.type === "chapter" ? r?.subject?.name : "-",
    },
    {
      title: "Global",
      render: (_, r) =>
        r.type === "chapter" ? (r.isGlobal ? "Yes" : "No") : "-",
    },
    {
      title: "Action",
      render: (_, r) =>
        r.type === "chapter" && (
          <Space>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(r)}
            />
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
              onClick={() => handleDelete(r._id)}
            />
          </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card
        title="Chapters"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddChapter}
          >
            Add
          </Button>
        }
      >
        <Search
          placeholder="Search..."
          style={{ width: 300, marginBottom: 20 }}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <Spin spinning={chapterLoading}>
          <Table
            columns={columns}
            dataSource={treeData}
            pagination={false}
            expandable={{ childrenColumnName: "children" }}
            rowKey="key"
          />
        </Spin>
      </Card>

      <Modal
        title={editingChapter ? "Edit Chapter" : "Add Chapter"}
        open={chapterModalVisible}
        onCancel={() => setChapterModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="boardId" label="Board" rules={[{ required: true }]}>
            <Select
              loading={boardLoading}
              onChange={(v) => {
                setSelectedBoard(v);
                setSelectedClass(null);
                form.setFieldsValue({
                  schoolClassId: null,
                  subjectId: null,
                });
              }}
            >
              {boards.map((b) => (
                <Select.Option key={b._id} value={b._id}>
                  {b.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="schoolClassId" label="Class" rules={[{ required: true }]}>
            <Select
              disabled={!selectedBoard}
              onChange={(v) => {
                setSelectedClass(v);
                form.setFieldsValue({ subjectId: null });
              }}
            >
              {filteredClasses?.map((c) => (
                <Select.Option key={c._id} value={c._id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}>
            <Select disabled={!selectedClass}>
              {subjects?.map((s) => (
                <Select.Option key={s._id} value={s._id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="name" label="Chapter Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="chapterNo" label="Chapter No" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          {isSuperAdmin && (
            <Form.Item name="isGlobal" valuePropName="checked">
              <Checkbox>Global</Checkbox>
            </Form.Item>
          )}

          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChaptersTopics;
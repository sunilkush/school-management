import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
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
  Tag,
  Typography,
  Divider,
  Avatar,
  Badge,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  SearchOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { getBoards } from "../../../features/boardSlice.js";
import { getBoardClass } from "../../../features/boardClassSlice.js";
import { getAllSubjects } from "../../../features/subjectSlice.js";
import {
  fetchVisibleChapters,
  createChapterThunk,
  updateChapterThunk,
  deleteChapterThunk,
} from "../../../features/chapterSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  toolbarRow,
  tableContainer,
  tableHeadCss,
  modalTitle,
} from "../../../styles/pageStyles";

const { Search } = Input;
const { Text } = Typography;

// ─── Color palette per tree depth ───────────────────────────────────────────
const DEPTH_COLORS = {
  board: { bg: "#e8f4ff", border: "#91caff", text: "#0958d9", icon: <AppstoreOutlined /> },
  class: { bg: "#f6ffed", border: "#b7eb8f", text: "#389e0d", icon: <FolderOpenOutlined /> },
  subject: { bg: "#fff7e6", border: "#ffd591", text: "#d46b08", icon: <ReadOutlined /> },
  chapter: { bg: "#fff", border: "var(--border-muted)", text: "#595959", icon: <BookOutlined /> },
};

const rowStyle = (type) => {
  const c = DEPTH_COLORS[type] || DEPTH_COLORS.chapter;
  return { background: c.bg };
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const ChaptersTopics = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const hasFetchedRef = useRef(false);
  const searchTimeout = useRef(null);

  const { user } = useSelector((state) => state.auth || {});
  const { chapters = [], loading: chapterLoading, pagination: meta = {} } = useSelector((state) => state.chapter || {});

  const boards = useSelector((state) => state.boards?.boards || []);
  const boardLoading = useSelector((state) => state.boards?.loading);
  const boardClass = useSelector((state) => state.boardClass?.boardClass || []);
  const subjects = useSelector((state) => state.subject?.subjects || []);

  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(500);

  const isSuperAdmin = user?.role?.name === "Super Admin";

  const fetchChapters = useCallback(
    (overrides = {}) => {
      if (!user && !isSuperAdmin) return;

      dispatch(
        fetchVisibleChapters({
          page,
          limit,
          search: searchValue,
          schoolId: isSuperAdmin ? undefined : user?.schoolId,
          ...overrides,
        })
      );
    },
    [dispatch, isSuperAdmin, user, page, limit, searchValue]
  );

  useEffect(() => {
    dispatch(getBoards());
    dispatch(getAllSubjects({}));
  }, [dispatch]);

  useEffect(() => {
    if (selectedBoard) {
      dispatch(getBoardClass({ boardId: selectedBoard }));
    }
  }, [dispatch, selectedBoard]);

  useEffect(() => {
    if (!user || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchChapters({ page: 1, search: "" });
  }, [user, fetchChapters]);

  useEffect(() => {
    if (!hasFetchedRef.current) return;
    fetchChapters();
  }, [page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredClasses = useMemo(() => {
    if (!selectedBoard) return boardClass;
    return boardClass.filter((c) => String(c.boardId?._id || c.boardId) === String(selectedBoard));
  }, [selectedBoard, boardClass]);

  const handleSearch = (value) => {
    const nextValue = value || "";
    setSearchValue(nextValue);

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      dispatch(
        fetchVisibleChapters({
          page: 1,
          limit,
          search: nextValue,
          schoolId: isSuperAdmin ? undefined : user?.schoolId,
        })
      );
    }, 400);
  };

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const handleAddChapter = () => {
    setEditingChapter(null);
    form.resetFields();
    setSelectedBoard(null);
    setSelectedClass(null);
    setChapterModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingChapter(record);
    setSelectedBoard(record?.board?._id || null);
    setSelectedClass(record?.class?._id || null);

    if (record?.board?._id) {
      dispatch(getBoardClass({ boardId: record.board._id }));
    }

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
    if (!res.error) {
      message.success("Chapter deleted successfully");
      setDeleteConfirmId(null);
      fetchChapters();
    } else {
      message.error(res.payload || "Failed to delete chapter");
    }
  };

  const handleSubmit = async (values) => {
    if (!user) return message.error("User not loaded");

    const classId = values.schoolClassId || values.boardClassId;

    const payload = {
      ...values,
      schoolClassId: classId,
      boardClassId: classId,
      schoolId: values.isGlobal ? null : user?.schoolId,
    };

    let res;
    if (editingChapter) {
      res = await dispatch(updateChapterThunk({ id: editingChapter._id, payload }));
    } else {
      res = await dispatch(createChapterThunk(payload));
    }

    if (!res.error) {
      message.success(editingChapter ? "Chapter updated!" : "Chapter created!");
      setChapterModalVisible(false);
      form.resetFields();
      setEditingChapter(null);
      fetchChapters();
    } else {
      message.error(res.payload || "Failed to save chapter");
    }
  };

  // ─── Tree builder ─────────────────────────────────────────────────────────
  const treeData = useMemo(() => {
    if (!chapters?.length) return [];

    const map = {};

    chapters.forEach((ch) => {
      const boardId = ch?.board?._id || "unknown-board-id";
      const classId = ch?.class?._id || "unknown-class-id";
      const subjectId = ch?.subject?._id || "unknown-subject-id";

      const b = ch?.board?.name || "Unknown Board";
      const c = ch?.class?.name || "Unknown Class";
      const s = ch?.subject?.name || "Unknown Subject";

      const boardKey = `board-${boardId}`;
      const classKey = `class-${boardId}-${classId}`;
      const subjectKey = `subject-${boardId}-${classId}-${subjectId}`;
      const chapterKey = `chapter-${ch._id}`;

      if (!map[boardKey]) {
        map[boardKey] = {
          key: boardKey,
          title: b,
          _type: "board",
          children: [],
        };
      }

      let classNode = map[boardKey].children.find((x) => x.key === classKey);
      if (!classNode) {
        classNode = {
          key: classKey,
          title: c,
          _type: "class",
          children: [],
        };
        map[boardKey].children.push(classNode);
      }

      let subjectNode = classNode.children.find((x) => x.key === subjectKey);
      if (!subjectNode) {
        subjectNode = {
          key: subjectKey,
          title: s,
          _type: "subject",
          children: [],
        };
        classNode.children.push(subjectNode);
      }

      subjectNode.children.push({
        key: chapterKey,
        title: ch.name,
        _type: "chapter",
        type: "chapter",
        ...ch,
      });
    });

    return Object.values(map);
  }, [chapters]);

  // ─── Column definitions ───────────────────────────────────────────────────
  const columns = [
    {
      title: "Name",
      dataIndex: "title",
      render: (text, r) => {
        const type = r._type || "chapter";
        const cfg = DEPTH_COLORS[type];
        const indentMap = { board: 0, class: 8, subject: 16, chapter: 24 };
        const indent = indentMap[type] ?? 0;

        return (
          <Space style={{ paddingLeft: indent }}>
            <Avatar
              size={28}
              icon={cfg.icon}
              style={{
                background: cfg.bg,
                color: cfg.text,
                border: `1.5px solid ${cfg.border}`,
                flexShrink: 0,
              }}
            />
            <Text strong={type !== "chapter"} style={{ color: cfg.text, fontSize: type === "board" ? 15 : 14 }}>
              {text}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Ch. No",
      width: 90,
      align: "center",
      render: (_, r) =>
        r._type === "chapter" ? (
          <Tag color="blue" style={{ fontWeight: 600, minWidth: 36, textAlign: "center" }}>
            #{r.chapterNo}
          </Tag>
        ) : "—",
    },
    {
      title: "Subject",
      width: 160,
      render: (_, r) =>
        r._type === "chapter" ? (
          <Tag icon={<ReadOutlined />} color="orange" style={{ fontWeight: 500 }}>
            {r?.subject?.name}
          </Tag>
        ) : "—",
    },
    {
      title: "Scope",
      width: 110,
      align: "center",
      render: (_, r) =>
        r._type === "chapter" ? (
          r.isGlobal ? (
            <Badge
              count={<GlobalOutlined style={{ color: "var(--primary)" }} />}
              style={{ background: "transparent" }}
            >
              <Tag color="geekblue">Global</Tag>
            </Badge>
          ) : (
            <Tag color="default">School</Tag>
          )
        ) : "—",
    },
    {
      title: "Actions",
      width: 100,
      align: "center",
      render: (_, r) =>
        r._type === "chapter" ? (
          <Space size={6}>
            <Tooltip title="Edit chapter">
              <Button
                icon={<EditOutlined />}
                size="small"
                type="text"
                style={{ color: "var(--primary)" }}
                onClick={() => handleEdit(r)}
              />
            </Tooltip>
            <Tooltip title="Delete chapter">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                type="text"
                danger
                onClick={() => setDeleteConfirmId(r._id)}
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  const totalChapters = meta?.total || chapters?.length || 0;
  const globalCount = chapters?.filter((c) => c.isGlobal).length || 0;
  const boardCount = treeData.length;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Chapters & Topics"
        subtitle="Manage your curriculum structure — boards, classes, subjects, and chapters."
        icon={<BookOutlined />}
      />

      {/* ── Stat cards ── */}
      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<AppstoreOutlined />} label="Boards" value={boardCount} color="#0958d9" />
        <StatCard icon={<BookOutlined />} label="Chapters" value={totalChapters} color="#389e0d" />
        <StatCard icon={<GlobalOutlined />} label="Global" value={globalCount} color="#d46b08" />
      </div>

      <style>{tableHeadCss("chapters-tbl")}</style>

      {/* ── Main panel ── */}
      <div style={{ ...sectionPanel, padding: 0 }}>
        {/* toolbar */}
        <div
          style={{
            ...toolbarRow,
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-muted)",
            marginBottom: 0,
          }}
        >
          <Search
            placeholder="Search chapters…"
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            allowClear
            style={{ width: 280 }}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            onClick={handleAddChapter}
          >
            Add Chapter
          </Button>
        </div>

        {/* table */}
        <div className="chapters-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
          <Spin spinning={chapterLoading}>
            <Table
              columns={columns}
              dataSource={treeData}
              rowKey="key"
              expandable={{ childrenColumnName: "children", defaultExpandAllRows: true }}
              rowClassName={(r) => `chapter-row-${r._type || "chapter"}`}
              onRow={(r) => ({ style: rowStyle(r._type || "chapter") })}
              pagination={{
                current: page,
                pageSize: limit,
                total: meta?.total || chapters?.length || 0,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100","200","500"],
                onChange: (nextPage, nextLimit) => {
                  setPage(nextPage);
                  setLimit(nextLimit);
                },
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: "48px 0", textAlign: "center" }}>
                    <BookOutlined style={{ fontSize: 40, color: "var(--text-muted)", marginBottom: 12 }} />
                    <br />
                    <Text type="secondary">No chapters yet. Click "Add Chapter" to get started.</Text>
                  </div>
                ),
              }}
            />
          </Spin>
        </div>
      </div>

      {/* ══ Add / Edit Modal ══ */}
      <Modal
        title={modalTitle(
          editingChapter ? <EditOutlined /> : <PlusOutlined />,
          editingChapter ? "Edit Chapter" : "Add New Chapter"
        )}
        open={chapterModalVisible}
        onCancel={() => {
          setChapterModalVisible(false);
          setEditingChapter(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingChapter ? "Save Changes" : "Create Chapter"}
        width={520}
        destroyOnClose
        styles={{ body: { paddingTop: 8 } }}
      >
        <Divider style={{ margin: "12px 0 20px" }} />
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
          <Form.Item
            name="boardId"
            label="Board"
            rules={[{ required: true, message: "Select a board" }]}
            style={{ gridColumn: "1 / 2" }}
          >
            <Select
              placeholder="Choose board"
              loading={boardLoading}
              onChange={(v) => {
                setSelectedBoard(v);
                setSelectedClass(null);
                form.setFieldsValue({ schoolClassId: null, subjectId: null });
              }}
            >
              {boards.map((b) => (
                <Select.Option key={b._id} value={b._id}>
                  {b.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item
              name="schoolClassId"
              label="Class"
              rules={[{ required: true, message: "Select a class" }]}
            >
              <Select
                placeholder="Choose class"
                disabled={!selectedBoard}
                onChange={(v) => {
                  setSelectedClass(v);
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
              name="subjectId"
              label="Subject"
              rules={[{ required: true, message: "Select a subject" }]}
            >
              <Select placeholder="Choose subject" disabled={!selectedClass}>
                {subjects.map((s) => (
                  <Select.Option key={s._id} value={s._id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="chapterNo" label="Chapter No." rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="1" />
            </Form.Item>
            <Form.Item name="name" label="Chapter Name" rules={[{ required: true, message: "Enter chapter name" }]}>
              <Input placeholder="e.g. Introduction to Algebra" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional notes about this chapter…" style={{ resize: "none" }} />
          </Form.Item>

          {isSuperAdmin && (
            <Form.Item name="isGlobal" valuePropName="checked">
              <Checkbox>
                <Space>
                  <GlobalOutlined style={{ color: "var(--primary)" }} />
                  <span>Mark as <b>Global</b> (visible to all schools)</span>
                </Space>
              </Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ══ Delete confirmation modal ══ */}
      <Modal
        open={!!deleteConfirmId}
        title={modalTitle(<DeleteOutlined />, "Delete Chapter?")}
        onCancel={() => setDeleteConfirmId(null)}
        onOk={() => handleDelete(deleteConfirmId)}
        okText="Yes, Delete"
        okButtonProps={{ danger: true }}
        width={400}
      >
        <Text type="secondary">
          This action cannot be undone. Are you sure you want to permanently delete this chapter?
        </Text>
      </Modal>
    </div>
  );
};

export default ChaptersTopics;

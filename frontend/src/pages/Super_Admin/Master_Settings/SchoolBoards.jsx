import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Checkbox,
  message,
  Select,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  StopOutlined,
  BookOutlined,
  LinkOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  createBoard,
  getBoards,
  updateBoard,
  deleteBoard,
  assignSchoolBoards,
} from "../../../features/boardSlice.js";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { currentUser } from "../../../features/authSlice.js";
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

const { Text } = Typography;
const { Option } = Select;

/* ─── Status Badge ─── */
function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: isActive ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)",
      color: isActive ? "#22C55E" : "#EF4444",
      border: `1px solid ${isActive ? "rgba(220,252,231,0.5)" : "rgba(254,226,226,0.5)"}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#22C55E" : "#EF4444",
        display: "inline-block",
      }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, accentColor }) {
  return (
    <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
      <div style={iconWell(accentColor, 42)}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Board Code Chip ─── */
function CodeChip({ code }) {
  if (!code) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  return (
    <span style={{
      background: "rgba(20,184,166,0.2)", color: "#14B8A6",
      border: "1px solid rgba(20,184,166,0.5)",
      borderRadius: 6, padding: "2px 9px",
      fontSize: 12, fontWeight: 600,
      fontFamily: "monospace", letterSpacing: 0.5,
    }}>
      {code}
    </span>
  );
}

/* ─── Main Component ─── */
const SchoolBoards = () => {
  const dispatch = useDispatch();

  const boardsState = useSelector((state) => state.boards || {});
  const boards = boardsState?.boards?.boards || boardsState?.boards || [];
  const loading = boardsState?.loading || false;
  const {user} = useSelector((state) => state.auth || {});
  const { schools = [] } = useSelector((state) => state.school || {});

  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  /* ── Role ── */
  const createdByRole = user?.role?.name || null;

  /* ── Fetch ── */
  useEffect(() => {
    dispatch(currentUser())
    dispatch(getBoards());
    dispatch(fetchSchools());
  }, [dispatch]);

  /* ── Handlers ── */
  const handleAddBoard = () => {
    setEditingBoard(null);
    form.resetFields();
    form.setFieldsValue({ createdByRole, isActive: true });
    setModalVisible(true);
  };

  const handleEditBoard = (board) => {
    setEditingBoard(board);
    form.setFieldsValue({
      name: board?.name,
      code: board?.code,
      description: board?.description,
      isActive: board?.isActive,
      createdByRole: board?.createdByRole || createdByRole,
    });
    setModalVisible(true);
  };

  const handleDeleteBoard = async (id) => {
    try {
      await dispatch(deleteBoard(id)).unwrap();
      message.success("Board deleted successfully");
      dispatch(getBoards());
    } catch (err) {
      message.error(err?.message || "Delete failed");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBoard) {
        await dispatch(updateBoard({ id: editingBoard._id, boardData: values })).unwrap();
        message.success("Board updated successfully");
      } else {
        await dispatch(createBoard(values)).unwrap();
        message.success("Board created successfully");
      }
      setModalVisible(false);
      dispatch(getBoards());
    } catch (err) {
      message.error(err?.message || "Operation failed");
    }
  };

  const handleOpenAssignModal = () => {
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (values) => {
    try {
      await dispatch(assignSchoolBoards(values)).unwrap();
      message.success("Boards assigned successfully");
      setAssignModalVisible(false);
    } catch (err) {
      message.error(err?.message || "Assign failed");
    }
  };

  /* ── Filtered Data ── */
  const boardArray = Array.isArray(boards) ? boards : [];
  const filteredBoards = boardArray.filter((b) => {
    const matchSearch =
      !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.code?.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "" ? true : statusFilter === "active" ? b.isActive : !b.isActive;
    return matchSearch && matchStatus;
  });

  /* ── Stats ── */
  const totalBoards = boardArray.length;
  const activeBoards = boardArray.filter((b) => b.isActive).length;
  const inactiveBoards = totalBoards - activeBoards;

  /* ── Columns ── */
  const columns = [
    {
      title: "Board Name",
      dataIndex: "name",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(20,184,166,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <BookOutlined style={{ color: "#14B8A6", fontSize: 14 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      render: (code) => <CodeChip code={code} />,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (desc) =>
        desc ? (
          <span style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 240, display: "inline-block" }}>
            {desc}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (val) => <StatusBadge isActive={val} />,
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space size={8}>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditBoard(record)}
            style={{
              borderRadius: 8, fontWeight: 600, fontSize: 12,
              background: "rgba(20,184,166,0.2)", borderColor: "rgba(20,184,166,0.5)", color: "#14B8A6",
            }}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              Modal.confirm({
                title: "Delete Board?",
                content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
                okText: "Delete",
                okButtonProps: { danger: true },
                cancelText: "Cancel",
                onOk: () => handleDeleteBoard(record._id),
              });
            }}
            style={{
              borderRadius: 8, fontWeight: 600, fontSize: 12,
              background: "rgba(254,226,226,0.2)", borderColor: "rgba(254,226,226,0.5)", color: "#EF4444",
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="School Exam Boards"
        subtitle="Manage boards and assign them to schools"
        icon={<ApartmentOutlined />}
        extra={
          <Space>
            <Button icon={<LinkOutlined />} onClick={handleOpenAssignModal}>
              Assign School Boards
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBoard}>
              Add Board
            </Button>
          </Space>
        }
      />

      {/* ── Stats ── */}
      <div style={{ ...statGrid(180), marginTop: 20 }}>
        <StatCard label="Total Boards"    value={totalBoards}   icon={<ApartmentOutlined />}    accentColor="#14B8A6" />
        <StatCard label="Active Boards"   value={activeBoards}  icon={<CheckCircleOutlined />}  accentColor="#22C55E" />
        <StatCard label="Inactive Boards" value={inactiveBoards} icon={<StopOutlined />}        accentColor="#EF4444" />
        <StatCard label="Schools Covered" value={schools.length} icon={<BookOutlined />}        accentColor="#2563EB" />
      </div>

      <style>{tableHeadCss("boards-tbl")}</style>

      {/* ── Table Card ── */}
      <div style={{ ...sectionPanel, padding: 0 }}>
        {/* Filter Bar */}
        <div style={{
          ...toolbarRow,
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-muted)",
          marginBottom: 0,
        }}>
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search board name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="All Status"
              allowClear
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v ?? "")}
              style={{ width: 140 }}
              suffixIcon={<FilterOutlined style={{ fontSize: 11 }} />}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing <strong>{filteredBoards.length}</strong> of <strong>{totalBoards}</strong> boards
          </Text>
        </div>

        {/* Table */}
        <div className="boards-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
          <Table
            rowKey="_id"
            dataSource={filteredBoards}
            columns={columns}
            loading={loading}
            pagination={{
              pageSize: 8,
              size: "small",
              showSizeChanger: false,
              style: { padding: "12px 20px" },
            }}
          />
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        title={modalTitle(
          editingBoard ? <EditOutlined /> : <PlusOutlined />,
          editingBoard ? "Edit Board" : "Add New Board",
          editingBoard ? "Update board details" : "Fill in the board information"
        )}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText={editingBoard ? "Update Board" : "Create Board"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="createdByRole" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Board Name"
            name="name"
            rules={[{ required: true, message: "Board name is required" }]}
          >
            <Input placeholder="e.g. Central Board of Secondary Education" />
          </Form.Item>

          <Form.Item
            label="Code"
            name="code"
          >
            <Input
              placeholder="e.g. CBSE"
              style={{ fontFamily: "monospace", letterSpacing: 1 }}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea
              placeholder="Brief description of this board..."
              rows={3}
            />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(220,252,231,0.2)", border: "1px solid rgba(220,252,231,0.5)",
              borderRadius: 10, padding: "10px 14px",
            }}>
              <Checkbox />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#22C55E" }}>Mark as Active</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Active boards are visible to schools</div>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Assign Modal ── */}
      <Modal
        title={modalTitle(<LinkOutlined />, "Assign School Boards", "Link boards to a school")}
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={() => assignForm.submit()}
        okText="Assign Boards"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            label="Select School"
            name="schoolId"
            rules={[{ required: true, message: "Please select a school" }]}
          >
            <Select
              placeholder="Choose a school..."
              showSearch
              optionFilterProp="children"
            >
              {schools.map((school) => (
                <Option key={school._id} value={school._id}>
                  {school.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Select Boards"
            name="boardIds"
            rules={[{ required: true, message: "Please select at least one board" }]}
          >
            <Select
              mode="multiple"
              placeholder="Choose boards to assign..."
              showSearch
              optionFilterProp="children"
            >
              {boardArray.map((board) => (
                <Option key={board._id} value={board._id}>
                  <span style={{ fontWeight: 500 }}>{board.name}</span>
                  {board.code && (
                    <span style={{ color: "var(--text-muted)", fontSize: 11, marginLeft: 6 }}>({board.code})</span>
                  )}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolBoards;

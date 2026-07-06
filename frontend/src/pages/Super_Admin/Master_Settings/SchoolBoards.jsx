import React, { useEffect, useState } from "react";
<<<<<<< HEAD
import { Table, Modal, Form, Input, Select, Checkbox, message, Spin } from "antd";
import { Award, BookMarked, CheckCircle, XCircle, School2, Plus, Pencil, Trash2, Link2, Search, Filter } from "lucide-react";
=======
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
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
import { useDispatch, useSelector } from "react-redux";
import {
  createBoard, getBoards, updateBoard, deleteBoard, assignSchoolBoards,
} from "../../../features/boardSlice.js";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { currentUser } from "../../../features/authSlice.js";
<<<<<<< HEAD
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState, iconWell,
} from "../../../styles/pageStyles";

const ACCENT = "#14B8A6";

function StatusPill({ isActive }) {
=======
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
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
  return (
    <span style={pill(isActive ? "#16A34A" : "#DC2626", isActive ? "rgba(220,252,231,0.4)" : "rgba(254,226,226,0.4)")}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#22C55E" : "#EF4444", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

<<<<<<< HEAD
=======
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
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
function CodeChip({ code }) {
  if (!code) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  return (
    <span style={{ ...pill("#14B8A6", "rgba(20,184,166,0.12)"), fontFamily: "monospace", letterSpacing: 0.5, fontSize: 11 }}>
      {code}
    </span>
  );
}

const SchoolBoards = () => {
  const dispatch = useDispatch();
  const boardsState = useSelector((s) => s.boards || {});
  const boards = boardsState?.boards?.boards || boardsState?.boards || [];
  const loading = boardsState?.loading || false;
  const { user } = useSelector((s) => s.auth || {});
  const { schools = [] } = useSelector((s) => s.school || {});

  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const createdByRole = user?.role?.name || null;

  useEffect(() => {
    dispatch(currentUser());
    dispatch(getBoards());
    dispatch(fetchSchools());
  }, [dispatch]);

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

  const handleDeleteBoard = async (id, name) => {
    Modal.confirm({
      title: "Delete Board?",
      content: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(deleteBoard(id)).unwrap();
          message.success("Board deleted");
          dispatch(getBoards());
        } catch (err) { message.error(err?.message || "Delete failed"); }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBoard) {
        await dispatch(updateBoard({ id: editingBoard._id, boardData: values })).unwrap();
        message.success("Board updated");
      } else {
        await dispatch(createBoard(values)).unwrap();
        message.success("Board created");
      }
      setModalVisible(false);
      dispatch(getBoards());
    } catch (err) { message.error(err?.message || "Operation failed"); }
  };

  const handleAssignSubmit = async (values) => {
    try {
      await dispatch(assignSchoolBoards(values)).unwrap();
      message.success("Boards assigned successfully");
      setAssignModalVisible(false);
    } catch (err) { message.error(err?.message || "Assign failed"); }
  };

  const boardArray = Array.isArray(boards) ? boards : [];
  const filteredBoards = boardArray.filter((b) => {
    const matchSearch = !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.code?.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "" ? true : statusFilter === "active" ? b.isActive : !b.isActive;
    return matchSearch && matchStatus;
  });

  const totalBoards = boardArray.length;
  const activeBoards = boardArray.filter((b) => b.isActive).length;
  const inactiveBoards = totalBoards - activeBoards;

  const columns = [
    {
      title: "Board Name",
      dataIndex: "name",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconWell(ACCENT, 30)}>
            <BookMarked size={14} />
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
<<<<<<< HEAD
      render: (desc) => desc
        ? <span style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 240, display: "inline-block" }}>{desc}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
=======
      render: (desc) =>
        desc ? (
          <span style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 240, display: "inline-block" }}>
            {desc}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => <StatusPill isActive={v} />,
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => handleEditBoard(record)}
            style={{ ...pill("#14B8A6", "rgba(20,184,166,0.12)"), cursor: "pointer", border: "1px solid rgba(20,184,166,0.3)", padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={() => handleDeleteBoard(record._id, record.name)}
            style={{ ...pill("#DC2626", "rgba(254,226,226,0.3)"), cursor: "pointer", border: "1px solid rgba(220,38,38,0.3)", padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      ),
    },
  ];

<<<<<<< HEAD
  const modalTitleStyle = (color, icon, title, subtitle) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={iconWell(color, 34)}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>{subtitle}</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{tableHeadCss("boards-tbl")}</style>
      <div style={pageWrapper}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconWell(ACCENT, 44)}><Award size={22} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>School Exam Boards</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Manage boards and assign them to schools</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { assignForm.resetFields(); setAssignModalVisible(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-soft)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              <Link2 size={15} /> Assign School Boards
            </button>
            <button
              onClick={handleAddBoard}
              style={{ display: "flex", alignItems: "center", gap: 6, background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              <Plus size={15} /> Add Board
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={statGrid(160)}>
          {[
            { label: "Total Boards", value: totalBoards, color: ACCENT, icon: <Award size={18} /> },
            { label: "Active", value: activeBoards, color: "#22C55E", icon: <CheckCircle size={18} /> },
            { label: "Inactive", value: inactiveBoards, color: "#EF4444", icon: <XCircle size={18} /> },
            { label: "Schools", value: schools.length, color: "#6366F1", icon: <School2 size={18} /> },
          ].map((s) => (
            <div key={s.label} style={statCard({ color: s.color, bg: "var(--surface)", accentBar: s.color })}>
              <div>
                <div style={statLabel(s.color)}>{s.label}</div>
                <div style={statValue(s.color)}>{s.value}</div>
              </div>
              <div style={iconWell(s.color, 40)}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Table Panel */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Input
                prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
                placeholder="Search board name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 260, borderRadius: 8 }}
              />
              <Select
                placeholder="All Status"
                allowClear
                value={statusFilter || undefined}
                onChange={(v) => setStatusFilter(v ?? "")}
                style={{ width: 130 }}
                suffixIcon={<Filter size={11} />}
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Showing <strong>{filteredBoards.length}</strong> of <strong>{totalBoards}</strong> boards
            </span>
          </div>

          <Spin spinning={!!loading}>
            <div className="boards-tbl">
              <Table
                rowKey="_id"
                dataSource={filteredBoards}
                columns={columns}
                pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
                locale={{ emptyText: <div style={emptyState}><Award size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} /><div style={{ color: "var(--text-muted)", fontSize: 13 }}>No boards found</div></div> }}
              />
            </div>
          </Spin>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={modalTitleStyle(
          ACCENT,
          editingBoard ? <Pencil size={16} /> : <Plus size={16} />,
          editingBoard ? "Edit Board" : "Add New Board",
          editingBoard ? "Update board details" : "Fill in the board information"
        )}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText={editingBoard ? "Update Board" : "Create Board"}
        okButtonProps={{ style: { background: ACCENT, borderColor: ACCENT, borderRadius: 8, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="createdByRole" hidden><Input /></Form.Item>
          <Form.Item
            label={<span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Board Name</span>}
            name="name"
            rules={[{ required: true, message: "Board name is required" }]}
          >
            <Input placeholder="e.g. Central Board of Secondary Education" style={{ borderRadius: 8, height: 38 }} />
          </Form.Item>
          <Form.Item
            label={<span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Code</span>}
            name="code"
          >
            <Input placeholder="e.g. CBSE" style={{ borderRadius: 8, height: 38, fontFamily: "monospace", letterSpacing: 1 }} />
          </Form.Item>
          <Form.Item
            label={<span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Description</span>}
            name="description"
          >
            <Input.TextArea placeholder="Brief description of this board..." rows={3} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,252,231,0.15)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "10px 14px" }}>
              <Checkbox />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>Mark as Active</div>
=======
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
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Active boards are visible to schools</div>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

<<<<<<< HEAD
      {/* Assign Modal */}
      <Modal
        title={modalTitleStyle("#2563EB", <Link2 size={16} />, "Assign School Boards", "Link boards to a school")}
=======
      {/* ── Assign Modal ── */}
      <Modal
        title={modalTitle(<LinkOutlined />, "Assign School Boards", "Link boards to a school")}
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={() => assignForm.submit()}
        okText="Assign Boards"
<<<<<<< HEAD
        okButtonProps={{ style: { background: "#2563EB", borderColor: "#2563EB", borderRadius: 8, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
=======
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit} style={{ marginTop: 16 }}>
          <Form.Item
<<<<<<< HEAD
            label={<span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Select School</span>}
            name="schoolId"
            rules={[{ required: true, message: "Please select a school" }]}
          >
            <Select placeholder="Choose a school..." showSearch optionFilterProp="children" style={{ borderRadius: 8 }}>
              {schools.map((school) => (
                <Select.Option key={school._id} value={school._id}>{school.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={<span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Select Boards</span>}
            name="boardIds"
            rules={[{ required: true, message: "Please select at least one board" }]}
          >
            <Select mode="multiple" placeholder="Choose boards to assign..." showSearch optionFilterProp="children" style={{ borderRadius: 8 }}>
              {boardArray.map((board) => (
                <Select.Option key={board._id} value={board._id}>
                  <span style={{ fontWeight: 500 }}>{board.name}</span>
                  {board.code && <span style={{ color: "var(--text-muted)", fontSize: 11, marginLeft: 6 }}>({board.code})</span>}
                </Select.Option>
=======
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
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
<<<<<<< HEAD
    </>
=======
    </div>
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
  );
};

export default SchoolBoards;

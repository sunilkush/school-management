import React, { useEffect, useState } from "react";
import {
  Layout,
  Card,
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
  ConfigProvider,
  Tag,
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


const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

/* ─── Status Badge ─── */
function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: isActive ? "#f6ffed" : "#fff2f0",
      color: isActive ? "#52c41a" : "#ff4d4f",
      border: `1px solid ${isActive ? "#b7eb8f" : "#ffa39e"}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#52c41a" : "#ff4d4f",
        display: "inline-block",
      }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, accentColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        borderTop: `3px solid ${accentColor}`,
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
        cursor: "default",
        flex: 1,
      }}
      bodyStyle={{ padding: "18px 20px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{
            fontSize: 26, fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            color: "#141414", letterSpacing: -0.5,
          }}>{value}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: accentColor,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* ─── Board Code Chip ─── */
function CodeChip({ code }) {
  if (!code) return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
  return (
    <span style={{
      background: "#f0eeff", color: "#6c5ce7",
      border: "1px solid #d3cdf7",
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
   console.log(createdByRole)
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
            background: "#f0eeff",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <BookOutlined style={{ color: "#6c5ce7", fontSize: 14 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#141414" }}>{name}</span>
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
          <span style={{ fontSize: 12, color: "#595959", maxWidth: 240, display: "inline-block" }}>
            {desc}
          </span>
        ) : (
          <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>
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
              background: "#f0eeff", borderColor: "#d3cdf7", color: "#6c5ce7",
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
              background: "#fff2f0", borderColor: "#ffa39e", color: "#ff4d4f",
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6c5ce7",
          borderRadius: 12,
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        },
      }}
    >
      <Layout style={{ background: "#f5f6fa", minHeight: "100vh" }}>

        {/* ── Page Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
          padding: "20px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>School Exam Boards</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
              Manage boards and assign them to schools
            </div>
          </div>
          <Space>
            <Button
              icon={<LinkOutlined />}
              onClick={handleOpenAssignModal}
              style={{
                borderRadius: 10, fontWeight: 600, height: 38,
                background: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            >
              Assign School Boards
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddBoard}
              style={{
                background: "#6c5ce7", borderColor: "#6c5ce7",
                borderRadius: 10, fontWeight: 600, height: 38,
              }}
            >
              Add Board
            </Button>
          </Space>
        </div>

        <Content style={{ padding: "24px 32px" }}>

          {/* ── Stats ── */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Boards"    value={totalBoards}   icon={<ApartmentOutlined />}    accentColor="#6c5ce7" />
            <StatCard label="Active Boards"   value={activeBoards}  icon={<CheckCircleOutlined />}  accentColor="#00b894" />
            <StatCard label="Inactive Boards" value={inactiveBoards} icon={<StopOutlined />}        accentColor="#e17055" />
            <StatCard label="Schools Covered" value={schools.length} icon={<BookOutlined />}        accentColor="#0984e3" />
          </div>

          {/* ── Table Card ── */}
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Filter Bar */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap",
              gap: 10, padding: "16px 20px",
              borderBottom: "1px solid #f5f5f5",
            }}>
              <Space wrap>
                <Input
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Search board name, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 240, borderRadius: 10 }}
                  allowClear
                />
                <Select
                  placeholder="All Status"
                  allowClear
                  value={statusFilter || undefined}
                  onChange={(v) => setStatusFilter(v ?? "")}
                  style={{ width: 140, borderRadius: 10 }}
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
              onRow={(_, index) => ({
                style: { background: index % 2 === 0 ? "#fff" : "#fafafa" },
                onMouseEnter: (e) => (e.currentTarget.style.background = "#f0eeff22"),
                onMouseLeave: (e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafafa"),
              })}
              style={{ borderRadius: 0 }}
            />
          </Card>
        </Content>

        {/* ── Add / Edit Modal ── */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "#f0eeff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {editingBoard
                  ? <EditOutlined style={{ color: "#6c5ce7", fontSize: 15 }} />
                  : <PlusOutlined style={{ color: "#6c5ce7", fontSize: 15 }} />
                }
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {editingBoard ? "Edit Board" : "Add New Board"}
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>
                  {editingBoard ? "Update board details" : "Fill in the board information"}
                </div>
              </div>
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          okText={editingBoard ? "Update Board" : "Create Board"}
          okButtonProps={{
            style: { background: "#6c5ce7", borderColor: "#6c5ce7", borderRadius: 10, fontWeight: 600 },
          }}
          cancelButtonProps={{ style: { borderRadius: 10 } }}
          destroyOnClose
          styles={{ header: { borderBottom: "1px solid #f5f5f5", paddingBottom: 16 } }}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
            <Form.Item name="createdByRole" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Board Name</span>}
              name="name"
              rules={[{ required: true, message: "Board name is required" }]}
            >
              <Input
                placeholder="e.g. Central Board of Secondary Education"
                style={{ borderRadius: 10, height: 38 }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Code</span>}
              name="code"
            >
              <Input
                placeholder="e.g. CBSE"
                style={{ borderRadius: 10, height: 38, fontFamily: "monospace", letterSpacing: 1 }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Description</span>}
              name="description"
            >
              <Input.TextArea
                placeholder="Brief description of this board..."
                rows={3}
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item name="isActive" valuePropName="checked">
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#f6ffed", border: "1px solid #b7eb8f",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <Checkbox />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#52c41a" }}>Mark as Active</div>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>Active boards are visible to schools</div>
                </div>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* ── Assign Modal ── */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "#e3f2fd",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <LinkOutlined style={{ color: "#0984e3", fontSize: 15 }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Assign School Boards</div>
                <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>Link boards to a school</div>
              </div>
            </div>
          }
          open={assignModalVisible}
          onCancel={() => setAssignModalVisible(false)}
          onOk={() => assignForm.submit()}
          okText="Assign Boards"
          okButtonProps={{
            style: { background: "#0984e3", borderColor: "#0984e3", borderRadius: 10, fontWeight: 600 },
          }}
          cancelButtonProps={{ style: { borderRadius: 10 } }}
          destroyOnClose
          styles={{ header: { borderBottom: "1px solid #f5f5f5", paddingBottom: 16 } }}
        >
          <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit} style={{ marginTop: 16 }}>
            <Form.Item
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Select School</span>}
              name="schoolId"
              rules={[{ required: true, message: "Please select a school" }]}
            >
              <Select
                placeholder="Choose a school..."
                showSearch
                optionFilterProp="children"
                style={{ borderRadius: 10 }}
              >
                {schools.map((school) => (
                  <Option key={school._id} value={school._id}>
                    {school.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 600, fontSize: 13 }}>Select Boards</span>}
              name="boardIds"
              rules={[{ required: true, message: "Please select at least one board" }]}
            >
              <Select
                mode="multiple"
                placeholder="Choose boards to assign..."
                showSearch
                optionFilterProp="children"
                style={{ borderRadius: 10 }}
              >
                {boardArray.map((board) => (
                  <Option key={board._id} value={board._id}>
                    <span style={{ fontWeight: 500 }}>{board.name}</span>
                    {board.code && (
                      <span style={{ color: "#8c8c8c", fontSize: 11, marginLeft: 6 }}>({board.code})</span>
                    )}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

      </Layout>
    </ConfigProvider>
  );
};

export default SchoolBoards;
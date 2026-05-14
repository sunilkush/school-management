import { useEffect, useState, useMemo } from "react";
import {
  Layout,
  Button,
  Table,
  Select,
  Card,
  Typography,
  Space,
  Input,
  ConfigProvider,
} from "antd";
import {
  PlusOutlined,
  BookOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  FilterOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import AddBoardClassModal from "../../../../components/forms/AddBoardClassModal.jsx";
import { getBoardClass } from "../../../../features/boardClassSlice.js";
import { getBoards } from "../../../../features/boardSlice.js";
import { useDispatch, useSelector } from "react-redux";

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const isActive = status === "active";
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

/* ─── Board Name Chip ─── */
function BoardChip({ name }) {
  if (!name) return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: "#f0eeff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <ApartmentOutlined style={{ color: "#6c5ce7", fontSize: 12 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#141414" }}>{name}</span>
    </div>
  );
}

/* ─── Class Name Cell ─── */
function ClassCell({ name }) {
  return (
    <span style={{
      background: "#e3f2fd", color: "#0984e3",
      border: "1px solid #9ed4f5",
      borderRadius: 6, padding: "3px 10px",
      fontSize: 12, fontWeight: 600,
    }}>
      {name}
    </span>
  );
}

/* ─── Main Component ─── */
export default function BoardClassPage() {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector((state) => state.boardClass);
  const boardsState = useSelector((state) => state.boards || {});
  const boards = boardsState?.boards?.boards || boardsState?.boards || [];

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);

  /* ── Fetch ── */
  useEffect(() => {
    dispatch(getBoards());
  }, [dispatch]);

  useEffect(() => {
   if(selectedBoard){
     dispatch(getBoardClass(selectedBoard ? { boardId: selectedBoard } : {}));
   }
  }, [selectedBoard, dispatch]);

  /* ── Filtered Data ── */
  const filtered = useMemo(() => {
    return boardClass.filter((item) => {
      const matchSearch =
        !search ||
        item.boardId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "" ? true : item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [boardClass, search, statusFilter]);

  /* ── Stats ── */
  const totalClasses = boardClass.length;
  const activeClasses = boardClass.filter((c) => c.status === "active").length;
  const inactiveClasses = totalClasses - activeClasses;
  const boardCount = new Set(boardClass.map((c) => c.boardId?._id).filter(Boolean)).size;

  /* ── Columns ── */
  const columns = [
    {
      title: "Board Name",
      render: (_, record) => <BoardChip name={record.boardId?.name} />,
    },
    {
      title: "Class",
      dataIndex: "name",
      render: (name) => <ClassCell name={name} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <StatusBadge status={status} />,
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
          borderBottomLeftRadius: 24, borderBottomRightRadius: 24,borderTopRightRadius: 24,borderTopLeftRadius: 24,
        }}>
          <div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Board Classes</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
              Manage classes assigned to each exam board
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
            style={{
              background: "#6c5ce7", borderColor: "#6c5ce7",
              borderRadius: 10, fontWeight: 600, height: 38, paddingInline: 20,
            }}
          >
            Add Board Class
          </Button>
        </div>

        <Content style={{ padding: "24px 0px" }}>

          {/* ── Stats ── */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Classes"   value={totalClasses}   icon={<AppstoreOutlined />}    accentColor="#6c5ce7" />
            <StatCard label="Active Classes"  value={activeClasses}  icon={<CheckCircleOutlined />} accentColor="#00b894" />
            <StatCard label="Inactive Classes" value={inactiveClasses} icon={<StopOutlined />}      accentColor="#e17055" />
            <StatCard label="Boards Linked"   value={boardCount}     icon={<ApartmentOutlined />}   accentColor="#0984e3" />
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
                  placeholder="Search board or class name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 240, borderRadius: 10 }}
                  allowClear
                />
                <Select
                  placeholder="Filter by Board"
                  allowClear
                  value={selectedBoard || undefined}
                  onChange={(v) => setSelectedBoard(v || null)}
                  showSearch
                  optionFilterProp="children"
                  style={{ width: 200, borderRadius: 10 }}
                  suffixIcon={<ApartmentOutlined style={{ fontSize: 11 }} />}
                >
                  {(Array.isArray(boards) ? boards : []).map((board) => (
                    <Option key={board._id} value={board._id}>
                      {board.name}
                    </Option>
                  ))}
                </Select>
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
                Showing <strong>{filtered.length}</strong> of <strong>{totalClasses}</strong> classes
              </Text>
            </div>

            {/* Table */}
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={filtered}
              loading={loading}
              pagination={{
                pageSize: 10,
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

        {/* ── Modal ── */}
        <AddBoardClassModal
          open={open}
          setOpen={setOpen}
          onSuccess={() => {
            setOpen(false);
            dispatch(getBoardClass(selectedBoard ? { boardId: selectedBoard } : {}));
          }}
        />

      </Layout>
    </ConfigProvider>
  );
}
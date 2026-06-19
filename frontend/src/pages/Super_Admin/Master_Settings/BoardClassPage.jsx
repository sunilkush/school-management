import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Table,
  Select,
  Space,
  Input,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SearchOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import AddBoardClassModal from "../../../components/forms/AddBoardClassModal.jsx";
import { getBoardClass } from "../../../features/boardClassSlice.js";
import { getBoards } from "../../../features/boardSlice.js";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  toolbarRow,
  tableHeadCss,
  statGrid,
  statCard,
  statLabel,
  statValue,
  pill,
} from "../../../styles/pageStyles";

const { Option } = Select;

function StatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span style={pill(isActive ? "#22C55E" : "#EF4444", isActive ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)")}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#22C55E" : "#EF4444", display: "inline-block", marginRight: 5 }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function BoardChip({ name }) {
  if (!name) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ApartmentOutlined style={{ color: "var(--primary)", fontSize: 12 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
    </div>
  );
}

function ClassCell({ name }) {
  return (
    <span style={pill("var(--primary)", "var(--surface-soft)")}>
      {name}
    </span>
  );
}

export default function BoardClassPage() {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector((state) => state.boardClass);
  const boardsState = useSelector((state) => state.boards || {});
  const boards = boardsState?.boards?.boards || boardsState?.boards || [];

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(getBoards());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBoard) {
      dispatch(getBoardClass(selectedBoard ? { boardId: selectedBoard } : {}));
    }
  }, [selectedBoard, dispatch]);

  const filtered = useMemo(() => {
    return boardClass.filter((item) => {
      const matchSearch =
        !search ||
        item.boardId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "" ? true : item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [boardClass, search, statusFilter]);

  const totalClasses = boardClass.length;
  const activeClasses = boardClass.filter((c) => c.status === "active").length;
  const inactiveClasses = totalClasses - activeClasses;
  const boardCount = new Set(boardClass.map((c) => c.boardId?._id).filter(Boolean)).size;

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
    <div style={pageWrapper}>
      <style>{tableHeadCss("bc-table")}</style>

      <PageHeader
        title="Board Classes"
        subtitle="Manage classes assigned to each exam board"
        icon={<ApartmentOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ fontWeight: 600, borderRadius: 10 }}>
            Add Board Class
          </Button>
        }
      />

      <div className="stat-grid" style={statGrid(160)}>
        <div style={statCard({ color: "var(--primary)" })}>
          <div>
            <div style={statLabel("var(--primary)")}>Total Classes</div>
            <div style={statValue("var(--primary)")}>{totalClasses}</div>
          </div>
          <AppstoreOutlined style={{ fontSize: 26, color: "var(--primary)", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#22C55E" })}>
          <div>
            <div style={statLabel("#22C55E")}>Active Classes</div>
            <div style={statValue("#22C55E")}>{activeClasses}</div>
          </div>
          <CheckCircleOutlined style={{ fontSize: 26, color: "#22C55E", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#EF4444" })}>
          <div>
            <div style={statLabel("#EF4444")}>Inactive Classes</div>
            <div style={statValue("#EF4444")}>{inactiveClasses}</div>
          </div>
          <StopOutlined style={{ fontSize: 26, color: "#EF4444", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#0984e3" })}>
          <div>
            <div style={statLabel("#0984e3")}>Boards Linked</div>
            <div style={statValue("#0984e3")}>{boardCount}</div>
          </div>
          <ApartmentOutlined style={{ fontSize: 26, color: "#0984e3", opacity: 0.4 }} />
        </div>
      </div>

      <div style={pageCard}>
        <div className="page-toolbar" style={{ ...toolbarRow, padding: "14px 20px", borderBottom: "1px solid var(--border-muted)" }}>
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search board or class name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="Filter by Board"
              allowClear
              value={selectedBoard || undefined}
              onChange={(v) => setSelectedBoard(v || null)}
              showSearch
              optionFilterProp="children"
              style={{ width: 200 }}
              suffixIcon={<ApartmentOutlined style={{ fontSize: 11 }} />}
            >
              {(Array.isArray(boards) ? boards : []).map((board) => (
                <Option key={board._id} value={board._id}>{board.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="All Status"
              allowClear
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v ?? "")}
              style={{ width: 140 }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Space>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Showing <strong>{filtered.length}</strong> of <strong>{totalClasses}</strong> classes
          </span>
        </div>

        <Table
          className="bc-table"
          rowKey="_id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10, size: "small", showSizeChanger: false, style: { padding: "12px 20px" } }}
        />
      </div>

      <AddBoardClassModal
        open={open}
        setOpen={setOpen}
        onSuccess={() => {
          setOpen(false);
          dispatch(getBoardClass(selectedBoard ? { boardId: selectedBoard } : {}));
        }}
      />
    </div>
  );
}

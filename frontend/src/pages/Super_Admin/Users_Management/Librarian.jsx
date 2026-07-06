<<<<<<< HEAD
import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllUser, deleteUser, activeUser } from "../../../features/authSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import { Table, Input, Select, message, Spin, Popconfirm } from "antd";
import { Library, UserCheck, UserX, School2, Search, RefreshCw, Filter } from "lucide-react";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState, avatarStyle, iconWell,
} from "../../../styles/pageStyles";

const ACCENT = "#6366F1";

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function StatusPill({ isActive }) {
  return (
    <span style={pill(isActive ? "#16A34A" : "#DC2626", isActive ? "rgba(220,252,231,0.4)" : "rgba(254,226,226,0.4)")}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#22C55E" : "#EF4444", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

const Librarian = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error, user: currentUser } = useSelector((s) => s.auth);
  const { schools = [] } = useSelector((s) => s.school);

  const [selectedSchool, setSelectedSchool] = useState("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { dispatch(fetchAllUser()); dispatch(fetchSchools()); }, [dispatch]);

  const refresh = () => dispatch(fetchAllUser());
  const schoolNames = ["All", ...new Set(schools.map((s) => s.name).filter(Boolean))];

  const allLibrarians = useMemo(() => users.filter((u) => u?.role?.name === "Librarian"), [users]);

  const librarians = useMemo(() => {
    let data = [...allLibrarians];
    if (selectedSchool !== "All") data = data.filter((l) => l.school?.name === selectedSchool);
    if (search) data = data.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === "active") data = data.filter((u) => u.isActive);
    if (statusFilter === "inactive") data = data.filter((u) => !u.isActive);
    return data;
  }, [allLibrarians, selectedSchool, search, statusFilter]);

  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) { message.warning("You cannot change your own status"); return; }
    dispatch(user.isActive ? deleteUser({ id: user._id, isActive: false }) : activeUser({ id: user._id, isActive: true }))
      .then(() => dispatch(fetchAllUser()));
  };

  const handleBulkAction = async (activate) => {
    const targets = allLibrarians.filter((r) => selectedRowKeys.includes(r._id) && r._id !== currentUser?._id);
    if (!targets.length) { message.warning("No eligible rows selected"); return; }
    setBulkLoading(true);
    try {
      await Promise.all(targets.map((r) => dispatch(activate ? activeUser({ id: r._id, isActive: true }) : deleteUser({ id: r._id, isActive: false }))));
      message.success(`${targets.length} librarian(s) ${activate ? "activated" : "deactivated"}`);
      setSelectedRowKeys([]);
      dispatch(fetchAllUser());
    } catch { message.error("Bulk action failed"); }
    finally { setBulkLoading(false); }
  };

  const totalCount = allLibrarians.length;
  const activeCount = allLibrarians.filter((u) => u.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const schoolCount = new Set(allLibrarians.map((u) => u.school?.name).filter(Boolean)).size;

  const columns = [
    {
      title: "Librarian",
      key: "user",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...avatarStyle(record.name, 36), borderRadius: 10, overflow: "hidden" }}>
            {record.avatar ? <img src={record.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(record.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{record.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "School",
      dataIndex: ["school", "name"],
      render: (v) => v ? <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    { title: "Status", dataIndex: "isActive", render: (v) => <StatusPill isActive={v} /> },
    {
      title: "Action",
      align: "right",
      render: (_, record) => (
        <button
          onClick={() => handleToggleStatus(record)}
          style={{ ...pill(record.isActive ? "#DC2626" : "#16A34A", record.isActive ? "rgba(254,226,226,0.3)" : "rgba(220,252,231,0.3)"), cursor: "pointer", border: `1px solid ${record.isActive ? "#FCA5A5" : "#86EFAC"}`, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}
        >
          {record.isActive ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("librarian-tbl")}</style>
      <div style={pageWrapper}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={iconWell(ACCENT, 44)}><Library size={22} /></div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Librarian Management</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Manage librarians across all schools</div>
          </div>
        </div>

        <div style={statGrid(160)}>
          {[
            { label: "Total Librarians", value: totalCount, color: ACCENT, icon: <Library size={18} /> },
            { label: "Active", value: activeCount, color: "#22C55E", icon: <UserCheck size={18} /> },
            { label: "Inactive", value: inactiveCount, color: "#EF4444", icon: <UserX size={18} /> },
            { label: "Schools", value: schoolCount, color: "#F59E0B", icon: <School2 size={18} /> },
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

        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Input prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />} placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 230, borderRadius: 8 }} />
              <Select value={selectedSchool} onChange={setSelectedSchool} style={{ width: 180 }}>
                {schoolNames.map((n) => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
              <Select placeholder="All Status" allowClear value={statusFilter || undefined} onChange={(v) => setStatusFilter(v ?? "")} style={{ width: 120 }} suffixIcon={<Filter size={11} />}>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
              <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface-soft)", border: "1px solid var(--border-muted)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Showing <strong>{librarians.length}</strong> of <strong>{totalCount}</strong></span>
          </div>

          {selectedRowKeys.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{selectedRowKeys.length} selected</span>
              <Popconfirm title={`Activate ${selectedRowKeys.length} librarian(s)?`} onConfirm={() => handleBulkAction(true)} okText="Activate">
                <button style={{ ...pill("#16A34A", "rgba(220,252,231,0.4)"), cursor: "pointer", padding: "4px 12px", fontSize: 12 }} disabled={bulkLoading}>Activate</button>
              </Popconfirm>
              <Popconfirm title={`Deactivate ${selectedRowKeys.length} librarian(s)?`} onConfirm={() => handleBulkAction(false)} okText="Deactivate" okButtonProps={{ danger: true }}>
                <button style={{ ...pill("#DC2626", "rgba(254,226,246,0.4)"), cursor: "pointer", padding: "4px 12px", fontSize: 12 }} disabled={bulkLoading}>Deactivate</button>
              </Popconfirm>
            </div>
          )}

          {error && <div style={{ ...pill("#DC2626", "rgba(254,226,226,0.3)"), marginBottom: 12, padding: "8px 14px" }}>{error}</div>}

          <Spin spinning={!!loading}>
            <div className="librarian-tbl">
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={librarians}
                rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
                pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
                locale={{ emptyText: <div style={emptyState}><Library size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} /><div style={{ color: "var(--text-muted)", fontSize: 13 }}>No librarians found</div></div> }}
              />
            </div>
          </Spin>
        </div>
      </div>
    </>
  );
};
=======
import React from "react";
import { BookOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";

const Librarian = () => (
  <UserRoleList
    roleNames={["Librarian"]}
    title="Librarian Management"
    subtitle="Super Admin can manage librarians across all schools"
    icon={<BookOutlined />}
    nounSingular="librarian"
    nounPlural="librarians"
    enableBulkActions={false}
  />
);
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d

export default Librarian;

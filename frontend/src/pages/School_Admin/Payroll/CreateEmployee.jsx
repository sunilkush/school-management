import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Drawer, Input, Modal, Space, Table, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined, TeamOutlined,
  BookOutlined, UserOutlined, SearchOutlined, CalendarOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getEmployees, softDeleteEmployee } from "../../../features/employeeSlice";
import EmployeeForm from "../../../components/forms/EmployeeForm";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, tableHeadCss,
} from "../../../styles/pageStyles";

const C = {
  primary: "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "#EFF6FF",
  accent: "var(--accent)", accentLight: "var(--accent-light)",
  success: "var(--success)", successLight: "var(--success-light)",
  danger: "var(--danger)", dangerLight: "var(--danger-light)",
  warning: "var(--warning)", warningLight: "var(--warning-light)",
  purple: "var(--purple)", purpleLight: "rgba(var(--purple-rgb), 0.08)",
  border: "var(--border)", text: "var(--text)", textSub: "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface: "var(--surface)", surfaceSoft: "var(--background)",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, var(--primary), var(--accent))",
  "linear-gradient(135deg, var(--purple), var(--pink))",
  "linear-gradient(135deg, var(--warning), var(--danger))",
  "linear-gradient(135deg, var(--success), var(--accent))",
  "linear-gradient(135deg, var(--info), var(--primary))",
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRoleName = (e) => e.userId?.roleId?.name || e.userId?.role?.name || "Staff";

const StatusBadge = ({ active }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: active ? C.successLight : "var(--surface-soft)",
    color: active ? "var(--success-hover)" : C.textSub,
    border: `1px solid ${active ? "var(--success-light)" : C.border}`,
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: "50%",
      background: active ? C.success : C.textMuted, display: "inline-block",
    }} />
    {active ? "Active" : "Inactive"}
  </span>
);

const RoleBadge = ({ role = "Staff" }) => {
  const isTeacher = role.toLowerCase().includes("teacher");
  const isAdmin = role.toLowerCase().includes("admin");
  return (
    <span style={{
      padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isTeacher ? C.accentLight : isAdmin ? C.primaryLighter : C.purpleLight,
      color: isTeacher ? "var(--accent-hover)" : isAdmin ? C.primary : C.purple,
      border: `1px solid ${isTeacher ? "rgba(var(--accent-rgb), 0.3)" : isAdmin ? C.primaryLight : "rgba(var(--purple-rgb), 0.3)"}`,
    }}>
      {role}
    </span>
  );
};

const CreateEmployee = () => {
  const dispatch = useDispatch();
  const { employees = [], loading } = useSelector((s) => s.employee);
  const { profile, user } = useSelector((s) => s.auth);
  const schoolId = profile?.school?._id || user?.school?._id;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (schoolId) dispatch(getEmployees({ schoolId }));
  }, [dispatch, schoolId]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.isActive !== false).length,
    teachers: employees.filter((e) =>
      getRoleName(e).toLowerCase().includes("teacher"),
    ).length,
    staff: employees.filter((e) =>
      !getRoleName(e).toLowerCase().includes("teacher"),
    ).length,
  }), [employees]);

  const dataSource = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list
      .filter((e) => {
        if (!search) return true;
        const name = (e.userId?.name || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        const desig = (e.designation || "").toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || dept.includes(q) || desig.includes(q);
      })
      .map((e, i) => ({
        key: e._id,
        _id: e._id,
        raw: e,
        name: e.userId?.name || "—",
        role: getRoleName(e),
        department: e.department || "—",
        designation: e.designation || "—",
        employeeStatus: e.employeeStatus || "—",
        joinDate: e.joinDate,
        isActive: e.isActive !== false,
        avatarBg: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
      }));
  }, [employees, search]);

  const handleAdd = () => {
    setEditingEmployee(null);
    setDrawerOpen(true);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record.raw);
    setDrawerOpen(true);
  };

  const handleDeactivate = (record) => {
    Modal.confirm({
      title: `Deactivate ${record.name}?`,
      content: "This employee will be marked as inactive and access will be restricted.",
      okText: "Deactivate",
      okButtonProps: { danger: true, style: { borderRadius: 8 } },
      cancelButtonProps: { style: { borderRadius: 8 } },
      icon: <StopOutlined style={{ color: C.danger }} />,
      onOk: async () => {
        try {
          await dispatch(softDeleteEmployee(record._id)).unwrap();
          message.success(`${record.name} deactivated successfully`);
          dispatch(getEmployees({ schoolId }));
        } catch (err) {
          message.error(err?.message || "Failed to deactivate employee");
        }
      },
    });
  };

  const handleSuccess = () => {
    setDrawerOpen(false);
    setEditingEmployee(null);
    dispatch(getEmployees({ schoolId }));
  };

  const columns = [
    {
      title: "Employee",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: r.avatarBg,
            color: "#fff", fontSize: 13, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {getInitials(r.name)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 3 }}>
              {r.name}
            </div>
            <RoleBadge role={r.role} />
          </div>
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      render: (v) => <span style={{ color: C.textSub, fontSize: 13 }}>{v}</span>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      render: (v) => <span style={{ color: C.textSub, fontSize: 13 }}>{v}</span>,
    },
    {
      title: "Emp. Status",
      dataIndex: "employeeStatus",
      render: (v) => (
        <span style={{
          padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: C.warningLight, color: "var(--warning-hover)",
          border: "1px solid var(--warning-light)",
        }}>
          {v}
        </span>
      ),
    },
    {
      title: "Joined",
      dataIndex: "joinDate",
      render: (v) => v ? (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSub }}>
          <CalendarOutlined style={{ fontSize: 10 }} />
          {dayjs(v).format("DD MMM YYYY")}
        </span>
      ) : <span style={{ color: C.textMuted }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (v) => <StatusBadge active={v} />,
    },
    {
      title: "Actions",
      width: 110,
      render: (_, r) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(r)}
            style={{
              borderRadius: 7, borderColor: C.primary,
              color: C.primary, background: C.primaryLighter,
            }}
          />
          <Button
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleDeactivate(r)}
            disabled={!r.isActive}
            style={{
              borderRadius: 7,
              borderColor: r.isActive ? C.danger : C.border,
              color: r.isActive ? C.danger : C.textMuted,
              background: r.isActive ? C.dangerLight : C.surfaceSoft,
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("emp-tbl")}</style>

      <PageHeader
        title="Employee Management"
        subtitle="Manage all school staff — teachers, admin, and support employees"
        icon={<TeamOutlined />}
        extra={
          <Button
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 600,
            }}
          >
            Add Employee
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ ...statGrid(150), margin: "20px 0 20px" }}>
        {[
          { icon: <TeamOutlined />,      label: "Total Employees", value: stats.total,    color: "var(--primary)" },
          { icon: <UserOutlined />,      label: "Active",          value: stats.active,   color: "var(--success)" },
          { icon: <BookOutlined />,      label: "Teachers",        value: stats.teachers, color: "var(--accent)" },
          { icon: <ApartmentOutlined />, label: "Other Staff",     value: stats.staff,    color: "var(--purple)" },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.surface, borderRadius: 14,
            border: "1px solid " + C.border, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={iconWell(s.color, 42)}>{s.icon}</div>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: s.color,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2,
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>All Employees</span>
          <span style={{
            fontSize: 12, padding: "2px 9px", borderRadius: 20,
            background: C.primaryLighter, color: C.primary,
            border: "1px solid " + C.primaryLight, fontWeight: 600,
          }}>
            {dataSource.length}
          </span>
          <div style={{ marginLeft: "auto" }}>
            <Input
              placeholder="Search name, dept or designation…"
              prefix={<SearchOutlined style={{ color: C.textMuted }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250, borderRadius: 8 }}
              allowClear
            />
          </div>
        </div>
        <Table
          className="emp-tbl"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} employees` }}
          rowKey="key"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No employees found. Click 'Add Employee' to get started." }}
        />
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingEmployee(null); }}
        width={Math.min(760, typeof window !== "undefined" ? window.innerWidth * 0.92 : 700)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: C.primaryLighter, color: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15,
            }}>
              {editingEmployee ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, lineHeight: 1.2 }}>
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </div>
              {editingEmployee && (
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>
                  {editingEmployee.userId?.name || ""}
                </div>
              )}
            </div>
          </div>
        }
        styles={{ header: { borderBottom: "1px solid " + C.border, padding: "14px 20px" } }}
        destroyOnClose
      >
        <EmployeeForm
          editingEmployee={editingEmployee}
          onSuccess={handleSuccess}
        />
      </Drawer>
    </div>
  );
};

export default CreateEmployee;

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Input, Tag } from "antd";
import { TeamOutlined, CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { fetchAllUser } from "../../../features/authSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableHeadCss,
  avatarStyle, pill, emptyState, statCard, statLabel, statValue, statGrid,
} from "../../../styles/pageStyles";

const STAT_META = [
  { key: "total",   label: "Total Parents", color: "var(--accent)", icon: <TeamOutlined /> },
  { key: "active",  label: "Active",        color: "var(--success)", icon: <CheckCircleOutlined /> },
  { key: "showing", label: "Showing",       color: "var(--primary)", icon: <EyeOutlined /> },
];

const ParentsList = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");

  const { users = [], user: loggedInUser, loading } = useSelector(
    (state) => state.auth || {}
  );
  const { activeYear, selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );

  const schoolId = loggedInUser?.school?._id;
  const currentYear = selectedAcademicYear || activeYear;

  useEffect(() => {
    if (schoolId) {
      if (!activeYear) dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (schoolId) {
      const params = { roleName: ["Parent"], isActive: true };
      if (currentYear?._id) params.academicYearId = currentYear._id;
      dispatch(fetchAllUser(params));
    }
  }, [dispatch, schoolId, currentYear?._id]);

  const parentsList = useMemo(() => {
    return users.filter((u) => {
      if (!u.isActive || u.school?._id !== schoolId || u.role?.name?.toLowerCase() !== "parent")
        return false;
      if (!searchText) return true;
      const kw = searchText.toLowerCase();
      return (
        u.name?.toLowerCase().includes(kw) ||
        u.email?.toLowerCase().includes(kw) ||
        u.phone?.toLowerCase().includes(kw)
      );
    });
  }, [users, schoolId, searchText]);

  const stats = useMemo(() => ({
    total:   users.filter((u) => u.role?.name?.toLowerCase() === "parent").length,
    active:  parentsList.length,
    showing: parentsList.length,
  }), [users, parentsList]);

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const columns = [
    {
      title: "Parent",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={avatarStyle(name, 36)}>{getInitials(name)}</div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <span style={{ color: phone ? "var(--text-secondary)" : "var(--text-muted)", fontSize: 13 }}>
          {phone || "—"}
        </span>
      ),
    },
    {
      title: "School",
      key: "school",
      render: (_, record) => (
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{record.school?.name || "—"}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 0 2px var(--success-light)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--success-hover)" }}>Active</span>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: () => <span style={pill("var(--accent)", "rgba(var(--accent-rgb), 0.2)")}>Parent</span>,
    },
  ];

  return (
    <>
      <style>{tableHeadCss("parents-table")}</style>

      <PageHeader
        title="Parents Directory"
        subtitle={loggedInUser?.school?.name ?? "School"}
        icon={<TeamOutlined />}
        extra={currentYear ? <Tag color="blue">{currentYear.name}</Tag> : null}
      />

      <div style={pageWrapper}>
        {/* KPI row */}
        <div className="stat-grid" style={statGrid(200)}>
          {STAT_META.map(({ key, label, color, icon }) => (
            <div key={key} style={statCard({ color })}>
              <div>
                <div style={statLabel(color)}>{label}</div>
                <div style={statValue(color)}>{stats[key]}</div>
              </div>
              <div style={{ fontSize: 26, color, opacity: 0.5 }}>{icon}</div>
            </div>
          ))}
        </div>

        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            <div className="page-toolbar" style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Parents
              </span>
              <div style={{ flex: 1 }} />
              <Input.Search
                allowClear
                placeholder="Search by name, email or phone…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(v) => setSearchText(v)}
                style={{ width: 280 }}
              />
            </div>
          </div>

          {!loading && parentsList.length === 0 ? (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={emptyState}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                  {searchText ? "No parents match your search" : "No parents found"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {searchText
                    ? "Try a different name, email, or phone number"
                    : "Parents will appear here once added to the system"}
                </div>
              </div>
            </div>
          ) : (
            <div className="parents-table" style={{ borderTop: "1px solid var(--border-muted)" }}>
              <Table
                columns={columns}
                dataSource={parentsList}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showTotal: (total) => (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} parents</span>
                  ),
                }}
                scroll={{ x: "max-content" }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParentsList;

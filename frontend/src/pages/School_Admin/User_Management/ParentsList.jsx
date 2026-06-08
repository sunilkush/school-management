import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table } from "antd";
import { fetchAllUser } from "../../../features/authSlice";
import { Users, Check, Eye } from "lucide-react";
const ParentsList = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");

  const { users = [], user: loggedInUser, loading } = useSelector(
    (state) => state.auth || {}
  );

  const schoolId = loggedInUser?.school?._id;

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllUser({ roleName: ["Parent"], isActive: true }));
    }
  }, [dispatch, schoolId]);

  const parentsList = useMemo(() => {
    return users.filter((u) => {
      if (
        !u.isActive ||
        u.school?._id !== schoolId ||
        u.role?.name?.toLowerCase() !== "parent"
      )
        return false;

      if (!searchText) return true;

      const keyword = searchText.toLowerCase();
      return (
        u.name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword) ||
        u.phone?.toLowerCase().includes(keyword)
      );
    });
  }, [users, schoolId, searchText]);

  const stats = useMemo(() => ({
    total: users.filter((u) => u.role?.name?.toLowerCase() === "parent").length,
    active: parentsList.length,
    showing: parentsList.length,
  }), [users, parentsList]);

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const AVATAR_COLORS = [
    { bg: "#ede9fe", color: "#7c6ff7" },
    { bg: "#f0fdf8", color: "#1d9e75" },
    { bg: "#fef9ec", color: "#e69020" },
    { bg: "#fce7f3", color: "#db2777" },
    { bg: "#e0f2fe", color: "#0284c7" },
  ];

  const getAvatarColor = (name = "") => {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  const columns = [
    {
      title: "Parent",
      dataIndex: "name",
      key: "name",
      render: (name, record) => {
        const { bg, color } = getAvatarColor(name);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: bg, color, fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {getInitials(name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{record.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <span style={{ color: phone ? "#555" : "#ccc", fontSize: 13 }}>
          {phone || "—"}
        </span>
      ),
    },
    {
      title: "School",
      key: "school",
      render: (_, record) => (
        <span style={{ fontSize: 13, color: "#555" }}>{record.school?.name || "—"}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#1d9e75",
            boxShadow: "0 0 0 2px #d4f0e8",
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1d9e75" }}>Active</span>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: () => (
        <span style={{
          display: "inline-block",
          padding: "3px 12px",
          background: "#f0eeff",
          color: "#7c6ff7",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
        }}>
          Parent
        </span>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      //background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)",
      padding: "24px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .parents-table .ant-table {
          background: transparent !important;
        }
        .parents-table .ant-table-thead > tr > th {
          background: #f8f7ff !important;
          color: #aaa !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          border-bottom: 1px solid #ede9fe !important;
          padding: 12px 20px !important;
        }
        .parents-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f5f3ff !important;
          padding: 14px 20px !important;
        }
        .parents-table .ant-table-tbody > tr:hover > td {
          background: #faf8ff !important;
        }
        .parents-table .ant-pagination-item-active {
          border-color: #1677ff !important;
        }
        .parents-table .ant-pagination-item-active a {
          color: #1677ff !important;
        }
        .parents-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .search-input {
          height: 42px;
          border-radius: 11px !important;
          border: 1.5px solid #e8e4ff !important;
          background: #fdfcff !important;
          font-size: 14px !important;
          padding: 0 14px 0 40px !important;
          width: 280px;
          outline: none;
          color: #1a1a2e;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
          border-color: #7c6ff7 !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }
        .search-input::placeholder { color: #ccc; }
        .search-wrap { position: relative; display: inline-block; }
        .search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #c5bef5;
          font-size: 15px;
          pointer-events: none;
        }
      `}</style>

      <div style={{
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(124, 111, 247, 0.1), 0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
        maxWidth: "100%",
        margin: "0 auto",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1677ff 0%, #5a50c9 100%)",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ position: "absolute", bottom: -50, right: 80, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
             
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
                Parents Directory
              </h1>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                {loggedInUser?.school?.name ?? "School"}
              </p>
            </div>
            {/* Badge */}
            <div style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "8px 18px",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Parents</div>
              <div style={{ fontSize: 22, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>{stats.total}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px" }}>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
            {[
              { label: "Total Parents", value: stats.total, icon: <Users />, color: "#7c6ff7", bg: "#f0eeff" },
              { label: "Active", value: stats.active, icon: <Check />, color: "#1d9e75", bg: "#f0fdf8" },
              { label: "Showing", value: stats.showing, icon: <Eye />, color: "#e69020", bg: "#fef9ec" },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: "16px 20px",
                background: stat.bg,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: stat.color, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{ fontSize: 28, opacity: 0.7 }}>{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b0a8f5", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              All Parents
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by name, email or phone…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {!loading && parentsList.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "56px 24px",
              border: "1.5px dashed #ddd8ff",
              borderRadius: 16,
              background: "#faf9ff",
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
              <div style={{ fontWeight: 600, color: "#aaa", marginBottom: 4 }}>
                {searchText ? "No parents match your search" : "No parents found"}
              </div>
              <div style={{ fontSize: 13, color: "#c5bef5" }}>
                {searchText ? "Try a different name, email, or phone number" : "Parents will appear here once added to the system"}
              </div>
            </div>
          ) : (
            <div className="parents-table" style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #ede9fe",
            }}>
              <Table
                columns={columns}
                dataSource={parentsList}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showTotal: (total) => (
                    <span style={{ fontSize: 12, color: "#aaa" }}>{total} parents</span>
                  ),
                }}
                scroll={{ x: "max-content" }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ParentsList;
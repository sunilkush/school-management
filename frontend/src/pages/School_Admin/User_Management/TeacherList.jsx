import React, { useEffect, useMemo, useState } from "react";
import { Table, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUser,
  deleteUser,
  currentUser,
} from "../../../features/authSlice";
import RegisterForm from "../../../components/forms/RegisterForm";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Check,
  Tag,
  Trash2,
  Eye,
  SquarePen,
  Search,
} from "lucide-react";

const TeacherList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users = [] } = useSelector((state) => state.auth);
  const loggedInUser = useSelector((state) => state.auth.user);

  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const schoolId = loggedInUser?.school?._id || loggedInUser?.schoolId;

  const hiddenRoles = ["student", "parent"];

  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllUser({ isActive: true }));
  }, [dispatch, schoolId]);

  const handleDelete = (id) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;

    setDeletingId(confirmDeleteId);

    try {
      await dispatch(deleteUser(confirmDeleteId)).unwrap();
      dispatch(fetchAllUser({ isActive: true }));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const userSchoolId = u?.school?._id || u?.schoolId;
      const role = u?.role?.name?.trim()?.toLowerCase();

      if (!u?.isActive) return false;
      if (schoolId && userSchoolId !== schoolId) return false;
      if (hiddenRoles.includes(role)) return false;

      const keyword = searchText.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        u?.name?.toLowerCase()?.includes(keyword) ||
        u?.email?.toLowerCase()?.includes(keyword) ||
        u?.phone?.toString()?.toLowerCase()?.includes(keyword);

      const matchRole = selectedRole === "all" || role === selectedRole;

      return matchSearch && matchRole;
    });
  }, [users, schoolId, searchText, selectedRole]);

  const roleOptions = useMemo(() => {
    const roleMap = new Map();

    users.forEach((u) => {
      const userSchoolId = u?.school?._id || u?.schoolId;
      const roleName = u?.role?.name?.trim();
      const roleValue = roleName?.toLowerCase();

      if (!u?.isActive) return;
      if (schoolId && userSchoolId !== schoolId) return;
      if (!roleName || hiddenRoles.includes(roleValue)) return;

      if (!roleMap.has(roleValue)) {
        roleMap.set(roleValue, roleName);
      }
    });

    return [...roleMap.entries()].map(([value, label]) => ({
      value,
      label,
    }));
  }, [users, schoolId]);

  const stats = useMemo(
    () => ({
      total: filteredUsers.length,
      active: filteredUsers.filter((u) => u?.isActive).length,
      roles: roleOptions.length,
    }),
    [filteredUsers, roleOptions]
  );

  const AVATAR_COLORS = [
    { bg: "#ede9fe", color: "#7c6ff7" },
    { bg: "#f0fdf8", color: "#1d9e75" },
    { bg: "#fef9ec", color: "#e69020" },
    { bg: "#fce7f3", color: "#db2777" },
    { bg: "#e0f2fe", color: "#0284c7" },
  ];

  const getAvatarColor = (name = "") => {
    const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  };

  const ROLE_COLORS = {
    teacher: { bg: "#f0eeff", color: "#7c6ff7" },
    admin: { bg: "#fef9ec", color: "#e69020" },
    principal: { bg: "#f0fdf8", color: "#1d9e75" },
    accountant: { bg: "#e0f2fe", color: "#0284c7" },
    staff: { bg: "#f3f4f6", color: "#4b5563" },
  };

  const getRolePill = (roleName = "") => {
    const key = roleName.toLowerCase();
    const style = ROLE_COLORS[key] || {
      bg: "#f3f4f6",
      color: "#6b7280",
    };

    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 12px",
          background: style.bg,
          color: style.color,
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {roleName}
      </span>
    );
  };

  const columns = [
    {
      title: "Staff Member",
      key: "user",
      render: (_, record) => {
        const { bg, color } = getAvatarColor(record?.name);

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: bg,
                color,
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {record?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#1a1a2e",
                  fontSize: 14,
                }}
              >
                {record?.name || "Unnamed User"}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  marginTop: 1,
                }}
              >
                {record?.email || "No email"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Phone",
      key: "phone",
      render: (_, record) => (
        <span style={{ fontSize: 13, color: record?.phone ? "#555" : "#ccc" }}>
          {record?.phone || "—"}
        </span>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (_, record) => getRolePill(record?.role?.name || "N/A"),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: record?.isActive ? "#1d9e75" : "#e24b4a",
              boxShadow: record?.isActive
                ? "0 0 0 2px #d4f0e8"
                : "0 0 0 2px #fce8e8",
            }}
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: record?.isActive ? "#1d9e75" : "#e24b4a",
            }}
          >
            {record?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            className="icon-btn view"
            title="View details"
            onClick={() =>
              navigate(
                `/dashboard/schooladmin/users/employee-details?id=${record._id}`
              )
            }
          >
            <Eye size={16} color="#7c6ff7" />
          </button>

          <button
            className="icon-btn edit"
            title="Edit user"
            onClick={() =>
              navigate(`/dashboard/schooladmin/users/employee-form?id=${record._id}`)
            }
          >
            <SquarePen size={16} color="#faad14" />
          </button>

          <button
            className="icon-btn delete"
            title="Delete user"
            disabled={deletingId === record._id}
            onClick={() => handleDelete(record._id)}
          >
            {deletingId === record._id ? "…" : <Trash2 color="red" size={16} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", padding: 0 }}>
      <style>{`
        .staff-table .ant-table {
          background: transparent !important;
        }

        .staff-table .ant-table-thead > tr > th {
          background: #f8f7ff !important;
          color: #aaa !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          border-bottom: 1px solid #ede9fe !important;
          padding: 12px 20px !important;
        }

        .staff-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f5f3ff !important;
          padding: 14px 20px !important;
        }

        .staff-table .ant-table-tbody > tr:hover > td {
          background: #faf8ff !important;
        }

        .staff-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }

        .staff-table .ant-pagination-item-active {
          border-color: #7c6ff7 !important;
        }

        .staff-table .ant-pagination-item-active a {
          color: #7c6ff7 !important;
        }

        .search-input {
          height: 42px;
          border-radius: 11px !important;
          border: 1.5px solid #e8e4ff !important;
          background: #fdfcff !important;
          font-size: 14px !important;
          padding: 0 14px 0 40px !important;
          outline: none;
          color: #1a1a2e;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }

        .search-input:focus {
          border-color: #7c6ff7 !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }

        .search-input::placeholder {
          color: #ccc;
        }

        .search-wrap {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #c5bef5;
          pointer-events: none;
        }

        .role-filter {
          height: 42px;
          border-radius: 11px !important;
          border: 1.5px solid #e8e4ff !important;
          background: #fdfcff !important;
          font-size: 14px !important;
          padding: 0 12px !important;
          outline: none;
          color: #1a1a2e;
          cursor: pointer;
          min-width: 160px;
        }

        .role-filter:focus {
          border-color: #7c6ff7 !important;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 24px;
          height: 42px;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #7c6ff7 0%, #5a50c9 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(124, 111, 247, 0.35);
        }

        .action-btn.primary:hover {
          box-shadow: 0 6px 20px rgba(124, 111, 247, 0.45);
          transform: translateY(-1px);
        }

        .action-btn.ghost {
          background: #f0eeff;
          color: #7c6ff7;
          border: 1.5px solid #ddd8ff;
        }

        .action-btn.ghost:hover {
          background: #e4dfff;
        }

        .icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .icon-btn.view {
          background: #f0eeff;
        }

        .icon-btn.view:hover {
          background: #e4dfff;
        }

        .icon-btn.edit {
          background: #fef9ec;
        }

        .icon-btn.edit:hover {
          background: #fef0c7;
        }

        .icon-btn.delete {
          background: #fef2f2;
        }

        .icon-btn.delete:hover {
          background: #fee2e2;
        }

        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirm-box {
          background: #fff;
          border-radius: 18px;
          padding: 28px 32px;
          max-width: 380px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          text-align: center;
        }

        @media (max-width: 768px) {
          .toolbar-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .search-wrap {
            width: 100% !important;
          }

          .role-filter,
          .action-btn {
            width: 100%;
          }
        }
      `}</style>

      {confirmDeleteId && (
        <div
          className="confirm-overlay"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 12 }}>
              <Trash2 size={36} color="#e24b4a" />
            </div>

            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a2e",
                marginBottom: 8,
              }}
            >
              Delete User?
            </div>

            <div style={{ fontSize: 14, color: "#aaa", marginBottom: 24 }}>
              This user will be permanently removed. This action cannot be
              undone.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="action-btn ghost"
                style={{ flex: 1 }}
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>

              <button
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 11,
                  border: "none",
                  background: "linear-gradient(135deg, #e24b4a, #a32d2d)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(226,75,74,0.3)",
                }}
                onClick={confirmDelete}
              >
                {deletingId ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        width={680}
        centered
        destroyOnClose
        title={
          <span style={{ fontWeight: 700, color: "#1a1a2e" }}>
            Add New Staff Member
          </span>
        }
        styles={{
          header: {
            borderBottom: "1px solid #f0eeff",
            paddingBottom: 14,
          },
        }}
      >
        <RegisterForm onClose={() => setIsModalOpen(false)} />
      </Modal>

      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow:
            "0 8px 40px rgba(124, 111, 247, 0.1), 0 2px 8px rgba(0,0,0,0.04)",
          overflow: "hidden",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1677ff 0%, #5a50c9 100%)",
            padding: "18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                Staff Directory
              </h1>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 14,
                }}
              >
                Manage teachers, admins and staff in one place.
              </p>
            </div>

            <button
              className="action-btn primary"
              style={{
                background: "rgba(255,255,255,0.2)",
                boxShadow: "none",
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}
              onClick={() => setIsModalOpen(true)}
            >
              + Add Staff
            </button>
          </div>
        </div>

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {[
              {
                label: "Total Staff",
                value: stats.total,
                icon: <Users />,
                color: "#7c6ff7",
                bg: "#f0eeff",
              },
              {
                label: "Active",
                value: stats.active,
                icon: <Check />,
                color: "#1d9e75",
                bg: "#f0fdf8",
              },
              {
                label: "Roles",
                value: stats.roles,
                icon: <Tag />,
                color: "#e69020",
                bg: "#fef9ec",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "16px 20px",
                  background: stat.bg,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: stat.color,
                      opacity: 0.75,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    {stat.label}
                  </div>

                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: stat.color,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>

                <div style={{ opacity: 0.7 }}>{stat.icon}</div>
              </div>
            ))}
          </div>

          <div
            className="toolbar-row"
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 18,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#b0a8f5",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                whiteSpace: "nowrap",
              }}
            >
              All Staff
            </div>

            <div style={{ flex: 1 }} />

            <div className="search-wrap">
              <span className="search-icon">
                <Search size={16} />
              </span>

              <input
                className="search-input"
                placeholder="Search by name, email or phone…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <select
              className="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>

              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <button
              className="action-btn ghost"
              onClick={() => dispatch(fetchAllUser({ isActive: true }))}
            >
              ↺ Refresh
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "56px 24px",
                border: "1.5px dashed #ddd8ff",
                borderRadius: 16,
                background: "#faf9ff",
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12 }}>🧑‍🏫</div>

              <div
                style={{
                  fontWeight: 600,
                  color: "#aaa",
                  marginBottom: 4,
                }}
              >
                {searchText || selectedRole !== "all"
                  ? "No staff match your filters"
                  : "No staff found"}
              </div>

              <div style={{ fontSize: 13, color: "#c5bef5" }}>
                {searchText || selectedRole !== "all"
                  ? "Try clearing your search or role filter"
                  : "Add a staff member to get started"}
              </div>
            </div>
          ) : (
            <div
              className="staff-table"
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #ede9fe",
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredUsers}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  size: "small",
                  showTotal: (total) => (
                    <span style={{ fontSize: 12, color: "#aaa" }}>
                      {total} staff members
                    </span>
                  ),
                }}
                scroll={{ x: 700 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherList;
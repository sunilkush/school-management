import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../../features/authSlice";
import { Avatar, Dropdown, Typography, Divider, Grid } from "antd";
import {
  UserOutlined,
  MailOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  CrownOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const UserDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  const rolePathMap = {
    "Support Staff": "staff",
  };
  const roleName = user?.role?.name || "";
  const rolePath = rolePathMap[roleName] ?? roleName.toLowerCase().replace(/\s+/g, "");

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/", { replace: true });
  };

  const menuItems = [
    {
      key: "header",
      label: (
        <div style={{ padding: "4px 0 8px" }}>
          <Text strong style={{ display: "block", fontSize: 14, color: "var(--text-primary)" }}>
            {user?.name || "User"}<br></br>{user?.role?.name && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
                padding: "2px 8px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                background: "var(--primary-light)",
                color: "var(--primary)",
                border: "1px solid rgba(124,58,237,0.15)",
              }}
            >
              <CrownOutlined style={{ fontSize: 10 }} />
              {user.role.name}
            </span>
          )}
          </Text>
          
          <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {user?.email || ""}
          </Text>
          
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to={`/dashboard/${rolePath}/profile`} style={{ color: "inherit" }}>Profile</Link>,
    },
    {
      key: "message",
      icon: <MailOutlined />,
      label: <Link to={`/dashboard/${rolePath}/message`} style={{ color: "inherit" }}>Messages</Link>,
    },
    {
      key: "notification",
      icon: <BellOutlined />,
      label: <Link to={`/dashboard/${rolePath}/notification`} style={{ color: "inherit" }}>Notifications</Link>,
    },
    ...(rolePath === "schooladmin" ? [{
      key: "settings",
      icon: <SettingOutlined />,
      label: <Link to={`/dashboard/${rolePath}/settings`} style={{ color: "inherit" }}>Settings</Link>,
    }] : []),
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign Out",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["click"]}
      placement="bottomRight"
      overlayStyle={{ minWidth: 220 }}
    >
      <button
        aria-label="User menu"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          background: "transparent",
          border: "none",
          padding: "4px 8px",
          borderRadius: 10,
          transition: "background 0.18s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {user?.avatar ? (
          <Avatar src={user.avatar} size={32} />
        ) : (
          <Avatar
            size={32}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
        )}
        {!isMobile && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.name?.split(" ")[0] || "User"}
          </Text>
        )}
      </button>
    </Dropdown>
  );
};

export default UserDropdown;

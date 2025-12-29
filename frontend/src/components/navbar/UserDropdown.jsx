import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../features/authSlice";
import { Avatar, Dropdown, Menu, Button, Typography ,Col} from "antd";
import {
  UserOutlined,
  MailOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const UserDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const rolePath = user?.role?.name?.toLowerCase().replace(/\s+/g, "") || "user";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <a href={`/dashboard/${rolePath}/profile`}>Profile</a>
      </Menu.Item>
      <Menu.Item key="message" icon={<MailOutlined />}>
        <a href={`/dashboard/${rolePath}/message`}>Message</a>
      </Menu.Item>
      <Menu.Item key="notification" icon={<BellOutlined />}>
        <a href={`/dashboard/${rolePath}/notification`}>Notification</a>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <a href={`/dashboard/${rolePath}/settings`}>Settings</a>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: "red" }}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
      <Col type="text" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        {user?.avatar ? (
          <Avatar src={user.avatar} size={24} />
        ) : (
          <Avatar icon={<UserOutlined />} size={24} />
        )}
        <Text style={{textTransform:"capitalize"}}>{user?.name || "User"}</Text>
      </Col>
    </Dropdown>
  );
};

export default UserDropdown;

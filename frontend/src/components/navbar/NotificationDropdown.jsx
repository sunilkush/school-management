import { BellOutlined } from "@ant-design/icons";
import { Badge, Dropdown, List, Avatar, Typography } from "antd";

const { Text } = Typography;

const notifications = [
  {
    id: 1,
    avatar: "https://i.pravatar.cc/40?img=3",
    message: "Dr sultads Send you Photo",
    time: "29 July 2020 – 02:26 PM",
  },
  {
    id: 2,
    avatar: null,
    iconText: "KG",
    message: "Report created successfully",
    time: "29 July 2020 – 02:26 PM",
  },
  {
    id: 3,
    avatar: null,
    iconText: "🏠",
    message: "Reminder: Treatment Time!",
    time: "29 July 2020 – 02:26 PM",
  },
  {
    id: 4,
    avatar: "https://i.pravatar.cc/40?img=3",
    message: "Dr sultads Send you Photo",
    time: "29 July 2020 – 02:26 PM",
  },
];

const NotificationDropdown = () => {
  const notificationMenu = (
    <div style={{ width: 300, maxHeight: 400, overflowY: "auto" ,backgroundColor: "#fff", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"}}>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        header={<Text strong style={{padding:"10px"}}>Notifications</Text>}
        footer={
          <div style={{ textAlign: "center", cursor: "pointer", color: "#1890ff" }}>
            See all notifications
          </div>
        }
        renderItem={(item) => (
          <List.Item style={{ padding: "10px 16px", cursor: "pointer" }}>
            <List.Item.Meta
              avatar={
                item.avatar ? (
                  <Avatar src={item.avatar} />
                ) : (
                  <Avatar style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}>
                    {item.iconText}
                  </Avatar>
                )
              }
              title={<Text>{item.message}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      trigger={["click"]}
      placement="bottomRight"
      arrow
    >
      <Badge dot offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;

import { PlusOutlined, MoreOutlined } from "@ant-design/icons";
import { Layout, Avatar, Badge, Typography, List, Button, Divider } from "antd";

const { Sider } = Layout;
const { Text } = Typography;

const chatGroups = {
  A: [
    {
      name: "Archie Parker",
      avatar: "https://i.pravatar.cc/40?img=3",
      status: "online",
      lastSeen: "Kalid is online",
      color: "green",
    },
    {
      name: "Alfie Mason",
      avatar: "https://i.pravatar.cc/40?img=4",
      status: "away",
      lastSeen: "Taherah left 7 mins ago",
      color: "gray",
    },
    {
      name: "Aharli Kane",
      avatar: "https://i.pravatar.cc/40?img=5",
      status: "online",
      lastSeen: "Sami is online",
      color: "green",
    },
    {
      name: "Athan Jacoby",
      avatar: "https://i.pravatar.cc/40?img=6",
      status: "away",
      lastSeen: "Nargis left 30 mins ago",
      color: "red",
    },
  ],
  B: [
    {
      name: "Bashid Samim",
      avatar: "https://i.pravatar.cc/40?img=7",
      status: "away",
      lastSeen: "Rashid left 50 mins ago",
      color: "gray",
    },
    {
      name: "Breddie Ronan",
      avatar: "https://i.pravatar.cc/40?img=8",
      status: "online",
      lastSeen: "Kalid is online",
      color: "green",
    },
    {
      name: "George Carson",
      avatar: "https://i.pravatar.cc/40?img=9",
      status: "away",
      lastSeen: "Taherah left 7 mins ago",
      color: "gray",
    },
  ],
  D: [
    {
      name: "Darry Parker",
      avatar: "https://i.pravatar.cc/40?img=10",
      status: "online",
      lastSeen: "Sami is online",
      color: "green",
    },
    {
      name: "Denry Hunter",
      avatar: "https://i.pravatar.cc/40?img=11",
      status: "away",
      lastSeen: "Nargis left 30 mins ago",
      color: "red",
    },
  ],
  J: [
    {
      name: "Jack Ronan",
      avatar: "https://i.pravatar.cc/40?img=12",
      status: "away",
      lastSeen: "Rashid left 50 mins ago",
      color: "gray",
    },
    {
      name: "Jacob Tucker",
      avatar: "https://i.pravatar.cc/40?img=13",
      status: "online",
      lastSeen: "Kalid is online",
      color: "green",
    },
    {
      name: "James Logan",
      avatar: "https://i.pravatar.cc/40?img=14",
      status: "away",
      lastSeen: "Taherah left 7 mins ago",
      color: "gray",
    },
    {
      name: "Joshua Weston",
      avatar: "https://i.pravatar.cc/40?img=15",
      status: "online",
      lastSeen: "Sami is online",
      color: "green",
    },
  ],
};

const statusColors = {
  online: "green",
  away: "gray",
  busy: "red",
};

const ChatSidebar = () => {
  return (
    <Sider width={300} style={{ background: "#fff", borderRight: "1px solid #f0f0f0", height: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottom: "1px solid #f0f0f0", backgroundColor: "#e6f7ff" }}>
        <div style={{ display: "flex", gap: 24 }}>
          <Text type="secondary">NOTES</Text>
          <Text type="secondary">ALERTS</Text>
          <Text strong style={{ borderBottom: "2px solid #722ed1" }}>CHAT</Text>
        </div>
        <MoreOutlined style={{ fontSize: 16, color: "#595959" }} />
      </div>

      {/* Chat List Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottom: "1px solid #f0f0f0" }}>
        <Text strong>Chat List</Text>
        <Button shape="circle" icon={<PlusOutlined />} size="small" />
      </div>

      {/* Chat List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {Object.entries(chatGroups).map(([letter, users]) => (
          <div key={letter}>
            <Divider style={{ margin: "8px 0" }}>{letter}</Divider>
            <List
              itemLayout="horizontal"
              dataSource={users}
              renderItem={(user) => (
                <List.Item style={{ padding: "8px 16px", cursor: "pointer" }}>
                  <List.Item.Meta
                    avatar={
                      <Badge
                        dot
                        color={statusColors[user.status]}
                        offset={[-2, 28]}
                      >
                        <Avatar src={user.avatar} />
                      </Badge>
                    }
                    title={<Text>{user.name}</Text>}
                    description={<Text type="secondary" style={{ fontSize: 12 }}>{user.lastSeen}</Text>}
                  />
                </List.Item>
              )}
            />
          </div>
        ))}
      </div>
    </Sider>
  );
};

export default ChatSidebar;

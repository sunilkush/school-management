import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, Drawer, Empty, Input, List, Select, Space, Spin, Tag, Typography, message } from "antd";
import { useSelector } from "react-redux";
import httpClient from "../api/httpClient";

const { Title, Text, Paragraph } = Typography;

const LEVEL_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Role", value: "role" },
  { label: "User Level", value: "user-level" },
  { label: "User", value: "user" },
];

const formatTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const MessagePage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const userRole = useSelector((state) => state.auth?.user?.role?.name || "");

  const canView = [
    "Super Admin",
    "School Admin",
    "Principal",
    "Vice Principal",
    "Teacher",
    "Student",
    "Parent",
    "Accountant",
    "Staff",
    "Receptionist",
    "Librarian",
  ].includes(userRole);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await httpClient.get("/notifications");
      const data = response?.data?.data || [];
      setRows(data);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [canView]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesLevel = levelFilter === "all" || row?.level === levelFilter;
      const matchesSearch =
        !query ||
        [row?.title, row?.message, row?.createdBy]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesLevel && matchesSearch;
    });
  }, [rows, search, levelFilter]);

  if (!canView) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Message access not available for your role"
        description="Please contact School Admin to grant communication module access."
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={2}>
          <Title level={4} style={{ margin: 0 }}>Message Center</Title>
          <Text type="secondary">Role-aware inbox powered by notifications module.</Text>
        </Space>
      </Card>

      <Card>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search title or content"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 260 }}
            />
            <Select
              style={{ width: 170 }}
              value={levelFilter}
              onChange={setLevelFilter}
              options={LEVEL_OPTIONS}
            />
          </Space>
        </Space>
      </Card>

      <Card title="Messages">
        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin />
          </div>
        ) : filteredRows.length === 0 ? (
          <Empty description="No messages found" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredRows}
            renderItem={(item) => (
              <List.Item key={item._id} onClick={() => setSelected(item)} style={{ cursor: "pointer" }}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space>
                    <Text strong>{item.title}</Text>
                    <Tag color="blue">{item.level || "all"}</Tag>
                  </Space>
                  <Text type="secondary" ellipsis={{ rows: 2 }}>
                    {item.message}
                  </Text>
                  <Text type="secondary">{formatTime(item.createdAt)}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Drawer
        title={selected?.title || "Message"}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={500}
      >
        {selected && (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space>
              <Tag color="blue">{selected.level || "all"}</Tag>
              <Text type="secondary">{formatTime(selected.createdAt)}</Text>
            </Space>
            <Paragraph style={{ whiteSpace: "pre-wrap" }}>{selected.message}</Paragraph>
            <Text type="secondary">Created by: {selected.createdBy || "System"}</Text>
          </Space>
        )}
      </Drawer>
    </Space>
  );
};

export default MessagePage;
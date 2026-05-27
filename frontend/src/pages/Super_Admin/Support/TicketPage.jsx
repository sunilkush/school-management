import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Typography,
} from "antd";

import {
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;
const { Text, Paragraph } = Typography;

const TicketPage = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // ===== Dummy Data =====
  const tickets = [
    {
      _id: "1",
      title: "Login issue",
      school: "ABC School",
      user: "Rahul Sharma",
      priority: "High",
      status: "Open",
      description: "Unable to login with correct credentials",
    },
    {
      _id: "2",
      title: "Payment failed",
      school: "XYZ Academy",
      user: "Ankit Verma",
      priority: "Medium",
      status: "Resolved",
      description: "Payment deducted but not updated",
    },
  ];

  // ===== FILTER =====
  const filteredData = tickets.filter((t) => {
    const matchSearch =
      !searchText ||
      t.title.toLowerCase().includes(searchText.toLowerCase());

    const matchStatus =
      !statusFilter || t.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // ===== HANDLERS =====
  const handleView = (ticket) => {
    setSelectedTicket(ticket);
    setOpenModal(true);
  };

  // ===== TABLE COLUMNS =====
  const columns = [
    {
      title: "Ticket",
      dataIndex: "title",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "School",
      dataIndex: "school",
    },
    {
      title: "User",
      dataIndex: "user",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (p) => {
        const color =
          p === "High" ? "red" : p === "Medium" ? "orange" : "green";
        return <Tag color={color}>{p}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "Resolved" ? "green" : "blue"}>
          {s}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
          >
            View
          </Button>

          <Button
            icon={<CheckCircleOutlined />}
            size="small"
            type="primary"
          >
            Resolve
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="support-page-shell">
      
      {/* HEADER */}
      <div className="support-page-header">
        <h2>🎫 Ticket Management</h2>
      </div>

      {/* FILTER BAR */}
      <Card className="support-filter-card">
        <Space wrap>
          <Search
            placeholder="Search tickets..."
            onChange={(e) => setSearchText(e.target.value)}
            className="support-search-width"
          />

          <Select
            placeholder="Filter Status"
            allowClear
            className="support-select-width"
            onChange={(v) => setStatusFilter(v || "")}
          >
            <Option value="Open">Open</Option>
            <Option value="Resolved">Resolved</Option>
          </Select>
        </Space>
      </Card>

      {/* TABLE */}
      <Card title="All Tickets">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      {/* MODAL */}
      <Modal
        title="Ticket Details"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
      >
        {selectedTicket && (
          <>
            <Text strong>Title:</Text>
            <Paragraph>{selectedTicket.title}</Paragraph>

            <Text strong>Description:</Text>
            <Paragraph>{selectedTicket.description}</Paragraph>

            <Text strong>School:</Text>
            <Paragraph>{selectedTicket.school}</Paragraph>

            <Text strong>User:</Text>
            <Paragraph>{selectedTicket.user}</Paragraph>

            <Text strong>Status:</Text>
            <Paragraph>{selectedTicket.status}</Paragraph>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TicketPage;

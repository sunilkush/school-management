import React, { useState } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  Button,
  Space,
} from "antd";
import { SearchOutlined, MailOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, tableHeadCss } from "../../../styles/pageStyles.js";

const { Option } = Select;
const { RangePicker } = DatePicker;

const SmsEmailHistory = () => {
  const [history] = useState([
    {
      key: 1,
      type: "SMS",
      title: "Holiday Notice",
      message: "School will be closed tomorrow.",
      recipients: "Students, Parents",
      dateSent: "2026-01-01 10:00",
    },
    {
      key: 2,
      type: "Email",
      title: "Exam Schedule",
      message: "Final exam schedule is attached.",
      recipients: "Students, Teachers",
      dateSent: "2026-01-02 12:00",
    },
  ]);

  const [filters, setFilters] = useState({ type: null, search: "", dateRange: null });

  // Filtered data
  const filteredData = history.filter((item) => {
    const matchType = filters.type ? item.type === filters.type : true;
    const matchSearch =
      filters.search === "" ||
      item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.message.toLowerCase().includes(filters.search.toLowerCase());
    const matchDate =
      !filters.dateRange ||
      (dayjs(item.dateSent).isAfter(filters.dateRange[0], "day") &&
        dayjs(item.dateSent).isBefore(filters.dateRange[1], "day"));
    return matchType && matchSearch && matchDate;
  });

  // Summary
  const totalSMS = history.filter((h) => h.type === "SMS").length;
  const totalEmail = history.filter((h) => h.type === "Email").length;

  return (
    <>
      <style>{tableHeadCss("sms-history-tbl")}</style>
      <PageHeader
        title="SMS & Email History"
        subtitle="View all sent notifications and communication history"
        icon={<MailOutlined />}
      />
      <div style={pageWrapper}>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Card title="Total SMS Sent">{totalSMS}</Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card title="Total Emails Sent">{totalEmail}</Card>
          </Col>
        </Row>

        {/* Filters */}
        <div className="page-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <Select
            placeholder="Select Type"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters({ ...filters, type: value })}
          >
            <Option value="SMS">SMS</Option>
            <Option value="Email">Email</Option>
          </Select>

          <Input
            placeholder="Search by title/message"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <RangePicker
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
          />

          <Button
            onClick={() => setFilters({ type: null, search: "", dateRange: null })}
          >
            Reset
          </Button>
        </div>

        {/* History Table */}
        <Table
          className="sms-history-tbl"
          scroll={{ x: 600 }}
          columns={[
            { title: "Type", dataIndex: "type", key: "type" },
            { title: "Title", dataIndex: "title", key: "title" },
            { title: "Message", dataIndex: "message", key: "message" },
            { title: "Recipients", dataIndex: "recipients", key: "recipients" },
            { title: "Date Sent", dataIndex: "dateSent", key: "dateSent" },
          ]}
          dataSource={filteredData}
          rowKey="key"
          pagination={{ pageSize: 5 }}
        />
      </div>
    </>
  );
};

export default SmsEmailHistory;

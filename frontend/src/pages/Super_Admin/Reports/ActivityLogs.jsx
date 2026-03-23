import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Typography,
  Select,
  Table,
  Space,
  Button,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchActivityLogs } from "../../../features/activitySlice"; // you need an API for logs

const { Title, Text } = Typography;
const { Option } = Select;

const ActivityLogs = () => {
  const dispatch = useDispatch();
  const { schools = [] } = useSelector((state) => state.school);
  const { logs = [], loading, error } = useSelector(
    (state) => state.activity
  );

  const [selectedSchool, setSelectedSchool] = useState("All");

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchActivityLogs()); // fetch all logs initially
  }, [dispatch]);

  // ✅ Filter logs by selected school
  const filteredLogs = useMemo(() => {
    if (selectedSchool === "All") return logs;
    return logs.filter((log) => log.school?.name === selectedSchool);
  }, [logs, selectedSchool]);

  const schoolOptions = ["All", ...schools.map((s) => s.name).filter(Boolean)];

  // ✅ Table columns
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (user) => user?.name || "—",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => role?.name || "—",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "School",
      dataIndex: "school",
      key: "school",
      render: (school) => school?.name || "—",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* 🔹 Header */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space
          style={{ width: "100%", justifyContent: "space-between" }}
          align="center"
        >
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Activity Logs
            </Title>
            <Text type="secondary">
              Track user and system activities within the school management system
            </Text>
          </div>

          <Space>
            <Select
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: 220 }}
            >
              {schoolOptions.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchActivityLogs())}
            >
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 🔹 Table */}
      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          loading={loading}
          rowKey={(record) => record._id}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
        {error && <Text type="danger">{error}</Text>}
      </Card>
    </div>
  );
};

export default ActivityLogs;

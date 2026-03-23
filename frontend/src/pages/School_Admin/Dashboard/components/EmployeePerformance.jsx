import React from "react";
import { Card, Table, Tag, Avatar, Select, Space } from "antd";

const { Option } = Select;

const employees = [
  {
    name: "Henry, Arthur",
    email: "sara.cruz@example.com",
    designation: "Designer",
    performance: "GOOD",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    name: "Cooper, Kristin",
    email: "tanya.hill@example.com",
    designation: "JS Developer",
    performance: "AVERAGE",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
];

const EmployeePerformance = () => {
  const columns = [
    {
      title: "Employee",
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} />
          <div>
            <div>{record.name}</div>
            <small style={{ color: "#888" }}>{record.email}</small>
          </div>
        </Space>
      ),
    },
    {
      title: "Designation",
      dataIndex: "designation",
    },
    {
      title: "Performance",
      render: (_, record) => (
        <Tag color={record.performance === "GOOD" ? "green" : "blue"}>
          {record.performance}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: () => <a>Edit</a>,
    },
  ];

  return (
    <Card
      title="Teacher Performance"
      extra={
        <Select defaultValue="lastMonth" size="small">
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
        </Select>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={employees}
        pagination={false}
        rowKey="email"
      />
    </Card>
  );
};

export default EmployeePerformance;
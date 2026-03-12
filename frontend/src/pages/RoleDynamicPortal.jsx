import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Card, Row, Col, Typography, Tag, List, Button, Space, Empty } from "antd";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const roleConfig = {
  principal: {
    title: "Principal Portal",
    modules: ["School Overview", "Staff Management", "Student Management", "Academic Reports"],
  },
  viceprincipal: {
    title: "Vice Principal Portal",
    modules: ["Academic Management", "Exam Monitoring", "Attendance Oversight", "Reports"],
  },
  subjectcoordinator: {
    title: "Subject Coordinator Portal",
    modules: ["Subjects", "Teacher Assignment", "Class Assignment", "Exams & Grades"],
  },
  librarian: {
    title: "Librarian Portal",
    modules: ["Book Catalog", "Issue / Return", "Fine Management", "Library Reports"],
  },
  hostelwarden: {
    title: "Hostel Warden Portal",
    modules: ["Hostel Rooms", "Student Allocation", "Attendance", "Visitor Log"],
  },
  transportmanager: {
    title: "Transport Manager Portal",
    modules: ["Routes", "Vehicles", "Drivers", "Fuel & Maintenance"],
  },
  examcoordinator: {
    title: "Exam Coordinator Portal",
    modules: ["Exam Creation", "Question Bank", "Scheduling", "Result Reports"],
  },
  receptionist: {
    title: "Receptionist Portal",
    modules: ["Visitor Management", "Enquiries", "Call Logs", "Notifications"],
  },
  itsupport: {
    title: "IT Support Portal",
    modules: ["System Maintenance", "Support Tickets", "Network Status", "System Logs"],
  },
  counselor: {
    title: "Counselor Portal",
    modules: ["Student Profiles", "Counseling Sessions", "Appointments", "Reports"],
  },
  security: {
    title: "Security Portal",
    modules: ["Visitor Entry", "Gate Logs", "Shift Attendance", "Emergency Alerts"],
  },
};

const toRoleKey = (roleName = "") => roleName.toLowerCase().replace(/\s+/g, "");

const RoleDynamicPortal = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.roleUi.permissions || []);

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "User";
  const roleKey = toRoleKey(roleName);

  const routeParts = location.pathname.split("/").filter(Boolean);
  const section = routeParts[routeParts.length - 1] || "dashboard";

  const config = roleConfig[roleKey] || {
    title: `${roleName} Workspace`,
    modules: permissions.map((perm) => perm.module),
  };

  const visibleModules = useMemo(() => {
    if (Array.isArray(config.modules) && config.modules.length > 0) return config.modules;
    return [];
  }, [config.modules]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>{config.title}</Title>
        <Text type="secondary">Active section: {section}</Text>
        <div style={{ marginTop: 12 }}>
          <Tag color="blue">Role: {roleName}</Tag>
          <Tag color="purple">Section: {section}</Tag>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {visibleModules.length ? (
          visibleModules.map((module) => (
            <Col xs={24} md={12} xl={8} key={module}>
              <Card
                title={module}
                extra={<Tag color="green">Active</Tag>}
                actions={[
                  <Button type="link" key="open">Open</Button>,
                  <Button type="link" key="report">Report</Button>,
                ]}
              >
                <Text type="secondary">
                  Manage {module.toLowerCase()} operations through this module.
                </Text>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Card>
              <Empty description="No modules configured yet for this role" />
            </Card>
          </Col>
        )}
      </Row>

      <Card title="Permission Snapshot">
        <List
          dataSource={permissions}
          locale={{ emptyText: "No permissions available" }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2}>
                <Text strong>{item.module}</Text>
                <Space wrap>
                  {(item.actions || []).map((action) => (
                    <Tag key={`${item.module}-${action}`}>{action.toUpperCase()}</Tag>
                  ))}
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export default RoleDynamicPortal;

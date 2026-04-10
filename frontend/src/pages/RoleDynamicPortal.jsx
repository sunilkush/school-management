import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Tag, List, Button, Space, Empty, Tabs } from "antd";
import { useSelector } from "react-redux";
import RoleDashboardOverview from "../components/dashboard/RoleDashboardOverview";
import Classes from "./School_Admin/Academic_Management/Classes";
import Subjects from "./School_Admin/Academic_Management/Subjects";
import ExamSchedule from "./School_Admin/Exams_&_Grades/ExamSchedule";
import AllStudentsAttendance from "./School_Admin/Attendance/AllStudentsAttendance";
import StaffAttendance from "./School_Admin/Attendance/StaffAttendance";
import Profile from "./Profile";
import VicePrincipalReports from "./Vice_Principal/VicePrincipalReports";

const { Title, Text } = Typography;

const roleConfig = {
  principal: {
    title: "Principal Portal",
    modules: ["School Overview", "Staff Management", "Student Management", "Academic Reports"],
  },
  viceprincipal: {
    title: "Vice Principal Portal",
    modules: [
      { title: "Academic Management", path: "viceprincipal/academics" },
      { title: "Exams & Grades", path: "viceprincipal/exams" },
      { title: "Student Attendance", path: "viceprincipal/attendance/students" },
      { title: "Teacher Attendance", path: "viceprincipal/attendance/staff" },
      { title: "Reports", path: "viceprincipal/reports" },
      { title: "Profile", path: "viceprincipal/profile" },
    ],
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
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.roleUi.permissions || []);

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "User";
  const roleKey = toRoleKey(roleName);

  const routeParts = location.pathname.split("/").filter(Boolean);
  const rolePathIndex = routeParts.findIndex((part) => part === roleKey);
  const relativePath =
    rolePathIndex >= 0 ? routeParts.slice(rolePathIndex + 1).join("/") : "";
  const section = relativePath || "dashboard";

  const config = roleConfig[roleKey] || {
    title: `${roleName} Workspace`,
    modules: permissions.map((perm) => perm.module),
  };

  const visibleModules = useMemo(() => {
    if (Array.isArray(config.modules) && config.modules.length > 0) {
      return config.modules.map((module) =>
        typeof module === "string" ? { title: module, path: `${roleKey}/${module.toLowerCase()}` } : module
      );
    }
    return [];
  }, [config.modules, roleKey]);

  const vicePrincipalContent = useMemo(() => {
    if (roleKey !== "viceprincipal") return null;

    switch (relativePath) {
      case "academics":
        return (
          <Card title="Academic Management">
            <Tabs
              defaultActiveKey="classes"
              items={[
                { key: "classes", label: "Classes", children: <Classes /> },
                { key: "subjects", label: "Subjects", children: <Subjects /> },
              ]}
            />
          </Card>
        );
      case "exams":
        return (
          <Card title="Exams & Grades">
            <ExamSchedule />
          </Card>
        );
      case "attendance/students":
        return (
          <Card title="Student Attendance">
            <AllStudentsAttendance />
          </Card>
        );
      case "attendance/staff":
        return (
          <Card title="Teacher Attendance">
            <StaffAttendance />
          </Card>
        );
      case "reports":
        return (
          <Card title="Vice Principal Reports">
            <VicePrincipalReports />
          </Card>
        );
      case "profile":
        return <Profile />;
      default:
        return null;
    }
  }, [relativePath, roleKey]);

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

      {!vicePrincipalContent ? (
        <Row gutter={[16, 16]}>
          {visibleModules.length ? (
            visibleModules.map((module) => (
              <Col xs={24} md={12} xl={8} key={module.title}>
                <Card
                  title={module.title}
                  extra={<Tag color="green">Active</Tag>}
                  actions={[
                    <Button type="link" key="open" onClick={() => navigate(`/dashboard/${module.path}`)}>
                      Open
                    </Button>,
                    <Button
                      type="link"
                      key="report"
                      onClick={() => navigate(`/dashboard/${roleKey}/reports?module=${encodeURIComponent(module.title)}`)}
                    >
                      Report
                    </Button>,
                  ]}
                >
                  <Text type="secondary">
                    Manage {module.title.toLowerCase()} operations through this module.
                  </Text>
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Card
                title="Module Setup Pending"
              >
                <Empty description="No modules configured yet for this role" />
              </Card>
            </Col>
          )}
        </Row>
      ) : (
        vicePrincipalContent
      )}

      <RoleDashboardOverview titlePrefix={`${roleName} Dashboard`} />

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

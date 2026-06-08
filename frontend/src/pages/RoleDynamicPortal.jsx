import React, { useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Tag, List, Button, Space, Empty, Alert } from "antd";
import { useSelector } from "react-redux";
import RoleDashboardOverview from "../components/dashboard/RoleDashboardOverview";
import Notification from "./Notification";
import Message from "./Message";
import SendNotification from "./School_Admin/Communication/SendNotification";
import SmsEmailHistory from "./School_Admin/Communication/SmsEmailHistory";
import MyAttendancePage from "./Attendance/MyAttendancePage";
import AttendanceTablePage from "./Attendance/AttendanceTablePage";
import MarkAttendancePage from "./Attendance/MarkAttendancePage";
import MonthlyReportPage from "./Attendance/MonthlyReportPage";
const { Title, Text } = Typography;

const roleConfig = {
  viceprincipal: {
    title: "Vice Principal Portal",
    subtitle: "Academic quality, attendance discipline, and operational coordination.",
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
    subtitle: "Subject planning, syllabus health, and teacher alignment.",
    modules: [
      { title: "Subjects", path: "subjectcoordinator/subjects" },
      { title: "Teacher Allocation", path: "subjectcoordinator/teacher-allocation" },
      { title: "Class Mapping", path: "subjectcoordinator/class-mapping" },
      { title: "Assessments", path: "subjectcoordinator/assessments" },
    ],
  },
  librarian: {
    title: "Librarian Portal",
    subtitle: "Catalog operations, circulation tracking, and member activity.",
    modules: [
      { title: "Book Catalog", path: "librarian/book-catalog" },
      { title: "Issue / Return", path: "librarian/issue-return" },
      { title: "Members", path: "librarian/members" },
      { title: "Reports", path: "librarian/reports" },
    ],
  },
  hostelwarden: {
    title: "Hostel Warden Portal",
    subtitle: "Room occupancy, hostel discipline, and student safety.",
    modules: [
      { title: "Rooms", path: "hostelwarden/rooms" },
      { title: "Allocations", path: "hostelwarden/allocations" },
      { title: "Attendance", path: "hostelwarden/attendance" },
    ],
  },
  transportmanager: {
    title: "Transport Manager Portal",
    subtitle: "Route planning, fleet usage, and trip monitoring.",
    modules: [
      { title: "Routes", path: "transportmanager/routes" },
      { title: "Vehicles", path: "transportmanager/vehicles" },
      { title: "Drivers", path: "transportmanager/drivers" },
      { title: "Fuel & Maintenance", path: "transportmanager/maintenance" },
    ],
  },
  receptionist: {
    title: "Receptionist Portal",
    subtitle: "Front-office activity, inquiry response, and visitor handling.",
    modules: [
      { title: "Visitors", path: "receptionist/visitors" },
      { title: "Enquiries", path: "receptionist/enquiries" },
      { title: "Call Logs", path: "receptionist/calls" },
      { title: "Broadcasts", path: "receptionist/broadcasts" },
    ],
  },
  counselor: {
    title: "Counselor Portal",
    subtitle: "Wellness tracking, counseling history, and intervention planning.",
    modules: [
      { title: "Student Profiles", path: "counselor/students" },
      { title: "Sessions", path: "counselor/sessions" },
      { title: "Appointments", path: "counselor/appointments" },
      { title: "Reports", path: "counselor/reports" },
    ],
  },
  security: {
    title: "Security Portal",
    subtitle: "Gate controls, shift logs, and incident readiness.",
    modules: [
      { title: "Entry Register", path: "security/entry-register" },
      { title: "Gate Logs", path: "security/gate-logs" },
      { title: "Shift Attendance", path: "security/shift-attendance" },
      { title: "Emergency Alerts", path: "security/alerts" },
    ],
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
  const relativePath = rolePathIndex >= 0 ? routeParts.slice(rolePathIndex + 1).join("/") : "";
  const activeSection = relativePath || "dashboard";

  const config = roleConfig[roleKey] || {
    title: `${roleName} Portal`,
    subtitle: "Role specific workspace.",
    modules: [],
  };

  const modules = useMemo(() => config.modules || [], [config.modules]);

  if (!roleConfig[roleKey]) {
    return <Navigate to="/dashboard/workspace" replace />;
  }

  if (activeSection === "notification") return <Notification />;
  if (activeSection === "message") return <Message />;
  if (activeSection === "communication/send") return <SendNotification />;
  if (activeSection === "communication/history") return <SmsEmailHistory />;
  if (["attendance", "shift-attendance"].includes(activeSection)) return <MyAttendancePage />;
  if (activeSection === "attendance/table") return <AttendanceTablePage />;
  if (["attendance/monthly", "reports/attendance"].includes(activeSection)) return <MonthlyReportPage />;
  if (["attendance/students", "attendance/staff", "attendance/mark"].includes(activeSection)) return <MarkAttendancePage />;
  return (
    <Space direction="vertical" size={16} style={{ width: "100%",padding:24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>{config.title}</Title>
        <Text type="secondary">{config.subtitle}</Text>
        <div style={{ marginTop: 12 }}>
          <Tag color="blue">Role: {roleName}</Tag>
          <Tag color="purple">Section: {activeSection}</Tag>
        </div>
      </Card>

      {activeSection !== "dashboard" && (
        <Alert
          type="info"
          showIcon
          message="Dedicated module pages are being enabled role-wise."
          description="For now, use module shortcuts below to navigate within your role scope."
        />
      )}

      <Row gutter={[16, 16]}>
        {modules.length ? (
          modules.map((module) => (
            <Col xs={24} md={12} xl={8} key={module.title}>
              <Card
                title={module.title}
                extra={<Tag color="green">Role Specific</Tag>}
                actions={[
                  <Button type="link" key="open" onClick={() => navigate(`/dashboard/${module.path}`)}>
                    Open
                  </Button>,
                ]}
              >
                <Text type="secondary">Access only {roleName} workflows for {module.title.toLowerCase()}.</Text>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Card title="No modules configured">
              <Empty description="Module setup pending for this role." />
            </Card>
          </Col>
        )}
      </Row>

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

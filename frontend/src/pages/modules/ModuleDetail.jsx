import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Col, Empty, Flex, Row, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { ERP_MODULES } from "../../utils/moduleRegistry";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell } from "../../styles/pageStyles.js";

const { Text } = Typography;

/* ── Module visual identity (shared with ModuleOverview) ─────────── */
const MODULE_META = {
  "school-management":     { color: "#2563EB", emoji: "🏫" },
  "academic-management":   { color: "#7C3AED", emoji: "📚" },
  "student-management":    { color: "#10B981", emoji: "🎓" },
  "teacher-management":    { color: "#F59E0B", emoji: "👩‍🏫" },
  "attendance-system":     { color: "#EF4444", emoji: "✅" },
  "exam-result":           { color: "#14B8A6", emoji: "📝" },
  "timetable-management":  { color: "#6366F1", emoji: "🗓️" },
  "fees-management":       { color: "#22C55E", emoji: "💰" },
  "transport-management":  { color: "#F97316", emoji: "🚌" },
  "hostel-management":     { color: "#8B5CF6", emoji: "🏠" },
  "library-management":    { color: "#0EA5E9", emoji: "📖" },
  "inventory":             { color: "#64748B", emoji: "📦" },
  "communication":         { color: "#EC4899", emoji: "💬" },
  "learning-management":   { color: "#84CC16", emoji: "🧑‍💻" },
  "reports-analytics":     { color: "#A855F7", emoji: "📊" },
};

/* ── Per-module feature bullets ──────────────────────────────────── */
const MODULE_FEATURES = {
  "school-management":    ["School profile and branding setup", "Subscription & plan management", "Academic year configuration", "Branch and campus management", "System-wide settings control"],
  "academic-management":  ["Board, class, section, and subject management", "Chapter and lesson plan structure", "Curriculum mapping per class", "Subject-teacher assignment", "Academic calendar setup"],
  "student-management":   ["Student admission and registration", "Profile, document & ID management", "Class promotion workflows", "Parent-student linking", "Admission inquiry tracking"],
  "teacher-management":   ["Teacher profile and department setup", "Subject and class assignment", "Performance and evaluation tracking", "Leave and attendance management", "Salary and contract records"],
  "attendance-system":    ["Daily student and staff attendance", "QR code and biometric support", "Geo-fencing for location-based marking", "Leave application and approval", "Monthly attendance reports and analytics"],
  "exam-result":          ["Exam creation and scheduling", "Question paper builder", "Marks entry and grade calculation", "Report card generation", "Exam analytics and performance trends"],
  "timetable-management": ["Class-wise weekly timetable creation", "Teacher-wise schedule view", "Period and time-slot configuration", "Room and hall allocation", "Conflict detection and resolution", "Student-visible timetable portal"],
  "fees-management":      ["Fee structure setup per class/category", "Fee collection and receipt generation", "Installment and due-date management", "Finance dashboards and reports", "Concession and discount handling"],
  "transport-management": ["Route planning and vehicle assignment", "Driver and conductor management", "Student transport allocation", "GPS tracking integration", "Vehicle maintenance scheduling"],
  "hostel-management":    ["Hostel and block/room configuration", "Bed allocation and occupancy tracking", "Hostel fee integration", "Warden assignment and duty roster", "Student check-in / check-out logs"],
  "library-management":   ["Books catalog and ISBN management", "Issue, return, and renewal workflows", "Member card generation", "Fine calculation and collection", "Library analytics and usage reports"],
  "inventory":            ["Item and category management", "Supplier and purchase order tracking", "Stock-in / stock-out operations", "Asset lifecycle management", "Expense and consumption reports"],
  "communication":        ["In-app notifications and announcements", "SMS and email broadcast", "Role-wise and user-specific targeting", "Scheduled notification delivery", "Communication history and audit log"],
  "learning-management":  ["Homework and assignment creation", "Online quizzes and MCQ tests", "Study materials and resource sharing", "Student submission and evaluation", "Learning progress tracking"],
  "reports-analytics":    ["Attendance, exam, and finance reports", "Role-wise dashboard KPIs", "Custom report builder", "Data export (PDF, Excel)", "Platform usage analytics"],
};

/* ── Role dashboard base paths ───────────────────────────────────── */
const ROLE_BASE = {
  "School Admin":    "/dashboard/schooladmin",
  "Principal":       "/dashboard/principal",
  "Vice Principal":  "/dashboard/viceprincipal",
  "Teacher":         "/dashboard/teacher",
  "Student":         "/dashboard/student",
  "Parent":          "/dashboard/parent",
  "Accountant":      "/dashboard/accountant",
  "Receptionist":    "/dashboard/receptionist",
  "Librarian":       "/dashboard/librarian",
  "Hostel Warden":   "/dashboard/hostelwarden",
  "Transport Manager": "/dashboard/transportmanager",
  "Exam Coordinator":  "/dashboard/examcoordinator",
  "IT Support":      "/dashboard/itsupport",
  "Counselor":       "/dashboard/counselor",
  "Security":        "/dashboard/security",
  "Staff":           "/dashboard/staff",
  "Support Staff":   "/dashboard/supportstaff",
};

/* ── Per-module quick-access actions by role ─────────────────────── */
const MODULE_ACTIONS = {
  "school-management": {
    "School Admin":  [
      { label: "School Setup", path: "/dashboard/schooladmin/school-setup", desc: "Configure profile, branding, and settings" },
      { label: "Academic Years", path: "/dashboard/schooladmin/school-setup", desc: "Manage active academic year" },
    ],
  },
  "academic-management": {
    "School Admin":  [
      { label: "Classes", path: "/dashboard/schooladmin/classes", desc: "Manage boards, classes, and sections" },
      { label: "Subjects", path: "/dashboard/schooladmin/subjects", desc: "Configure subjects and curriculum" },
    ],
    "Teacher": [
      { label: "Lesson Plans", path: "/dashboard/teacher/lesson-plans", desc: "Create and manage lesson plans" },
      { label: "Resources", path: "/dashboard/teacher/resources", desc: "Upload study resources" },
    ],
  },
  "student-management": {
    "School Admin": [
      { label: "Student List", path: "/dashboard/schooladmin/studentList", desc: "Browse and manage all students" },
      { label: "New Admission", path: "/dashboard/schooladmin/admission", desc: "Register a new student" },
      { label: "Admission Inquiry", path: "/dashboard/schooladmin/admission/inquiry", desc: "Track and follow-up inquiries" },
      { label: "Student Promotion", path: "/dashboard/schooladmin/students/promotion", desc: "Promote students to next class" },
    ],
    "Receptionist": [
      { label: "Admission Inquiry", path: "/dashboard/receptionist/admission/inquiry", desc: "Log and manage new inquiries" },
    ],
    "Counselor": [
      { label: "Student List", path: "/dashboard/counselor/students", desc: "View all student profiles" },
    ],
  },
  "teacher-management": {
    "School Admin": [
      { label: "Teacher List", path: "/dashboard/schooladmin/teacher", desc: "Browse and manage all teachers" },
      { label: "Create Employee", path: "/dashboard/schooladmin/payroll/create-employee", desc: "Onboard a new teacher" },
    ],
  },
  "attendance-system": {
    "School Admin": [
      { label: "Student Attendance", path: "/dashboard/schooladmin/attendance/students", desc: "Mark and view student attendance" },
      { label: "Staff Attendance", path: "/dashboard/schooladmin/attendance/staff", desc: "Track staff attendance records" },
      { label: "Teacher Attendance", path: "/dashboard/schooladmin/attendance/teachers", desc: "Teacher attendance overview" },
      { label: "Attendance Reports", path: "/dashboard/schooladmin/attendance/reports", desc: "Detailed attendance analytics" },
      { label: "Leave Management", path: "/dashboard/schooladmin/attendance/leave", desc: "Manage leave requests" },
    ],
    "Teacher": [
      { label: "Mark Attendance", path: "/dashboard/teacher/attendance/students", desc: "Mark class student attendance" },
      { label: "My Attendance", path: "/dashboard/teacher/attendance/my", desc: "View personal attendance log" },
    ],
    "Student": [
      { label: "My Attendance", path: "/dashboard/student/attendance", desc: "Check attendance record" },
    ],
  },
  "exam-result": {
    "School Admin": [
      { label: "Exam List", path: "/dashboard/schooladmin/exams/exams-list", desc: "View and manage all exams" },
      { label: "Create Exam", path: "/dashboard/schooladmin/exams/exams-create", desc: "Schedule a new exam" },
      { label: "Enter Grades", path: "/dashboard/schooladmin/exams/grades", desc: "Enter marks and results" },
      { label: "Exam Schedule", path: "/dashboard/schooladmin/exams/schedule", desc: "View exam timetable" },
      { label: "Exam Analytics", path: "/dashboard/schooladmin/exams/analytics", desc: "Performance trends and insights" },
      { label: "Admit Cards", path: "/dashboard/schooladmin/exams/admit-card", desc: "Generate and download admit cards" },
    ],
    "Teacher": [
      { label: "Exam List", path: "/dashboard/teacher/exams/list", desc: "View assigned exams" },
      { label: "Create Exam", path: "/dashboard/teacher/exams/create", desc: "Create a new exam" },
      { label: "Evaluation", path: "/dashboard/teacher/exams/evaluation", desc: "Evaluate submitted answers" },
    ],
    "Student": [
      { label: "My Exams", path: "/dashboard/student/exams", desc: "View upcoming and past exams" },
    ],
  },
  "timetable-management": {
    "School Admin": [
      { label: "Class Timetable", path: "/dashboard/schooladmin/timetable/class", desc: "View and manage class-wise schedules" },
      { label: "Teacher Timetable", path: "/dashboard/schooladmin/timetable/teacher", desc: "View teacher-wise teaching schedules" },
      { label: "Time Slots", path: "/dashboard/schooladmin/timetable/time-slots", desc: "Configure periods and time slots" },
      { label: "Rooms", path: "/dashboard/schooladmin/timetable/rooms", desc: "Manage rooms and hall allocation" },
      { label: "Timetable Dashboard", path: "/dashboard/schooladmin/timetable", desc: "Full timetable overview" },
    ],
    "Teacher": [
      { label: "My Timetable", path: "/dashboard/teacher/timetable", desc: "View your class and period schedule" },
    ],
    "Student": [
      { label: "My Timetable", path: "/dashboard/student/timetable", desc: "View your personal class schedule" },
    ],
    "Parent": [
      { label: "Child Timetable", path: "/dashboard/parent/timetable", desc: "View your child's class schedule" },
    ],
    "Principal": [
      { label: "Timetable Overview", path: "/dashboard/principal/timetable", desc: "School-wide timetable view" },
    ],
    "Vice Principal": [
      { label: "Timetable Overview", path: "/dashboard/viceprincipal/timetable", desc: "School-wide timetable view" },
    ],
  },
  "fees-management": {
    "School Admin": [
      { label: "Fee Structure", path: "/dashboard/schooladmin/fees/feestructure", desc: "Configure fee plans and categories" },
      { label: "Collect Fee", path: "/dashboard/schooladmin/fees/collect", desc: "Record and process fee payments" },
      { label: "Assign Fees", path: "/dashboard/schooladmin/fees/assign", desc: "Assign fees to students" },
      { label: "Fee Categories", path: "/dashboard/schooladmin/fees/categories", desc: "Manage fee types" },
    ],
    "Accountant": [
      { label: "Collect Fee", path: "/dashboard/accountant/fees/collect", desc: "Process fee collection" },
      { label: "Fee Reports", path: "/dashboard/accountant/fees/reports", desc: "View financial reports" },
    ],
  },
  "transport-management": {
    "School Admin": [
      { label: "Vehicles", path: "/dashboard/schooladmin/transport/vehicles", desc: "Manage fleet and vehicle records" },
      { label: "Routes", path: "/dashboard/schooladmin/transport/routes", desc: "Configure transport routes" },
      { label: "Assignments", path: "/dashboard/schooladmin/transport/assignments", desc: "Assign students to routes" },
    ],
    "Transport Manager": [
      { label: "Dashboard", path: "/dashboard/transportmanager", desc: "Transport operations overview" },
      { label: "Drivers", path: "/dashboard/transportmanager/drivers", desc: "Manage driver records" },
      { label: "Maintenance", path: "/dashboard/transportmanager/maintenance", desc: "Vehicle maintenance logs" },
    ],
  },
  "hostel-management": {
    "School Admin": [
      { label: "Hostel Management", path: "/dashboard/schooladmin/hostel", desc: "Rooms, blocks, and allocations" },
    ],
    "Hostel Warden": [
      { label: "Hostel Dashboard", path: "/dashboard/hostelwarden", desc: "Hostel operations overview" },
      { label: "Room Allocation", path: "/dashboard/hostelwarden/rooms", desc: "Manage room and bed allocation" },
    ],
  },
  "library-management": {
    "School Admin": [
      { label: "Books Catalog", path: "/dashboard/schooladmin/library/books", desc: "Manage books inventory" },
      { label: "Issue Book", path: "/dashboard/schooladmin/library/issue", desc: "Issue and return books" },
      { label: "Library Cards", path: "/dashboard/schooladmin/library/card", desc: "Generate member cards" },
    ],
    "Librarian": [
      { label: "Books Catalog", path: "/dashboard/librarian/books", desc: "Manage books and catalog" },
      { label: "Issue Book", path: "/dashboard/librarian/issue", desc: "Issue and return books" },
    ],
  },
  "inventory": {
    "School Admin": [
      { label: "Supplies", path: "/dashboard/schooladmin/inventory/supplies", desc: "Manage supplies and stock" },
      { label: "Assets", path: "/dashboard/schooladmin/inventory/assets", desc: "Track school assets" },
    ],
  },
  "communication": {
    "School Admin": [
      { label: "Send Notification", path: "/dashboard/schooladmin/communication/send", desc: "Broadcast notifications to roles" },
      { label: "Communication History", path: "/dashboard/schooladmin/communication/history", desc: "View sent messages and broadcasts" },
      { label: "Message Center", path: "/dashboard/schooladmin/message", desc: "Direct messages inbox and sent" },
    ],
    "Teacher": [
      { label: "Send Notification", path: "/dashboard/teacher/communication/send", desc: "Send class announcements" },
      { label: "Message Center", path: "/dashboard/teacher/message", desc: "Direct messaging" },
    ],
    "Receptionist": [
      { label: "Broadcasts", path: "/dashboard/receptionist/broadcasts", desc: "Send school broadcasts" },
      { label: "Message Center", path: "/dashboard/receptionist/message", desc: "Direct messaging" },
    ],
  },
  "learning-management": {
    "Teacher": [
      { label: "Assignments", path: "/dashboard/teacher/assignments", desc: "Create and manage assignments" },
      { label: "Lesson Plans", path: "/dashboard/teacher/lesson-plans", desc: "Plan and share lessons" },
      { label: "Resources", path: "/dashboard/teacher/resources", desc: "Upload study materials" },
    ],
    "Student": [
      { label: "Assignments", path: "/dashboard/student/assignments", desc: "View and submit assignments" },
    ],
  },
  "reports-analytics": {
    "School Admin": [
      { label: "School Reports", path: "/dashboard/schooladmin/reports", desc: "Enrollment and role-wise analytics" },
      { label: "Attendance Reports", path: "/dashboard/schooladmin/attendance/reports", desc: "Attendance trends and summaries" },
      { label: "Exam Reports", path: "/dashboard/schooladmin/exams/reports", desc: "Performance and result analytics" },
    ],
    "Teacher": [
      { label: "Teacher Reports", path: "/dashboard/teacher/reports", desc: "Class performance analytics" },
    ],
  },
};

const ModuleDetail = () => {
  const navigate = useNavigate();
  const { moduleKey } = useParams();
  const { user } = useSelector((state) => state.auth);

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "";
  const moduleData = ERP_MODULES.find((m) => m.key === moduleKey);
  const meta = MODULE_META[moduleKey] || { color: "#2563EB", emoji: "📋" };
  const features = MODULE_FEATURES[moduleKey] || [];

  const quickActions = useMemo(() => {
    const roleActions = MODULE_ACTIONS[moduleKey] || {};
    return roleActions[roleName] || roleActions["School Admin"] || [];
  }, [moduleKey, roleName]);

  if (!moduleData) {
    return (
      <>
        <PageHeader
          title="Module Not Found"
          subtitle="The requested module does not exist."
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/modules")}>
              Back to Modules
            </Button>
          }
        />
        <div style={pageWrapper}>
          <div style={{ ...sectionPanel, textAlign: "center", padding: "56px 24px" }}>
            <Empty description="Module not found. Please check the URL or contact your administrator." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={moduleData.title}
        subtitle={moduleData.description}
        icon={<span style={{ fontSize: 20 }}>{meta.emoji}</span>}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/modules")}>
            All Modules
          </Button>
        }
      />

      <div style={pageWrapper}>
        {/* Module Hero Banner */}
        <div style={{
          ...sectionPanel,
          marginBottom: 20,
          padding: 0,
          overflow: "hidden",
          borderTop: `4px solid ${meta.color}`,
        }}>
          <Flex align="stretch" style={{ minHeight: 100 }}>
            {/* Left accent strip */}
            <div style={{
              width: 6,
              background: `linear-gradient(180deg, ${meta.color} 0%, ${meta.color}44 100%)`,
              flexShrink: 0,
            }} />

            <Flex align="center" gap={20} style={{ padding: "24px 28px", flex: 1, flexWrap: "wrap" }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: `${meta.color}15`,
                border: `2px solid ${meta.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                flexShrink: 0,
              }}>
                {meta.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <Text strong style={{ fontSize: 20, color: "var(--text-primary)", display: "block", lineHeight: 1.3 }}>
                  {moduleData.title}
                </Text>
                <Text style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  {moduleData.description}
                </Text>
                <Flex gap={8} style={{ marginTop: 10 }} wrap="wrap">
                  <Tag color="blue" style={{ borderRadius: 99 }}>{roleName || "User"}</Tag>
                  <Tag style={{ borderRadius: 99, borderColor: `${meta.color}40`, color: meta.color, background: `${meta.color}12` }}>
                    {quickActions.length} Quick Actions
                  </Tag>
                  {features.length > 0 && (
                    <Tag style={{ borderRadius: 99 }}>{features.length} Features</Tag>
                  )}
                </Flex>
              </div>
            </Flex>
          </Flex>
        </div>

        <Row gutter={[16, 16]}>
          {/* Quick Access Actions */}
          <Col xs={24} lg={quickActions.length > 0 ? 15 : 24}>
            <div style={sectionPanel}>
              <Flex align="center" gap={10} style={{ marginBottom: 18 }}>
                <div style={iconWell(meta.color, 36)}>
                  <ArrowRightOutlined style={{ fontSize: 15 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                    Quick Access
                  </Text>
                  <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Jump directly to your most-used pages in this module
                  </Text>
                </div>
              </Flex>

              {quickActions.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={`No quick actions configured for ${roleName || "your role"} in this module.`}
                  style={{ padding: "32px 0" }}
                />
              ) : (
                <Row gutter={[12, 12]}>
                  {quickActions.map((action) => (
                    <Col xs={24} sm={12} key={action.path}>
                      <div
                        onClick={() => navigate(action.path)}
                        style={{
                          background: "var(--surface-soft)",
                          border: "1px solid var(--border-muted)",
                          borderRadius: 12,
                          padding: "14px 16px",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = meta.color;
                          e.currentTarget.style.background = `${meta.color}08`;
                          e.currentTarget.style.boxShadow = `0 4px 14px ${meta.color}18`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border-muted)";
                          e.currentTarget.style.background = "var(--surface-soft)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={iconWell(meta.color, 36)}>
                          <ArrowRightOutlined style={{ fontSize: 14 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                            {action.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 1 }}>
                            {action.desc}
                          </Text>
                        </div>
                        <ArrowRightOutlined style={{ color: meta.color, fontSize: 12, flexShrink: 0 }} />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </Col>

          {/* Module Features */}
          {features.length > 0 && (
            <Col xs={24} lg={9}>
              <div style={{ ...sectionPanel, height: "100%" }}>
                <Flex align="center" gap={10} style={{ marginBottom: 18 }}>
                  <div style={iconWell(meta.color, 36)}>
                    <CheckOutlined style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                      Module Capabilities
                    </Text>
                    <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      What this module covers
                    </Text>
                  </div>
                </Flex>

                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {features.map((feat, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: i < features.length - 1 ? "1px solid var(--border-muted)" : "none",
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: `${meta.color}15`,
                        color: meta.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        ✓
                      </div>
                      <Text style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.45 }}>
                        {feat}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
          )}
        </Row>

        {/* Footer navigation */}
        <div style={{ ...sectionPanel, marginTop: 16, padding: "14px 20px" }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
              You're viewing the <strong style={{ color: meta.color }}>{moduleData.title}</strong> module.
            </Text>
            <Flex gap={8}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/modules")}>
                Back to Modules
              </Button>
              {quickActions.length > 0 && (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate(quickActions[0].path)}
                  style={{ background: meta.color, borderColor: meta.color }}
                >
                  Open {quickActions[0].label}
                </Button>
              )}
            </Flex>
          </Flex>
        </div>
      </div>
    </>
  );
};

export default ModuleDetail;

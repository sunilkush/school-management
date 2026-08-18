import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Col, Empty, Flex, Row, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { ERP_MODULES } from "../../utils/moduleRegistry";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell } from "../../styles/pageStyles.js";
import { categoricalColorFor } from "../../utils/colorPalette.js";

const { Text } = Typography;

/* ── Module visual identity (shared with ModuleOverview — same
   categoricalColorFor(key) source so a module's color matches across
   both pages) ──────────────────────────────────────────────────── */
const MODULE_META = {
  "school-management":    { color: categoricalColorFor("school-management"), emoji: "🏫" },
  "academic-management":  { color: categoricalColorFor("academic-management"), emoji: "📚" },
  "student-management":   { color: categoricalColorFor("student-management"), emoji: "🎓" },
  "teacher-management":   { color: categoricalColorFor("teacher-management"), emoji: "👩‍🏫" },
  "attendance-system":    { color: categoricalColorFor("attendance-system"), emoji: "✅" },
  "exam-result":          { color: categoricalColorFor("exam-result"), emoji: "📝" },
  "timetable-management": { color: categoricalColorFor("timetable-management"), emoji: "🗓️" },
  "fees-management":      { color: categoricalColorFor("fees-management"), emoji: "💰" },
  "transport-management": { color: categoricalColorFor("transport-management"), emoji: "🚌" },
  "hostel-management":    { color: categoricalColorFor("hostel-management"), emoji: "🏠" },
  "library-management":   { color: categoricalColorFor("library-management"), emoji: "📖" },
  "inventory":            { color: categoricalColorFor("inventory"), emoji: "📦" },
  "communication":        { color: categoricalColorFor("communication"), emoji: "💬" },
  "learning-management":  { color: categoricalColorFor("learning-management"), emoji: "🧑‍💻" },
  "reports-analytics":    { color: categoricalColorFor("reports-analytics"), emoji: "📊" },
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

/* ── Per-module quick-access actions by role ─────────────────────── */
const MODULE_ACTIONS = {
  "school-management": {
    "School Admin": [
      { label: "School Setup",    path: "/dashboard/schooladmin/school-setup", desc: "Configure profile, branding, and settings" },
      { label: "Academic Years",  path: "/dashboard/schooladmin/school-setup", desc: "Manage active academic year" },
    ],
  },
  "academic-management": {
    "School Admin": [
      { label: "Classes",  path: "/dashboard/schooladmin/classes",  desc: "Manage boards, classes, and sections" },
      { label: "Subjects", path: "/dashboard/schooladmin/subjects", desc: "Configure subjects and curriculum" },
    ],
    "Teacher": [
      { label: "Lesson Plans", path: "/dashboard/teacher/lesson-plans", desc: "Create and manage lesson plans" },
      { label: "Resources",    path: "/dashboard/teacher/resources",    desc: "Upload study resources" },
    ],
  },
  "student-management": {
    "School Admin": [
      { label: "Student List",       path: "/dashboard/schooladmin/studentList",          desc: "Browse and manage all students" },
      { label: "New Admission",      path: "/dashboard/schooladmin/admission",             desc: "Register a new student" },
      { label: "Admission Inquiry",  path: "/dashboard/schooladmin/admission/inquiry",    desc: "Track and follow-up inquiries" },
      { label: "Student Promotion",  path: "/dashboard/schooladmin/students/promotion",   desc: "Promote students to next class" },
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
      { label: "Teacher List",     path: "/dashboard/schooladmin/teacher",                    desc: "Browse and manage all teachers" },
      { label: "Create Employee",  path: "/dashboard/schooladmin/payroll/create-employee",    desc: "Onboard a new teacher" },
    ],
  },
  "attendance-system": {
    "School Admin": [
      { label: "Student Attendance",  path: "/dashboard/schooladmin/attendance/students", desc: "Mark and view student attendance" },
      { label: "Staff Attendance",    path: "/dashboard/schooladmin/attendance/staff",    desc: "Track staff attendance records" },
      { label: "Teacher Attendance",  path: "/dashboard/schooladmin/attendance/teachers", desc: "Teacher attendance overview" },
      { label: "Attendance Reports",  path: "/dashboard/schooladmin/attendance/reports",  desc: "Detailed attendance analytics" },
      { label: "Leave Management",    path: "/dashboard/schooladmin/attendance/leave",    desc: "Manage leave requests" },
    ],
    "Teacher": [
      { label: "Mark Attendance", path: "/dashboard/teacher/attendance/students", desc: "Mark class student attendance" },
      { label: "My Attendance",   path: "/dashboard/teacher/attendance/my",       desc: "View personal attendance log" },
    ],
    "Student": [
      { label: "My Attendance", path: "/dashboard/student/attendance", desc: "Check attendance record" },
    ],
  },
  "exam-result": {
    "School Admin": [
      { label: "Exam List",     path: "/dashboard/schooladmin/exams/exams-list",  desc: "View and manage all exams" },
      { label: "Create Exam",   path: "/dashboard/schooladmin/exams/exams-create", desc: "Schedule a new exam" },
      { label: "Enter Grades",  path: "/dashboard/schooladmin/exams/grades",      desc: "Enter marks and results" },
      { label: "Exam Schedule", path: "/dashboard/schooladmin/exams/schedule",    desc: "View exam timetable" },
      { label: "Exam Analytics", path: "/dashboard/schooladmin/exams/analytics",  desc: "Performance trends and insights" },
      { label: "Admit Cards",   path: "/dashboard/schooladmin/exams/admit-card",  desc: "Generate and download admit cards" },
    ],
    "Teacher": [
      { label: "Exam List",   path: "/dashboard/teacher/exams/list",       desc: "View assigned exams" },
      { label: "Create Exam", path: "/dashboard/teacher/exams/create",     desc: "Create a new exam" },
      { label: "Evaluation",  path: "/dashboard/teacher/exams/evaluation", desc: "Evaluate submitted answers" },
    ],
    "Student": [
      { label: "My Exams", path: "/dashboard/student/exams", desc: "View upcoming and past exams" },
    ],
  },
  "timetable-management": {
    "School Admin": [
      { label: "Class Timetable",   path: "/dashboard/schooladmin/timetable/class",       desc: "View and manage class-wise schedules" },
      { label: "Teacher Timetable", path: "/dashboard/schooladmin/timetable/teacher",     desc: "View teacher-wise teaching schedules" },
      { label: "Time Slots",        path: "/dashboard/schooladmin/timetable/time-slots",  desc: "Configure periods and time slots" },
      { label: "Rooms",             path: "/dashboard/schooladmin/timetable/rooms",       desc: "Manage rooms and hall allocation" },
      { label: "Overview",          path: "/dashboard/schooladmin/timetable",             desc: "Full timetable overview" },
    ],
    "Teacher":   [{ label: "My Timetable",      path: "/dashboard/teacher/timetable",    desc: "View your class and period schedule" }],
    "Student":   [{ label: "My Timetable",      path: "/dashboard/student/timetable",    desc: "View your personal class schedule" }],
    "Parent":    [{ label: "Child Timetable",   path: "/dashboard/parent/timetable",     desc: "View your child's class schedule" }],
    "Principal": [{ label: "Timetable Overview", path: "/dashboard/principal/timetable", desc: "School-wide timetable view" }],
    "Vice Principal": [{ label: "Timetable Overview", path: "/dashboard/viceprincipal/timetable", desc: "School-wide timetable view" }],
  },
  "fees-management": {
    "School Admin": [
      { label: "Fee Structure", path: "/dashboard/schooladmin/fees/feestructure", desc: "Configure fee plans and categories" },
      { label: "Collect Fee",   path: "/dashboard/schooladmin/fees/collect",      desc: "Record and process fee payments" },
      { label: "Assign Fees",   path: "/dashboard/schooladmin/fees/assign",       desc: "Assign fees to students" },
      { label: "Fee Categories", path: "/dashboard/schooladmin/fees/categories",  desc: "Manage fee types" },
    ],
    "Accountant": [
      { label: "Collect Fee",  path: "/dashboard/accountant/fees/collect",  desc: "Process fee collection" },
      { label: "Fee Reports",  path: "/dashboard/accountant/fees/reports",  desc: "View financial reports" },
    ],
  },
  "transport-management": {
    "School Admin": [
      { label: "Vehicles",     path: "/dashboard/schooladmin/transport/vehicles",     desc: "Manage fleet and vehicle records" },
      { label: "Routes",       path: "/dashboard/schooladmin/transport/routes",       desc: "Configure transport routes" },
      { label: "Assignments",  path: "/dashboard/schooladmin/transport/assignments",  desc: "Assign students to routes" },
    ],
    "Transport Manager": [
      { label: "Dashboard",    path: "/dashboard/transportmanager",            desc: "Transport operations overview" },
      { label: "Drivers",      path: "/dashboard/transportmanager/drivers",    desc: "Manage driver records" },
      { label: "Maintenance",  path: "/dashboard/transportmanager/maintenance", desc: "Vehicle maintenance logs" },
    ],
  },
  "hostel-management": {
    "School Admin":   [{ label: "Hostel Management", path: "/dashboard/schooladmin/hostel",       desc: "Rooms, blocks, and allocations" }],
    "Hostel Warden":  [
      { label: "Hostel Dashboard", path: "/dashboard/hostelwarden",        desc: "Hostel operations overview" },
      { label: "Room Allocation",  path: "/dashboard/hostelwarden/rooms",  desc: "Manage room and bed allocation" },
    ],
  },
  "library-management": {
    "School Admin": [
      { label: "Books Catalog",  path: "/dashboard/schooladmin/library/books", desc: "Manage books inventory" },
      { label: "Issue Book",     path: "/dashboard/schooladmin/library/issue", desc: "Issue and return books" },
      { label: "Library Cards",  path: "/dashboard/schooladmin/library/card",  desc: "Generate member cards" },
    ],
    "Librarian": [
      { label: "Books Catalog", path: "/dashboard/librarian/books", desc: "Manage books and catalog" },
      { label: "Issue Book",    path: "/dashboard/librarian/issue", desc: "Issue and return books" },
    ],
  },
  "inventory": {
    "School Admin": [
      { label: "Supplies", path: "/dashboard/schooladmin/inventory/supplies", desc: "Manage supplies and stock" },
      { label: "Assets",   path: "/dashboard/schooladmin/inventory/assets",   desc: "Track school assets" },
    ],
  },
  "communication": {
    "School Admin": [
      { label: "Send Notification",      path: "/dashboard/schooladmin/communication/send",    desc: "Broadcast notifications to roles" },
      { label: "Communication History",  path: "/dashboard/schooladmin/communication/history", desc: "View sent messages and broadcasts" },
      { label: "Message Center",         path: "/dashboard/schooladmin/message",               desc: "Direct messages inbox and sent" },
    ],
    "Teacher": [
      { label: "Send Notification", path: "/dashboard/teacher/communication/send", desc: "Send class announcements" },
      { label: "Message Center",    path: "/dashboard/teacher/message",            desc: "Direct messaging" },
    ],
    "Receptionist": [
      { label: "Broadcasts",    path: "/dashboard/receptionist/broadcasts", desc: "Send school broadcasts" },
      { label: "Message Center", path: "/dashboard/receptionist/message",   desc: "Direct messaging" },
    ],
  },
  "learning-management": {
    "Teacher": [
      { label: "Assignments",  path: "/dashboard/teacher/assignments",   desc: "Create and manage assignments" },
      { label: "Lesson Plans", path: "/dashboard/teacher/lesson-plans",  desc: "Plan and share lessons" },
      { label: "Resources",    path: "/dashboard/teacher/resources",     desc: "Upload study materials" },
    ],
    "Student": [
      { label: "Assignments", path: "/dashboard/student/assignments", desc: "View and submit assignments" },
    ],
  },
  "reports-analytics": {
    "School Admin": [
      { label: "School Reports",      path: "/dashboard/schooladmin/reports",              desc: "Enrollment and role-wise analytics" },
      { label: "Attendance Reports",  path: "/dashboard/schooladmin/attendance/reports",   desc: "Attendance trends and summaries" },
      { label: "Exam Reports",        path: "/dashboard/schooladmin/exams/reports",        desc: "Performance and result analytics" },
    ],
    "Teacher": [
      { label: "Teacher Reports", path: "/dashboard/teacher/reports", desc: "Class performance analytics" },
    ],
  },
};

/* ── Action card ─────────────────────────────────────────────────── */
const ActionCard = ({ action, color, onClick, isPrimary }) => (
  <div
    onClick={onClick}
    style={{
      background: isPrimary ? `color-mix(in srgb, ${color} 6%, transparent)` : "var(--surface-soft)",
      border: `1px solid ${isPrimary ? `color-mix(in srgb, ${color} 21%, transparent)` : "var(--border-muted)"}`,
      borderRadius: 12,
      padding: "14px 16px",
      cursor: "pointer",
      transition: "all 0.18s ease",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.background = `color-mix(in srgb, ${color} 6%, transparent)`;
      e.currentTarget.style.boxShadow = `0 4px 16px color-mix(in srgb, ${color} 12%, transparent)`;
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = isPrimary ? `color-mix(in srgb, ${color} 21%, transparent)` : "var(--border-muted)";
      e.currentTarget.style.background = isPrimary ? `color-mix(in srgb, ${color} 6%, transparent)` : "var(--surface-soft)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={iconWell(color, 38)}>
      <ThunderboltOutlined style={{ fontSize: 15 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
        {action.label}
      </Text>
      <Text style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 1 }}>
        {action.desc}
      </Text>
    </div>
    <ArrowRightOutlined style={{ color, fontSize: 11, flexShrink: 0 }} />
  </div>
);

/* ── Feature item ────────────────────────────────────────────────── */
const FeatureItem = ({ text, color, index }) => (
  <div style={{
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "9px 0",
    borderBottom: "1px solid var(--border-muted)",
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
      background: `color-mix(in srgb, ${color} 8%, transparent)`, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700,
    }}>
      <CheckOutlined style={{ fontSize: 10 }} />
    </div>
    <Text style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, flex: 1 }}>
      {text}
    </Text>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const ModuleDetail = () => {
  const navigate = useNavigate();
  const { moduleKey } = useParams();
  const { user } = useSelector((state) => state.auth);

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "";
  const moduleData = ERP_MODULES.find((m) => m.key === moduleKey);
  const meta = MODULE_META[moduleKey] || { color: "var(--primary)", emoji: "📋" };
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
        {/* ── Hero Banner ── */}
        <div style={{
          borderRadius: 16,
          background: `linear-gradient(135deg, color-mix(in srgb, ${meta.color} 7%, transparent) 0%, color-mix(in srgb, ${meta.color} 4%, transparent) 60%, var(--surface) 100%)`,
          border: `1px solid color-mix(in srgb, ${meta.color} 19%, transparent)`,
          borderLeft: `5px solid ${meta.color}`,
          padding: "28px 32px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}>
          {/* Big emoji */}
          <div style={{
            width: 80, height: 80, borderRadius: 22, flexShrink: 0,
            background: `color-mix(in srgb, ${meta.color} 9%, transparent)`, border: `2px solid color-mix(in srgb, ${meta.color} 19%, transparent)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, boxShadow: `0 4px 20px color-mix(in srgb, ${meta.color} 12%, transparent)`,
          }}>
            {meta.emoji}
          </div>

          {/* Title + tags */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <Text strong style={{ fontSize: 22, color: "var(--text-primary)", display: "block", lineHeight: 1.25 }}>
              {moduleData.title}
            </Text>
            <Text style={{ fontSize: 14, color: "var(--text-muted)", display: "block", marginTop: 4, lineHeight: 1.5 }}>
              {moduleData.description}
            </Text>
            <Flex gap={8} style={{ marginTop: 12 }} wrap="wrap">
              <Tag
                style={{
                  borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 600,
                  background: `color-mix(in srgb, ${meta.color} 8%, transparent)`, color: meta.color, border: `1px solid color-mix(in srgb, ${meta.color} 19%, transparent)`,
                }}
              >
                {meta.emoji} {moduleData.title}
              </Tag>
              <Tag color="blue" style={{ borderRadius: 99, padding: "3px 12px" }}>
                {roleName || "User"}
              </Tag>
            </Flex>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Features",     value: features.length,     color: meta.color  },
              { label: "Quick Actions", value: quickActions.length, color: "var(--primary)"   },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Content ── */}
        <Row gutter={[16, 16]}>
          {/* Quick Access Actions */}
          <Col xs={24} lg={quickActions.length > 0 ? 15 : 24}>
            <div style={sectionPanel}>
              <Flex align="center" gap={10} style={{ marginBottom: 18 }}>
                <div style={iconWell(meta.color, 36)}>
                  <ThunderboltOutlined style={{ fontSize: 15 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                    Quick Access
                  </Text>
                  <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Jump directly to your most-used pages
                  </Text>
                </div>
                {quickActions.length > 0 && (
                  <div style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 10px",
                    borderRadius: 20, background: `color-mix(in srgb, ${meta.color} 8%, transparent)`, color: meta.color,
                    border: `1px solid color-mix(in srgb, ${meta.color} 16%, transparent)`,
                  }}>
                    {quickActions.length} actions
                  </div>
                )}
              </Flex>

              {quickActions.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      No quick actions configured for <strong>{roleName || "your role"}</strong> in this module.
                    </span>
                  }
                  style={{ padding: "32px 0" }}
                />
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 10,
                }}>
                  {quickActions.map((action, i) => (
                    <ActionCard
                      key={action.path}
                      action={action}
                      color={meta.color}
                      isPrimary={i === 0}
                      onClick={() => navigate(action.path)}
                    />
                  ))}
                </div>
              )}

              {/* Primary CTA */}
              {quickActions.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-muted)" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate(quickActions[0].path)}
                    style={{
                      background: meta.color, borderColor: meta.color,
                      borderRadius: 10, fontWeight: 600, height: 44,
                    }}
                  >
                    Open {quickActions[0].label}
                  </Button>
                </div>
              )}
            </div>
          </Col>

          {/* Module Features */}
          {features.length > 0 && (
            <Col xs={24} lg={9}>
              <div style={{ ...sectionPanel, height: "100%" }}>
                <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
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

                <div>
                  {features.map((feat, i) => (
                    <FeatureItem key={i} text={feat} color={meta.color} index={i} />
                  ))}
                </div>

                {/* "No more features" tail */}
                <div style={{
                  marginTop: 14, padding: "10px 14px", borderRadius: 10,
                  background: `color-mix(in srgb, ${meta.color} 5%, transparent)`, border: `1px solid color-mix(in srgb, ${meta.color} 12%, transparent)`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                  <Text style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
                    {features.length} capabilities included in this module
                  </Text>
                </div>
              </div>
            </Col>
          )}
        </Row>

        {/* ── Footer navigation ── */}
        <div style={{ ...sectionPanel, marginTop: 4, padding: "14px 20px" }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Viewing{" "}
              <strong style={{ color: meta.color }}>{moduleData.title}</strong>
              {" "}as{" "}
              <strong style={{ color: "var(--text-primary)" }}>{roleName}</strong>
            </Text>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/modules")}>
              Back to All Modules
            </Button>
          </Flex>
        </div>
      </div>
    </>
  );
};

export default ModuleDetail;

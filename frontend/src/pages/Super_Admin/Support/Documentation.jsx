import React, { useState, useMemo } from "react";
import { Input, Tag, Divider } from "antd";
import {
  RocketOutlined,
  BankOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  DollarOutlined,
  CarOutlined,
  BarChartOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  ApiOutlined,
  SearchOutlined,
  BookOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  RightOutlined,
  FileProtectOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, iconWell, pill, sectionPanel } from "../../../styles/pageStyles";

/* ─── Doc Sections Data ─── */
const SECTIONS = [
  {
    id: "intro",
    group: "Overview",
    icon: <RocketOutlined />,
    color: "var(--primary)",
    title: "Introduction",
    subtitle: "Platform overview & what you can do",
    badge: "Start Here",
    overview:
      "EduOS is a comprehensive School Management SaaS platform designed for Super Admins, School Administrators, Teachers, Accountants, and Parents. It covers the full academic lifecycle — from onboarding schools to generating reports.",
    sections: [
      {
        heading: "What is EduOS?",
        body: "EduOS is a multi-tenant cloud platform where a single Super Admin manages multiple schools. Each school has its own data silo, staff hierarchy, academic structure, fee management, payroll, and analytics.",
      },
      {
        heading: "Who uses EduOS?",
        body: null,
        list: [
          "Super Admin — manages all schools, subscription plans, boards, and platform-level settings.",
          "School Admin / Principal — manages one school: staff, classes, students, fees, and reports.",
          "Teacher / Class Teacher — marks attendance, uploads marks, manages assigned classes.",
          "Accountant — handles fee collection, receipts, payroll cycles, and financial reports.",
          "Parent / Student — views attendance, marks, timetable, and fee statements.",
          "Transport Manager, Librarian, Hostel Warden — role-specific dashboards and actions.",
        ],
      },
    ],
    tips: ["Use the left sidebar to navigate between documentation sections.", "Use the search bar above to quickly find any topic."],
  },
  {
    id: "getting-started",
    group: "Overview",
    icon: <BulbOutlined />,
    color: "var(--purple)",
    title: "Getting Started",
    subtitle: "First-time setup guide for Super Admins",
    badge: "Setup",
    overview: "Follow this quick-start guide to get your first school live on EduOS in under 30 minutes.",
    sections: [
      {
        heading: "Step-by-Step Onboarding",
        body: null,
        steps: [
          "Login with your Super Admin credentials at /login.",
          "Go to School Management → Schools and click Add School. Fill in school name, address, email, and phone.",
          "Assign a Subscription Plan to the school from the Billing section.",
          "Go to Master Settings → School Boards and create/assign board (e.g. CBSE, ICSE) to the school.",
          "Open the school's user list and create the first School Admin account (role: School Admin).",
          "The School Admin can now login, set up academic year, classes, sections, and add staff.",
          "Verify the school is active and subscription is valid from the Schools grid.",
        ],
      },
    ],
    tips: [
      "Each school needs at least one active subscription before staff can login.",
      "Super Admin can impersonate a school to verify setup without sharing credentials.",
    ],
  },
  {
    id: "school-management",
    group: "Administration",
    icon: <BankOutlined />,
    color: "var(--cyan)",
    title: "School Management",
    subtitle: "Add, edit, and manage registered institutions",
    badge: "Admin",
    overview:
      "The Schools section is the central hub for all registered institutions. Super Admins can create schools, assign subscription plans, manage boarding details, and monitor school health from a card-based dashboard.",
    sections: [
      {
        heading: "Adding a School",
        body: null,
        steps: [
          "Navigate to School Management → Schools.",
          "Click Add School and fill the form: name, address, email, phone, and optional website.",
          "Save and then assign a subscription plan from the Manage Subscription button on the school card.",
          "Set the school's isActive flag to Active so staff can login.",
        ],
      },
      {
        heading: "School Subscription Actions",
        body: null,
        list: [
          "Renew — extends the subscription from the current end date.",
          "Suspend — blocks all school staff logins until reactivated.",
          "Reactivate — restores access for a suspended school.",
          "Cancel — permanently cancels; must re-assign a new plan to restore access.",
          "Change Plan — upgrade or downgrade to another active plan.",
        ],
      },
    ],
    tips: [
      "Suspending a school does NOT delete data. Staff accounts, academic records, and fees are preserved.",
      "A school without an active subscription cannot have staff log in.",
    ],
  },
  {
    id: "user-management",
    group: "Administration",
    icon: <TeamOutlined />,
    color: "var(--success-hover)",
    title: "User Management",
    subtitle: "Manage admins, teachers, students, parents and more",
    badge: "Users",
    overview:
      "The Users section under Super Admin lists all users across all schools, segmented by role. You can activate/deactivate accounts, and register new School Admins.",
    sections: [
      {
        heading: "Available Role Pages",
        body: null,
        list: [
          "School Admins — register new admins via the Add School Admin button (uses RegisterForm).",
          "Teachers — view and manage all teachers across schools.",
          "Accountants — manage accountant accounts.",
          "Librarians — manage library staff.",
          "Parents — view and manage parent accounts.",
          "Students — view student registrations.",
          "Staff — general non-teaching staff.",
          "Transport — drivers and transporters with Tabs view.",
        ],
      },
      {
        heading: "Activate / Deactivate Users",
        body: "Each user row has a status toggle. Deactivating a user blocks their login immediately without deleting data. Bulk activate/deactivate is available on pages with enableBulkActions.",
      },
    ],
    tips: [
      "Super Admins cannot be created from this panel — they are seeded directly in the database.",
      "User search works across name, email, and school name simultaneously.",
    ],
  },
  {
    id: "roles-permissions",
    group: "Administration",
    icon: <SafetyCertificateOutlined />,
    color: "var(--danger-hover)",
    title: "Roles & Permissions",
    subtitle: "Role-based access control across the platform",
    badge: "Security",
    overview:
      "EduOS uses role-based access control (RBAC). Every user has exactly one role, and each role's dashboard and sidebar are automatically filtered to show only permitted features.",
    sections: [
      {
        heading: "Platform Roles",
        body: null,
        list: [
          "Super Admin — full platform access; manages all schools and system settings.",
          "School Admin / Principal — full access within their school.",
          "Vice Principal — academic and administrative oversight.",
          "Teacher / Class Teacher — attendance, marks, timetable for assigned classes.",
          "Exam Coordinator — exam scheduling, results entry, and reporting.",
          "Accountant — fee management, payroll, and financial exports.",
          "Librarian — library catalog and issue/return tracking.",
          "Transport Manager — vehicle and route management.",
          "Hostel Warden — hostel student management.",
          "Counselor / IT Support / Receptionist / Lab Technician / Medical Officer / Sports Teacher — role-scoped dashboards.",
          "Student — self-service: marks, attendance, timetable, fees.",
          "Parent — linked to a student; reads marks, attendance, and fees.",
        ],
      },
      {
        heading: "Permission Model",
        body: "Route guards on the frontend and middleware on the backend check role on every request. Attempting to access a restricted route redirects to a 403 page. Role assignment is permanent at account creation; a Super Admin must change it manually.",
      },
    ],
    tips: ["Never share Super Admin credentials. Use role-specific accounts for each staff member."],
  },
  {
    id: "academic-year",
    group: "Academic",
    icon: <CalendarOutlined />,
    color: "var(--warning-hover)",
    title: "Academic Year",
    subtitle: "Define and activate academic sessions per school",
    badge: "Academic",
    overview:
      "Each school must have at least one Academic Year before sections, attendance, or exam data can be recorded. The active academic year acts as the global filter for most data views.",
    sections: [
      {
        heading: "Creating an Academic Year",
        body: null,
        steps: [
          "Go to Master Settings → Academic Years (within a school's context).",
          "Click Add Academic Year and provide: name (e.g. 2024–25), start date, end date.",
          "Mark the year as Active — this sets it as the live session for that school.",
          "Only one academic year can be active per school at a time.",
        ],
      },
      {
        heading: "Impact of Active Academic Year",
        body: null,
        list: [
          "Sections displayed in Class & Section Explorer are filtered by active year.",
          "Attendance records are linked to the active year.",
          "Exam schedules and results are scoped to the active year.",
          "Fee structures and payroll cycles use the active year's date range.",
        ],
      },
    ],
    tips: [
      "Changing the active year does NOT delete old data; previous year records remain accessible in historical views.",
      "Deactivate an old year before activating the new one to avoid data conflicts.",
    ],
  },
  {
    id: "classes-sections",
    group: "Academic",
    icon: <ApartmentOutlined />,
    color: "var(--purple)",
    title: "Classes & Sections",
    subtitle: "Manage class hierarchy and section enrollment",
    badge: "Academic",
    overview:
      "Classes define the grade (e.g. Class 10), and Sections are subdivisions (A, B, C). The Class & Section Explorer shows enrollment ratios, assigned class teachers, and section capacity.",
    sections: [
      {
        heading: "Setup Flow",
        body: null,
        steps: [
          "Ensure an active academic year exists for the school.",
          "Create classes via Academic Structure → Classes. Specify name and grade level.",
          "Create sections under each class. Assign a capacity and optionally a class teacher.",
          "Students are enrolled into sections during admission.",
        ],
      },
      {
        heading: "Enrollment Ratio Colors",
        body: null,
        list: [
          "🟢 Green — enrolled < 80% of capacity (healthy).",
          "🟡 Amber — enrolled 80–99% of capacity (near full).",
          "🔴 Red — enrolled ≥ 100% of capacity (over-capacity).",
        ],
      },
    ],
    tips: [
      "Sections without an assigned class teacher will show 'Not assigned' in the explorer.",
      "Super Admins see all schools' class data; School Admins see only their school.",
    ],
  },
  {
    id: "subjects",
    group: "Academic",
    icon: <BookOutlined />,
    color: "var(--cyan)",
    title: "Subjects & Chapters",
    subtitle: "Curriculum structure and content hierarchy",
    badge: "Curriculum",
    overview:
      "Subjects are assigned to classes and teachers. Chapters and Topics form the content hierarchy within each subject, used for planning, assignments, and exam scoping.",
    sections: [
      {
        heading: "Subject Assignment",
        body: null,
        steps: [
          "Create subjects (e.g. Mathematics, Science) from Academic → Subjects.",
          "Assign subjects to a class — each subject can have multiple teachers.",
          "Teachers see assigned subjects on their dashboard under My Classes.",
        ],
      },
      {
        heading: "Chapters & Topics",
        body: "Within each subject, create Chapters (e.g. Chapter 1: Algebra). Each chapter can have multiple Topics. Exam questions can be tagged to specific chapters for detailed analytics.",
      },
    ],
    tips: [
      "Deleting a subject cascades to remove chapter links; exam marks are preserved but lose the subject context.",
    ],
  },
  {
    id: "attendance",
    group: "Operations",
    icon: <CheckSquareOutlined />,
    color: "var(--success-hover)",
    title: "Attendance Management",
    subtitle: "Daily student and staff attendance tracking",
    badge: "Daily Ops",
    overview:
      "Teachers mark student attendance class-by-class. The system supports Present, Absent, Late, and Half-Day statuses. Reports aggregate daily, monthly, and per-student summaries.",
    sections: [
      {
        heading: "Marking Attendance (Teacher)",
        body: null,
        steps: [
          "Login as Teacher and go to Attendance → Student Attendance.",
          "Select your class from the dropdown. The enrolled students list loads automatically.",
          "For each student, mark P (Present), A (Absent), L (Late), or HD (Half Day).",
          "Submit — records are locked for editing after the school-defined cut-off time.",
          "For staff attendance, go to Attendance → Staff Attendance and follow the same flow.",
        ],
      },
      {
        heading: "Attendance Reports",
        body: null,
        list: [
          "Daily summary — who was absent today across all classes.",
          "Monthly report — per-student attendance percentage for the month.",
          "Student report card — attendance % printed on the report card.",
          "Low attendance alerts — students below the threshold (configurable) are flagged.",
        ],
      },
    ],
    tips: [
      "Attendance cannot be marked for a future date.",
      "School Admin can correct submitted attendance within the edit window defined in Settings.",
    ],
  },
  {
    id: "exams",
    group: "Operations",
    icon: <FileTextOutlined />,
    color: "var(--warning-hover)",
    title: "Exams & Results",
    subtitle: "Exam scheduling, marks entry, and report cards",
    badge: "Exams",
    overview:
      "The Exam module manages the full lifecycle: create exam schedule → assign invigilators → enter marks → generate rank lists and report cards.",
    sections: [
      {
        heading: "Exam Setup",
        body: null,
        steps: [
          "Go to Exams → Exam Schedule and create a new exam (e.g. Mid-Term 2024).",
          "Add subjects to the exam, define max marks and pass marks for each.",
          "Publish the timetable — teachers and students can view it.",
          "After exams, teachers enter marks via Exams → Marks Entry for their subject.",
        ],
      },
      {
        heading: "Results & Report Cards",
        body: null,
        steps: [
          "Once all marks are entered, go to Exams → Results.",
          "Generate rank list for the class.",
          "Generate and download/print individual student report cards (PDF).",
          "Results are available to parents and students via their portal.",
        ],
      },
    ],
    checklist: [
      "All subject marks must be entered before generating the final rank list.",
      "Verify pass marks configuration before publishing results.",
      "Archive the result set before starting the next exam cycle.",
    ],
    tips: ["Exam Coordinator role has dedicated access; Teacher role is restricted to marks entry only."],
  },
  {
    id: "fees",
    group: "Operations",
    icon: <DollarOutlined />,
    color: "var(--danger-hover)",
    title: "Fees & Billing",
    subtitle: "Fee structures, collection, and receipts",
    badge: "Finance",
    overview:
      "The Fee module handles fee structure creation, student fee assignment, collection, receipts, and overdue tracking. Accountants manage day-to-day collection; Admins configure structures.",
    sections: [
      {
        heading: "Fee Structure Setup",
        body: null,
        steps: [
          "Go to Finance → Fee Structure and create a new structure (e.g. Annual Tuition 2024–25).",
          "Add fee heads (Tuition, Transport, Lab, Library) with amounts and due dates.",
          "Assign the structure to class(es) — all students in those classes inherit the fee.",
        ],
      },
      {
        heading: "Fee Collection",
        body: null,
        steps: [
          "Go to Finance → Fee Collection. Search for a student by name or roll number.",
          "View their pending installments. Collect payment (cash/cheque/online) and enter the amount.",
          "Generate a receipt — print or share PDF to the parent.",
          "Overdue amounts are highlighted in red and included in defaulters reports.",
        ],
      },
    ],
    tips: [
      "Partial payments are supported — the remaining balance carries forward.",
      "Fee structure changes after assignment only affect new assignments, not existing ones.",
    ],
  },
  {
    id: "payroll",
    group: "HR & Finance",
    icon: <SolutionOutlined />,
    color: "var(--purple)",
    title: "Payroll Module",
    subtitle: "Monthly salary cycles for all staff",
    badge: "HR",
    overview:
      "Payroll runs monthly. Set up salary structures → generate monthly cycle → verify → lock → mark as paid → issue payslips.",
    sections: [
      {
        heading: "Super Admin Responsibilities",
        body: null,
        steps: [
          "Verify school setup readiness: employees, designations, departments exist.",
          "Ensure Payroll module is active for the school in Module Settings.",
          "Confirm Accountant/School Admin have payroll permissions (run, lock, pay, payslip, reports).",
          "Share this documentation and audit policies with school staff.",
          "After month close, review payroll summary and process compliance from Reports & Analytics.",
        ],
      },
      {
        heading: "Accountant Operations",
        body: null,
        steps: [
          "Go to Payroll → Salary Structures and configure earnings (Basic, HRA, allowances) and deductions (PF, TDS, advance) per employee/role.",
          "Go to Payroll → Monthly Run, select month, and generate the cycle.",
          "Review generated entries: gross pay, deductions, net pay. Fix mismatches by updating structure and refreshing.",
          "Lock the cycle when verified. Locked cycles cannot be edited.",
          "Mark as Paid — select payment mode (bank transfer / cash / reference number).",
          "Print payslips via Payroll → Payslips (select employee + month).",
          "Export monthly salary expense summary from Payroll → Monthly Reports.",
        ],
      },
    ],
    checklist: [
      "Update salary structure before generating the monthly cycle.",
      "Avoid changes after locking; use controlled re-run process for corrections.",
      "Cross-check net pay and employee mapping before marking as Paid.",
      "Archive payslip and monthly report for audit compliance every month.",
    ],
    tips: [
      "Locking a cycle prevents any further edits — coordinate with HR before clicking Lock.",
      "The re-run process creates a correction entry, preserving the audit trail.",
    ],
  },
  {
    id: "transport",
    group: "HR & Finance",
    icon: <CarOutlined />,
    color: "var(--cyan)",
    title: "Transport Management",
    subtitle: "Drivers, transporters, routes and vehicles",
    badge: "Transport",
    overview:
      "The Transport module covers driver and transporter user management, vehicle assignments, and route allocation for students using school transport.",
    sections: [
      {
        heading: "Transport Users",
        body: "Users with the Driver or Transporter role appear in the Transport Management page (tabbed view). Activate/deactivate drivers directly from this page.",
      },
      {
        heading: "Routes & Vehicles",
        body: null,
        steps: [
          "Create vehicle entries (bus number, capacity, driver assignment).",
          "Define routes with stops and timings.",
          "Assign students to routes during admission or from the student profile.",
          "Transport fee can be linked to the fee structure as a separate fee head.",
        ],
      },
    ],
    tips: ["Deactivating a driver blocks their login but preserves route assignments for re-assignment."],
  },
  {
    id: "reports",
    group: "Analytics",
    icon: <BarChartOutlined />,
    color: "var(--success-hover)",
    title: "Reports & Analytics",
    subtitle: "Platform-wide and school-specific reporting",
    badge: "Analytics",
    overview:
      "EduOS provides layered reporting — Super Admin sees platform-wide aggregates, School Admin sees school-level data, and role-specific users (Teacher, Accountant) see their domain reports.",
    sections: [
      {
        heading: "Super Admin Reports",
        body: null,
        list: [
          "School health dashboard — active schools, enrollment counts, subscription status.",
          "Revenue analytics — monthly collection, plan distribution, churn.",
          "User growth — new registrations per school per period.",
          "Audit logs — who changed what and when (role actions, bulk operations).",
        ],
      },
      {
        heading: "School-Level Reports",
        body: null,
        list: [
          "Attendance summary — daily/monthly per class and per student.",
          "Exam results — rank lists, section averages, subject-wise performance.",
          "Fee collection — collected vs. pending, defaulters list, receipt ledger.",
          "Payroll summary — monthly cost per department, salary register.",
          "Student report cards — printable/downloadable per student per exam.",
        ],
      },
    ],
    tips: [
      "All reports with date ranges use the school's active academic year as default scope.",
      "Export formats supported: PDF (printable), CSV (spreadsheet), Excel.",
    ],
  },
  {
    id: "subscription-plans",
    group: "Analytics",
    icon: <CrownOutlined />,
    color: "var(--warning-hover)",
    title: "Subscription Plans",
    subtitle: "Plan management for platform monetization",
    badge: "Billing",
    overview:
      "Super Admins create and manage subscription plans. Schools are assigned a plan on registration. Plan status (active, trial, suspended, cancelled) controls school staff login access.",
    sections: [
      {
        heading: "Plan Lifecycle",
        body: null,
        steps: [
          "Create a plan from Subscription Plans → Add Plan (name, price, duration in days, features).",
          "Assign the plan to a school from the Schools card → Manage Subscription.",
          "Plan auto-expires after the duration. Use Renew to extend.",
          "Change Plan to upgrade or downgrade (resets start/end dates).",
        ],
      },
      {
        heading: "Plan Status Reference",
        body: null,
        list: [
          "active — school is within the paid period; all staff can log in.",
          "trial — school is in a grace/trial window (same access as active).",
          "expired — period ended; staff login is blocked until renewed.",
          "suspended — manually suspended by Super Admin (e.g. payment dispute).",
          "cancelled — permanently cancelled; reactivation requires a new plan assignment.",
        ],
      },
    ],
    tips: [
      "Suspension and cancellation are instantaneous — staff are logged out on next request validation.",
      "Payment tracking is external (Razorpay / manual); update paymentStatus accordingly.",
    ],
  },
  {
    id: "settings",
    group: "Configuration",
    icon: <SettingOutlined />,
    color: "var(--text-secondary)",
    title: "System Settings",
    subtitle: "Platform-level configuration and module toggles",
    badge: "Config",
    overview:
      "System Settings let Super Admins configure platform defaults, enable/disable modules per school, set global policies (attendance cut-off, grade boundaries, etc.), and manage exam boards.",
    sections: [
      {
        heading: "Master Settings",
        body: null,
        list: [
          "School Exam Boards — create CBSE / ICSE / State boards and assign to schools.",
          "Academic Calendar — define term dates, holidays, and working days.",
          "Grade Boundaries — configure A+, A, B, C, D, F percentage thresholds.",
          "Attendance Policy — daily cut-off time, minimum attendance percentage for eligibility.",
          "Notification Settings — SMS / email triggers for fee overdue, low attendance, results.",
        ],
      },
      {
        heading: "Module Toggles",
        body: "Certain features (Payroll, Library, Hostel, Transport) can be enabled or disabled per school. Disabled modules hide the sidebar item and block API access for that school.",
      },
    ],
    tips: [
      "Grade boundary changes are prospective only — historical results are not recalculated.",
      "Always test notification templates in staging before enabling for production schools.",
    ],
  },
  {
    id: "api",
    group: "Developer",
    icon: <ApiOutlined />,
    color: "var(--primary)",
    title: "API Reference",
    subtitle: "REST API endpoints and authentication guide",
    badge: "Dev",
    overview:
      "EduOS exposes a REST API at /api/v1. All endpoints require a Bearer JWT token obtained from /api/auth/login. Tokens expire in 7 days by default.",
    sections: [
      {
        heading: "Authentication",
        body: null,
        code: [
          "POST   /api/auth/login          — email + password → JWT",
          "POST   /api/auth/logout         — invalidate token",
          "GET    /api/auth/current-user   — returns logged-in user profile",
        ],
      },
      {
        heading: "School & User Endpoints",
        body: null,
        code: [
          "GET    /api/school              — list all schools (Super Admin)",
          "POST   /api/school/create       — create school",
          "POST   /api/school/update/:id   — update school details",
          "DELETE /api/school/delete/:id   — delete school",
          "GET    /api/user/all            — list users (filtered by role param)",
          "POST   /api/user/register       — create user",
          "PUT    /api/user/active/:id     — activate user",
          "DELETE /api/user/delete/:id     — deactivate user",
        ],
      },
      {
        heading: "Academic Endpoints",
        body: null,
        code: [
          "GET    /api/class               — list classes",
          "POST   /api/class/create        — create class",
          "GET    /api/section             — list sections",
          "POST   /api/section/create      — create section",
          "GET    /api/subject             — list subjects",
          "GET    /api/academic-year/active/:schoolId — active year for school",
        ],
      },
      {
        heading: "Operations Endpoints",
        body: null,
        code: [
          "POST   /api/attendance          — submit attendance",
          "GET    /api/attendance/report   — attendance report",
          "GET    /api/fee/structure       — list fee structures",
          "POST   /api/fee/collect         — record fee payment",
          "GET    /api/payroll/run         — list monthly runs",
          "POST   /api/payroll/generate    — generate monthly cycle",
        ],
      },
    ],
    tips: [
      "Include Authorization: Bearer <token> header on every request.",
      "Rate limit: 200 requests/minute per IP. Exceeding returns HTTP 429.",
      "All timestamps are in ISO 8601 UTC format.",
    ],
  },
];

/* ─── Group order ─── */
const GROUP_ORDER = ["Overview", "Administration", "Academic", "Operations", "HR & Finance", "Analytics", "Configuration", "Developer"];

/* ─── Step block ─── */
const StepBlock = ({ steps }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
    {steps.map((step, i) => (
      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          ...iconWell("var(--primary)", 26),
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 800,
          flexShrink: 0,
          marginTop: 1,
        }}>
          {i + 1}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6, paddingTop: 2 }}>
          {step}
        </div>
      </div>
    ))}
  </div>
);

/* ─── Code block ─── */
const CodeBlock = ({ lines }) => (
  <div style={{
    background: "var(--surface-soft)",
    border: "1px solid var(--border-muted)",
    borderRadius: 10,
    padding: "14px 18px",
    marginTop: 10,
    overflowX: "auto",
  }}>
    {lines.map((line, i) => (
      <div key={i} style={{ fontFamily: "monospace", fontSize: 12.5, color: "var(--text-primary)", lineHeight: 2, whiteSpace: "nowrap" }}>
        <span style={{ color: "var(--primary)", fontWeight: 700 }}>{line.split("   ")[0]}</span>
        <span style={{ color: "var(--text-muted)" }}>{"   " + line.split("   ").slice(1).join("   ")}</span>
      </div>
    ))}
  </div>
);

/* ─── Main component ─── */
const Documentation = () => {
  const [activeId, setActiveId] = useState("intro");
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return SECTIONS;
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(kw) ||
        s.subtitle.toLowerCase().includes(kw) ||
        s.overview.toLowerCase().includes(kw)
    );
  }, [search]);

  const activeSection = SECTIONS.find((s) => s.id === activeId) || SECTIONS[0];

  /* Group the filtered sections for sidebar */
  const grouped = useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach((g) => { map[g] = []; });
    filteredSections.forEach((s) => {
      if (map[s.group]) map[s.group].push(s);
    });
    return map;
  }, [filteredSections]);

  return (
    <div style={{ ...pageWrapper, padding: 0 }}>
      <PageHeader
        title="Documentation"
        subtitle="Complete guide to EduOS School Management Platform"
        icon={<FileProtectOutlined />}
        extra={
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search docs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
        }
      />

      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 252,
          flexShrink: 0,
          borderRight: "1px solid var(--border-muted)",
          background: "var(--surface)",
          padding: "16px 0",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          maxHeight: "calc(100vh - 80px)",
        }}>
          {GROUP_ORDER.map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: 4 }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "10px 18px 6px",
                }}>
                  {group}
                </div>
                {items.map((s) => {
                  const isActive = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 18px",
                        border: "none",
                        background: isActive ? `color-mix(in srgb, ${s.color} 7%, transparent)` : "transparent",
                        borderRight: isActive ? `3px solid ${s.color}` : "3px solid transparent",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-soft)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{
                        color: isActive ? s.color : "var(--text-muted)",
                        fontSize: 15,
                        flexShrink: 0,
                        transition: "color 0.15s",
                      }}>
                        {s.icon}
                      </span>
                      <span style={{
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? s.color : "var(--text-primary)",
                        transition: "color 0.15s",
                      }}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No docs match your search
            </div>
          )}
        </div>

        {/* ── Content area ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px",
          background: "var(--surface-page)",
          maxWidth: "860px",
        }}>

          {/* Section hero */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div style={iconWell(activeSection.color, 52)}>
              {activeSection.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  {activeSection.title}
                </h1>
                <Tag color={activeSection.color} style={{ fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  {activeSection.badge}
                </Tag>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {activeSection.subtitle}
              </p>
            </div>
          </div>

          {/* Overview */}
          <div style={{
            ...sectionPanel,
            background: `color-mix(in srgb, ${activeSection.color} 3%, transparent)`,
            border: `1px solid color-mix(in srgb, ${activeSection.color} 13%, transparent)`,
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <InfoCircleOutlined style={{ color: activeSection.color, fontSize: 15, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.7 }}>
                {activeSection.overview}
              </p>
            </div>
          </div>

          {/* Sections */}
          {activeSection.sections?.map((sec, si) => (
            <div key={si} style={{ ...sectionPanel, marginBottom: 16 }}>
              <h3 style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <RightOutlined style={{ color: activeSection.color, fontSize: 11 }} />
                {sec.heading}
              </h3>

              {sec.body && (
                <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {sec.body}
                </p>
              )}

              {sec.steps && <StepBlock steps={sec.steps} />}

              {sec.list && (
                <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                  {sec.list.map((item, i) => (
                    <li key={i} style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {sec.code && <CodeBlock lines={sec.code} />}
            </div>
          ))}

          {/* Checklist */}
          {activeSection.checklist?.length > 0 && (
            <div style={{ ...sectionPanel, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                ✅ Checklist
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeSection.checklist.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 14, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {activeSection.tips?.length > 0 && (
            <div style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <BulbOutlined style={{ color: "var(--warning-hover)", fontSize: 15 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--warning-hover)" }}>Tips</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {activeSection.tips.map((tip, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--warning-hover)", lineHeight: 1.6 }}>
                    • {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer navigation */}
          <Divider style={{ margin: "28px 0 20px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              EduOS Documentation · Last updated July 2025
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeId);
                const prev = SECTIONS[idx - 1];
                const next = SECTIONS[idx + 1];
                return (
                  <>
                    {prev && (
                      <button
                        onClick={() => setActiveId(prev.id)}
                        style={{
                          ...pill("var(--primary)", "var(--surface-soft)"),
                          cursor: "pointer",
                          border: "1px solid var(--border-muted)",
                          padding: "6px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ← {prev.title}
                      </button>
                    )}
                    {next && (
                      <button
                        onClick={() => setActiveId(next.id)}
                        style={{
                          ...pill("var(--primary)", `color-mix(in srgb, ${activeSection.color} 6%, transparent)`),
                          cursor: "pointer",
                          border: `1px solid color-mix(in srgb, ${activeSection.color} 19%, transparent)`,
                          padding: "6px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {next.title} →
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;

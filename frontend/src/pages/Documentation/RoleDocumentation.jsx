import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Input, Tag, Divider } from "antd";
import {
  SearchOutlined, RightOutlined, BulbOutlined,
  CheckCircleOutlined, InfoCircleOutlined, FileProtectOutlined,
  RocketOutlined, SettingOutlined, UserOutlined, CalendarOutlined,
  BookOutlined, BarChartOutlined, MessageOutlined, TeamOutlined,
  DollarOutlined, CarOutlined, SafetyCertificateOutlined, BankOutlined,
  FileTextOutlined, CheckSquareOutlined, ApartmentOutlined,
  ReadOutlined, MedicineBoxOutlined, WifiOutlined, CrownOutlined,
  IdcardOutlined, HeartOutlined, LaptopOutlined,
  PhoneOutlined, SolutionOutlined, StarOutlined, ExperimentOutlined,
} from "@ant-design/icons";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, iconWell, pill, sectionPanel } from "../../styles/pageStyles";

/* ─── Shared sub-components ─────────────────────────────────── */
const StepBlock = ({ steps }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
    {steps.map((step, i) => (
      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ ...iconWell("#2563EB", 26), borderRadius: 8, fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
          {i + 1}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
      </div>
    ))}
  </div>
);

const BulletList = ({ items }) => (
  <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>{item}</li>
    ))}
  </ul>
);

/* ─── Role documentation data ───────────────────────────────── */
const SCHOOL_ADMIN_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Dashboard Overview", subtitle: "Your school management control centre",
    badge: "Start Here",
    overview: "As a School Admin / Principal, your dashboard gives you a real-time summary of your school — active students, staff, attendance today, upcoming exams, fee collection status, and quick-action buttons.",
    sections: [
      { heading: "What you can manage", body: null, list: [
        "Users — teachers, students, parents, accountants, and support staff.",
        "Academic structure — classes, sections, subjects, timetables.",
        "Attendance — daily student & staff attendance with reports.",
        "Exams & Results — schedule exams, enter marks, generate report cards.",
        "Fees — structure, collection, receipts, defaulter tracking.",
        "Payroll — salary structures, monthly runs, payslips.",
        "Communication — send SMS/email notifications to parents and staff.",
        "Events & Calendar — school events, holidays, term dates.",
        "Reports — attendance, finance, academic performance.",
      ]},
    ],
    tips: ["Pin frequently visited pages to your browser bookmarks for faster access.", "Check the dashboard daily for attendance alerts and fee overdue notifications."],
  },
  {
    id: "users", group: "Administration", icon: <TeamOutlined />, color: "#059669",
    title: "User Management", subtitle: "Add and manage all school staff and students",
    badge: "Users",
    overview: "Manage all users in your school from one place. You can register new teachers, students, parents, and support staff, and activate or deactivate accounts.",
    sections: [
      { heading: "Adding a Teacher", body: null, steps: [
        "Go to User Management → Teachers and click Register Teacher.",
        "Fill in name, email, phone, and subject specialisations.",
        "The teacher receives login credentials via email.",
        "Assign the teacher to a class/subject from Academic → Class Teacher Assignments.",
      ]},
      { heading: "Enrolling a Student", body: null, steps: [
        "Go to User Management → Students → Add Student.",
        "Fill in student details and select their class and section.",
        "Link a parent account — create one if it doesn't exist.",
        "Assign fees from Finance → Fee Collection → Assign to Student.",
      ]},
    ],
    tips: ["Deactivating a user blocks login immediately without deleting records.", "Use bulk import (CSV) for enrolling large batches of students at term start."],
  },
  {
    id: "attendance", group: "Operations", icon: <CheckSquareOutlined />, color: "#D97706",
    title: "Attendance Management", subtitle: "Monitor daily attendance across the school",
    badge: "Daily Ops",
    overview: "View and manage student and staff attendance. School Admins can see attendance across all classes, correct submitted records, and generate compliance reports.",
    sections: [
      { heading: "Monitoring Today's Attendance", body: null, steps: [
        "Go to Attendance → Dashboard. Overview cards show present/absent/late counts by class.",
        "Click any class card to drill down into individual student status.",
        "For corrections, go to Attendance → All Students and edit within the allowed time window.",
      ]},
      { heading: "Attendance Reports", body: null, list: [
        "Monthly Report — per-student attendance % for the month.",
        "Analytics — heatmap and trend charts by class.",
        "Low Attendance List — students below the threshold defined in Settings.",
        "Staff Attendance — teacher and support staff punch-in/out summary.",
      ]},
    ],
    tips: ["Set the attendance edit cut-off in Settings → Attendance Policy.", "Monthly reports are auto-archived at month end for record keeping."],
  },
  {
    id: "exams", group: "Operations", icon: <FileTextOutlined />, color: "#7C3AED",
    title: "Exams & Results", subtitle: "Schedule exams, enter marks, issue report cards",
    badge: "Exams",
    overview: "The exam module lets you create exam schedules, assign subjects and invigilators, collect marks from teachers, and generate rank lists and report cards.",
    sections: [
      { heading: "Creating an Exam", body: null, steps: [
        "Go to Exams → Exam Schedule → Create Exam.",
        "Enter exam name, type (unit test, mid-term, final), and date range.",
        "Add subjects with max marks and pass marks for each.",
        "Publish the timetable — teachers and students can now view it.",
      ]},
      { heading: "Generating Results", body: null, steps: [
        "Once all teachers have entered marks, go to Exams → Results.",
        "Select the exam and class, then Generate Rank List.",
        "Download/print individual Report Cards as PDF.",
        "Parents and students can view results from their portal.",
      ]},
    ],
    checklist: [
      "All subject marks must be submitted before generating the final rank list.",
      "Verify pass marks configuration before publishing results to students.",
      "Archive the result set before starting the next exam cycle.",
    ],
    tips: ["Exam Coordinator role can manage exams independently if set up."],
  },
  {
    id: "fees", group: "Finance", icon: <DollarOutlined />, color: "#DC2626",
    title: "Fee Management", subtitle: "Structure, collect, and track school fees",
    badge: "Finance",
    overview: "Configure fee structures per class, track collections, generate receipts, and monitor defaulters. Accountants handle day-to-day collection; you set the structures.",
    sections: [
      { heading: "Setting Up Fee Structure", body: null, steps: [
        "Go to Finance → Fee Structure → Create Structure.",
        "Add fee heads: Tuition, Transport, Lab, Library, Activity — with amounts and due dates.",
        "Assign the structure to classes. All enrolled students inherit it automatically.",
      ]},
      { heading: "Viewing Collection Status", body: null, list: [
        "Finance → Fee Collection — see pending vs. collected per student.",
        "Defaulters Report — students with overdue fees highlighted in red.",
        "Daily Collection Summary — total collected today, this month.",
        "Receipt Ledger — every payment recorded with receipt number.",
      ]},
    ],
    tips: ["Partial payments are supported — remaining balance auto-carries forward.", "Send fee reminder SMS from Communication → Send Notifications → Fee Reminders."],
  },
  {
    id: "reports", group: "Analytics", icon: <BarChartOutlined />, color: "#0891B2",
    title: "Reports & Analytics", subtitle: "School performance at a glance",
    badge: "Analytics",
    overview: "Access comprehensive reports on attendance trends, exam performance, fee collection, and staff metrics. All reports support export to PDF and CSV.",
    sections: [
      { heading: "Available Reports", body: null, list: [
        "Attendance Summary — daily, monthly, per-class and per-student.",
        "Academic Performance — class averages, subject-wise scores, rank distribution.",
        "Fee Collection Report — collected vs. pending, category breakdown.",
        "Staff Summary — attendance, leave balance, payroll cost.",
        "Event Calendar Report — upcoming events, holidays, exam dates.",
      ]},
    ],
    tips: ["All date-range reports default to the active academic year.", "Export as CSV for use in Excel for custom analysis."],
  },
];

const TEACHER_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Dashboard Overview", subtitle: "Your teaching workspace at a glance",
    badge: "Start Here",
    overview: "Your Teacher dashboard shows today's class schedule, pending attendance, upcoming exams, and recent student activity across your assigned classes and subjects.",
    sections: [
      { heading: "Quick Actions", body: null, list: [
        "Mark Attendance — available for your classes for today only.",
        "Enter Marks — accessible after an exam is published by the Exam Coordinator.",
        "View Timetable — your weekly teaching schedule.",
        "My Classes — full list of classes and subjects assigned to you.",
        "Leave Request — apply for leave via Attendance → Leave Requests.",
      ]},
    ],
    tips: ["Attendance must be marked before the school's daily cut-off time.", "Your dashboard reloads data automatically — no need to refresh manually."],
  },
  {
    id: "classes", group: "Teaching", icon: <ApartmentOutlined />, color: "#7C3AED",
    title: "My Assigned Classes", subtitle: "Manage your classes, subjects and students",
    badge: "Teaching",
    overview: "All classes and subjects assigned to you appear in My Classes. You can view student lists, take attendance, and access each class's timetable from here.",
    sections: [
      { heading: "Viewing a Class", body: null, steps: [
        "Go to My Classes. Each card shows the class name, sections, and number of students.",
        "Click View Class to see the full student roster, subjects, and recent attendance.",
        "Click Take Attendance to mark today's attendance for that class.",
      ]},
      { heading: "Class Teacher Duties", body: "If you are a Class Teacher, you also have access to your class's full dashboard — manage student records, communicate with parents, and generate class-level attendance reports.", },
    ],
    tips: ["Use the search bar on the My Classes page to filter by class name or subject."],
  },
  {
    id: "attendance", group: "Teaching", icon: <CheckSquareOutlined />, color: "#059669",
    title: "Marking Attendance", subtitle: "Daily student attendance workflow",
    badge: "Daily Ops",
    overview: "Mark attendance for your assigned classes each day. The system records Present, Absent, Late, and Half-Day status for each student.",
    sections: [
      { heading: "How to Mark Attendance", body: null, steps: [
        "Go to Attendance → Student Attendance.",
        "Select your class from the dropdown — enrolled students load automatically.",
        "For each student, tap P (Present), A (Absent), L (Late), or HD (Half Day).",
        "Click Submit. Records are locked for editing after the school's cut-off time.",
        "If you need to correct an error, contact your School Admin before the cut-off.",
      ]},
      { heading: "My Own Attendance", body: "You can view your own attendance history at Attendance → My Attendance. Your GPS check-in/check-out is recorded automatically when you use the mobile app on school premises.", },
    ],
    tips: ["Attendance cannot be submitted for a future date.", "Once submitted, changes require School Admin approval."],
  },
  {
    id: "marks", group: "Teaching", icon: <FileTextOutlined />, color: "#B45309",
    title: "Entering Marks", subtitle: "Submit exam scores for your subjects",
    badge: "Exams",
    overview: "After an exam is published, you can enter marks for the subjects assigned to you. Marks entry is open until the Exam Coordinator closes the window.",
    sections: [
      { heading: "Marks Entry Steps", body: null, steps: [
        "Go to Exams → Marks Entry.",
        "Select the exam and your subject from the dropdowns.",
        "Enter marks for each student. The system validates against maximum marks.",
        "Save draft at any time — marks are not final until you click Submit.",
        "Submitted marks are locked; contact the Exam Coordinator for corrections.",
      ]},
    ],
    checklist: [
      "Check maximum marks limit before entering — values cannot exceed it.",
      "Submit before the marks entry deadline set by the Exam Coordinator.",
      "Absent students should have '0' or 'AB' entered, not left blank.",
    ],
    tips: ["You can only enter marks for subjects assigned to you.", "Drafts are auto-saved every 30 seconds."],
  },
  {
    id: "reports", group: "Analytics", icon: <BarChartOutlined />, color: "#0891B2",
    title: "Reports", subtitle: "Your attendance and class performance reports",
    badge: "Reports",
    overview: "Access your generated reports from the Reports section. You can view attendance summaries, subject performance data, and download class-level analytics.",
    sections: [
      { heading: "Available Reports", body: null, list: [
        "Attendance Report — daily/monthly summary for your classes.",
        "Marks Report — subject-wise performance analysis.",
        "Student Progress — individual student trend across exams.",
        "My Payslips — download monthly salary slips from Payroll → Payslips.",
      ]},
    ],
    tips: ["Reports are scoped to your assigned classes and subjects only.", "Contact School Admin for reports beyond your scope."],
  },
];

const ACCOUNTANT_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Dashboard Overview", subtitle: "Your financial operations hub",
    badge: "Start Here",
    overview: "As Accountant, your dashboard shows today's fee collection, pending dues, payroll cycle status, and quick links to receipts and expense reports.",
    sections: [
      { heading: "Your Main Responsibilities", body: null, list: [
        "Fee Collection — collect, record, and receipt student fees.",
        "Fee Structure — view structures set by the School Admin.",
        "Payroll — run monthly salary cycles, lock, and mark as paid.",
        "Payslips — generate and distribute employee payslips.",
        "Financial Reports — monthly collection summaries, salary registers.",
        "Salary Advance — manage advance requests from employees.",
        "Reimbursements — process expense reimbursement claims.",
      ]},
    ],
    tips: ["Reconcile fee collection daily before closing accounts.", "Keep payslip archives for a minimum of 3 years for audit compliance."],
  },
  {
    id: "fees", group: "Finance", icon: <DollarOutlined />, color: "#DC2626",
    title: "Fee Collection", subtitle: "Collect, receipt, and track student fees",
    badge: "Finance",
    overview: "Day-to-day fee collection is your core responsibility. Every payment must be recorded and receipted immediately.",
    sections: [
      { heading: "Collecting a Fee Payment", body: null, steps: [
        "Go to Finance → Fee Collection.",
        "Search for the student by name, roll number, or admission number.",
        "View their pending fee installments. Select the installment(s) to collect.",
        "Enter payment amount, mode (Cash/Cheque/Online/UPI), and transaction reference.",
        "Click Collect & Generate Receipt. Print or share the PDF receipt with the parent.",
      ]},
      { heading: "Tracking Defaulters", body: null, list: [
        "Finance → Defaulters Report — students with overdue fees.",
        "Filter by class, section, or fee head.",
        "Use Send Reminder to trigger an SMS/email to the parent.",
        "Escalate persistent defaulters to the School Admin.",
      ]},
    ],
    checklist: [
      "Every payment must have a payment mode and reference number before saving.",
      "Print receipts for all cash payments immediately.",
      "Reconcile collected amount with the bank deposit daily.",
    ],
    tips: ["Partial payments are allowed — remaining balance auto-carries forward.", "For fee waivers, get written approval from the School Admin before applying."],
  },
  {
    id: "payroll", group: "Payroll", icon: <SolutionOutlined />, color: "#7C3AED",
    title: "Payroll Operations", subtitle: "Monthly salary cycle management",
    badge: "Payroll",
    overview: "Payroll runs monthly. You set up salary structures, generate the monthly cycle, verify, lock, mark as paid, and issue payslips.",
    sections: [
      { heading: "Monthly Payroll Workflow", body: null, steps: [
        "Go to Payroll → Salary Structures. Ensure all employee earnings (Basic, HRA, allowances) and deductions (PF, TDS, advance) are correctly configured.",
        "Go to Payroll → Monthly Run. Select the month and click Generate Cycle.",
        "Review every entry: gross pay, deductions, and net pay. Fix mismatches in the salary structure and refresh.",
        "Once verified, click Lock Cycle. Locked cycles cannot be edited.",
        "Go to Payroll → Mark as Paid. Enter payment mode (bank transfer/cash) and reference for each employee.",
        "Generate and distribute payslips from Payroll → Payslips.",
        "Download the Monthly Salary Report from Payroll → Monthly Reports for records.",
      ]},
    ],
    checklist: [
      "Update salary structures for any increments or changes before generating the cycle.",
      "Never lock a cycle without a second verification of net pay totals.",
      "Archive payslip PDFs and monthly reports for audit — minimum 3 years.",
      "Cross-check bank transfer totals with the generated payroll register.",
    ],
    tips: ["The re-run process creates a correction entry preserving the original audit trail.", "Use the Salary Advance module to track and deduct advances automatically."],
  },
  {
    id: "reports", group: "Analytics", icon: <BarChartOutlined />, color: "#059669",
    title: "Financial Reports", subtitle: "Collection summaries, expense analysis, and salary registers",
    badge: "Reports",
    overview: "Generate and export detailed financial reports for internal records and audit purposes.",
    sections: [
      { heading: "Available Reports", body: null, list: [
        "Fee Collection Summary — collected vs. pending by class, month, or fee head.",
        "Defaulters List — overdue fee details with contact information.",
        "Salary Register — all employee net pay for a month (printable).",
        "Monthly Payroll Report — department-wise salary expense breakdown.",
        "Reimbursement Report — approved and settled expense claims.",
        "Advance Register — salary advances issued and recovered.",
      ]},
    ],
    tips: ["Export to CSV for use in Tally or Excel for reconciliation.", "All reports default to the current financial year."],
  },
];

const LIBRARIAN_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Library Dashboard", subtitle: "Your library management workspace",
    badge: "Start Here",
    overview: "As Librarian, you manage the school's book catalog, issue and return books, track overdue items, and generate library reports.",
    sections: [
      { heading: "Core Features", body: null, list: [
        "Books — add, edit, and categorise the book catalog.",
        "Issue Book — issue books to students or staff members.",
        "Return & Fine — record returns and apply fines for overdue books.",
        "Library Card — view and print student library cards.",
        "Reports — overdue books, popular titles, issue history.",
      ]},
    ],
    tips: ["Add ISBN, author, and publisher when cataloguing books for better searchability."],
  },
  {
    id: "books", group: "Catalog", icon: <BookOutlined />, color: "#7C3AED",
    title: "Book Catalog", subtitle: "Add and manage library books",
    badge: "Catalog",
    overview: "Maintain a complete catalog of all books in the library. Each book entry includes title, author, ISBN, category, quantity, and shelf location.",
    sections: [
      { heading: "Adding a Book", body: null, steps: [
        "Go to Library → Books → Add Book.",
        "Enter title, author, publisher, ISBN, edition, year, category, and quantity.",
        "Specify shelf/rack location for physical retrieval.",
        "Save — the book is now available for issue.",
      ]},
      { heading: "Book Categories", body: "Organise books by category (Fiction, Science, History, Reference, etc.) to help students find books quickly. Use the search and filter on the Books page to locate any title instantly.", },
    ],
    tips: ["Mark Reference books as non-issuable so they stay in the library.", "Duplicate ISBN entries are blocked automatically."],
  },
  {
    id: "issue-return", group: "Operations", icon: <CheckSquareOutlined />, color: "#059669",
    title: "Issue & Return", subtitle: "Track book borrowing and returns",
    badge: "Daily Ops",
    overview: "Issue books to students and staff, track due dates, and process returns with any applicable fines.",
    sections: [
      { heading: "Issuing a Book", body: null, steps: [
        "Go to Library → Issue Book.",
        "Search for the member (student/staff) by name or ID.",
        "Search for the book by title or ISBN.",
        "Set the return due date (default is configurable in Settings).",
        "Click Issue. A record is created and the available quantity decreases.",
      ]},
      { heading: "Processing a Return", body: null, steps: [
        "Go to Library → Return Book.",
        "Search for the issued record by member name or book title.",
        "Verify the book condition. If damaged, note it in the remarks.",
        "If overdue, the system calculates the fine automatically.",
        "Collect the fine (if any) and click Return. The quantity is restored.",
      ]},
    ],
    checklist: [
      "Verify the book is the same copy issued (check edition and ISBN).",
      "Record damaged book condition before returning to catalog.",
      "Collect overdue fines before completing the return transaction.",
    ],
    tips: ["Members with unpaid fines cannot borrow new books (configurable policy).", "Send overdue reminders from the Overdue Books report page."],
  },
];

const HOSTEL_WARDEN_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Hostel Dashboard", subtitle: "Your hostel management workspace",
    badge: "Start Here",
    overview: "As Hostel Warden, you manage hostel room allocations, student attendance, visitor logs, leave requests, complaints, and hostel reports.",
    sections: [
      { heading: "Core Features", body: null, list: [
        "Room Allocation — assign students to hostel rooms.",
        "Hostel Attendance — daily check-in/check-out for hostel students.",
        "Leave Management — approve/reject student leave requests.",
        "Visitor Log — record visitor entries and exits.",
        "Complaint Management — track and resolve student complaints.",
        "Hostel Reports — occupancy, attendance, and incident reports.",
      ]},
    ],
    tips: ["Update room allocations at the start of each term.", "All visitor entries must be logged with ID proof for security."],
  },
  {
    id: "rooms", group: "Operations", icon: <BankOutlined />, color: "#0891B2",
    title: "Room Management", subtitle: "Allocate and manage hostel rooms",
    badge: "Rooms",
    overview: "Manage hostel rooms, bed allocations, and student assignments. Track occupancy levels per floor and room.",
    sections: [
      { heading: "Allocating a Room", body: null, steps: [
        "Go to Hostel → Room Allocation.",
        "Select the hostel block, floor, and room.",
        "Search for the student by name or admission number.",
        "Assign a bed number and set the allocation date.",
        "Save — the student's hostel details are updated on their profile.",
      ]},
    ],
    tips: ["Mark rooms as 'Under Maintenance' to prevent allocation during repairs.", "Vacate rooms when students leave at term end to keep occupancy data accurate."],
  },
  {
    id: "attendance", group: "Operations", icon: <CheckSquareOutlined />, color: "#059669",
    title: "Hostel Attendance", subtitle: "Daily student check-in and check-out",
    badge: "Daily Ops",
    overview: "Take morning and evening attendance for hostel students. Track who is on campus and who is on approved leave.",
    sections: [
      { heading: "Taking Attendance", body: null, steps: [
        "Go to Hostel → Hostel Attendance.",
        "Select the hostel block and date.",
        "Mark each student as Present, Absent, or On Leave.",
        "Students on approved leave are pre-marked automatically.",
        "Submit — records are locked at the end of the day.",
      ]},
    ],
    tips: ["Coordinate with class attendance for students who are absent from both hostel and class.", "Night attendance (post-lights-out) can be marked separately if enabled."],
  },
  {
    id: "leave", group: "Operations", icon: <CalendarOutlined />, color: "#D97706",
    title: "Leave & Visitor Management", subtitle: "Approve leaves and log visitors",
    badge: "Leave",
    overview: "Process student leave requests and maintain a visitor log for campus security and parent coordination.",
    sections: [
      { heading: "Approving Leave", body: null, steps: [
        "Go to Hostel → Leave Management. Pending requests are listed.",
        "Review the request details: student, dates, reason, and parent approval.",
        "Approve or Reject with an optional note.",
        "Approved leaves automatically mark the student absent in hostel attendance.",
      ]},
      { heading: "Logging Visitors", body: null, steps: [
        "Go to Hostel → Visitor Log → Add Visitor.",
        "Record visitor name, relation to student, ID type and number, purpose, and check-in time.",
        "On exit, update the check-out time.",
        "Visitor log is searchable and exportable for security review.",
      ]},
    ],
    tips: ["Weekend/holiday leaves require parent consent before approval.", "Visitor log entries older than 90 days are auto-archived."],
  },
];

const TRANSPORT_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Transport Dashboard", subtitle: "Your transport operations workspace",
    badge: "Start Here",
    overview: "As Transport Manager, you manage school vehicles, routes, driver assignments, student transport allocations, and fuel/maintenance records.",
    sections: [
      { heading: "Core Features", body: null, list: [
        "Vehicles — add and maintain the school's fleet.",
        "Routes — define pickup/drop routes with stops and timings.",
        "Assignments — assign students to routes and vehicles.",
        "Drivers — manage driver accounts and vehicle assignments.",
        "Fuel & Maintenance — track fuel consumption and service records.",
      ]},
    ],
    tips: ["Update vehicle fitness/insurance expiry dates to receive renewal alerts.", "GPS tracking data is visible on the Transport Map page (if enabled)."],
  },
  {
    id: "vehicles", group: "Fleet", icon: <CarOutlined />, color: "#0891B2",
    title: "Vehicle Management", subtitle: "Fleet registration and maintenance",
    badge: "Fleet",
    overview: "Maintain records of all school vehicles — registration, capacity, insurance, fitness, and assigned driver.",
    sections: [
      { heading: "Adding a Vehicle", body: null, steps: [
        "Go to Transport → Vehicles → Add Vehicle.",
        "Enter registration number, vehicle type, capacity, insurance expiry, and fitness expiry.",
        "Assign a driver from the Drivers list.",
        "Save — the vehicle is now available for route assignment.",
      ]},
    ],
    checklist: [
      "Insurance and fitness certificates must be valid before the vehicle operates.",
      "Record every service and repair in the Maintenance Log.",
      "Fuel entries should be made at every refuelling stop.",
    ],
    tips: ["Set expiry alerts 30 days before insurance/fitness renewal due dates."],
  },
  {
    id: "routes", group: "Operations", icon: <ApartmentOutlined />, color: "#7C3AED",
    title: "Routes & Assignments", subtitle: "Define routes and assign students",
    badge: "Routes",
    overview: "Create transport routes with stops, assign vehicles, and allocate students to routes. Students and parents can view route details from their portal.",
    sections: [
      { heading: "Creating a Route", body: null, steps: [
        "Go to Transport → Routes → Add Route.",
        "Enter route name, start point, end point, and intermediate stops with timings.",
        "Assign a vehicle and driver to the route.",
        "Save and publish — the route is now bookable for students.",
      ]},
      { heading: "Assigning Students", body: null, steps: [
        "Go to Transport → Assignments.",
        "Search for a student and select their route and pickup stop.",
        "Save — the student's transport fee is auto-linked if configured.",
      ]},
    ],
    tips: ["Routes can be temporarily suspended (bad weather, holidays) without deleting the route.", "Student transport fee is separate from the tuition fee structure."],
  },
];

const EXAM_COORDINATOR_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Exam Coordinator Hub", subtitle: "Manage all exam operations",
    badge: "Start Here",
    overview: "As Exam Coordinator, you own the full exam lifecycle — scheduling, seating plans, admit cards, marks collection, rank lists, and result publishing.",
    sections: [
      { heading: "Your Responsibilities", body: null, list: [
        "Create and publish exam schedules.",
        "Generate seating plans and admit cards.",
        "Open/close marks entry windows for teachers.",
        "Verify and finalise submitted marks.",
        "Generate rank lists and report cards.",
        "Manage re-correction requests and result corrections.",
        "Produce exam analytics and performance reports.",
      ]},
    ],
    tips: ["Coordinate with class teachers before opening marks entry — data quality is critical.", "Lock marks entry as soon as all teachers have submitted to prevent changes."],
  },
  {
    id: "schedule", group: "Planning", icon: <CalendarOutlined />, color: "#D97706",
    title: "Exam Schedule", subtitle: "Create and publish exam timetables",
    badge: "Planning",
    overview: "Build exam schedules that students, parents, and teachers can view. Define dates, subjects, timings, and halls per exam.",
    sections: [
      { heading: "Creating an Exam Schedule", body: null, steps: [
        "Go to Exams → Exam Schedule → Create Exam.",
        "Set exam name, type (unit test / mid-term / final), class, and date range.",
        "Add subjects one by one with date, start time, duration, and max/pass marks.",
        "Click Publish — the timetable becomes visible to all users.",
      ]},
    ],
    checklist: [
      "Verify no subject conflicts on the same date for the same class.",
      "Confirm max marks match the grade boundary configuration in Settings.",
      "Share the timetable with invigilators at least 7 days before the exam.",
    ],
    tips: ["Admit cards can be bulk-generated and printed after the schedule is published.", "Seating plans can be auto-generated based on class strength and hall capacity."],
  },
  {
    id: "results", group: "Results", icon: <FileTextOutlined />, color: "#7C3AED",
    title: "Marks & Results", subtitle: "Collect marks, generate rank lists and report cards",
    badge: "Results",
    overview: "Open the marks entry window for teachers after each exam, verify submissions, and then generate rank lists and downloadable report cards.",
    sections: [
      { heading: "Managing Marks Entry", body: null, steps: [
        "Go to Exams → Marks Entry → Open Entry. Select exam and class.",
        "Teachers now see the entry form for their subjects.",
        "Monitor submission status from Exams → Marks Entry → Status Board.",
        "Once all subjects are submitted, click Close Entry to lock marks.",
        "Go to Exams → Results → Generate Rank List for the class.",
        "Download individual Report Cards (PDF) or bulk-print for the class.",
      ]},
    ],
    checklist: [
      "All subjects must have marks submitted before generating the rank list.",
      "Run a sanity check — scan for unusually high or zero scores before locking.",
      "Publish results only after School Admin approval.",
    ],
    tips: ["Correction requests post-locking require School Admin authorisation.", "Analytics are generated automatically once results are published."],
  },
];

const SUBJECT_COORDINATOR_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Subject Coordinator Hub", subtitle: "Curriculum and subject management",
    badge: "Start Here",
    overview: "As Subject Coordinator, you manage curriculum structure — subjects, chapters, topics — and coordinate teacher assignments for your subject area across classes.",
    sections: [
      { heading: "Your Responsibilities", body: null, list: [
        "Subjects — create and maintain subject records.",
        "Chapters & Topics — build the curriculum hierarchy.",
        "Teacher Assignments — verify which teachers are assigned to your subjects.",
        "Exam Scope — define chapter-wise exam question weightings.",
        "Performance — track subject-wise performance across classes and teachers.",
      ]},
    ],
    tips: ["Keep the chapter/topic list updated before each exam cycle.", "Co-ordinate with teachers to ensure curriculum coverage before exams."],
  },
  {
    id: "curriculum", group: "Curriculum", icon: <BookOutlined />, color: "#7C3AED",
    title: "Chapters & Topics", subtitle: "Build and maintain curriculum structure",
    badge: "Curriculum",
    overview: "The curriculum hierarchy is: Subject → Chapter → Topic. This structure is used for lesson planning, exam scoping, and performance analytics.",
    sections: [
      { heading: "Creating Chapters", body: null, steps: [
        "Go to Academics → Chapters & Topics.",
        "Select the subject and class.",
        "Click Add Chapter and enter chapter number, title, and description.",
        "Within a chapter, add Topics one by one with learning objectives.",
      ]},
    ],
    tips: ["Tag topics with difficulty level (Easy/Medium/Hard) for balanced exam paper generation.", "Mark completed chapters/topics from the teacher's progress view."],
  },
];

const RECEPTIONIST_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Receptionist Workspace", subtitle: "Front-desk operations guide",
    badge: "Start Here",
    overview: "As Receptionist, you handle visitor management, admission inquiries, phone calls, parcel tracking, and front-desk communications.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "Visitor Log — register and track all campus visitors.",
        "Admission Inquiries — log incoming admission requests.",
        "Communication — send messages and notifications.",
        "Announcements — post campus notices.",
        "Profile — manage your own account and attendance.",
      ]},
    ],
    tips: ["All visitors must sign in with a valid ID before entering campus.", "Log admission inquiries in real-time to avoid losing leads."],
  },
  {
    id: "visitors", group: "Operations", icon: <UserOutlined />, color: "#059669",
    title: "Visitor Management", subtitle: "Log and track all campus visitors",
    badge: "Daily Ops",
    overview: "Every person entering the campus (other than staff and students) must be logged. The visitor log is searchable and printable for security audits.",
    sections: [
      { heading: "Logging a Visitor", body: null, steps: [
        "Go to Reception → Visitor Log → Add Visitor.",
        "Enter visitor name, purpose, person to meet, ID type and number.",
        "Issue a visitor badge / entry slip.",
        "Record check-in time.",
        "On exit, mark check-out time.",
      ]},
    ],
    tips: ["Visitors without appointment should be confirmed with the person they're meeting before entry.", "Group visits (e.g. field trip parents) can be logged as a single batch entry."],
  },
];

const IT_SUPPORT_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "IT Support Workspace", subtitle: "Technical support operations guide",
    badge: "Start Here",
    overview: "As IT Support, you handle internal technical issues, device management, network access, and system requests from staff.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "Support Tickets — receive and resolve internal IT requests.",
        "Device Management — track school-issued devices.",
        "Network Access — manage Wi-Fi and lab system access.",
        "Software Requests — approve/install required software.",
        "Profile & Attendance — manage your own account.",
      ]},
    ],
    tips: ["Escalate hardware issues that cannot be resolved in-house to your vendor within 24 hours.", "Document every resolved ticket with the solution for future reference."],
  },
  {
    id: "tickets", group: "Operations", icon: <SolutionOutlined />, color: "#7C3AED",
    title: "Support Ticket Management", subtitle: "Handle and resolve IT requests",
    badge: "Tickets",
    overview: "Internal users submit support tickets for IT issues. You receive, triage, assign, and resolve these tickets.",
    sections: [
      { heading: "Handling a Ticket", body: null, steps: [
        "Go to Support → Support Tickets. New tickets appear in the Pending queue.",
        "Open the ticket, review the issue description and priority.",
        "Update the status to In Progress and add your initial notes.",
        "Resolve the issue, document the solution in the ticket notes.",
        "Mark as Resolved. The requester is notified automatically.",
        "If out of scope, escalate by changing the assignee and adding a note.",
      ]},
    ],
    tips: ["High-priority tickets (P1/P2) should be acknowledged within 30 minutes.", "Use ticket comments to communicate with the requester without email."],
  },
];

const COUNSELOR_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Counselor Workspace", subtitle: "Student support and guidance operations",
    badge: "Start Here",
    overview: "As Counselor, you support student well-being, handle referrals, track counseling sessions, and coordinate with parents and teachers for student support plans.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "Student Referrals — receive and manage counseling referrals from teachers.",
        "Session Notes — record confidential counseling session notes.",
        "Parent Communication — coordinate with parents on student support plans.",
        "Reports — attendance alerts, academic performance flags.",
        "Resource Library — share mental health and wellness resources with students.",
      ]},
    ],
    tips: ["All session notes are confidential and visible only to you and the School Admin.", "Follow your school's safeguarding policy for disclosures during sessions."],
  },
  {
    id: "referrals", group: "Operations", icon: <TeamOutlined />, color: "#059669",
    title: "Student Referrals", subtitle: "Manage counseling referrals and sessions",
    badge: "Counseling",
    overview: "Teachers and parents can refer students for counseling. You receive, accept, schedule, and close referrals from your workspace.",
    sections: [
      { heading: "Handling a Referral", body: null, steps: [
        "Go to Counselor → Referrals. New referrals appear in Pending.",
        "Open the referral, review the concern and referring teacher's notes.",
        "Accept and schedule an initial session with the student.",
        "After the session, record notes (confidential) and update the referral status.",
        "If a parent meeting is needed, schedule it from the referral record.",
        "Close the referral when the support plan is complete.",
      ]},
    ],
    tips: ["Always document the session date, duration, and key points — even brief check-ins.", "Mandatory disclosures (safety concerns) must be escalated to School Admin immediately."],
  },
];

const SECURITY_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <SafetyCertificateOutlined />, color: "#DC2626",
    title: "Security Dashboard", subtitle: "Campus security operations guide",
    badge: "Start Here",
    overview: "As Security Officer, you manage campus access control, incident logging, visitor verification, and daily security reports.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "Entry Gate Log — record all entry and exit.",
        "Visitor Verification — verify and log visitor IDs.",
        "Incident Reports — log security incidents and escalate.",
        "Vehicle Log — record vehicle entry and exit.",
        "Emergency Procedures — access emergency contacts and protocols.",
      ]},
    ],
    tips: ["Any unverified person attempting campus entry must be denied and reported immediately.", "Incident reports should be filed within 2 hours of the event."],
  },
  {
    id: "access", group: "Operations", icon: <SafetyCertificateOutlined />, color: "#B45309",
    title: "Gate & Access Control", subtitle: "Manage campus entry and exit",
    badge: "Access",
    overview: "Every person entering or leaving campus must be logged. Use the gate log for staff, students (late arrivals), and visitors.",
    sections: [
      { heading: "Logging Entry/Exit", body: null, steps: [
        "Go to Security → Gate Log → Add Entry.",
        "Select type: Staff / Student / Visitor.",
        "For staff/students, search by name or ID card scan.",
        "For visitors, verify ID and record visitor details.",
        "Log the gate used and entry time.",
        "On exit, mark the corresponding record with exit time.",
      ]},
    ],
    tips: ["Students leaving early must have a written note from the School Admin or Parent.", "Vehicle entry must include number plate and driver ID."],
  },
];

const STUDENT_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Student Portal Guide", subtitle: "Your student dashboard explained",
    badge: "Start Here",
    overview: "Your student portal gives you access to your attendance, exam results, timetable, fee status, library account, and school announcements — all in one place.",
    sections: [
      { heading: "What you can do", body: null, list: [
        "View your daily timetable and class schedule.",
        "Check your attendance percentage and individual day status.",
        "See your exam marks, rank, and report card.",
        "View your fee payment status and download receipts.",
        "Access library books issued to you.",
        "Read school announcements and events.",
        "Update your profile and change your password.",
      ]},
    ],
    tips: ["Log in daily to stay updated on exam schedules and school notices.", "If you spot an error in your attendance or marks, inform your class teacher immediately."],
  },
  {
    id: "attendance", group: "Academics", icon: <CheckSquareOutlined />, color: "#059669",
    title: "My Attendance", subtitle: "Track your attendance record",
    badge: "Attendance",
    overview: "View your day-by-day attendance for the current academic year. Check your overall attendance percentage and identify which dates you were absent.",
    sections: [
      { heading: "Reading Your Attendance", body: null, list: [
        "Go to Attendance → My Attendance.",
        "The calendar view highlights Present (green), Absent (red), Late (amber), and Holiday (grey) days.",
        "The summary card shows your overall attendance % for the year.",
        "Hover over any date for details (status and remarks).",
        "If your attendance is below the minimum required %, a warning banner appears.",
      ]},
    ],
    tips: ["Minimum attendance is typically 75%. Contact your counselor if you're at risk.", "Medical leave with a valid certificate may be counted differently — check with your class teacher."],
  },
  {
    id: "results", group: "Academics", icon: <FileTextOutlined />, color: "#7C3AED",
    title: "Exam Results", subtitle: "View marks, rank, and report cards",
    badge: "Results",
    overview: "Access your exam results as soon as they are published by the Exam Coordinator. Download your report card as a PDF.",
    sections: [
      { heading: "Viewing Results", body: null, steps: [
        "Go to Exams → My Results.",
        "Select the exam from the dropdown.",
        "View subject-wise marks, total, percentage, rank, and pass/fail status.",
        "Click Download Report Card to save or print your report card PDF.",
      ]},
    ],
    tips: ["Results are only visible after the Exam Coordinator officially publishes them.", "Contact your teacher if you believe there is an error in your marks."],
  },
  {
    id: "fees", group: "Finance", icon: <DollarOutlined />, color: "#DC2626",
    title: "Fee Statement", subtitle: "View and download fee records",
    badge: "Fees",
    overview: "View your complete fee statement — what has been collected, what is pending, and download receipts for paid installments.",
    sections: [
      { heading: "Checking Fee Status", body: null, list: [
        "Go to Finance → My Fees.",
        "Each installment shows: fee head, due date, amount, paid amount, and status.",
        "Green = Paid, Red = Overdue, Amber = Due Soon.",
        "Click Download Receipt to get a PDF copy of any paid installment.",
        "For queries on the fee amount or waiver, contact the school accountant.",
      ]},
    ],
    tips: ["Keep a copy of all fee receipts — you may need them for scholarship applications.", "Online payments are reflected within 24 hours of the bank confirmation."],
  },
];

const PARENT_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Parent Portal Guide", subtitle: "Stay connected with your child's school life",
    badge: "Start Here",
    overview: "Your Parent portal gives you real-time visibility into your child's attendance, exam results, fee payments, timetable, and school announcements.",
    sections: [
      { heading: "What you can access", body: null, list: [
        "Your child's daily attendance — present, absent, or late.",
        "Exam results and report cards when published.",
        "Fee payment status and downloadable receipts.",
        "School timetable and exam schedule.",
        "Teacher notifications and school announcements.",
        "Leave application for your child.",
      ]},
    ],
    tips: ["Enable browser notifications to receive real-time alerts for absent days and fee dues.", "If you have multiple children in the same school, switch between them from the top profile selector."],
  },
  {
    id: "attendance", group: "Monitoring", icon: <CheckSquareOutlined />, color: "#059669",
    title: "Child's Attendance", subtitle: "Monitor daily attendance in real time",
    badge: "Attendance",
    overview: "View your child's attendance day by day and receive alerts when they are marked absent.",
    sections: [
      { heading: "Viewing Attendance", body: null, list: [
        "Go to Attendance → Child's Attendance.",
        "The calendar shows each day's status — Present, Absent, Late, or Holiday.",
        "The summary card shows overall attendance % for the year.",
        "If your child's attendance falls below the minimum threshold, you receive an SMS/email alert.",
        "To dispute an attendance entry, contact the class teacher directly.",
      ]},
    ],
    tips: ["Attendance is marked by the class teacher daily — usually by 10 AM.", "If your child is sick, inform the class teacher by phone the same day to avoid an unexplained absence."],
  },
  {
    id: "results", group: "Monitoring", icon: <FileTextOutlined />, color: "#7C3AED",
    title: "Exam Results", subtitle: "View marks and download report cards",
    badge: "Results",
    overview: "Access your child's exam results as soon as the school publishes them. Download printable report cards.",
    sections: [
      { heading: "Viewing Results", body: null, steps: [
        "Go to Exams → Child's Results.",
        "Select the exam from the dropdown.",
        "View subject-wise marks, total score, percentage, rank, and pass/fail status.",
        "Click Download Report Card to save or print the PDF.",
      ]},
    ],
    tips: ["Results appear only after the school officially publishes them — no preview before publishing.", "For result queries, contact the class teacher or exam coordinator."],
  },
  {
    id: "fees", group: "Finance", icon: <DollarOutlined />, color: "#DC2626",
    title: "Fee Payments", subtitle: "Track fee dues and payment history",
    badge: "Fees",
    overview: "View your child's fee statement, track overdue payments, and download receipts for your records.",
    sections: [
      { heading: "Fee Status Overview", body: null, list: [
        "Go to Finance → Fee Statement.",
        "Each installment shows fee head, due date, amount due, and paid status.",
        "Green = Paid, Red = Overdue, Amber = Due within 7 days.",
        "Click Download Receipt to get a copy of any paid installment.",
        "For fee discrepancies or waiver requests, contact the school accountant.",
      ]},
    ],
    tips: ["Pay fees before the due date to avoid the late payment fee.", "Keep PDF receipts as proof of payment — especially if paying by cash."],
  },
];

const STAFF_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Staff Portal Guide", subtitle: "Your staff workspace at a glance",
    badge: "Start Here",
    overview: "Your Staff portal gives you access to your attendance, leave management, salary information, task assignments, and school notices.",
    sections: [
      { heading: "Core Features", body: null, list: [
        "GPS Check-In / Check-Out — mark your daily attendance from your mobile.",
        "My Attendance — view your punch-in/out history and monthly summary.",
        "Leave Requests — apply for and track leave approvals.",
        "My Payslips — download your monthly salary slips.",
        "Tasks — view tasks assigned to you by the School Admin.",
        "Notices — read important school announcements.",
        "Profile — update contact details and change your password.",
      ]},
    ],
    tips: ["Use GPS check-in on the school premises to avoid attendance discrepancies.", "Apply for leave at least 24 hours in advance wherever possible."],
  },
  {
    id: "attendance", group: "Operations", icon: <CheckSquareOutlined />, color: "#059669",
    title: "My Attendance", subtitle: "Track your daily attendance",
    badge: "Attendance",
    overview: "Your attendance is recorded via GPS check-in/check-out. View your history and apply for leave corrections if there are discrepancies.",
    sections: [
      { heading: "GPS Check-In", body: null, steps: [
        "Open the EduOS portal on your phone while on school premises.",
        "Go to Attendance → GPS Check-In/Out.",
        "Click Check In — your GPS location is verified against the school geofence.",
        "At the end of the day, click Check Out.",
        "If you forget to check out, contact the School Admin to mark it manually.",
      ]},
    ],
    tips: ["GPS check-in only works when you are physically within the school boundary.", "Check 'My Attendance' monthly to verify your records before payroll is processed."],
  },
  {
    id: "leave", group: "Operations", icon: <CalendarOutlined />, color: "#D97706",
    title: "Leave Management", subtitle: "Apply and track leave requests",
    badge: "Leave",
    overview: "Apply for various leave types (Casual, Sick, Earned, LOP) and track approval status from your leave history.",
    sections: [
      { heading: "Applying for Leave", body: null, steps: [
        "Go to Attendance → Leave Requests → Apply Leave.",
        "Select leave type, start date, end date, and enter reason.",
        "Upload a supporting document if required (e.g. medical certificate for sick leave).",
        "Submit — the School Admin receives the request for approval.",
        "You will receive a notification when the leave is approved or rejected.",
      ]},
    ],
    tips: ["Sick leave applied after the absence must include a medical certificate.", "Your available leave balance is shown before you apply."],
  },
  {
    id: "payslip", group: "Finance", icon: <DollarOutlined />, color: "#7C3AED",
    title: "My Payslips", subtitle: "View and download monthly salary slips",
    badge: "Finance",
    overview: "Access your payslips for every month where the Accountant has completed the payroll cycle.",
    sections: [
      { heading: "Downloading a Payslip", body: null, steps: [
        "Go to Payroll → My Payslips.",
        "Select the month and year from the dropdown.",
        "View the payslip breakdown: earnings (Basic, HRA, allowances) and deductions (PF, TDS, advance).",
        "Click Download PDF to save or print.",
      ]},
    ],
    tips: ["Payslips are available after the Accountant marks the cycle as Paid.", "Contact the Accountant for queries on deductions or advance recovery."],
  },
];

const MEDICAL_OFFICER_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <RocketOutlined />, color: "#2563EB",
    title: "Medical Officer Workspace", subtitle: "School health management guide",
    badge: "Start Here",
    overview: "As Medical Officer, you manage student and staff health records, medical room visits, health screenings, emergency responses, and health reports.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "Medical Room Log — record all health room visits.",
        "Student Health Records — maintain medical histories and vaccination records.",
        "Health Screenings — record results of routine health checks.",
        "Emergency Log — document medical emergencies and action taken.",
        "Health Reports — generate class-wise and school-level health summaries.",
      ]},
    ],
    tips: ["Any student visit involving medication administration must be logged with parent notification.", "Emergency protocols must be followed for all serious cases — always call 108 and inform School Admin simultaneously."],
  },
  {
    id: "records", group: "Operations", icon: <HeartOutlined />, color: "#DC2626",
    title: "Health Records", subtitle: "Manage student medical histories",
    badge: "Health",
    overview: "Maintain confidential medical records for all students including allergies, chronic conditions, emergency contacts, and vaccination history.",
    sections: [
      { heading: "Recording a Health Room Visit", body: null, steps: [
        "Go to Medical → Health Room Log → Add Visit.",
        "Search for the student or staff member.",
        "Record the complaint, vital signs (if taken), treatment given, and medication dispensed.",
        "Note whether the student was sent home or returned to class.",
        "If medication was given, log the dose and time.",
        "For serious cases, complete the Emergency Report form as well.",
      ]},
    ],
    tips: ["Check student allergy records before administering any medication.", "Parent contact details must be confirmed for every student before treatment."],
  },
];

const LAB_TECHNICIAN_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <ExperimentOutlined />, color: "#0891B2",
    title: "Lab Technician Workspace", subtitle: "Laboratory management guide",
    badge: "Start Here",
    overview: "As Lab Technician, you manage lab equipment inventory, consumables, experiment schedules, safety compliance, and lab booking.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "Equipment Register — maintain the inventory of lab equipment.",
        "Lab Booking — manage class and teacher lab usage schedules.",
        "Consumables — track chemicals and supplies usage.",
        "Safety Compliance — record safety checks and incident reports.",
        "My Classes — assist teachers during lab sessions for assigned classes.",
      ]},
    ],
    tips: ["Complete a safety checklist before every lab session.", "Log all chemical usage for compliance and resupply planning."],
  },
  {
    id: "equipment", group: "Inventory", icon: <SettingOutlined />, color: "#7C3AED",
    title: "Equipment Management", subtitle: "Track lab instruments and devices",
    badge: "Inventory",
    overview: "Maintain a complete register of all lab equipment including microscopes, chemical cabinets, computer systems, and specialised instruments.",
    sections: [
      { heading: "Equipment Register", body: null, list: [
        "Go to Lab → Equipment Register.",
        "Add each item: name, serial number, quantity, condition, and last service date.",
        "Mark items as In Use, Available, or Under Repair.",
        "Log servicing dates and vendor details for maintenance tracking.",
      ]},
    ],
    tips: ["Schedule equipment calibration quarterly for precision instruments.", "Faulty equipment must be tagged and removed from use immediately."],
  },
];

const SPORTS_TEACHER_DOCS = [
  {
    id: "overview", group: "Getting Started", icon: <StarOutlined />, color: "#D97706",
    title: "Sports Teacher Workspace", subtitle: "Physical education and sports management",
    badge: "Start Here",
    overview: "As Sports Teacher, you manage PE classes, sports activities, team registrations, tournament participation, and sports equipment inventory.",
    sections: [
      { heading: "Core Functions", body: null, list: [
        "My Classes — mark attendance for PE periods.",
        "Sports Teams — register and manage school sports teams.",
        "Equipment Inventory — track sports equipment.",
        "Events & Tournaments — schedule and manage sports events.",
        "Student Fitness Records — log fitness test results.",
        "Reports — sports participation and achievement reports.",
      ]},
    ],
    tips: ["Attendance for PE classes should be marked the same as regular subjects.", "Update tournament results promptly for accurate school achievement records."],
  },
  {
    id: "classes", group: "Teaching", icon: <CheckSquareOutlined />, color: "#059669",
    title: "PE Classes & Attendance", subtitle: "Manage physical education sessions",
    badge: "Teaching",
    overview: "Your PE class schedule appears in My Classes alongside regular teachers. Mark attendance, plan activities, and record student performance.",
    sections: [
      { heading: "Taking PE Class Attendance", body: null, steps: [
        "Go to My Classes and select the PE class.",
        "Click Take Attendance.",
        "Mark each student as Present, Absent, or Excused (for medical exemptions).",
        "Add notes for students who are medically excused.",
        "Submit before the school's daily cut-off time.",
      ]},
    ],
    tips: ["Medically excused students should have a note from the Medical Officer or School Admin.", "Students consistently excused from PE should be flagged to the counselor."],
  },
];

/* ─── Role → content mapping ─────────────────────────────────── */
const ROLE_DOC_MAP = {
  "school admin":       SCHOOL_ADMIN_DOCS,
  "principal":          SCHOOL_ADMIN_DOCS,
  "vice principal":     SCHOOL_ADMIN_DOCS,
  "teacher":            TEACHER_DOCS,
  "class teacher":      TEACHER_DOCS,
  "sports teacher":     SPORTS_TEACHER_DOCS,
  "lab technician":     LAB_TECHNICIAN_DOCS,
  "medical officer":    MEDICAL_OFFICER_DOCS,
  "subject coordinator": SUBJECT_COORDINATOR_DOCS,
  "exam coordinator":   EXAM_COORDINATOR_DOCS,
  "accountant":         ACCOUNTANT_DOCS,
  "librarian":          LIBRARIAN_DOCS,
  "hostel warden":      HOSTEL_WARDEN_DOCS,
  "transport manager":  TRANSPORT_DOCS,
  "receptionist":       RECEPTIONIST_DOCS,
  "it support":         IT_SUPPORT_DOCS,
  "counselor":          COUNSELOR_DOCS,
  "security":           SECURITY_DOCS,
  "student":            STUDENT_DOCS,
  "parent":             PARENT_DOCS,
  "staff":              STAFF_DOCS,
  "support staff":      STAFF_DOCS,
};

const ROLE_COLORS = {
  "school admin": "#2563EB", "principal": "#2563EB", "vice principal": "#0891B2",
  "teacher": "#7C3AED", "class teacher": "#7C3AED", "sports teacher": "#D97706",
  "lab technician": "#0891B2", "medical officer": "#DC2626",
  "subject coordinator": "#059669", "exam coordinator": "#B45309",
  "accountant": "#DC2626", "librarian": "#7C3AED", "hostel warden": "#059669",
  "transport manager": "#0891B2", "receptionist": "#64748B", "it support": "#2563EB",
  "counselor": "#D97706", "security": "#DC2626", "student": "#059669",
  "parent": "#2563EB", "staff": "#64748B", "support staff": "#64748B",
};

const GROUP_ORDER = ["Getting Started", "Administration", "Academic", "Teaching", "Curriculum", "Planning", "Operations", "Finance", "Payroll", "Catalog", "Fleet", "Routes", "Counseling", "Access", "Inventory", "Academics", "Monitoring", "Analytics", "Reports"];

/* ─── Main component ─────────────────────────────────────────── */
const RoleDocumentation = () => {
  const { user } = useSelector((s) => s.auth || {});
  const roleName = (typeof user?.role === "string" ? user?.role : user?.role?.name) || "";
  const roleKey = roleName.toLowerCase();

  const sections = ROLE_DOC_MAP[roleKey] || STAFF_DOCS;
  const accentColor = ROLE_COLORS[roleKey] || "#2563EB";

  const [activeId, setActiveId] = useState(sections[0]?.id || "overview");
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return sections;
    return sections.filter(
      (s) => s.title.toLowerCase().includes(kw) || s.subtitle.toLowerCase().includes(kw) || s.overview.toLowerCase().includes(kw)
    );
  }, [sections, search]);

  const activeSection = sections.find((s) => s.id === activeId) || sections[0];

  const grouped = useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach((g) => { map[g] = []; });
    filteredSections.forEach((s) => {
      if (!map[s.group]) map[s.group] = [];
      map[s.group].push(s);
    });
    return map;
  }, [filteredSections]);

  return (
    <div style={{ ...pageWrapper, padding: 0 }}>
      <PageHeader
        title={`${roleName} Documentation`}
        subtitle={`Platform guide for the ${roleName} role`}
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
          width: 240,
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
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 16px 6px" }}>
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
                        padding: "9px 16px",
                        border: "none",
                        background: isActive ? `${s.color}12` : "transparent",
                        borderRight: isActive ? `3px solid ${s.color}` : "3px solid transparent",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-soft)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ color: isActive ? s.color : "var(--text-muted)", fontSize: 14, flexShrink: 0, transition: "color 0.15s" }}>
                        {s.icon}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : "var(--text-primary)", transition: "color 0.15s", lineHeight: 1.3 }}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filteredSections.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No results for "{search}"
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "var(--surface-page)", maxWidth: "840px" }}>

          {/* Hero */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div style={iconWell(activeSection.color, 52)}>{activeSection.icon}</div>
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
          <div style={{ ...sectionPanel, background: `${activeSection.color}08`, border: `1px solid ${activeSection.color}20`, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <InfoCircleOutlined style={{ color: activeSection.color, fontSize: 15, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.7 }}>
                {activeSection.overview}
              </p>
            </div>
          </div>

          {/* Section blocks */}
          {activeSection.sections?.map((sec, si) => (
            <div key={si} style={{ ...sectionPanel, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <RightOutlined style={{ color: activeSection.color, fontSize: 11 }} />
                {sec.heading}
              </h3>
              {sec.body && (
                <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>{sec.body}</p>
              )}
              {sec.steps && <StepBlock steps={sec.steps} />}
              {sec.list && <BulletList items={sec.list} />}
            </div>
          ))}

          {/* Checklist */}
          {activeSection.checklist?.length > 0 && (
            <div style={{ ...sectionPanel, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>✅ Checklist</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeSection.checklist.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <CheckCircleOutlined style={{ color: "#22C55E", fontSize: 14, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {activeSection.tips?.length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <BulbOutlined style={{ color: "#B45309", fontSize: 15 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#B45309" }}>Tips</span>
              </div>
              {activeSection.tips.map((tip, i) => (
                <div key={i} style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>• {tip}</div>
              ))}
            </div>
          )}

          {/* Footer nav */}
          <Divider style={{ margin: "28px 0 20px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              EduOS Documentation · {roleName} Guide
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(() => {
                const idx = sections.findIndex((s) => s.id === activeId);
                const prev = sections[idx - 1];
                const next = sections[idx + 1];
                return (
                  <>
                    {prev && (
                      <button onClick={() => setActiveId(prev.id)} style={{ ...pill("var(--primary)", "var(--surface-soft)"), cursor: "pointer", border: "1px solid var(--border-muted)", padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
                        ← {prev.title}
                      </button>
                    )}
                    {next && (
                      <button onClick={() => setActiveId(next.id)} style={{ ...pill(accentColor, `${accentColor}10`), cursor: "pointer", border: `1px solid ${accentColor}30`, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
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

export default RoleDocumentation;

# EduManage — Complete User Guide

**Version:** 1.0  
**Platform:** Web Application (Desktop & Mobile)  
**Supported Roles:** Super Admin, School Admin, Principal, Vice Principal, Teacher, Student, Parent, Accountant, Librarian, Hostel Warden, Staff, and more.

---

## Table of Contents

1. [Getting Started — Login & Authentication](#1-getting-started)
2. [Super Admin Guide](#2-super-admin)
3. [School Admin Guide](#3-school-admin)
4. [Principal & Vice Principal Guide](#4-principal--vice-principal)
5. [Teacher Guide](#5-teacher)
6. [Student Guide](#6-student)
7. [Parent Guide](#7-parent)
8. [Accountant Guide](#8-accountant)
9. [Librarian Guide](#9-librarian)
10. [Hostel Warden Guide](#10-hostel-warden)
11. [Staff Guide](#11-staff)
12. [Common Features for All Roles](#12-common-features)

---

## 1. Getting Started

### Login

1. Open the application in your browser.
2. Enter your **Email Address** and **Password**.
3. Check **Remember me** if you want to stay logged in.
4. Click **Sign In**.
5. You will be redirected to your role-specific dashboard automatically.

### Forgot Password

1. Click **Forgot password?** on the login page.
2. Enter your registered email address.
3. Check your inbox for the reset link and follow the instructions.

### First-Time Setup (School Admin)

Before any role can use the system, the School Admin must complete the setup in this exact order:

```
School Setup → Academic Year → Classes → Sections → Subjects → Assign Teachers
```

Without completing this setup, modules like Attendance, Fees, and Exams will not work.

---

## 2. Super Admin

The Super Admin manages the entire platform — all schools, subscriptions, users, and system settings.

---

### 2.1 Dashboard

- View platform-wide stats: total schools, active subscriptions, total revenue.
- Monitor system health and recent activity.

---

### 2.2 School Management

**Path:** School Management → Schools

| Action | How To |
|--------|--------|
| Add a new school | Click **Add School**, fill in name, address, board, contact details, then Save |
| View school details | Click the school name in the list |
| Edit school info | Open school → click Edit |
| View school reports | School Management → School Reports |

**Subscription Plans**
- Go to **Subscription Plans** to create Free / Basic / Premium plans.
- Assign a plan to a school from the school's detail page.
- View payment history under **Payments**.
- View plan change logs under **Plan Logs**.

---

### 2.3 User Management

Manage all users across all schools.

| Section | What you can do |
|---------|----------------|
| Teachers | View, search, activate/deactivate teacher accounts |
| Students | View all students across all schools |
| Parents | View parent accounts and their linked children |
| Staff | View non-teaching staff |
| Accountant | View accountant accounts |
| Librarian | View library staff |
| Transport | View transport managers |

> **Note:** Creating school-level users is done by the School Admin. Super Admin has view/manage access only.

---

### 2.4 Master Settings

**Path:** Master Settings → Class & Section List

- Define global class names (e.g., Class 1 to Class 12) that schools can use.
- These are templates — each school configures their own classes under School Setup.

---

### 2.5 Reports & Analytics

| Report | Description |
|--------|-------------|
| Academic Reports | School-wise academic performance summary |
| School-wise Reports | Enrollment, attendance, and fee collection per school |
| Custom Reports | Create reports with custom filters and export as PDF/Excel |

---

### 2.6 System Settings

**Audit Logs**
- View every action taken in the system: who did what and when.
- Filter by date, user, or action type.

**Backup Management**
- Click **Create Backup** to generate a JSON snapshot of school data.
- Click the **Download** button (⬇) next to any backup to save the file.
- Click the **Delete** button (🗑) to remove old backups.
- Schedule automatic backups using the Backup Schedules tab.

---

### 2.7 Support

- **FAQs** — Frequently asked questions for schools and users.
- **Documentation** — Platform documentation and how-to articles.

---

## 3. School Admin

The School Admin is the most powerful role within a single school. They control all setup, students, fees, staff, and reporting.

---

### 3.1 Initial Setup (Must do first)

Complete these steps before using any other module:

#### Step 1 — School Setup → Board
- Add the education board (e.g., CBSE, ICSE, State Board).

#### Step 2 — School Setup → Classes
- Add classes (e.g., Class 1, Class 2 … Class 12).

#### Step 3 — School Setup → Classes → Sections
- Add sections for each class (e.g., A, B, C).

#### Step 4 — School Setup → Subjects
- Add subjects and map them to the correct class.

#### Step 5 — School Setup → Assign Teachers
- Assign a class teacher to each class-section combination.

#### Step 6 — Create Academic Year
- Go to **Settings → Academic Year** and create the current year (e.g., 2024-2025).
- Mark it as **Active**. All modules depend on the active academic year.

---

### 3.2 Student Management

**Path:** Teachers & Students

| Task | How To |
|------|--------|
| Admit a new student | Click **Add Student (Admission)** → fill the multi-step form → Submit |
| View all students | Teachers & Students → Student List |
| Promote students | Teachers & Students → **Student Promotion** → select FROM class/year and TO class/year → select students → Promote |
| Assign roll numbers | Teachers & Students → **Roll Number Management** → select class & section → Auto Assign or manually edit |
| Admission inquiry | Teachers & Students → **Admission Inquiry** — track walk-in inquiries before formal admission |

**Admission Form Steps:**
1. **Step 1** — Basic info (name, DOB, gender, class, section, registration number, roll number preview, SMS mobile, fee discount)
2. **Step 2** — Parent/guardian details
3. **Step 3** — Address and additional info

> The **Roll No. (Auto)** field in Step 1 shows a preview of the next roll number based on the selected class and section. It is assigned automatically on save.

---

### 3.3 Fee Management

**Correct workflow order:**

```
Fee Categories → Fee Structure → Assign to Students → Collect Payment
```

**Fee Categories** (`Fees Management → Fee Categories`)
- Create categories like Tuition Fee, Transport Fee, Library Fee, etc.

**Fee Structure** (`Fees Management → Fee Structure`)
- Create a fee structure for a class by combining categories and setting amounts.

**Assign Student Fee** (`Fees Management → Assign Fee`)
- Assign a fee structure to individual students or an entire class.
- Apply discounts here if needed.

**Fee Collection** (`Fees Management → Fee Collection`)
1. Select a **Class** from the dropdown.
2. Select a **Student** from the list.
3. The assigned fees will load automatically.
4. Select which fees to pay and click **Record Payment**.
5. A payment receipt is generated automatically.

---

### 3.4 Attendance

| Module | Description |
|--------|-------------|
| Dashboard | Today's attendance summary — present, absent, late |
| All Students Attendance | Mark or view attendance for any class/section/date |
| Teacher Attendance | Mark attendance for teaching staff |
| Staff Attendance | Mark attendance for non-teaching staff |
| Attendance Analytics | Charts and trends by class, month, or student |
| Attendance Reports | Export attendance data as PDF or Excel |
| Leave Management | Approve or reject student/staff leave requests |
| Geofence Settings | Set GPS boundary for location-based attendance |

**Marking Attendance:**
1. Go to **All Students Attendance**.
2. Select Class, Section, and Date.
3. Mark each student as Present / Absent / Late / Half Day.
4. Click **Save**.

---

### 3.5 Exams & Grades

**Workflow:**
```
Create Exam → Set Schedule → Enter Grades → View Reports
```

| Page | Purpose |
|------|---------|
| Exam List | View all created exams |
| Create Exam | Define exam name, type, class, subject, max marks, pass marks |
| Exam Schedule | Set date/time/room for each exam paper |
| Seat Plan | Assign seat numbers to students for an exam hall |
| Admit Card | Generate and print student admit cards |
| Enter Grades | Enter marks subject-wise for each student |
| Exam Report | View class-wise result summary |
| Analytics | Pass/fail rates, top scorers, subject-wise analysis |

---

### 3.6 Payroll

| Page | Purpose |
|------|---------|
| Generate Payslip | Select employee and month → generate payslip with allowances and deductions |
| Monthly Payroll Report | View all salary disbursements for a month |

**Steps to generate payslip:**
1. Go to **Payroll → Generate Payslip**.
2. Select the employee.
3. Select the month and year.
4. Review the salary breakdown.
5. Click **Generate** → Download PDF.

---

### 3.7 Timetables

1. Go to **Timetables**.
2. Select Class and Section.
3. Assign subjects and teachers to each period slot.
4. Save the timetable. Teachers and students can view their own timetable from their dashboards.

---

### 3.8 Communication

**Send Notification** (`Communication → Send Notification`)
- Send SMS, email, or in-app notifications.
- Target by role (all teachers, all parents, specific class, etc.).
- Write the message and click **Send**.

---

### 3.9 Events & Calendar

- **Events** — Create school events (annual day, sports day, holidays).
- **Calendar** — Monthly view of all events and exam schedules.

---

### 3.10 Transport

- Add buses/vehicles and assign routes.
- Assign students to routes and stops.
- View transport-wise student lists.

---

### 3.11 Hostel

- **Room Allocation** — Assign students to hostel rooms.
- View room occupancy and availability.

---

### 3.12 Library

- View borrowed books and due dates.
- Manage library catalog.

---

### 3.13 Inventory

| Section | Purpose |
|---------|---------|
| Assets | Track school assets (furniture, computers, projectors) |
| Supplies | Track consumables (stationery, lab supplies) |

---

### 3.14 Reports

- Generate school-wide summary reports.
- Export as PDF or Excel.

---

### 3.15 User Management

- View and manage all users within the school.
- Activate/deactivate accounts.

---

### 3.16 Settings

- **Academic Year** — Create and set the active academic year.
- **School Profile** — Update school name, logo, address, contact.
- **Teacher Evaluation** — Configure evaluation criteria.

---

## 4. Principal & Vice Principal

### Principal

| Module | Access |
|--------|--------|
| Dashboard | School-wide summary |
| Timetable Overview | View all class timetables |
| Reports | Academic performance across all classes |
| Attendance | View attendance analytics |
| Teacher Evaluation | Evaluate teacher performance |

**Timetable Overview:**
- Go to **Timetable** to see a full school timetable grid.
- Filter by class, section, or teacher.

### Vice Principal

- Access to reports and monitoring similar to Principal.
- Can view: attendance reports, exam results, teacher reports.

---

## 5. Teacher

### 5.1 Dashboard

- View today's class schedule, pending tasks, and announcements.

### 5.2 Assigned Classes

- View all classes and sections assigned to you.
- Click a class to see the **Class Details** — student list, attendance, and grades for that class.

### 5.3 My Students

- View the full list of students in your assigned classes.
- Search by name or roll number.

### 5.4 Attendance

- Mark daily attendance for your class.
- View attendance history for your students.
- View your own attendance record under **My Attendance**.

### 5.5 Exams

| Task | How To |
|------|--------|
| View exams | Exams → Exam List |
| Create exam | Exams → Create Exam → fill details → Save |
| Edit exam | Click Edit (✏) on any exam |
| Enter marks | Exams → Enter Grades → select exam → fill marks |
| View report | Exams → Exam Report → select exam |

### 5.6 Reports

- View your class-wise performance summary.
- Export reports as needed.

### 5.7 My Profile

- View and update your personal and employment details.
- View your payslips.
- View your attendance record.

---

## 6. Student

### 6.1 Dashboard

- View today's timetable, upcoming exams, and announcements.

### 6.2 Timetable

- View your class timetable (period-wise schedule for each day of the week).

### 6.3 Attendance

- View your own attendance record.
- See monthly summary and absent dates.

### 6.4 Exams & Grades

- View your exam schedule and admit card.
- View your marks and grade report after results are published.

### 6.5 Fee

- View your fee dues and payment history.

### 6.6 Library

- View borrowed books and return due dates.

---

## 7. Parent

Parents can monitor their child's progress across all modules.

| Module | What you can see |
|--------|-----------------|
| Grades | Child's exam marks and grade card |
| Homework | Pending and submitted homework |
| Progress | Overall academic progress report |
| Attendance | Child's daily attendance record |
| Leave | Apply for leave on behalf of child; view leave status |
| Library | Child's borrowed books |
| Hostel | Child's room details and hostel status |
| Transport | Child's bus route and stop details |

### Applying for Leave (Parent)

1. Go to **Leave → Apply Leave**.
2. Select date range and reason.
3. Submit. The leave will go to the School Admin for approval.

---

## 8. Accountant

### 8.1 Fee Reports

- View collection summary by class, date range, or fee category.
- Filter by payment status (paid, unpaid, partial).
- Export as PDF or Excel.

### 8.2 Expense Management

- Record school expenses (utilities, maintenance, supplies).
- View expense history and totals by category.
- Generate expense reports.

---

## 9. Librarian

### 9.1 Library Members

- View all registered library members (students and staff).
- See borrow history for each member.
- Mark books as returned.

### 9.2 Library Settings

- Add new books to the catalog.
- Set borrowing limits and due days.
- Manage book categories.

---

## 10. Hostel Warden

### 10.1 Dashboard

- Overview: total rooms, occupied rooms, available rooms, current residents.

### 10.2 Hostel Attendance

- Mark daily attendance for hostel residents.
- View attendance history.

### 10.3 Leave Management

- View leave requests from hostel students.
- Approve or reject with remarks.

### 10.4 Visitor Log

- Record visitor entries: visitor name, purpose, check-in/check-out time.
- View visitor history.

### 10.5 Complaint Management

- Students/staff submit complaints.
- Warden can mark complaints as In Progress / Resolved.

### 10.6 Reports

- Generate hostel occupancy, attendance, and leave reports.

---

## 11. Staff

- View your **Dashboard** with today's schedule and tasks.
- View your **Attendance** record.
- View your **Payslip**.
- View **Tasks** assigned to you.

---

## 12. Common Features

These features work the same for all roles.

---

### Dark / Light Mode

- Click the **theme toggle** (sun/moon icon) in the top header.
- The theme switches instantly and is saved for your session.

---

### Profile Settings

- Click your **avatar/name** in the top-right corner.
- Update your profile photo, name, and contact number.
- Change your password from the profile menu.

---

### Notifications

- The **bell icon** (🔔) in the header shows new notifications.
- Click a notification to go directly to the relevant page.

---

### No Active Academic Year

If you see the **"No Active Academic Year"** screen:
- Ask your School Admin to go to **Settings → Academic Year** and mark one year as Active.
- This must be done before any module can function.

---

### Search & Filters

- Most list pages have a **search bar** at the top.
- Use dropdown filters (Class, Section, Date, Status) to narrow results.
- Click column headers to sort the table.

---

### Exporting Data

- Tables that support export will show **PDF** and **Excel** buttons in the top-right area.
- Click the button to download the current filtered view.

---

### Pagination

- Large lists are paginated. Use the page numbers at the bottom to navigate.
- You can change how many rows are shown per page using the dropdown next to pagination.

---

## Quick Reference — Role Permissions

| Module | Super Admin | School Admin | Principal | Teacher | Student | Parent |
|--------|:-----------:|:------------:|:---------:|:-------:|:-------:|:------:|
| School Management | ✅ Full | Own School | View | — | — | — |
| User Management | ✅ Full | Own School | View | — | — | — |
| Attendance | View All | ✅ Full | View/Reports | Own Class | View Own | View Child |
| Fees | — | ✅ Full | View | — | View Own | View Child |
| Exams & Grades | — | ✅ Full | View All | Own Class | View Own | View Child |
| Payroll | — | ✅ Full | View | View Own | — | — |
| Library | — | ✅ Full | View | — | View Own | View Child |
| Hostel | — | ✅ Full | View | — | View Own | View Child |
| Transport | — | ✅ Full | View | — | View Own | View Child |
| Reports | All Schools | Own School | Own School | Own Class | — | — |
| System Backups | ✅ Full | — | — | — | — | — |
| Audit Logs | ✅ Full | — | — | — | — | — |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't log in | Check email/password. Use Forgot Password if needed. |
| Dashboard shows no data | Ensure an Academic Year is Active (Settings → Academic Year) |
| Students not showing in fee collection | Select the Class filter first, then choose a student |
| Roll number not showing | Go to Roll Number Management → Auto Assign for that class/section |
| Backup download not working | Check internet connection. Only Super Admin can download backups. |
| Timetable empty | School Admin must first set up the timetable for the class |
| Notification not received | Check spam/junk folder for email. Ensure phone number is correct for SMS. |

---

*For technical support, contact your system administrator or use the Support section in the application.*

roles 
# Super Admin 
# School Admin 
# Principal 
# Vice Principal 
# Teacher 
# Class Teacher 
# Subject Coordinator 
# Exam Coordinator 
# Sports Teacher 
# Lab Technician 
# Medical Officer 
# Student 
# Parent 
# Accountant 
# Librarian 
# Hostel Warden 
# Staff 
# Security 
# Receptionist 
# Counselor 
# IT Support 
# Transport Manager

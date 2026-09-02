# EduManage — Multi-Tenant School ERP Platform
## Investment / Acquisition Memorandum

**Asset:** Full source code + IP for a production-grade, multi-tenant School Management SaaS platform
**Seller:** Sunil Kushwaha
**Contact:** sunilkushwaha066@gmail.com
**Date:** August 2026

---

## 1. Executive Summary

EduManage is a complete, actively-maintained School ERP built over **22 months of continuous development** (Oct 2024 – Aug 2026, 1,133 commits). It is a **multi-tenant SaaS platform** — one codebase serving unlimited schools, each with isolated data, its own admin, and a subscription plan billed through an already-integrated Razorpay payment flow.

This is not a template or a boilerplate. It is a working system with **20+ role-based portals** (Super Admin down to Student/Parent), **143 database models**, **95 controllers**, and **~168,000 lines of code** across a Node.js/Express/MongoDB backend and a React 19/Vite frontend.

For a buyer — an EdTech company, IT services firm, or entrepreneur — this asset removes 12–18+ months of build time and lets you go to market with a feature-complete product immediately.

---

## 2. What's Included

| Item | Details |
|---|---|
| Backend source | Node.js + Express + MongoDB, 388 files, 44,028 LOC |
| Frontend source | React 19 + Vite, 455+ components/pages, 124,038 LOC |
| Git history | Full commit history (1,133 commits) proving organic, incremental development |
| Documentation | `USER_GUIDE.md` (complete role-by-role manual) + `RoleWiseGuide.html` (interactive guide) |
| Test suite | Jest + Supertest backend tests, `mongodb-memory-server` for isolated test runs |
| Mobile app | React Native / Expo (SDK 54) companion app, merged into `main` — fully redesigned UI (navy + purple theme), 23 role-driven navigation trees, 290+ screens, 400 RTK Query endpoint definitions against the same backend |

**Not included by default:** live customer/school data, existing domain/hosting, or third-party service accounts (Razorpay, Twilio, Cloudinary, SMTP) — the buyer provisions their own. Can be negotiated as part of a handover package.

---

## 3. Market Opportunity

- The global **Education ERP market is projected to reach $25.2 billion by 2026** (MarketsAndMarkets).
- The **Asia-Pacific school ERP segment alone is expected to surpass $800 million by 2026**, growing at roughly a **12% CAGR**, with India and China as the largest contributors.
- India's **National Education Policy (NEP) 2020** explicitly pushes technology integration in schools, and the private K-12 segment (150,000+ private schools) remains largely underserved by modern, affordable ERP software — most still run on spreadsheets, WhatsApp, or fragmented single-purpose tools.
- Because EduManage is architected multi-tenant with subscription billing already wired in, a buyer can onboard new schools without additional infrastructure work — the recurring-revenue model is not a roadmap item, it already exists in the code (`SubscriptionPlan`, `SchoolSubscription`, Razorpay billing controllers).

Sources: [MarketsandMarkets — Education ERP Market](https://www.marketsandmarkets.com/PressReleases/education-erp.asp) · [Grand View Research — India Education ERP Outlook](https://www.grandviewresearch.com/horizon/outlook/education-erp-market/india)

---

## 4. Product Depth

### 4.1 Roles Supported (20+)

Super Admin · School Admin · Principal · Vice Principal · Teacher · Class Teacher · Subject Coordinator · Exam Coordinator · Sports Teacher · Lab Technician · Medical Officer · Student · Parent · Accountant · Librarian · Hostel Warden · Staff · Security · Receptionist · Counselor · IT Support · Transport Manager

Each role has its own dashboard, permission scope, and workflows — this is not a single admin panel with hidden fields, it's genuinely differentiated UX per role.

### 4.2 Core Modules — Detailed Breakdown

#### 4.2.1 Admissions & Student Lifecycle
- **Admission Inquiry tracking** — captures walk-in/online inquiries before a family commits, so schools don't lose leads.
- **Multi-step admission form** — Step 1: basic info (name, DOB, gender, class, section) with a live roll-number preview; Step 2: parent/guardian details; Step 3: address and additional info.
- **Roll Number Management** — auto-assigns roll numbers per class/section, or lets staff override manually.
- **Student Promotion** — bulk-promotes students from one class/academic year to the next with a from→to selector, avoiding manual re-entry every year.

#### 4.2.2 Fee Management
- Enforces a clean, auditable workflow: **Fee Categories → Fee Structure → Assign to Students → Collect Payment.**
- **Fee Categories** — tuition, transport, library, etc., defined once and reused.
- **Fee Structure** — combines categories into a priced structure per class.
- **Assign Fee** — apply a structure to individual students or an entire class in one action, with per-student discounts.
- **Fee Collection** — select class → student → assigned fees auto-load → collect payment → receipt auto-generated. No manual receipt writing.
- Full **defaulter and collection reporting**, exportable to PDF/Excel.

#### 4.2.3 Attendance
- **Class-wise daily marking** — Present / Absent / Late / Half-Day, by class/section/date.
- **Geofenced attendance** — GPS boundary (via Leaflet maps) so check-ins can be restricted to school premises, a differentiator most budget school-ERP products don't offer.
- **Teacher & staff attendance** — separate flows for teaching and non-teaching staff, not just students.
- **Leave Management** — students/staff submit leave requests; admins approve/reject with remarks.
- **Attendance Analytics** — trend charts by class, month, or individual student, plus exportable reports.

#### 4.2.4 Exams & Grading
- Full exam lifecycle: **Create Exam → Schedule → Seat Plan → Admit Card → Enter Grades → Reports.**
- **Seat Plan** — auto-assigns seat numbers per exam hall.
- **Admit Card generation** — printable, student-specific admit cards.
- **Grade entry** — subject-wise mark entry per student, with pass/max marks validation.
- **Analytics** — pass/fail rates, top scorers, and subject-wise performance breakdowns per exam.
- Groundwork already exists for **online exams** (`OnlineExam`, `Questions`, `ExamAttempts` models) — a fast path to a full online-testing module.

#### 4.2.5 Payroll
- **Payslip generation** — select employee + month → system computes allowances and deductions → downloadable PDF payslip.
- **Monthly Payroll Report** — full disbursement view across all employees for a given month.
- Supporting models for **loans/advances, bonuses/incentives, and reimbursements** are already in place, not just base salary.

#### 4.2.6 Timetable
- Class/section timetable builder — assign subject + teacher to each period slot across the week.
- Once saved, the same timetable automatically surfaces on **teacher and student dashboards** — no duplicate data entry.

#### 4.2.7 Communication
- Unified **Send Notification** flow — SMS (Twilio), Email (Nodemailer), and in-app notifications from a single screen.
- **Targeted delivery** — by role (all teachers, all parents), by class, or platform-wide.
- Backed by dedicated `message` and `notification` models so history is queryable, not fire-and-forget.

#### 4.2.8 Transport
- Bus/vehicle registration with **route and stop management**.
- Student-to-route assignment, with transport-wise student lists for quick roll-call.
- **Vehicle maintenance tracking** (`VehicleMaintenance` model) — service history isn't an afterthought.

#### 4.2.9 Hostel
- **Room allocation** with live occupancy/availability view.
- **Hostel-specific attendance** separate from the main school attendance module.
- **Visitor log** — visitor name, purpose, check-in/check-out time.
- **Complaint management** — students/staff raise complaints, warden tracks In Progress/Resolved status.
- **Hostel leave** workflow distinct from general staff/student leave.

#### 4.2.10 Library
- Full catalog management with categories and borrowing limits.
- **Issue/return tracking** with due dates, and member-level borrow history for both students and staff.

#### 4.2.11 Inventory & Assets
- **Assets** — furniture, computers, projectors, etc., tracked as durable inventory.
- **Supplies** — consumables like stationery and lab supplies, tracked separately from durable assets.
- Backed by **Purchase Order** and **Vendor** models — this isn't just a static list, it supports a real procurement flow.

#### 4.2.12 Security & Safety
- **Gate Entry Register** — logs every entry/exit at the school gate.
- **Emergency Alert broadcast** — push urgent alerts platform-wide (recently rebuilt with filtering/search on the Security Dashboard).
- Purpose-built **Security** and **Receptionist** role portals, not a generic admin screen repurposed for the front desk.

#### 4.2.13 Billing & Subscriptions (SaaS Core)
- **Subscription Plans** — create Free/Basic/Premium tiers with different feature limits.
- **Razorpay integration** — live payment collection, invoices, and payment history per school.
- **Plan-change audit log** — every upgrade/downgrade is tracked, which matters for SaaS billing disputes and support.
- This is the module that turns the codebase from "a school's internal system" into **a sellable, multi-tenant SaaS product** — it's already built, not a roadmap promise.

#### 4.2.14 Platform Administration
- **Multi-school management** — Super Admin onboards, edits, and monitors every school on the platform from one place.
- **Audit Logs** — every action, by every user, is logged and filterable by date/user/action type.
- **Backup Management** — on-demand JSON snapshot backups, scheduled automatic backups, and restore — a compliance/trust feature schools specifically ask about.
- **IP Restriction & Two-Factor Authentication** — enterprise-grade access controls most budget competitors skip entirely.

#### 4.2.15 Reports & Analytics
- Virtually every list view across the platform (students, fees, attendance, exams) ships with **PDF/Excel export** built in.
- Role-scoped reporting — Super Admin sees platform-wide numbers, School Admin sees their school, Teacher sees their class — the same reporting engine, correctly permission-filtered.

---

## 5. Technical Architecture

**Backend**
- Node.js + Express, MongoDB via Mongoose (132 schemas)
- JWT authentication, Zod request validation, and three composable layers of RBAC — authenticated, role (`roleMiddleware`), and fine-grained module/action permissions carried on the Role document (`authorize(module, action)`)
- Security hardening: Helmet, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`
- Integrations: Razorpay (payments), Twilio (SMS), Cloudinary (media), Nodemailer (email), PDFKit + ExcelJS (exports)
- Scheduled jobs via `node-cron` (backups, recurring tasks)
- Automated tests: Jest + Supertest + in-memory MongoDB

**Frontend**
- React 19 + Vite, React Router v7
- Redux Toolkit + Redux Persist for state
- Ant Design, Material Tailwind, PrimeReact component ecosystem, Tailwind CSS
- React Hook Form + Zod for form validation
- Recharts / Ant Design Plots for analytics dashboards, Leaflet for maps (transport/geofencing)
- Dark/light theme support across the entire app

**Design principle:** every entity is scoped to a `school` from the ground up — this is what makes true multi-tenant SaaS delivery possible without re-architecture.

---

## 6. Maturity & Proof of Work

| Metric | Value |
|---|---|
| Development span | Oct 2024 – Aug 2026 (22 months, actively maintained) |
| Total commits | 1,133 |
| Backend | 44,028 LOC / 388 files |
| Frontend | 124,038 LOC / 455+ components |
| Database models | 143 |
| Controllers | 95 |
| Route groups | 94 |
| Role-based portals | 20+ |

Recent commits (last 7 days of history) refined the school-setup wizard (class/section/subject assignment), attendance date handling, and role-management UI — this is a live, evolving codebase, not an abandoned or frozen project.

---

## 7. Why Buy vs. Build

Building comparable scope from scratch — 20+ role-specific portals, 143 data models, billing integration, security hardening, and a tested backend — typically requires an experienced team **12–18+ months**. At typical offshore/blended development rates, replacement cost for equivalent scope commonly falls in the **tens of thousands of dollars** range before accounting for the market risk of a first release (bugs, missing edge cases, UX iteration) that this codebase has already absorbed through 22 months of real iteration.

Buying this asset converts that time-and-risk cost into a fixed, immediate acquisition — with a working product on day one.

*(This is a directional framework, not a formal valuation. A buyer should run their own cost/hour estimate against the LOC and module counts above.)*

---

## 8. Deal Structure

| Component | Included by default? |
|---|---|
| Full source code (backend + frontend) + git history | Yes |
| Documentation (user guide, role-wise guide) | Yes |
| Full IP transfer, no ongoing royalty | Yes (unless negotiated otherwise) |
| Mobile app (React Native/Expo, part of the same `main` codebase) | Optional add-on |
| Deployment / handover support (walkthrough sessions) | Optional add-on, negotiable |
| Live customer data, hosting, domain, third-party accounts | Not included — buyer provisions their own |

**Asking price:** ₹5,00,000 (INR 5 Lakh) — full source code, IP transfer, and documentation. Mobile app and handover/deployment support available as add-ons, negotiable.

---

## 9. Growth Roadmap (Upside for Buyer)

- **Mobile app store launch** — the Expo/React Native companion app is code-complete and merged into `main`; what remains is release engineering, not development: linking a real EAS project, real backend URLs in `eas.json`, store-ready icon/splash art, a privacy policy, and Apple/Google developer accounts (see `mobile/README.md`'s store-submission checklist).
- **Online exams / LMS** — groundwork already present (`OnlineExam` model, question bank), can be extended into a full LMS module.
- **White-label rollout** — multi-tenant architecture supports reselling under different school-group brands with minimal changes.
- **International payments** — Razorpay currently covers India; Stripe/PayPal integration would open international markets.
- **AI-driven features** — attendance/exam data already structured for predictive analytics (at-risk student flagging, auto-generated timetables).

---

## 10. Contact

**Sunil Kushwaha**
Email: sunilkushwaha066@gmail.com
Phone: +91 78276 75008

*Serious inquiries only. Code walkthrough and live demo available on request.*

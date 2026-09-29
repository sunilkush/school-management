/**
 * Builds the Upwork portfolio case study PDF.
 *
 *   node scripts/build-case-study.cjs
 *
 * Every figure in it was measured from this repo, not estimated. Re-run after the codebase grows
 * so the numbers on the PDF stay true.
 *
 * A case study, not the acquisition memorandum that already sits in the repo: the memo is aimed
 * at somebody buying the product ("Deal Structure", "Why Buy vs Build"), and an Upwork client is
 * there to hire a developer. Putting the memo on a portfolio reads as "this person is selling
 * their product", not "this person can build mine".
 */

const PDFDocument = require("../backend/node_modules/pdfkit");
const fs = require("fs");

const OUT = require("path").join(__dirname, "..", "EduManage-Case-Study.pdf");

/* ── palette ── */
const INK = "#16181D";
const BODY = "#3C4149";
const MUTED = "#767D8A";
const ACCENT = "#5B5BD6";
const RULE = "#E3E5EA";
const TINT = "#F4F4FB";

const M = 56; // margin
const doc = new PDFDocument({
  size: "A4",
  // Required for switchToPage below; without it the footer pass cannot revisit pages.
  bufferPages: true,
  margins: { top: M, bottom: M, left: M, right: M },
  info: {
    Title: "EduManage — Multi-Tenant School ERP · Case Study",
    Author: "Sunil Kushwaha",
    Subject: "Full-stack case study: multi-tenant school management SaaS",
    Keywords: "MERN, React, Node.js, MongoDB, SaaS, multi-tenant, school ERP",
  },
});
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width - M * 2;

/* ── helpers ── */
const gap = (n) => doc.moveDown(n);

/** Start a new page unless `need` points of vertical space remain. */
const ensure = (need) => {
  if (doc.y + need > doc.page.height - M - 26) doc.addPage();
};

const h1 = (text) => {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(19).text(text);
  doc.moveDown(0.45);
};

const h2 = (text) => {
  ensure(74);
  doc.moveDown(0.6);
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(9.5)
    .text(text.toUpperCase(), { characterSpacing: 1.1 });
  doc.moveDown(0.3);
  const y = doc.y;
  doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.6).strokeColor(RULE).stroke();
  doc.moveDown(0.55);
};

const p = (text, opts = {}) => {
  doc.fillColor(opts.color || BODY).font(opts.font || "Helvetica")
    .fontSize(opts.size || 9.3)
    .text(text, { align: "left", lineGap: 2.2, ...opts });
  doc.moveDown(opts.after ?? 0.38);
};

/** A labelled bullet: bold lead-in, then the rest on the same paragraph. */
const bullet = (lead, rest) => {
  const x = M + 11;
  const startY = doc.y;
  doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(9.3).text("•", M + 1, startY, { width: 10 });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.3)
    .text(lead, x, startY, { width: W - 11, continued: true });
  doc.fillColor(BODY).font("Helvetica").text(rest === undefined ? "" : ` ${rest}`, { lineGap: 2.1 });
  doc.moveDown(0.24);
  doc.x = M;
};

/* A row of stat cards. */
const stats = (items) => {
  const h = 46;
  ensure(h + 16);
  const gapX = 9;
  const w = (W - gapX * (items.length - 1)) / items.length;
  const y = doc.y;
  items.forEach((it, i) => {
    const x = M + i * (w + gapX);
    doc.roundedRect(x, y, w, h, 5).fillColor(TINT).fill();
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(14)
      .text(it.value, x, y + 9, { width: w, align: "center" });
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.4)
      .text(it.label.toUpperCase(), x, y + 28, { width: w, align: "center", characterSpacing: 0.5 });
  });
  doc.y = y + h + 12;
  doc.x = M;
};

/* Two-column module list. */
const twoCol = (rows) => {
  ensure(150);
  const colW = (W - 18) / 2;
  const startY = doc.y;
  let leftY = startY;
  let rightY = startY;
  rows.forEach((r, i) => {
    const left = i % 2 === 0;
    const x = left ? M : M + colW + 18;
    const y = left ? leftY : rightY;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(r.title, x, y, { width: colW });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.3)
      .text(r.body, x, doc.y + 1, { width: colW, lineGap: 1.6 });
    const endY = doc.y + 9;
    if (left) leftY = endY; else rightY = endY;
  });
  doc.y = Math.max(leftY, rightY);
  doc.x = M;
};

/* ═══════════════ PAGE 1 ═══════════════ */

doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8.5)
  .text("FULL-STACK CASE STUDY", { characterSpacing: 1.3 });
gap(0.35);
doc.fillColor(INK).font("Helvetica-Bold").fontSize(25).text("Multi-Tenant School ERP");
gap(0.2);
doc.fillColor(MUTED).font("Helvetica").fontSize(10.5)
  .text("One platform running an entire group of schools — each isolated, each on its own plan.");
gap(0.5);
doc.fillColor(MUTED).font("Helvetica").fontSize(8.6)
  .text("Sunil Kushwaha  ·  Full Stack Developer (MERN)  ·  Oct 2024 – Sep 2026");
gap(1.1);

stats([
  { value: "210K+", label: "lines of code" },
  { value: "1,284", label: "commits" },
  { value: "165", label: "data models" },
  { value: "108", label: "API modules" },
  { value: "327", label: "screens" },
]);

h2("The problem");
p("Private schools run admissions on paper, fees in a cash book, attendance in registers and payroll in spreadsheets. Nothing reconciles. A principal asking how much fee is outstanding this month, or which students are below 75% attendance, cannot answer it without a week of manual collation.");
p("Off-the-shelf ERPs are priced per school and sold as single-tenant installs, so a group running several branches ends up with several disconnected systems and no consolidated view.");

h2("What I built");
p("A multi-tenant SaaS platform where one deployment serves unlimited schools. Every record is scoped to its school; each gets its own administrator, roles, academic year and subscription, and none can see another's data. I built it end to end — database design, API, web app, React Native companion app, payments and deployment — in continuous development since October 2024.");

gap(0.3);
bullet("Tenant isolation", "enforced at the query layer, not the UI — every controller resolves the caller's school from their token, and a hand-crafted request for another school's data is refused rather than filtered.");
bullet("Role-based access", "across 24 roles from Super Admin to Parent. Each has its own dashboard and navigation tree, not one admin panel with fields hidden.");
bullet("Subscription billing", "with plan-based module gating — a school that has not bought the Transport module sees it locked, with an upgrade path, rather than missing.");

/* ═══════════════ PAGE 2 ═══════════════ */
doc.addPage();

h1("Modules");
p("Fifteen functional areas, each a working workflow rather than a CRUD screen.", { color: MUTED, size: 9.2, after: 0.8 });

twoCol([
  { title: "Admissions & Student Lifecycle", body: "Inquiry tracking, multi-step admission with live roll-number preview, document upload, bulk promotion between academic years." },
  { title: "Attendance", body: "GPS geofencing for staff check-in, biometric/RFID device integration, auto-checkout job, configurable late-grace window." },
  { title: "Fees & Finance", body: "Fee heads, per-class structures, instalment schedules, concessions, late fines, Razorpay collection with webhook reconciliation, PDF receipts." },
  { title: "Payroll", body: "Salary structures, monthly runs, payslip generation, advances, bonuses, reimbursements, PF/ESI reports." },
  { title: "Examinations", body: "Exam scheduling, seat plans, admit cards, marks entry, grading scales, report cards from configurable templates, analytics." },
  { title: "Transport", body: "Routes, vehicles, driver assignment, live GPS bus tracking on a Leaflet map, maintenance and fuel logs." },
  { title: "Library", body: "Catalogue, issue and return, fines, member activity, per-school lending rules." },
  { title: "Hostel", body: "Blocks, rooms, bed allocation, hostel attendance, leave and visitor logs, complaints." },
  { title: "HR", body: "Employee records, departments, designations, leave workflow, recruitment pipeline, appraisal cycles." },
  { title: "Communication", body: "In-app notifications, SMS via Twilio, email via SMTP, push via Firebase, circulars with read receipts." },
  { title: "Inventory & Procurement", body: "Items, vendors, purchase orders, stock issue, asset tracking, AMC schedules." },
  { title: "Compliance", body: "UDISE+ identifiers, RTE quota tracking, readiness reporting showing exactly which records are incomplete." },
]);

h2("Engineering decisions worth calling out");

bullet("Money is never recomputed on read.", "An issued fee receipt stores the figures it was issued with. Changing a fee structure later reprices the next student, not one already invoiced.");
bullet("Instalments always sum to the total.", "Splitting a fee three ways rounds every part down and lets the last carry the remainder — otherwise the bill is short by a rupee and never clears.");
bullet("Absent is not zero.", "An unmarked paper and a paper scored zero are stored differently, so a student who has not sat an exam is never reported as having failed it.");
bullet("Role assignment is server-enforced.", "A School Admin cannot mint a Super Admin by posting a role id they can read — the API refuses roles outside their own school.");
bullet("Security throughout.", "JWT with refresh rotation, 2FA/OTP, bcrypt, rate limiting, helmet, Mongo injection and XSS sanitisation, IP restriction, and an audit log on every mutation.");

/* ═══════════════ PAGE 3 ═══════════════ */
doc.addPage();

h1("Technical architecture");
gap(0.3);

const techRow = (label, value) => {
  const y = doc.y;
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8.2)
    .text(label.toUpperCase(), M, y, { width: 96, characterSpacing: 0.6 });
  doc.fillColor(BODY).font("Helvetica").fontSize(9.3)
    .text(value, M + 104, y, { width: W - 104, lineGap: 2 });
  doc.moveDown(0.55);
  doc.x = M;
};

techRow("Frontend", "React 19, Redux Toolkit, Ant Design, React Router 7, Recharts, Leaflet, Vite. 327 screens across 24 role-driven navigation trees.");
techRow("Backend", "Node.js, Express, MongoDB with Mongoose. 165 models, 113 controllers, 108 route modules, aggregation pipelines for every report.");
techRow("Mobile", "React Native / Expo companion app sharing the same API.");
techRow("Payments", "Razorpay — per-school merchant credentials, checkout, and HMAC-verified webhooks reconciled against raw request bytes.");
techRow("Integrations", "Twilio (SMS), Firebase Admin (push), Nodemailer (email), Cloudinary (media), PDFKit (receipts, ID cards, report cards), ExcelJS (exports).");
techRow("Jobs", "node-cron for subscription expiry, fee-overdue notices, auto-checkout and PTM reminders.");

h2("Scale of the work");
gap(0.2);
stats([
  { value: "23", label: "months" },
  { value: "1,284", label: "commits" },
  { value: "1,153", label: "source files" },
  { value: "24", label: "roles" },
]);
p("The commit history is incremental and continuous — this was built and iterated in production conditions, not generated in a weekend.", { color: MUTED, size: 9 });

h2("What this demonstrates");
p("If you are hiring for a product that needs more than screens on a database: multi-tenancy at the data layer, money that reconciles, permissions that hold when someone pokes at the API, and a codebase that stayed maintainable across two years and a thousand commits.");

gap(0.7);
ensure(70);
const boxY = doc.y;
doc.roundedRect(M, boxY, W, 58, 6).fillColor(TINT).fill();
doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5)
  .text("Available for similar work", M + 16, boxY + 13, { width: W - 32 });
doc.fillColor(BODY).font("Helvetica").fontSize(9)
  .text("Multi-tenant SaaS · payment and billing systems · role-based platforms · MERN applications at scale",
    M + 16, boxY + 30, { width: W - 32 });
doc.y = boxY + 58;

/* ── footer on every page ── */
/* The footer sits below the bottom margin, and PDFKit adds a page whenever text is placed
   past it — which is what turned a three-page document into five. Dropping the bottom margin
   for the footer pass stops that; it is restored afterwards. */
const bottomMargin = doc.page.margins.bottom;
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i += 1) {
  doc.switchToPage(i);
  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 38;
  doc.moveTo(M, fy - 8).lineTo(M + W, fy - 8).lineWidth(0.5).strokeColor(RULE).stroke();
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.6)
    .text("Multi-Tenant School ERP — Case Study", M, fy, { width: W / 2 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.6)
    .text(`${i + 1} / ${range.count}`, M + W / 2, fy, { width: W / 2, align: "right" });
}

doc.page.margins.bottom = bottomMargin;
doc.flushPages();
doc.end();
console.log("written:", OUT);

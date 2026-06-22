/**
 * Demo Seed Script — ADDITIVE (never deletes existing data)
 * Run: cd backend && npm run seed
 * Demo password for all new users: Demo@123
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ── Import real models ────────────────────────────────────────────────────────
import { Role } from "./models/Roles.model.js";
import { School } from "./models/school.model.js";
import { AcademicYear } from "./models/AcademicYear.model.js";
import { SchoolClass } from "./models/schoolClass.model.js";
import { Section } from "./models/section.model.js";
import { Subject } from "./models/subject.model.js";
import { User } from "./models/user.model.js";
import { Student } from "./models/student.model.js";
import { StudentEnrollment } from "./models/StudentEnrollment.model.js";
import { Exam } from "./models/Exam.model.js";
import { LessonPlan } from "./models/LessonPlan.model.js";
import { SupportTicket } from "./models/SupportTicket.model.js";
import { SchoolEvent } from "./models/SchoolEvent.model.js";
import { Notification } from "./models/notification.model.js";
import ActivityLog from "./models/ActivityLog.model.js";
import MaintenanceTask from "./models/MaintenanceTask.model.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const hash = (pwd) => bcrypt.hash(pwd, 10);
const ok   = (msg) => console.log(`  ✓ ${msg}`);
const skip = (msg) => console.log(`  - ${msg}`);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function daysAgo(n) { return daysFromNow(-n); }
function setHour(date, h, m = 0) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGOOSE_URI;
  if (!uri) throw new Error("MONGOOSE_URI missing in .env");

  // Connect the same way the app does (matches existing data in "test" db on Atlas)
  await mongoose.connect(`${uri}/school_management`);
  console.log("\n🌱 MongoDB connected — starting ADDITIVE seed...\n");

  // ── 1. Find school ──────────────────────────────────────────────────────────
  const school = await School.findOne({ isActive: true });
  if (!school) throw new Error("No active school found. Start the app first.");
  ok(`School: ${school.name}`);
  const schoolId = school._id;

  // ── 2. Roles ────────────────────────────────────────────────────────────────
  const roles = await Role.find({ isActive: true });
  const roleMap = {};
  roles.forEach((r) => { roleMap[r.name] = r._id; });
  ok(`Roles loaded: ${roles.length}`);

  // ── 3. Admin user (School Admin) ────────────────────────────────────────────
  const admin = await User.findOne({ schoolId, roleId: roleMap["School Admin"] });
  if (!admin) throw new Error("No School Admin found. Aborting.");
  ok(`Admin: ${admin.name}`);
  const adminId = admin._id;

  // ── 4. Academic Year 2025-2026 ──────────────────────────────────────────────
  let ay = await AcademicYear.findOne({ schoolId, name: "2025-2026" });
  if (!ay) {
    ay = new AcademicYear({ schoolId, startDate: new Date("2025-04-01"), endDate: new Date("2026-03-31"), isActive: true, status: "active" });
    await ay.save();
    ok("Academic year 2025-2026 created");
  } else {
    skip("Academic year 2025-2026 already exists");
  }
  const ayId = ay._id;

  // ── 5. Classes & Subjects ───────────────────────────────────────────────────
  const classes  = await SchoolClass.find({ schoolId }).sort({ name: 1 });
  const subjects = await Subject.find({ $or: [{ schoolId }, { schoolId: null }] }).limit(20);
  if (!classes.length)  throw new Error("No classes found. Run app first.");
  if (!subjects.length) throw new Error("No subjects found. Run app first.");
  ok(`Classes: ${classes.length}, Subjects: ${subjects.length}`);

  const targetClasses = classes.slice(0, 6);

  // ── 6. Sections ─────────────────────────────────────────────────────────────
  const sectionMap = {}; // classId → [secA, secB]
  for (const cls of targetClasses) {
    sectionMap[String(cls._id)] = [];
    for (const sName of ["A", "B"]) {
      // Find by class+name only (old unique index may not include academicYearId)
      let sec = await Section.findOne({ schoolClassId: cls._id, name: sName });
      if (!sec) {
        try {
          sec = await Section.create({ schoolId, schoolClassId: cls._id, academicYearId: ayId, name: sName, capacity: 40 });
        } catch (e) {
          if (e.code === 11000) {
            // Race / pre-existing — fetch it
            sec = await Section.findOne({ schoolClassId: cls._id, name: sName });
          } else { throw e; }
        }
      }
      if (sec) sectionMap[String(cls._id)].push(sec);
    }
  }
  ok(`Sections ready for ${targetClasses.length} classes`);

  // ── 7. Demo password ─────────────────────────────────────────────────────────
  const demoPwd = await hash("Demo@123");

  // ── 8. Teachers ──────────────────────────────────────────────────────────────
  const teacherDefs = [
    { name: "Rajesh Kumar",  email: "rajesh.kumar@dps.demo",  phone: "9811001001", regId: "TCH001" },
    { name: "Priya Sharma",  email: "priya.sharma@dps.demo",  phone: "9811001002", regId: "TCH002" },
    { name: "Amit Singh",    email: "amit.singh@dps.demo",    phone: "9811001003", regId: "TCH003" },
    { name: "Sunita Verma",  email: "sunita.verma@dps.demo",  phone: "9811001004", regId: "TCH004" },
    { name: "Deepak Joshi",  email: "deepak.joshi@dps.demo",  phone: "9811001005", regId: "TCH005" },
  ];

  const teachers = [];
  if (roleMap["Teacher"]) {
    for (const t of teacherDefs) {
      let u = await User.findOne({ email: t.email });
      if (!u) u = await User.create({ ...t, password: demoPwd, roleId: roleMap["Teacher"], schoolId });
      teachers.push(u);
    }
    ok(`Teachers: ${teachers.length}`);
  }

  // ── 9. Staff ─────────────────────────────────────────────────────────────────
  const staffDefs = [
    { name: "Ramesh Gupta",     email: "accountant@dps.demo",    role: "Accountant",   regId: "STF001" },
    { name: "Meena Kumari",     email: "librarian@dps.demo",     role: "Librarian",    regId: "STF002" },
    { name: "Vikram Pandey",    email: "itsupport@dps.demo",     role: "IT Support",   regId: "STF003" },
    { name: "Kavita Rao",       email: "counselor@dps.demo",     role: "Counselor",    regId: "STF004" },
    { name: "Suresh Mishra",    email: "receptionist@dps.demo",  role: "Receptionist", regId: "STF005" },
    { name: "Bharat Tiwari",    email: "security@dps.demo",      role: "Security",     regId: "STF006" },
  ];

  const staffMap = {};
  for (const s of staffDefs) {
    if (!roleMap[s.role]) continue;
    let u = await User.findOne({ email: s.email });
    if (!u) u = await User.create({ name: s.name, email: s.email, regId: s.regId, password: demoPwd, roleId: roleMap[s.role], schoolId });
    staffMap[s.role] = u;
  }
  ok(`Staff users: ${Object.keys(staffMap).length}`);

  // ── 10. Students + Parents ───────────────────────────────────────────────────
  const studentDefs = [
    { name: "Aarav Sharma",      email: "aarav.s@dps.demo",     gender: "Male",   dob: "2012-03-15", blood: "O+",  addr: "12 MG Road, Delhi",    fName: "Ramesh Sharma",   fMob: "9800001001", clsIdx: 0, sec: "A", reg: "DPS2526001" },
    { name: "Diya Patel",        email: "diya.p@dps.demo",      gender: "Female", dob: "2012-07-22", blood: "A+",  addr: "45 CP, Delhi",          fName: "Suresh Patel",    fMob: "9800001002", clsIdx: 0, sec: "A", reg: "DPS2526002" },
    { name: "Rohan Mehta",       email: "rohan.m@dps.demo",     gender: "Male",   dob: "2012-11-08", blood: "B+",  addr: "78 Karol Bagh, Delhi",  fName: "Anil Mehta",      fMob: "9800001003", clsIdx: 0, sec: "B", reg: "DPS2526003" },
    { name: "Ananya Gupta",      email: "ananya.g@dps.demo",    gender: "Female", dob: "2012-01-30", blood: "AB+", addr: "33 Lajpat Nagar",       fName: "Vinod Gupta",     fMob: "9800001004", clsIdx: 0, sec: "B", reg: "DPS2526004" },
    { name: "Karan Singh",       email: "karan.si@dps.demo",    gender: "Male",   dob: "2011-05-17", blood: "O-",  addr: "19 Dwarka, Delhi",      fName: "Gurpreet Singh",  fMob: "9800001005", clsIdx: 1, sec: "A", reg: "DPS2526005" },
    { name: "Shruti Yadav",      email: "shruti.y@dps.demo",    gender: "Female", dob: "2011-09-12", blood: "A-",  addr: "55 Pitampura, Delhi",   fName: "Mahesh Yadav",    fMob: "9800001006", clsIdx: 1, sec: "A", reg: "DPS2526006" },
    { name: "Arjun Verma",       email: "arjun.v@dps.demo",     gender: "Male",   dob: "2011-12-03", blood: "B-",  addr: "88 Rohini, Delhi",      fName: "Deepak Verma",    fMob: "9800001007", clsIdx: 1, sec: "B", reg: "DPS2526007" },
    { name: "Pooja Mishra",      email: "pooja.mi@dps.demo",    gender: "Female", dob: "2011-04-25", blood: "O+",  addr: "22 Mayur Vihar",        fName: "Rakesh Mishra",   fMob: "9800001008", clsIdx: 1, sec: "B", reg: "DPS2526008" },
    { name: "Vikram Joshi",      email: "vikram.j@dps.demo",    gender: "Male",   dob: "2010-08-14", blood: "A+",  addr: "67 Vaishali, NCR",      fName: "Naresh Joshi",    fMob: "9800001009", clsIdx: 2, sec: "A", reg: "DPS2526009" },
    { name: "Priya Tiwari",      email: "priya.ti@dps.demo",    gender: "Female", dob: "2010-02-19", blood: "B+",  addr: "14 Indirapuram, Gzb",   fName: "Sanjay Tiwari",   fMob: "9800001010", clsIdx: 2, sec: "A", reg: "DPS2526010" },
    { name: "Sahil Khan",        email: "sahil.k@dps.demo",     gender: "Male",   dob: "2010-06-28", blood: "O+",  addr: "91 Okhla, Delhi",       fName: "Imran Khan",      fMob: "9800001011", clsIdx: 2, sec: "B", reg: "DPS2526011" },
    { name: "Neha Agarwal",      email: "neha.a@dps.demo",      gender: "Female", dob: "2010-10-05", blood: "AB-", addr: "36 Saket, Delhi",       fName: "Pankaj Agarwal",  fMob: "9800001012", clsIdx: 2, sec: "B", reg: "DPS2526012" },
    { name: "Rahul Dubey",       email: "rahul.du@dps.demo",    gender: "Male",   dob: "2009-03-22", blood: "B+",  addr: "73 GK-1, Delhi",        fName: "Arvind Dubey",    fMob: "9800001013", clsIdx: 3, sec: "A", reg: "DPS2526013" },
    { name: "Simran Kaur",       email: "simran.k@dps.demo",    gender: "Female", dob: "2009-07-16", blood: "O+",  addr: "28 Punjabi Bagh",       fName: "Harjinder Kaur",  fMob: "9800001014", clsIdx: 3, sec: "A", reg: "DPS2526014" },
    { name: "Manish Saxena",     email: "manish.s@dps.demo",    gender: "Male",   dob: "2009-11-29", blood: "A+",  addr: "52 Janakpuri, Delhi",   fName: "Vivek Saxena",    fMob: "9800001015", clsIdx: 3, sec: "B", reg: "DPS2526015" },
    { name: "Anjali Pandey",     email: "anjali.p@dps.demo",    gender: "Female", dob: "2009-01-08", blood: "B-",  addr: "17 Uttam Nagar",        fName: "Rajiv Pandey",    fMob: "9800001016", clsIdx: 3, sec: "B", reg: "DPS2526016" },
    { name: "Nikhil Sinha",      email: "nikhil.si@dps.demo",   gender: "Male",   dob: "2008-05-11", blood: "O-",  addr: "64 Tilak Nagar",        fName: "Sunil Sinha",     fMob: "9800001017", clsIdx: 4, sec: "A", reg: "DPS2526017" },
    { name: "Tanisha Chaudhary", email: "tanisha.c@dps.demo",   gender: "Female", dob: "2008-09-04", blood: "A-",  addr: "39 Dwarka Sec-10",      fName: "Mohit Chaudhary", fMob: "9800001018", clsIdx: 4, sec: "A", reg: "DPS2526018" },
    { name: "Ayush Rawat",       email: "ayush.r@dps.demo",     gender: "Male",   dob: "2008-12-17", blood: "B+",  addr: "85 Palam, Delhi",       fName: "Dinesh Rawat",    fMob: "9800001019", clsIdx: 4, sec: "B", reg: "DPS2526019" },
    { name: "Swati Nair",        email: "swati.n@dps.demo",     gender: "Female", dob: "2008-04-02", blood: "O+",  addr: "21 Vasant Kunj",        fName: "Rajan Nair",      fMob: "9800001020", clsIdx: 4, sec: "B", reg: "DPS2526020" },
  ];

  let studentCount = 0;
  if (roleMap["Student"] && roleMap["Parent"]) {
    for (const d of studentDefs) {
      const cls = targetClasses[d.clsIdx];
      if (!cls) continue;
      const secs = sectionMap[String(cls._id)] || [];
      const sec  = secs.find((s) => s.name === d.sec) || secs[0];
      if (!sec) continue;

      const parentEmail = `parent.${d.email.split("@")[0]}@dps.demo`;
      let parentUser = await User.findOne({ email: parentEmail });
      if (!parentUser) parentUser = await User.create({ name: d.fName, email: parentEmail, phone: d.fMob, password: demoPwd, roleId: roleMap["Parent"], schoolId });

      let stuUser = await User.findOne({ email: d.email });
      if (!stuUser) stuUser = await User.create({ name: d.name, email: d.email, password: demoPwd, roleId: roleMap["Student"], schoolId });

      let stuProfile = await Student.findOne({ userId: stuUser._id });
      if (!stuProfile) {
        stuProfile = await Student.create({ userId: stuUser._id, schoolId, dateOfBirth: new Date(d.dob), gender: d.gender, bloodGroup: d.blood, address: d.addr, fatherId: parentUser._id, fatherInfo: { name: d.fName, mobile: d.fMob, email: parentEmail } });
      }

      const enrollExists = await StudentEnrollment.findOne({ studentId: stuProfile._id, academicYearId: ayId, schoolId });
      if (!enrollExists) {
        await StudentEnrollment.create({ studentId: stuProfile._id, schoolId, academicYearId: ayId, registrationNumber: d.reg, schoolClassId: cls._id, sectionId: sec._id, createdBy: adminId });
        studentCount++;
      }
    }
    ok(`Students enrolled: ${studentCount} new`);
  }

  // ── 11. Exams ────────────────────────────────────────────────────────────────
  const examDefs = [
    { title: "Unit Test 1 – Mathematics",      subIdx: 0, clsIdx: 0, daysOffset: -45, type: "Unit Test", status: "completed" },
    { title: "Unit Test 1 – Science",          subIdx: 1, clsIdx: 0, daysOffset: -40, type: "Unit Test", status: "completed" },
    { title: "Mid Term – English",             subIdx: 2, clsIdx: 1, daysOffset: -20, type: "Mid Term",  status: "completed" },
    { title: "Mid Term – Mathematics",         subIdx: 0, clsIdx: 1, daysOffset: -18, type: "Mid Term",  status: "completed" },
    { title: "Mid Term – Science",             subIdx: 1, clsIdx: 2, daysOffset: -15, type: "Mid Term",  status: "completed" },
    { title: "Unit Test 2 – Social Studies",   subIdx: 3, clsIdx: 2, daysOffset: -8,  type: "Unit Test", status: "published" },
    { title: "Unit Test 2 – Hindi",            subIdx: 4, clsIdx: 3, daysOffset: -4,  type: "Unit Test", status: "published" },
    { title: "Pre-Board – Mathematics",        subIdx: 0, clsIdx: 3, daysOffset: 12,  type: "Pre-Board", status: "published" },
    { title: "Pre-Board – Science",            subIdx: 1, clsIdx: 4, daysOffset: 18,  type: "Pre-Board", status: "published" },
    { title: "Annual Exam – Mathematics",      subIdx: 0, clsIdx: 5, daysOffset: 35,  type: "Annual",    status: "published" },
    { title: "Annual Exam – English",          subIdx: 2, clsIdx: 5, daysOffset: 40,  type: "Annual",    status: "published" },
    { title: "Annual Exam – Science",          subIdx: 1, clsIdx: 4, daysOffset: 45,  type: "Annual",    status: "published" },
  ];

  let examCount = 0;
  for (const e of examDefs) {
    const cls = classes[e.clsIdx];
    const sub = subjects[e.subIdx];
    if (!cls || !sub) continue;
    const exists = await Exam.findOne({ schoolId, title: e.title, schoolClassId: cls._id });
    if (!exists) {
      const examDate  = daysFromNow(e.daysOffset);
      const startTime = setHour(examDate, 9);
      const endTime   = setHour(examDate, 11);
      await Exam.create({ academicYearId: ayId, schoolId, title: e.title, examCode: `EX${Date.now().toString().slice(-6)}`, schoolClassId: cls._id, subjectId: sub._id, examType: e.type, examDate, startTime, endTime, durationMinutes: 120, totalMarks: 100, passingMarks: 35, questions: [], settings: { negativeMarking: 0, allowPartialScoring: false, maxAttempts: 1 }, createdBy: adminId, status: e.status });
      examCount++;
    }
  }
  ok(`Exams created: ${examCount}`);

  // ── 12. Lesson Plans ─────────────────────────────────────────────────────────
  const planDefs = [
    { title: "Introduction to Algebra",           sub: 0, cls: 0, tch: 0, daysOffset: -30, status: "completed", methods: ["Lecture", "Examples"],         resources: ["Textbook", "Whiteboard"] },
    { title: "Quadratic Equations",               sub: 0, cls: 0, tch: 0, daysOffset: -20, status: "completed", methods: ["Problem Solving"],             resources: ["Textbook"] },
    { title: "Linear Equations in 2 Variables",   sub: 0, cls: 1, tch: 0, daysOffset: -15, status: "completed", methods: ["Lecture", "Group Work"],       resources: ["Graph Paper"] },
    { title: "Photosynthesis Process",            sub: 1, cls: 0, tch: 1, daysOffset: -25, status: "completed", methods: ["Demonstration"],               resources: ["Lab Equipment"] },
    { title: "Cell Division – Mitosis",           sub: 1, cls: 1, tch: 1, daysOffset: -10, status: "approved",  methods: ["Slides", "Video"],             resources: ["Microscope"] },
    { title: "Newton's Laws of Motion",           sub: 1, cls: 2, tch: 1, daysOffset: -5,  status: "approved",  methods: ["Lab", "Theory"],               resources: ["Lab Kit"] },
    { title: "The Tempest – Act 1",               sub: 2, cls: 0, tch: 2, daysOffset: -18, status: "completed", methods: ["Reading", "Discussion"],       resources: ["Novel"] },
    { title: "Grammar – Tenses Review",           sub: 2, cls: 1, tch: 2, daysOffset: -8,  status: "approved",  methods: ["Exercises"],                   resources: ["Workbook"] },
    { title: "Essay Writing Skills",              sub: 2, cls: 2, tch: 2, daysOffset: 5,   status: "draft",     methods: ["Practice"],                    resources: ["Sample Essays"] },
    { title: "French Revolution",                 sub: 3, cls: 2, tch: 3, daysOffset: -12, status: "completed", methods: ["Lecture", "Map Work"],         resources: ["Atlas", "Textbook"] },
    { title: "Indian Independence Movement",      sub: 3, cls: 3, tch: 3, daysOffset: -3,  status: "approved",  methods: ["Discussion", "Timeline"],      resources: ["Photos", "Book"] },
    { title: "Water Resources Management",        sub: 3, cls: 4, tch: 3, daysOffset: 8,   status: "draft",     methods: ["Project"],                     resources: ["Internet"] },
    { title: "Hindi Vyakaran – Sandhi",           sub: 4, cls: 0, tch: 4, daysOffset: -22, status: "completed", methods: ["Lecture"],                     resources: ["Grammar Book"] },
    { title: "Kabir ke Dohe",                     sub: 4, cls: 1, tch: 4, daysOffset: -7,  status: "approved",  methods: ["Recitation", "Discussion"],    resources: ["Poetry Book"] },
    { title: "Nibandh Lekhan",                    sub: 4, cls: 2, tch: 4, daysOffset: 12,  status: "draft",     methods: ["Practice Writing"],            resources: ["Sample Nibandhs"] },
  ];

  let planCount = 0;
  if (teachers.length > 0) {
    for (const p of planDefs) {
      const cls = targetClasses[p.cls];
      const sub = subjects[p.sub];
      const tch = teachers[p.tch];
      if (!cls || !sub || !tch) continue;
      const secs = sectionMap[String(cls._id)] || [];
      const sec  = secs[0];
      if (!sec) continue;
      const exists = await LessonPlan.findOne({ schoolId, title: p.title, teacherId: tch._id });
      if (!exists) {
        await LessonPlan.create({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, subjectId: sub._id, teacherId: tch._id, title: p.title, objectives: `Students will understand ${p.title.toLowerCase()}`, content: `Detailed lesson content for: ${p.title}`, teachingMethods: p.methods, resources: p.resources, assessment: "Class test + homework", plannedDate: daysFromNow(p.daysOffset), duration: 45, status: p.status });
        planCount++;
      }
    }
  }
  ok(`Lesson Plans created: ${planCount}`);

  // ── 13. Support Tickets ──────────────────────────────────────────────────────
  const reporter    = teachers[0] || admin;
  const itUser      = staffMap["IT Support"] || admin;
  const ticketDefs  = [
    { title: "Projector not working in Room 12",    desc: "Projector in Room 12 stopped displaying. Need urgent fix before tomorrow.", cat: "Technical", priority: "High",   status: "Open",        daysAgoN: 3  },
    { title: "Printer paper jam – Admin Block",     desc: "HP LaserJet showing paper jam error repeatedly in admin office.",            cat: "Technical", priority: "Medium", status: "In Progress", daysAgoN: 5  },
    { title: "Student fee receipt not generating",  desc: "PDF export fails for students admitted after April 2025.",                   cat: "Finance",   priority: "High",   status: "In Progress", daysAgoN: 7  },
    { title: "Library catalog system down",         desc: "Library system shows 'connection refused' error since morning.",             cat: "Technical", priority: "Urgent", status: "Open",        daysAgoN: 1  },
    { title: "Attendance report showing wrong data",desc: "Monthly attendance report wrong absent count for Class 8B.",                 cat: "Academic",  priority: "Medium", status: "Open",        daysAgoN: 2  },
    { title: "WiFi issue in Computer Lab 2",        desc: "Students in Lab 2 unable to connect to school WiFi since Monday.",          cat: "Technical", priority: "High",   status: "Resolved",    daysAgoN: 10 },
    { title: "CCTV camera 3 offline",              desc: "Camera near main gate offline. Security concern needs urgent attention.",    cat: "Technical", priority: "Urgent", status: "Resolved",    daysAgoN: 12 },
    { title: "Email notifications not sending",     desc: "Automated exam-result emails not reaching parents.",                        cat: "Technical", priority: "High",   status: "Open",        daysAgoN: 4  },
    { title: "Transport GPS not updating",          desc: "GPS tracker for Bus Route 3 stopped live location updates.",                cat: "Transport", priority: "Medium", status: "In Progress", daysAgoN: 6  },
    { title: "Request for classroom furniture",     desc: "Class 10A needs 5 additional chairs and 2 desks.",                         cat: "General",   priority: "Low",    status: "Open",        daysAgoN: 8  },
  ];

  let ticketCount = 0;
  for (const t of ticketDefs) {
    const exists = await SupportTicket.findOne({ schoolId, title: t.title });
    if (!exists) {
      await SupportTicket.create({
        schoolId,
        title: t.title,
        description: t.desc,
        category: t.cat,
        priority: t.priority,
        status: t.status,
        createdBy: reporter._id,
        assignedTo: itUser._id,
        resolvedBy: t.status === "Resolved" ? itUser._id : null,
        resolvedAt: t.status === "Resolved" ? daysAgo(t.daysAgoN - 2) : null,
        updates: t.status !== "Open"
          ? [{ note: "Team is working on this issue", updatedBy: itUser._id, updatedAt: daysAgo(Math.max(1, t.daysAgoN - 1)) }]
          : [],
      });
      ticketCount++;
    }
  }
  ok(`Support Tickets created: ${ticketCount}`);

  // ── 14. School Events ─────────────────────────────────────────────────────────
  const eventDefs = [
    { title: "Annual Sports Day 2025",          type: "Activity", desc: "Annual inter-house sports competition for all students.", location: "School Ground",     audience: "All",      start: daysFromNow(20), end: daysFromNow(21), color: "#FF6B35" },
    { title: "Independence Day Celebration",    type: "Holiday",  desc: "National Independence Day flag hoisting & cultural programs.", location: "Assembly Ground", audience: "All",      start: daysFromNow(55), end: daysFromNow(55), color: "#F7931E" },
    { title: "Parent-Teacher Meeting – July",   type: "Meeting",  desc: "Quarterly PTM for Classes 6–10. Attendance compulsory.",    location: "Classrooms",      audience: "Parents",  start: daysFromNow(15), end: daysFromNow(15), color: "#6B48FF" },
    { title: "Science Exhibition 2025",         type: "Activity", desc: "Inter-class science project exhibition.",                   location: "School Hall",     audience: "All",      start: daysFromNow(30), end: daysFromNow(31), color: "#00B4D8" },
    { title: "Dussehra Holiday",                type: "Holiday",  desc: "School closed for Dussehra celebration.",                  location: "",                audience: "All",      start: daysFromNow(45), end: daysFromNow(45), color: "#EF233C" },
    { title: "Mid-Term Exams (Concluded)",      type: "Exam",     desc: "Mid-term examinations for all classes.",                   location: "Classrooms",      audience: "Students", start: daysFromNow(-18), end: daysFromNow(-12), color: "#457B9D" },
    { title: "Staff Development Workshop",      type: "Meeting",  desc: "Monthly training session for all teaching staff.",         location: "Conference Room", audience: "Teachers", start: daysFromNow(8),  end: daysFromNow(8),  color: "#2D6A4F" },
    { title: "Annual Prize Distribution",       type: "Event",    desc: "Prize distribution ceremony for top-performing students.", location: "School Auditorium", audience: "All",   start: daysFromNow(60), end: daysFromNow(60), color: "#D4A017" },
    { title: "Board Exam Preparation Camp",     type: "Activity", desc: "Special revision classes for Class 10 board prep.",        location: "Classrooms",      audience: "Students", start: daysFromNow(3),  end: daysFromNow(14), color: "#9B2335" },
    { title: "Teachers' Day Celebration",       type: "Event",    desc: "Students celebrate Teachers Day with performances.",       location: "School Hall",     audience: "All",      start: daysFromNow(-5), end: daysFromNow(-5), color: "#4CAF50" },
  ];

  let eventCount = 0;
  for (const e of eventDefs) {
    const exists = await SchoolEvent.findOne({ schoolId, title: e.title });
    if (!exists) {
      await SchoolEvent.create({ schoolId, title: e.title, type: e.type, description: e.desc, location: e.location, audience: e.audience, startDate: e.start, endDate: e.end, allDay: true, color: e.color, status: e.start < new Date() ? "completed" : "scheduled", createdBy: adminId });
      eventCount++;
    }
  }
  ok(`School Events created: ${eventCount}`);

  // ── 15. Notifications ────────────────────────────────────────────────────────
  const notifDefs = [
    { title: "Mid-Term Results Published",         msg: "Mid-term examination results for Classes 6-10 are now available. View marks in the portal.",    level: "all",  roles: [] },
    { title: "Parent-Teacher Meeting – July 15",   msg: "Dear Parents, PTM is on July 15 from 9 AM to 1 PM. Kindly confirm attendance.",               level: "role", roles: ["Parent"] },
    { title: "Annual Sports Day Registration Open",msg: "Students interested in sports events must register with their class teacher by July 10.",       level: "role", roles: ["Student"] },
    { title: "Staff Meeting – July 5 at 3 PM",     msg: "All staff members must attend the monthly meeting on July 5 in the conference room at 3 PM.",   level: "role", roles: ["Teacher"] },
    { title: "Fee Payment Reminder – 2nd Installment", msg: "2nd installment is due July 15. Pay on time to avoid late fees. Contact accounts for queries.", level: "role", roles: ["Parent"] },
  ];

  let notifCount = 0;
  for (const n of notifDefs) {
    const exists = await Notification.findOne({ schoolId, title: n.title });
    if (!exists) {
      await Notification.create({ schoolId, title: n.title, message: n.msg, level: n.level, targetRoles: n.roles, channels: { inApp: true, email: true, sms: false, whatsapp: false }, deliveryStats: { sent: 150, opened: 98, failed: 2 }, status: "sent", readBy: [], createdBy: admin.name, createdById: adminId });
      notifCount++;
    }
  }
  ok(`Notifications created: ${notifCount}`);

  // ── 16. Activity Logs ────────────────────────────────────────────────────────
  const adminRole = await Role.findOne({ name: "School Admin" });
  const logDefs = [
    { action: "USER_CREATED",       desc: "Created 20 student accounts for 2025-26",            daysAgoN: 14 },
    { action: "EXAM_PUBLISHED",     desc: "Published Mid-Term schedule for Classes 6-10",        daysAgoN: 20 },
    { action: "NOTIFICATION_SENT",  desc: "Sent fee payment reminder to all parents",            daysAgoN: 7  },
    { action: "REPORT_EXPORTED",    desc: "Exported monthly attendance report for June 2025",    daysAgoN: 3  },
    { action: "EVENT_CREATED",      desc: "Created Annual Sports Day event",                     daysAgoN: 10 },
    { action: "USER_UPDATED",       desc: "Updated enrollment status for 5 students",            daysAgoN: 5  },
    { action: "FEE_STRUCTURE_SET",  desc: "Configured fee structure for academic year 2025-26",  daysAgoN: 25 },
    { action: "SECTION_CREATED",    desc: "Created sections A & B for 6 classes",               daysAgoN: 30 },
    { action: "ACADEMIC_YEAR_SET",  desc: "Set 2025-2026 as the active academic year",          daysAgoN: 45 },
    { action: "BACKUP_COMPLETED",   desc: "Scheduled database backup completed successfully",    daysAgoN: 2  },
  ];

  for (const l of logDefs) {
    const ts = daysAgo(l.daysAgoN);
    const doc = await ActivityLog.create({ user: adminId, action: l.action, description: l.desc, role: adminRole?._id, school: schoolId, ipAddress: "192.168.1.10", userAgent: "SeedScript/1.0" });
    // Backdate the createdAt timestamp directly
    await ActivityLog.updateOne({ _id: doc._id }, { $set: { createdAt: ts, updatedAt: ts } });
  }
  ok(`Activity Logs created: ${logDefs.length}`);

  // ── 17. Maintenance Tasks ─────────────────────────────────────────────────────
  const itCreator  = staffMap["IT Support"] || admin;
  const taskDefs = [
    { title: "Server room AC maintenance",   desc: "Schedule AC servicing in server room to prevent overheating.",    priority: "high",   status: "pending",     daysFromNowN: 7  },
    { title: "Network switch replacement",   desc: "Replace aging network switch in Block B.",                        priority: "high",   status: "in_progress", daysFromNowN: 14 },
    { title: "Antivirus update – all PCs",   desc: "Deploy latest antivirus definitions to all lab computers.",       priority: "medium", status: "in_progress", daysFromNowN: 3  },
    { title: "UPS battery replacement",      desc: "Replace UPS batteries in admin office (every 3 years).",          priority: "medium", status: "pending",     daysFromNowN: 21 },
    { title: "Generator monthly test run",   desc: "Monthly test run of backup generator.",                           priority: "low",    status: "done",        daysFromNowN: -2 },
    { title: "Printer cartridge restock",    desc: "Order new toner cartridges for all 8 printers.",                  priority: "low",    status: "done",        daysFromNowN: -5 },
    { title: "Firewall rule update",         desc: "Update rules to block unauthorized streaming & gaming sites.",    priority: "high",   status: "pending",     daysFromNowN: 5  },
    { title: "CCTV footage archival",        desc: "Archive 3 months of footage to external backup drive.",           priority: "medium", status: "pending",     daysFromNowN: 10 },
  ];

  let taskCount = 0;
  for (const t of taskDefs) {
    const exists = await MaintenanceTask.findOne({ school: schoolId, title: t.title });
    if (!exists) {
      await MaintenanceTask.create({ title: t.title, description: t.desc, priority: t.priority, status: t.status, dueDate: daysFromNow(t.daysFromNowN), school: schoolId, createdBy: itCreator._id });
      taskCount++;
    }
  }
  ok(`Maintenance Tasks created: ${taskCount}`);

  // ── Done ──────────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed complete!  (password for all demo accounts: Demo@123)

TEACHERS:
  rajesh.kumar@dps.demo   (Math)
  priya.sharma@dps.demo   (Science)
  amit.singh@dps.demo     (English)
  sunita.verma@dps.demo   (Social Studies)
  deepak.joshi@dps.demo   (Hindi)

STAFF:
  itsupport@dps.demo      (IT Support)
  counselor@dps.demo      (Counselor)
  receptionist@dps.demo   (Receptionist)
  librarian@dps.demo      (Librarian)
  accountant@dps.demo     (Accountant)
  security@dps.demo       (Security)

STUDENTS (sample):
  aarav.s@dps.demo        (Class 1 – Sec A)
  diya.p@dps.demo         (Class 1 – Sec A)
  ... 18 more students

PARENTS (sample):
  parent.aarav.s@dps.demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

seed()
  .catch((err) => { console.error("❌ Seed failed:", err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

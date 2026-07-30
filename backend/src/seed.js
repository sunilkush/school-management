/**
 * Demo Seed Script — ADDITIVE (never deletes existing data)
 * Run: cd backend && npm run seed
 * Demo password for all new users: Demo@123
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ── Import models ─────────────────────────────────────────────────────────────
import { Role }                from "./models/Roles.model.js";
import { School }              from "./models/school.model.js";
import { AcademicYear }        from "./models/AcademicYear.model.js";
import { SchoolClass }         from "./models/schoolClass.model.js";
import { Section }             from "./models/section.model.js";
import { Subject }             from "./models/subject.model.js";
import { User }                from "./models/user.model.js";
import { Student }             from "./models/student.model.js";
import { StudentEnrollment }   from "./models/StudentEnrollment.model.js";
import { Exam }                from "./models/Exam.model.js";
import { LessonPlan }          from "./models/LessonPlan.model.js";
import { SupportTicket }       from "./models/SupportTicket.model.js";
import { SchoolEvent }         from "./models/SchoolEvent.model.js";
import { Notification }        from "./models/notification.model.js";
import ActivityLog             from "./models/ActivityLog.model.js";
import MaintenanceTask         from "./models/MaintenanceTask.model.js";
import { Attendance }          from "./models/attendance.model.js";
import { Department }          from "./models/Department.model.js";
import { Designation }         from "./models/Designation.model.js";
import { Assignment }          from "./models/AssignmentsAndHomework.model.js";
import { AssignmentSubmission } from "./models/AssignmentSubmission.model.js";
import { Marks }               from "./models/Marks.model.js";
import { ExamResult }          from "./models/ExamResult.model.js";
import { Question }            from "./models/Questions.model.js";
import { FeeHead }             from "./models/feeHead.model.js";
import { FeeStructure }        from "./models/feeStructure.model.js";
import { StudentFee }          from "./models/studentFee.model.js";
import { FeeInstallment }      from "./models/feeInstallment.model.js";
import { TimeSlot }            from "./models/TimeSlot.model.js";
import { Timetable }           from "./models/Timetable.model.js";
import { Teacher }             from "./models/teacherAssignment.model.js";
import { LeaveRequest }        from "./models/LeaveRequest.model.js";
import { Transport }           from "./models/Transport.model.js";
import { TransportRoute }      from "./models/TransportRoute.model.js";
import { HostelRoom }          from "./models/HostelRoom.model.js";
import { HostelAttendance }    from "./models/HostelAttendance.model.js";
import { Inventory }           from "./models/Inventory.model.js";
import { AdmissionInquiry }    from "./models/AdmissionInquiry.model.js";
import { Complaint }           from "./models/Complaint.model.js";
import { StudyMaterial }       from "./models/StudyMaterial.model.js";
import { Employee }           from "./models/Employee.model.js";
import { PayrollPolicy }      from "./models/payrollPolicy.model.js";
import { PayrollStructure }   from "./models/payrollStructure.model.js";
import { PayrollCycle }       from "./models/payrollCycle.model.js";
import { PayrollEntry }       from "./models/payrollEntry.model.js";
import { calculatePayrollEntry } from "./services/payrollCalculator.service.js";
import { ClassTeacherAssignment } from "./models/ClassTeacherAssignment.model.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
// Collect last N weekdays
function lastWeekdays(n) {
  const days = [];
  let cursor = new Date();
  cursor.setDate(cursor.getDate() - 1);
  while (days.length < n) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGOOSE_URI;
  if (!uri) throw new Error("MONGOOSE_URI missing in .env");
  // dbName option, not string concatenation — MONGOOSE_URI already ends in "/?retryWrites=...",
  // so appending a path segment there is malformed and mongoose silently ignores it.
  await mongoose.connect(uri, { dbName: DB_NAME });
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

  // ── 2b. Create new roles if missing (Sports Teacher, Lab Tech, Medical Officer, Class Teacher) ──
  const newRoleDefs = [
    { name: "Sports Teacher",  code: "SPTS", level: 3 },
    { name: "Lab Technician",  code: "LABT", level: 4 },
    { name: "Medical Officer", code: "MEDO", level: 4 },
    { name: "Class Teacher",   code: "CLST", level: 3 },
  ];
  for (const rd of newRoleDefs) {
    if (!roleMap[rd.name]) {
      let r = await Role.findOne({ name: rd.name });
      if (!r) {
        r = await Role.create({
          name: rd.name, code: rd.code, level: rd.level,
          isActive: true, permissions: [], type: "system",
        });
        ok(`Role created: ${rd.name}`);
      } else {
        skip(`Role already exists: ${rd.name}`);
      }
      roleMap[rd.name] = r._id;
    }
  }

  // ── 3. Admin user (School Admin) ────────────────────────────────────────────
  const admin = await User.findOne({ schoolId, roleId: roleMap["School Admin"] });
  if (!admin) throw new Error("No School Admin found. Aborting.");
  ok(`Admin: ${admin.name}`);
  const adminId = admin._id;

  // ── 4. Active Academic Year ──────────────────────────────────────────────────
  let ay = await AcademicYear.findOne({ schoolId, isActive: true });
  if (!ay) {
    ay = new AcademicYear({ schoolId, startDate: new Date("2025-04-01"), endDate: new Date("2026-03-31"), isActive: true, status: "active" });
    await ay.save();
    ok(`Academic year created: ${ay.name}`);
  } else {
    skip(`Using active academic year: ${ay.name}`);
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
  const sectionMap = {};
  for (const cls of targetClasses) {
    sectionMap[String(cls._id)] = [];
    for (const sName of ["A", "B"]) {
      let sec = await Section.findOne({ schoolClassId: cls._id, name: sName });
      if (!sec) {
        try {
          sec = await Section.create({ schoolId, schoolClassId: cls._id, academicYearId: ayId, name: sName, capacity: 40 });
        } catch (e) {
          if (e.code === 11000) {
            sec = await Section.findOne({ schoolClassId: cls._id, name: sName });
          } else { throw e; }
        }
      }
      if (sec) sectionMap[String(cls._id)].push(sec);
    }
  }
  ok(`Sections ready for ${targetClasses.length} classes`);

  const demoPwd = "Demo@123";

  // ── 7. Departments (must come before employees) ──────────────────────────────
  const deptDefs = [
    { name: "Teaching & Academics",    code: "TEACH" },
    { name: "Administration",          code: "ADMIN" },
    { name: "Finance & Accounts",      code: "FIN"   },
    { name: "Library",                 code: "LIB"   },
    { name: "Information Technology",  code: "IT"    },
    { name: "Transport & Hostel",      code: "TRANS" },
  ];
  const deptMap = {};
  for (const d of deptDefs) {
    let dept = await Department.findOne({ schoolId, name: d.name });
    if (!dept) dept = await Department.create({ schoolId, name: d.name, code: d.code, status: "active", createdBy: adminId });
    deptMap[d.code] = dept;
  }
  ok(`Departments: ${Object.keys(deptMap).length}`);

  // ── 8. Designations ─────────────────────────────────────────────────────────
  const desgDefs = [
    { title: "Principal",             level: "Senior", deptCode: "ADMIN" },
    { title: "Vice Principal",        level: "Senior", deptCode: "ADMIN" },
    { title: "Senior Teacher",        level: "Senior", deptCode: "TEACH" },
    { title: "Teacher",               level: "Mid",    deptCode: "TEACH" },
    { title: "Junior Teacher",        level: "Junior", deptCode: "TEACH" },
    { title: "Subject Coordinator",   level: "Mid",    deptCode: "TEACH" },
    { title: "Exam Coordinator",      level: "Mid",    deptCode: "TEACH" },
    { title: "Accountant",            level: "Mid",    deptCode: "FIN"   },
    { title: "Senior Accountant",     level: "Senior", deptCode: "FIN"   },
    { title: "Librarian",             level: "Mid",    deptCode: "LIB"   },
    { title: "IT Engineer",           level: "Mid",    deptCode: "IT"    },
    { title: "Counselor",             level: "Mid",    deptCode: "ADMIN" },
    { title: "Receptionist",          level: "Junior", deptCode: "ADMIN" },
    { title: "Security Guard",        level: "Junior", deptCode: "ADMIN" },
    { title: "Hostel Warden",         level: "Mid",    deptCode: "TRANS" },
    { title: "Transport Manager",     level: "Mid",    deptCode: "TRANS" },
    { title: "Sports Coach",          level: "Mid",    deptCode: "TEACH" },
    { title: "Lab Technician",        level: "Mid",    deptCode: "IT"    },
    { title: "Medical Officer",       level: "Senior", deptCode: "ADMIN" },
  ];
  const desgMap = {};
  for (const d of desgDefs) {
    const dept = deptMap[d.deptCode];
    if (!dept) continue;
    let desg = await Designation.findOne({ schoolId, title: d.title });
    if (!desg) desg = await Designation.create({ schoolId, title: d.title, level: d.level, departmentId: dept._id, status: "active", createdBy: adminId });
    desgMap[d.title] = desg;
  }
  ok(`Designations: ${Object.keys(desgMap).length}`);

  // ── 9. Teachers ──────────────────────────────────────────────────────────────
  const teacherDefs = [
    {
      name: "Rajesh Kumar",  email: "rajesh.kumar@dps.demo",  phone: "9811001001", regId: "TCH001",
      gender: "Male",   dob: "1985-03-15", qual: "M.Sc Mathematics",     join: "2018-06-01",
      addr: "B-12, Vasant Vihar, New Delhi – 110057",
      ecName: "Sunita Kumar",  ecPhone: "9811001101",
      dept: "TEACH", desg: "Senior Teacher",
    },
    {
      name: "Priya Sharma",  email: "priya.sharma@dps.demo",  phone: "9811001002", regId: "TCH002",
      gender: "Female", dob: "1988-07-22", qual: "M.Sc Biology",          join: "2019-07-01",
      addr: "A-45, Rohini Sector-9, New Delhi – 110085",
      ecName: "Vivek Sharma",  ecPhone: "9811001102",
      dept: "TEACH", desg: "Teacher",
    },
    {
      name: "Amit Singh",    email: "amit.singh@dps.demo",    phone: "9811001003", regId: "TCH003",
      gender: "Male",   dob: "1990-11-08", qual: "M.A. English",          join: "2020-04-01",
      addr: "C-78, Mayur Vihar Phase-1, Delhi – 110091",
      ecName: "Rekha Singh",   ecPhone: "9811001103",
      dept: "TEACH", desg: "Teacher",
    },
    {
      name: "Sunita Verma",  email: "sunita.verma@dps.demo",  phone: "9811001004", regId: "TCH004",
      gender: "Female", dob: "1987-01-30", qual: "M.A. History",          join: "2017-06-01",
      addr: "D-33, Lajpat Nagar-III, New Delhi – 110024",
      ecName: "Arun Verma",    ecPhone: "9811001104",
      dept: "TEACH", desg: "Subject Coordinator",
    },
    {
      name: "Deepak Joshi",  email: "deepak.joshi@dps.demo",  phone: "9811001005", regId: "TCH005",
      gender: "Male",   dob: "1992-05-17", qual: "M.A. Hindi Literature",  join: "2021-04-01",
      addr: "E-56, Dwarka Sector-6, New Delhi – 110075",
      ecName: "Kavita Joshi",  ecPhone: "9811001105",
      dept: "TEACH", desg: "Teacher",
    },
  ];

  // Helper: build full employee profile fields from a def + resolved dept/desg IDs
  const empFields = (d) => ({
    gender:               d.gender,
    dateOfBirth:          new Date(d.dob),
    joiningDate:          new Date(d.join),
    qualification:        d.qual,
    address:              d.addr,
    emergencyContactName: d.ecName,
    emergencyContactPhone: d.ecPhone,
    departmentId:         deptMap[d.dept]?._id  || null,
    designationId:        desgMap[d.desg]?._id  || null,
  });

  const teachers = [];
  if (roleMap["Teacher"]) {
    for (const t of teacherDefs) {
      const profileData = empFields(t);
      let u = await User.findOne({ email: t.email });
      if (!u) {
        u = await User.create({ name: t.name, email: t.email, phone: t.phone, regId: t.regId, password: demoPwd, roleId: roleMap["Teacher"], schoolId, ...profileData });
      } else {
        // Always sync employee profile fields so re-runs update existing users
        await User.updateOne({ _id: u._id }, { $set: profileData });
        u = await User.findById(u._id);
      }
      teachers.push(u);
    }
    ok(`Teachers: ${teachers.length}`);
  }

  // ── 10. Staff (all roles) ────────────────────────────────────────────────────
  const staffDefs = [
    {
      name: "Ramesh Gupta",  email: "accountant@dps.demo",    role: "Accountant",          regId: "STF001",
      phone: "9811002001",   gender: "Male",   dob: "1982-09-10", qual: "B.Com, CA",           join: "2016-04-01",
      addr: "F-22, Saket, New Delhi – 110017",
      ecName: "Priya Gupta",     ecPhone: "9811002101",
      dept: "FIN",   desg: "Accountant",
    },
    {
      name: "Meena Kumari",  email: "librarian@dps.demo",     role: "Librarian",           regId: "STF002",
      phone: "9811002002",   gender: "Female", dob: "1986-04-25", qual: "M.Lib.Sc",             join: "2017-07-01",
      addr: "G-88, Pitampura, New Delhi – 110034",
      ecName: "Rakesh Kumar",    ecPhone: "9811002102",
      dept: "LIB",   desg: "Librarian",
    },
    {
      name: "Vikram Pandey",  email: "itsupport@dps.demo",   role: "IT Support",          regId: "STF003",
      phone: "9811002003",   gender: "Male",   dob: "1993-12-03", qual: "B.Tech Computer Sc",   join: "2021-01-01",
      addr: "H-14, Janakpuri, New Delhi – 110058",
      ecName: "Meena Pandey",    ecPhone: "9811002103",
      dept: "IT",    desg: "IT Engineer",
    },
    {
      name: "Kavita Rao",    email: "counselor@dps.demo",    role: "Counselor",           regId: "STF004",
      phone: "9811002004",   gender: "Female", dob: "1989-06-18", qual: "M.A. Psychology",      join: "2019-04-01",
      addr: "I-67, GK-II, New Delhi – 110048",
      ecName: "Suresh Rao",      ecPhone: "9811002104",
      dept: "ADMIN", desg: "Counselor",
    },
    {
      name: "Suresh Mishra", email: "receptionist@dps.demo", role: "Receptionist",        regId: "STF005",
      phone: "9811002005",   gender: "Male",   dob: "1991-03-07", qual: "B.A.",                 join: "2020-06-01",
      addr: "J-39, Uttam Nagar, New Delhi – 110059",
      ecName: "Geeta Mishra",    ecPhone: "9811002105",
      dept: "ADMIN", desg: "Receptionist",
    },
    {
      name: "Bharat Tiwari", email: "security@dps.demo",     role: "Security",            regId: "STF006",
      phone: "9811002006",   gender: "Male",   dob: "1975-11-22", qual: "Class XII",            join: "2010-04-01",
      addr: "K-11, Palam, New Delhi – 110045",
      ecName: "Sunita Tiwari",   ecPhone: "9811002106",
      dept: "ADMIN", desg: "Security Guard",
    },
    {
      name: "Anita Nair",    email: "principal@dps.demo",    role: "Principal",           regId: "STF007",
      phone: "9811002007",   gender: "Female", dob: "1970-07-15", qual: "M.Ed, Ph.D Education", join: "2005-04-01",
      addr: "L-5, Defence Colony, New Delhi – 110024",
      ecName: "Rajan Nair",      ecPhone: "9811002107",
      dept: "ADMIN", desg: "Principal",
    },
    {
      name: "Rohit Bansal",  email: "viceprincipal@dps.demo", role: "Vice Principal",     regId: "STF008",
      phone: "9811002008",   gender: "Male",   dob: "1975-02-28", qual: "M.Ed, MBA",            join: "2008-06-01",
      addr: "M-29, Vasant Kunj, New Delhi – 110070",
      ecName: "Pooja Bansal",    ecPhone: "9811002108",
      dept: "ADMIN", desg: "Vice Principal",
    },
    {
      name: "Sundar Pillai", email: "hostelwarden@dps.demo",  role: "Hostel Warden",      regId: "STF009",
      phone: "9811002009",   gender: "Male",   dob: "1980-08-11", qual: "B.Sc",                 join: "2012-04-01",
      addr: "N-44, Karol Bagh, New Delhi – 110005",
      ecName: "Lakshmi Pillai",  ecPhone: "9811002109",
      dept: "TRANS", desg: "Hostel Warden",
    },
    {
      name: "Geeta Chandra", email: "transport@dps.demo",     role: "Transport Manager",  regId: "STF010",
      phone: "9811002010",   gender: "Female", dob: "1983-05-04", qual: "B.Com",                join: "2015-07-01",
      addr: "O-18, Dwarka Sector-10, New Delhi – 110075",
      ecName: "Mohan Chandra",   ecPhone: "9811002110",
      dept: "TRANS", desg: "Transport Manager",
    },
    {
      name: "Pawan Sharma",  email: "examcoord@dps.demo",     role: "Exam Coordinator",   regId: "STF011",
      phone: "9811002011",   gender: "Male",   dob: "1984-10-19", qual: "M.Sc, B.Ed",           join: "2014-04-01",
      addr: "P-72, Rohini Sector-16, New Delhi – 110089",
      ecName: "Kamla Sharma",    ecPhone: "9811002111",
      dept: "TEACH", desg: "Exam Coordinator",
    },
    {
      name: "Shalini Dixit", email: "subjcoord@dps.demo",     role: "Subject Coordinator", regId: "STF012",
      phone: "9811002012",   gender: "Female", dob: "1987-01-25", qual: "M.A., B.Ed",           join: "2016-06-01",
      addr: "Q-93, Indirapuram, Ghaziabad – 201014",
      ecName: "Anil Dixit",      ecPhone: "9811002112",
      dept: "TEACH", desg: "Subject Coordinator",
    },
    {
      name: "Arjun Khanna",   email: "sportsteacher@dps.demo",  role: "Sports Teacher",   regId: "STF013",
      phone: "9811002013",    gender: "Male",   dob: "1991-08-14", qual: "B.P.Ed, M.P.Ed",   join: "2020-06-01",
      addr: "R-33, Rajouri Garden, New Delhi – 110027",
      ecName: "Sunita Khanna",   ecPhone: "9811002113",
      dept: "TEACH", desg: "Sports Coach",
    },
    {
      name: "Rekha Soni",     email: "labtechnician@dps.demo",  role: "Lab Technician",   regId: "STF014",
      phone: "9811002014",    gender: "Female", dob: "1987-03-22", qual: "B.Sc Chemistry, Dip Lab Tech", join: "2018-09-01",
      addr: "S-17, Lajpat Nagar III, New Delhi – 110024",
      ecName: "Vijay Soni",      ecPhone: "9811002114",
      dept: "IT",   desg: "Lab Technician",
    },
    {
      name: "Dr. Suresh Jain", email: "medicalofficer@dps.demo", role: "Medical Officer",  regId: "STF015",
      phone: "9811002015",    gender: "Male",   dob: "1980-11-05", qual: "MBBS, MD (General Medicine)", join: "2017-04-01",
      addr: "T-9, Safdarjung Enclave, New Delhi – 110029",
      ecName: "Alka Jain",       ecPhone: "9811002115",
      dept: "ADMIN", desg: "Medical Officer",
    },
    {
      name: "Nandini Bajaj",  email: "classteacher@dps.demo",   role: "Class Teacher",    regId: "STF016",
      phone: "9811002016",    gender: "Female", dob: "1989-06-30", qual: "M.A. English, B.Ed",           join: "2019-08-01",
      addr: "U-51, Mayur Vihar Phase-2, Delhi – 110091",
      ecName: "Rajeev Bajaj",    ecPhone: "9811002116",
      dept: "TEACH", desg: "Teacher",
    },
  ];

  const staffMap = {};
  for (const s of staffDefs) {
    if (!roleMap[s.role]) continue;
    const profileData = empFields(s);
    let u = await User.findOne({ email: s.email });
    if (!u) {
      u = await User.create({ name: s.name, email: s.email, regId: s.regId, phone: s.phone, password: demoPwd, roleId: roleMap[s.role], schoolId, ...profileData });
    } else {
      await User.updateOne({ _id: u._id }, { $set: profileData });
      u = await User.findById(u._id);
    }
    staffMap[s.role] = u;
  }
  ok(`Staff users: ${Object.keys(staffMap).length}`);

  // ── 10a. Additional Roles demo (assign Class Teacher as secondary role to teacher1) ──
  if (roleMap["Class Teacher"] && teachers[0]) {
    await User.updateOne(
      { _id: teachers[0]._id },
      { $addToSet: { additionalRoles: roleMap["Class Teacher"] } }
    );
    ok(`Additional role "Class Teacher" → ${teachers[0].name}`);
  }
  if (roleMap["Exam Coordinator"] && teachers[1]) {
    const examCoordRole = await Role.findOne({ name: "Exam Coordinator" });
    if (examCoordRole) {
      await User.updateOne(
        { _id: teachers[1]._id },
        { $addToSet: { additionalRoles: examCoordRole._id } }
      );
      ok(`Additional role "Exam Coordinator" → ${teachers[1].name}`);
    }
  }

  // ── 10b. Class Teacher Assignments ──────────────────────────────────────────
  const ctaDefs = [
    { teacher: teachers[0], classIdx: 0, sec: "A" },
    { teacher: teachers[1], classIdx: 1, sec: "A" },
    { teacher: teachers[2], classIdx: 2, sec: "B" },
  ];
  let ctaCount = 0;
  for (const { teacher, classIdx, sec } of ctaDefs) {
    const cls = targetClasses[classIdx];
    if (!cls || !teacher) continue;
    const secs = sectionMap[String(cls._id)] || [];
    const section = secs.find((s) => s.name === sec) || secs[0];
    const existing = await ClassTeacherAssignment.findOne({
      teacherId: teacher._id, schoolId, academicYearId: ayId, isActive: true,
    });
    if (!existing) {
      await ClassTeacherAssignment.create({
        teacherId:     teacher._id,
        schoolClassId: cls._id,
        sectionId:     section?._id || null,
        academicYearId: ayId,
        schoolId,
        isActive:      true,
        assignedBy:    adminId,
      });
      ctaCount++;
    }
  }
  ok(`Class Teacher Assignments: ${ctaCount} new`);

  // ── 9. Students + Parents ───────────────────────────────────────────────────
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

  // Track student User + Student + Enrollment objects for later use
  const studentObjects = []; // { stuUser, stuProfile, enrollment, def }
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

      let enrollment = await StudentEnrollment.findOne({ studentId: stuProfile._id, academicYearId: ayId, schoolId });
      if (!enrollment) {
        enrollment = await StudentEnrollment.create({ studentId: stuProfile._id, schoolId, academicYearId: ayId, registrationNumber: d.reg, schoolClassId: cls._id, sectionId: sec._id, createdBy: adminId });
        studentCount++;
      }
      studentObjects.push({ stuUser, stuProfile, enrollment, def: d, cls, sec });
    }
    ok(`Students enrolled: ${studentCount} new`);
  }

  // ── 10. Student Attendance (past 30 weekdays) ────────────────────────────────
  const ATT_WEIGHTS = [
    { status: "present", weight: 80 }, { status: "absent", weight: 8 },
    { status: "late",    weight: 6  }, { status: "leave",  weight: 4 },
    { status: "halfday", weight: 2  },
  ];
  function pickStatus() {
    const total = ATT_WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const { status, weight } of ATT_WEIGHTS) { r -= weight; if (r <= 0) return status; }
    return "present";
  }
  const weekdays = lastWeekdays(30);

  let stuAttCount = 0;
  for (const { stuUser, cls, sec } of studentObjects) {
    for (const date of weekdays) {
      const d = new Date(date); d.setUTCHours(0, 0, 0, 0);
      const exists = await Attendance.findOne({ schoolId, userId: stuUser._id, date: d });
      if (!exists) {
        await Attendance.create({ schoolId, userId: stuUser._id, role: "student", schoolClassId: cls._id, sectionId: sec._id, date: d, status: pickStatus(), markedBy: adminId, remarks: "" });
        stuAttCount++;
      }
    }
  }
  ok(`Student attendance records: ${stuAttCount}`);

  // ── 11. Staff Attendance (teachers + staff, past 20 weekdays) ────────────────
  const allStaff = [
    ...teachers,
    ...Object.values(staffMap),
  ];
  const recentWeekdays = lastWeekdays(20);
  let staffAttCount = 0;
  for (const emp of allStaff) {
    for (const date of recentWeekdays) {
      const d = new Date(date); d.setUTCHours(0, 0, 0, 0);
      const exists = await Attendance.findOne({ schoolId, userId: emp._id, date: d });
      if (!exists) {
        const roll = Math.random();
        const status = roll < 0.88 ? "present" : roll < 0.94 ? "late" : roll < 0.97 ? "leave" : "absent";
        await Attendance.create({ schoolId, userId: emp._id, role: "teacher", date: d, status, markedBy: adminId, remarks: "" });
        staffAttCount++;
      }
    }
  }
  ok(`Staff attendance records: ${staffAttCount}`);

  // ── 12. Teacher Assignments ──────────────────────────────────────────────────
  // teacher 0=Math, 1=Science, 2=English, 3=SocialStudies, 4=Hindi
  const tchAssignDefs = [];
  for (let ci = 0; ci < Math.min(targetClasses.length, 5); ci++) {
    const cls = targetClasses[ci];
    const secs = sectionMap[String(cls._id)] || [];
    for (const sec of secs) {
      for (let ti = 0; ti < Math.min(teachers.length, subjects.length); ti++) {
        tchAssignDefs.push({ teacherId: teachers[ti]._id, subjectId: subjects[ti]._id, schoolClassId: cls._id, sectionId: sec._id });
      }
    }
  }
  let tchAssignCount = 0;
  for (const ta of tchAssignDefs) {
    const exists = await Teacher.findOne({ schoolId, academicYearId: ayId, teacherId: ta.teacherId, schoolClassId: ta.schoolClassId, subjectId: ta.subjectId, sectionId: ta.sectionId });
    if (!exists) {
      try {
        await Teacher.create({ ...ta, schoolId, academicYearId: ayId, status: "active", createdBy: adminId });
        tchAssignCount++;
      } catch (e) { if (e.code !== 11000) throw e; }
    }
  }
  ok(`Teacher assignments: ${tchAssignCount}`);

  // ── 15. Time Slots ───────────────────────────────────────────────────────────
  const timeSlotDefs = [
    { name: "Period 1",  startTime: "08:00", endTime: "08:45", type: "period",   order: 1 },
    { name: "Period 2",  startTime: "08:45", endTime: "09:30", type: "period",   order: 2 },
    { name: "Period 3",  startTime: "09:30", endTime: "10:15", type: "period",   order: 3 },
    { name: "Break",     startTime: "10:15", endTime: "10:30", type: "break",    order: 4 },
    { name: "Period 4",  startTime: "10:30", endTime: "11:15", type: "period",   order: 5 },
    { name: "Period 5",  startTime: "11:15", endTime: "12:00", type: "period",   order: 6 },
    { name: "Lunch",     startTime: "12:00", endTime: "12:40", type: "lunch",    order: 7 },
    { name: "Period 6",  startTime: "12:40", endTime: "13:25", type: "period",   order: 8 },
    { name: "Period 7",  startTime: "13:25", endTime: "14:10", type: "period",   order: 9 },
    { name: "Assembly",  startTime: "14:10", endTime: "14:30", type: "assembly", order: 10 },
  ];
  const timeSlots = [];
  for (const ts of timeSlotDefs) {
    let slot = await TimeSlot.findOne({ schoolId, academicYearId: ayId, name: ts.name });
    if (!slot) {
      try {
        slot = await TimeSlot.create({ schoolId, academicYearId: ayId, ...ts, isActive: true, createdBy: adminId });
      } catch (e) { if (e.code !== 11000) throw e; slot = await TimeSlot.findOne({ schoolId, academicYearId: ayId, name: ts.name }); }
    }
    if (slot) timeSlots.push(slot);
  }
  ok(`Time slots: ${timeSlots.length}`);

  // ── 16. Timetable (2 classes × 2 sections × 5 days × period slots) ───────────
  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  // subject rotation per day+period: [subjectIdx, teacherIdx]
  const periodSlots = timeSlots.filter((s) => s.type === "period");
  const breakSlots  = timeSlots.filter((s) => s.type === "break" || s.type === "lunch" || s.type === "assembly");
  const subRotation = [
    [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 0], [1, 1], // 7 periods
  ];
  let ttCount = 0;
  for (let ci = 0; ci < Math.min(targetClasses.length, 2); ci++) {
    const cls = targetClasses[ci];
    const secs = sectionMap[String(cls._id)] || [];
    for (const sec of secs) {
      for (const day of DAYS) {
        // Break/lunch/assembly slots
        for (const bSlot of breakSlots) {
          const exists = await Timetable.findOne({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, dayOfWeek: day, timeSlotId: bSlot._id });
          if (!exists) {
            try {
              await Timetable.create({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, dayOfWeek: day, timeSlotId: bSlot._id, type: bSlot.type === "break" ? "break" : bSlot.type === "lunch" ? "lunch" : "assembly", status: "active", createdBy: adminId });
              ttCount++;
            } catch (e) { if (e.code !== 11000) throw e; }
          }
        }
        // Regular period slots
        for (let pi = 0; pi < periodSlots.length; pi++) {
          const rot = subRotation[(pi + DAYS.indexOf(day)) % subRotation.length];
          const sub = subjects[rot[0]];
          const tch = teachers[rot[1]];
          if (!sub || !tch) continue;
          const pSlot = periodSlots[pi];
          const exists = await Timetable.findOne({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, dayOfWeek: day, timeSlotId: pSlot._id });
          if (!exists) {
            try {
              await Timetable.create({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, dayOfWeek: day, timeSlotId: pSlot._id, subjectId: sub._id, teacherId: tch._id, type: "regular", status: "active", createdBy: adminId });
              ttCount++;
            } catch (e) { if (e.code !== 11000) throw e; }
          }
        }
      }
    }
  }
  ok(`Timetable entries: ${ttCount}`);

  // ── 17. Assignments + Submissions ────────────────────────────────────────────
  const asgDefs = [
    { title: "algebra practice worksheet",         desc: "solve 20 algebra problems from chapter 3",       sub: 0, cls: 0, tch: 0, daysAgoN: 10, dueOff: -3,  status: "assigned" },
    { title: "photosynthesis experiment report",   desc: "write a 500-word report on your lab experiment",  sub: 1, cls: 0, tch: 1, daysAgoN: 8,  dueOff: -1,  status: "assigned" },
    { title: "essay on my favourite season",       desc: "write a 300-word essay in english",               sub: 2, cls: 0, tch: 2, daysAgoN: 5,  dueOff: 2,   status: "assigned" },
    { title: "quadratic equations practice set",   desc: "solve exercises 4.1 to 4.3 from ncert textbook",  sub: 0, cls: 1, tch: 0, daysAgoN: 12, dueOff: -5,  status: "closed"   },
    { title: "cell division diagram",              desc: "draw and label mitosis and meiosis diagrams",      sub: 1, cls: 1, tch: 1, daysAgoN: 7,  dueOff: 1,   status: "assigned" },
    { title: "french revolution timeline",         desc: "create a detailed timeline of the french revolution", sub: 3, cls: 2, tch: 3, daysAgoN: 6, dueOff: 1,  status: "assigned" },
    { title: "hindi nibandh – mera priya khel",    desc: "write a 400-word essay in hindi",                 sub: 4, cls: 2, tch: 4, daysAgoN: 4,  dueOff: 3,   status: "assigned" },
    { title: "newton laws problems",               desc: "solve 15 numerical problems on newton's laws",     sub: 1, cls: 3, tch: 1, daysAgoN: 3,  dueOff: 4,   status: "assigned" },
    { title: "english grammar tenses worksheet",   desc: "complete 30 fill-in-the-blanks on tenses",        sub: 2, cls: 3, tch: 2, daysAgoN: 2,  dueOff: 5,   status: "assigned" },
    { title: "water resources project",            desc: "prepare a 10-slide presentation on water conservation", sub: 3, cls: 4, tch: 3, daysAgoN: 1, dueOff: 7, status: "assigned" },
  ];
  const assignmentObjects = [];
  let asgCount = 0;
  for (const a of asgDefs) {
    const cls = targetClasses[a.cls];
    const sub = subjects[a.sub];
    const tch = teachers[a.tch];
    if (!cls || !sub || !tch) continue;
    const secs = sectionMap[String(cls._id)] || [];
    const sec  = secs[0];
    if (!sec) continue;
    const exists = await Assignment.findOne({ schoolId, title: a.title, teacherId: tch._id });
    if (!exists) {
      const asgDoc = await Assignment.create({ schoolId, academicYearId: ayId, teacherId: tch._id, schoolClassId: cls._id, sectionId: sec._id, subjectId: sub._id, title: a.title, description: a.desc, dueDate: daysFromNow(a.dueOff), status: a.status, createdBy: tch._id });
      assignmentObjects.push({ asgDoc, cls });
      asgCount++;
    } else {
      assignmentObjects.push({ asgDoc: exists, cls });
    }
  }
  ok(`Assignments: ${asgCount}`);

  // Submissions — some students submit past-due assignments
  let submissionCount = 0;
  for (const { asgDoc, cls } of assignmentObjects) {
    if (asgDoc.status !== "assigned" && asgDoc.status !== "closed") continue;
    const stuForClass = studentObjects.filter((s) => String(s.cls._id) === String(cls._id));
    for (const { stuProfile, enrollment } of stuForClass.slice(0, 3)) {
      const exists = await AssignmentSubmission.findOne({ assignmentId: asgDoc._id, studentEnrollmentId: enrollment._id });
      if (!exists && Math.random() > 0.35) {
        try {
          await AssignmentSubmission.create({ assignmentId: asgDoc._id, schoolId, academicYearId: ayId, studentId: stuProfile._id, studentEnrollmentId: enrollment._id, remarks: "Submitted on time", submittedAt: daysAgo(1), grade: Math.floor(Math.random() * 30) + 70, feedback: "Good work!", gradedBy: asgDoc.teacherId, gradedAt: daysAgo(0) });
          submissionCount++;
        } catch (e) { if (e.code !== 11000) throw e; }
      }
    }
  }
  ok(`Assignment submissions: ${submissionCount}`);

  // ── 18. Exams ─────────────────────────────────────────────────────────────────
  const examDefs = [
    { title: "Unit Test 1 – Mathematics", subIdx: 0, clsIdx: 0, daysOffset: -45, type: "Unit Test", status: "completed" },
    { title: "Unit Test 1 – Science",     subIdx: 1, clsIdx: 0, daysOffset: -40, type: "Unit Test", status: "completed" },
    { title: "Mid Term – English",         subIdx: 2, clsIdx: 1, daysOffset: -20, type: "Mid Term",  status: "completed" },
    { title: "Mid Term – Mathematics",     subIdx: 0, clsIdx: 1, daysOffset: -18, type: "Mid Term",  status: "completed" },
    { title: "Mid Term – Science",         subIdx: 1, clsIdx: 2, daysOffset: -15, type: "Mid Term",  status: "completed" },
    { title: "Unit Test 2 – Social Studies", subIdx: 3, clsIdx: 2, daysOffset: -8, type: "Unit Test", status: "published" },
    { title: "Unit Test 2 – Hindi",        subIdx: 4, clsIdx: 3, daysOffset: -4,  type: "Unit Test", status: "published" },
    { title: "Pre-Board – Mathematics",    subIdx: 0, clsIdx: 3, daysOffset: 12,  type: "Pre-Board", status: "published" },
    { title: "Pre-Board – Science",        subIdx: 1, clsIdx: 4, daysOffset: 18,  type: "Pre-Board", status: "published" },
    { title: "Annual Exam – Mathematics",  subIdx: 0, clsIdx: 5, daysOffset: 35,  type: "Annual",    status: "published" },
    { title: "Annual Exam – English",      subIdx: 2, clsIdx: 5, daysOffset: 40,  type: "Annual",    status: "published" },
    { title: "Annual Exam – Science",      subIdx: 1, clsIdx: 4, daysOffset: 45,  type: "Annual",    status: "published" },
  ];
  const examObjects = [];
  let examCount = 0;
  for (const e of examDefs) {
    const cls = classes[e.clsIdx];
    const sub = subjects[e.subIdx];
    if (!cls || !sub) continue;
    let examDoc = await Exam.findOne({ schoolId, title: e.title, schoolClassId: cls._id });
    if (!examDoc) {
      const examDate = daysFromNow(e.daysOffset);
      examDoc = await Exam.create({ academicYearId: ayId, schoolId, title: e.title, examCode: `EX${Date.now().toString().slice(-6)}`, schoolClassId: cls._id, subjectId: sub._id, examType: e.type, examDate, startTime: setHour(examDate, 9), endTime: setHour(examDate, 11), durationMinutes: 120, totalMarks: 100, passingMarks: 35, questions: [], settings: { negativeMarking: 0, allowPartialScoring: false, maxAttempts: 1 }, createdBy: adminId, status: e.status });
      examCount++;
    }
    examObjects.push({ examDoc, sub, cls: classes[e.clsIdx], status: e.status });
  }
  ok(`Exams: ${examCount}`);

  // ── 19. Marks (for completed exams) ─────────────────────────────────────────
  let marksCount = 0;
  const marksObjects = []; // { examDoc, sub, cls, sec, stuUser, marksDoc } — feeds ExamResult below
  for (const { examDoc, sub, cls, status } of examObjects) {
    if (status !== "completed") continue;
    const studentsForClass = studentObjects.filter((s) => String(s.cls._id) === String(cls._id));
    for (const { stuUser, cls: sCls, sec } of studentsForClass) {
      let marksDoc = await Marks.findOne({ schoolId, examId: examDoc._id, studentId: stuUser._id, subjectId: sub._id });
      if (!marksDoc) {
        try {
          const obtained = Math.floor(Math.random() * 55) + 35; // 35–89
          marksDoc = await Marks.create({ schoolId, academicYearId: ayId, examId: examDoc._id, studentId: stuUser._id, schoolClassId: sCls._id, sectionId: sec._id, subjectId: sub._id, totalMarks: 100, passingMarks: 35, obtainedMarks: obtained, enteredBy: adminId, isFinalSubmitted: true });
          marksCount++;
        } catch (e) { if (e.code !== 11000) throw e; marksDoc = await Marks.findOne({ schoolId, examId: examDoc._id, studentId: stuUser._id, subjectId: sub._id }); }
      }
      if (marksDoc) marksObjects.push({ examDoc, sub, cls: sCls, sec, stuUser, marksDoc });
    }
  }
  ok(`Marks entries: ${marksCount}`);

  // ── 19b. Exam Results (published, aggregated per student per exam) ──────────
  // Mobile/web's "Grades"/"My Results" screens read ExamResult, not Marks — Marks is the raw
  // per-subject entry teachers submit; ExamResult is the published, ranked outcome derived from
  // it. No backend endpoint auto-generates ExamResult from Marks (confirmed: ExamResult is only
  // ever read in exam.controllers.js/studentPortal.controllers.js, never written), so without this
  // step every completed exam above would show real Marks to teachers but an empty Grades tab to
  // students/parents. Built directly off the marksObjects just created/found so the numbers a
  // student sees under "My Results" match what a teacher sees under Evaluation for the same exam.
  function gradeFor(pct) {
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 35) return "D";
    return "F";
  }
  const marksByExam = new Map();
  for (const m of marksObjects) {
    const key = String(m.examDoc._id);
    if (!marksByExam.has(key)) marksByExam.set(key, []);
    marksByExam.get(key).push(m);
  }
  let resultCount = 0;
  for (const [, group] of marksByExam) {
    const ranked = [...group].sort((a, b) => b.marksDoc.obtainedMarks - a.marksDoc.obtainedMarks);
    for (let i = 0; i < ranked.length; i++) {
      const { examDoc, sub, cls, sec, stuUser, marksDoc } = ranked[i];
      const exists = await ExamResult.findOne({ schoolId, examId: examDoc._id, studentId: stuUser._id });
      if (exists) continue;
      const obtained = marksDoc.obtainedMarks;
      const total = marksDoc.totalMarks;
      const passing = marksDoc.passingMarks;
      const pct = Math.round((obtained / total) * 10000) / 100;
      const isPassed = obtained >= passing;
      try {
        await ExamResult.create({
          schoolId, academicYearId: ayId, examId: examDoc._id, studentId: stuUser._id,
          schoolClassId: cls._id, sectionId: sec._id,
          subjects: [{ subjectId: sub._id, subjectName: sub.name, obtainedMarks: obtained, totalMarks: total, passingMarks: passing, isPassed }],
          totalObtainedMarks: obtained, totalMaximumMarks: total, percentage: pct,
          grade: gradeFor(pct), resultStatus: isPassed ? "PASS" : "FAIL", rank: i + 1,
          isPublished: true, publishedAt: new Date(), publishedBy: adminId,
        });
        resultCount++;
      } catch (e) { if (e.code !== 11000) throw e; }
    }
  }
  ok(`Exam Results (published): ${resultCount}`);

  // ── 19c. Live Practice Quiz (question bank + a right-now-takeable online exam) ──
  // Every exam above (real Unit Test/Mid Term/Annual dates) is either already in the past or
  // scheduled days out, and none carry real Question docs in their `questions[]` — attempt.
  // controllers.js's startAttempt requires status "published" AND now within [startTime, endTime],
  // plus real questionId refs to populate. Without this, the actual student-facing "take an exam"
  // flow (ExamTakeScreen/AttemptReviewScreen) would have nothing to test against no matter how
  // many report-style exams exist. This one exam is deliberately scheduled around "now" with a wide
  // window so it stays takeable regardless of when this script is actually run relative to seeding.
  const quizClass = targetClasses[0];
  const quizSection = (sectionMap[String(quizClass?._id)] || [])[0];
  const quizSubject = subjects[0];
  const quizTeacher = teachers[0];
  if (quizClass && quizSubject && quizTeacher) {
    const questionDefs = [
      { statement: "What is 7 + 5?", options: [["A", "10"], ["B", "11"], ["C", "12"], ["D", "13"]], correct: ["C"], type: "mcq_single" },
      { statement: "What is 9 - 4?", options: [["A", "3"], ["B", "4"], ["C", "5"], ["D", "6"]], correct: ["C"], type: "mcq_single" },
      { statement: "Which of these numbers is even?", options: [["A", "3"], ["B", "7"], ["C", "8"], ["D", "11"]], correct: ["C"], type: "mcq_single" },
      { statement: "What is 6 × 3?", options: [["A", "16"], ["B", "18"], ["C", "20"], ["D", "24"]], correct: ["B"], type: "mcq_single" },
      { statement: "True or False: 10 is greater than 15", options: [], correct: ["false"], type: "true_false" },
    ];
    const quizQuestions = [];
    for (const q of questionDefs) {
      let doc = await Question.findOne({ schoolId, schoolClassId: quizClass._id, subjectId: quizSubject._id, statement: q.statement });
      if (!doc) {
        doc = await Question.create({
          schoolId, schoolClassId: quizClass._id, subjectId: quizSubject._id, academicYearId: ayId,
          questionType: q.type,
          statement: q.statement,
          options: q.options.map(([key, text]) => ({ key, text })),
          correctAnswers: q.correct,
          marks: 4, negativeMarks: 0, difficulty: "easy",
          createdBy: quizTeacher._id,
        });
      }
      quizQuestions.push(doc);
    }
    ok(`Question bank: ${quizQuestions.length} questions ready`);

    const quizTitle = "Live Practice Quiz – Mathematics";
    let quizExam = await Exam.findOne({ schoolId, title: quizTitle, schoolClassId: quizClass._id });
    if (!quizExam) {
      const now = new Date();
      const totalMarks = quizQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
      quizExam = await Exam.create({
        academicYearId: ayId, schoolId, title: quizTitle,
        examCode: `QZ${Date.now().toString().slice(-6)}`,
        schoolClassId: quizClass._id, sectionId: quizSection?._id ?? null, subjectId: quizSubject._id,
        examType: "Practice",
        examDate: now,
        startTime: new Date(now.getTime() - 60 * 60 * 1000),   // 1h before "now" ...
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // ... to 4h after, so it stays live whenever this is tested
        durationMinutes: 30,
        totalMarks, passingMarks: Math.ceil(totalMarks * 0.4),
        questions: quizQuestions.map((q) => ({ questionId: q._id, marks: q.marks })),
        settings: { negativeMarking: 0, allowPartialScoring: false, maxAttempts: 1 },
        createdBy: quizTeacher._id, status: "published",
      });
      ok(`Live exam created: "${quizTitle}" (open now → ${quizExam.endTime.toISOString()})`);
    } else {
      skip(`Live exam already exists: "${quizTitle}"`);
    }
  }

  // ── 20. Lesson Plans ─────────────────────────────────────────────────────────
  const planDefs = [
    { title: "Introduction to Algebra",         sub: 0, cls: 0, tch: 0, daysOffset: -30, status: "completed", methods: ["Lecture", "Examples"],       resources: ["Textbook", "Whiteboard"] },
    { title: "Quadratic Equations",              sub: 0, cls: 0, tch: 0, daysOffset: -20, status: "completed", methods: ["Problem Solving"],           resources: ["Textbook"] },
    { title: "Linear Equations in 2 Variables",  sub: 0, cls: 1, tch: 0, daysOffset: -15, status: "completed", methods: ["Lecture", "Group Work"],     resources: ["Graph Paper"] },
    { title: "Photosynthesis Process",           sub: 1, cls: 0, tch: 1, daysOffset: -25, status: "completed", methods: ["Demonstration"],             resources: ["Lab Equipment"] },
    { title: "Cell Division – Mitosis",          sub: 1, cls: 1, tch: 1, daysOffset: -10, status: "approved",  methods: ["Slides", "Video"],           resources: ["Microscope"] },
    { title: "Newton's Laws of Motion",          sub: 1, cls: 2, tch: 1, daysOffset: -5,  status: "approved",  methods: ["Lab", "Theory"],             resources: ["Lab Kit"] },
    { title: "The Tempest – Act 1",              sub: 2, cls: 0, tch: 2, daysOffset: -18, status: "completed", methods: ["Reading", "Discussion"],     resources: ["Novel"] },
    { title: "Grammar – Tenses Review",          sub: 2, cls: 1, tch: 2, daysOffset: -8,  status: "approved",  methods: ["Exercises"],                 resources: ["Workbook"] },
    { title: "Essay Writing Skills",             sub: 2, cls: 2, tch: 2, daysOffset: 5,   status: "draft",     methods: ["Practice"],                  resources: ["Sample Essays"] },
    { title: "French Revolution",                sub: 3, cls: 2, tch: 3, daysOffset: -12, status: "completed", methods: ["Lecture", "Map Work"],       resources: ["Atlas", "Textbook"] },
    { title: "Indian Independence Movement",     sub: 3, cls: 3, tch: 3, daysOffset: -3,  status: "approved",  methods: ["Discussion", "Timeline"],    resources: ["Photos", "Book"] },
    { title: "Water Resources Management",       sub: 3, cls: 4, tch: 3, daysOffset: 8,   status: "draft",     methods: ["Project"],                   resources: ["Internet"] },
    { title: "Hindi Vyakaran – Sandhi",          sub: 4, cls: 0, tch: 4, daysOffset: -22, status: "completed", methods: ["Lecture"],                   resources: ["Grammar Book"] },
    { title: "Kabir ke Dohe",                    sub: 4, cls: 1, tch: 4, daysOffset: -7,  status: "approved",  methods: ["Recitation", "Discussion"],  resources: ["Poetry Book"] },
    { title: "Nibandh Lekhan",                   sub: 4, cls: 2, tch: 4, daysOffset: 12,  status: "draft",     methods: ["Practice Writing"],          resources: ["Sample Nibandhs"] },
  ];
  let planCount = 0;
  if (teachers.length > 0) {
    for (const p of planDefs) {
      const cls = targetClasses[p.cls]; const sub = subjects[p.sub]; const tch = teachers[p.tch];
      if (!cls || !sub || !tch) continue;
      const secs = sectionMap[String(cls._id)] || []; const sec = secs[0];
      if (!sec) continue;
      const exists = await LessonPlan.findOne({ schoolId, title: p.title, teacherId: tch._id });
      if (!exists) {
        await LessonPlan.create({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, subjectId: sub._id, teacherId: tch._id, title: p.title, objectives: `Students will understand ${p.title.toLowerCase()}`, content: `Detailed lesson content for: ${p.title}`, teachingMethods: p.methods, resources: p.resources, assessment: "Class test + homework", plannedDate: daysFromNow(p.daysOffset), duration: 45, status: p.status });
        planCount++;
      }
    }
  }
  ok(`Lesson Plans: ${planCount}`);

  // ── 21. Study Materials ──────────────────────────────────────────────────────
  const smDefs = [
    { title: "NCERT Mathematics Class 6 – Chapter 3 Notes",       sub: 0, cls: 0, tch: 0, type: "notes",         link: "https://example.com/math-ch3-notes.pdf" },
    { title: "Science Lab Manual – Biology Practicals",            sub: 1, cls: 0, tch: 1, type: "book",          link: "https://example.com/bio-lab-manual.pdf" },
    { title: "English Grammar Quick Reference",                    sub: 2, cls: 0, tch: 2, type: "notes",         link: "https://example.com/eng-grammar-ref.pdf" },
    { title: "Indian History – Revision Question Bank",            sub: 3, cls: 2, tch: 3, type: "question_paper", link: "https://example.com/history-qbank.pdf" },
    { title: "Hindi Nibandh Collection – Sample Answers",          sub: 4, cls: 1, tch: 4, type: "notes",         link: "https://example.com/hindi-nibandh.pdf" },
    { title: "Mid-Term Mathematics Paper 2024-25",                 sub: 0, cls: 1, tch: 0, type: "question_paper", link: "https://example.com/math-midterm-2024.pdf" },
    { title: "Physics Formula Sheet – Laws of Motion",             sub: 1, cls: 3, tch: 1, type: "notes",         link: "https://example.com/physics-formula.pdf" },
    { title: "Essay Writing Tips & Practice Exercises",            sub: 2, cls: 2, tch: 2, type: "assignment",    link: "https://example.com/essay-tips.pdf" },
    { title: "Geography: Water Resources – Video Lecture",         sub: 3, cls: 4, tch: 3, type: "video",         link: "https://example.com/water-resources-video" },
    { title: "Algebra Concepts – Animated Video Playlist",         sub: 0, cls: 0, tch: 0, type: "video",         link: "https://example.com/algebra-playlist" },
  ];
  let smCount = 0;
  for (const m of smDefs) {
    const cls = targetClasses[m.cls]; const sub = subjects[m.sub]; const tch = teachers[m.tch];
    if (!cls || !sub || !tch) continue;
    const secs = sectionMap[String(cls._id)] || []; const sec = secs[0];
    if (!sec) continue;
    const exists = await StudyMaterial.findOne({ schoolId, title: m.title, uploadedBy: tch._id });
    if (!exists) {
      await StudyMaterial.create({ schoolId, academicYearId: ayId, schoolClassId: cls._id, sectionId: sec._id, subjectId: sub._id, uploadedBy: tch._id, title: m.title, type: m.type, externalLink: m.link, isActive: true });
      smCount++;
    }
  }
  ok(`Study Materials: ${smCount}`);

  // ── 22. Fee Heads ────────────────────────────────────────────────────────────
  const feeHeadDefs = [
    { name: "Tuition Fee",   type: "recurring" },
    { name: "Exam Fee",      type: "one-time"  },
    { name: "Library Fee",   type: "recurring" },
    { name: "Transport Fee", type: "recurring" },
    { name: "Computer Fee",  type: "recurring" },
    { name: "Sports Fee",    type: "one-time"  },
  ];
  const feeHeads = {};
  for (const fh of feeHeadDefs) {
    let h = await FeeHead.findOne({ schoolId, name: fh.name });
    if (!h) h = await FeeHead.create({ schoolId, name: fh.name, type: fh.type, isEditable: true, status: "active" });
    feeHeads[fh.name] = h;
  }
  ok(`Fee Heads: ${Object.keys(feeHeads).length}`);

  // ── 23. Fee Structures (per class) ──────────────────────────────────────────
  const feeStructureAmounts = {
    "Tuition Fee":   [2500, 2500, 3000, 3000, 3500, 3500], // per class index
    "Exam Fee":      [500,  500,  600,  600,  700,  700],
    "Library Fee":   [200,  200,  200,  200,  300,  300],
    "Transport Fee": [800,  800,  800,  800,  800,  800],
    "Computer Fee":  [300,  300,  400,  400,  500,  500],
    "Sports Fee":    [300,  300,  300,  300,  400,  400],
  };
  const feeStructureMap = {}; // key: `${clsId}_${feeHeadName}` → FeeStructure
  let fsCount = 0;
  for (let ci = 0; ci < targetClasses.length; ci++) {
    const cls = targetClasses[ci];
    for (const [headName, amounts] of Object.entries(feeStructureAmounts)) {
      const head = feeHeads[headName]; if (!head) continue;
      const amount = amounts[ci] || amounts[0];
      const freq   = head.type === "one-time" ? "yearly" : "quarterly";
      let fs = await FeeStructure.findOne({ schoolId, academicYearId: ayId, schoolClassId: cls._id, feeHeadId: head._id });
      if (!fs) {
        try {
          fs = await FeeStructure.create({ schoolId, academicYearId: ayId, schoolClassId: cls._id, feeHeadId: head._id, amount, frequency: freq, isActive: true, createdBy: adminId });
          fsCount++;
        } catch (e) { if (e.code !== 11000) throw e; fs = await FeeStructure.findOne({ schoolId, academicYearId: ayId, schoolClassId: cls._id, feeHeadId: head._id }); }
      }
      if (fs) feeStructureMap[`${cls._id}_${headName}`] = fs;
    }
  }
  ok(`Fee Structures: ${fsCount}`);

  // ── 24. Student Fees + Installments ─────────────────────────────────────────
  // Only seed Tuition Fee for first 8 students
  let sfCount = 0; let instCount = 0;
  const INSTALLMENT_NAMES = ["Q1 (Apr–Jun)", "Q2 (Jul–Sep)", "Q3 (Oct–Dec)", "Q4 (Jan–Mar)"];
  for (const { stuProfile, def, cls } of studentObjects.slice(0, 8)) {
    const fsKey = `${cls._id}_Tuition Fee`;
    const fs = feeStructureMap[fsKey]; if (!fs) continue;
    const totalAmount = fs.amount * 4; // quarterly × 4

    let sf = await StudentFee.findOne({ schoolId, academicYearId: ayId, studentId: stuProfile._id, feeStructureId: fs._id });
    if (!sf) {
      try {
        sf = await StudentFee.create({ schoolId, academicYearId: ayId, studentId: stuProfile._id, feeStructureId: fs._id, totalAmount, paidAmount: fs.amount * 2, dueAmount: fs.amount * 2, assignedBy: adminId });
        sfCount++;
      } catch (e) { if (e.code !== 11000) throw e; sf = await StudentFee.findOne({ schoolId, academicYearId: ayId, studentId: stuProfile._id, feeStructureId: fs._id }); }
    }
    if (!sf) continue;

    for (let qi = 0; qi < 4; qi++) {
      const instName = INSTALLMENT_NAMES[qi];
      const dueMon   = (qi * 3) + 4;
      const dueDate  = dueMon > 12
        ? new Date(`2026-${String(dueMon - 12).padStart(2, "0")}-10`)
        : new Date(`2025-${String(dueMon).padStart(2, "0")}-10`);
      const isPaid   = qi < 2;
      const exists = await FeeInstallment.findOne({ studentFeeId: sf._id, installmentName: instName });
      if (!exists) {
        try {
          await FeeInstallment.create({ schoolId, academicYearId: ayId, studentId: stuProfile._id, studentFeeId: sf._id, installmentName: instName, amount: fs.amount, paidAmount: isPaid ? fs.amount : 0, dueDate, status: isPaid ? "paid" : qi === 2 ? "late" : "pending" });
          instCount++;
        } catch (e) { if (e.code !== 11000) throw e; }
      }
    }
  }
  ok(`Student Fees: ${sfCount}, Installments: ${instCount}`);

  // ── 25. Leave Requests ───────────────────────────────────────────────────────
  const leaveRoleMap = {
    "Teacher":    "teacher",
    "Accountant": "accountant",
    "Librarian":  "librarian",
    "IT Support": "it_support",
    "Counselor":  "counselor",
    "Principal":  "principal",
  };
  const leaveDefs = [
    { userId: teachers[0]?._id,         role: "teacher",    type: "sick",      start: daysAgo(12), end: daysAgo(10), days: 3, reason: "Viral fever — doctor advised rest for 3 days",   status: "approved", approvedBy: adminId },
    { userId: teachers[1]?._id,         role: "teacher",    type: "casual",    start: daysAgo(5),  end: daysAgo(5),  days: 1, reason: "Personal work — bank visit",                    status: "approved", approvedBy: adminId },
    { userId: teachers[2]?._id,         role: "teacher",    type: "paid",      start: daysFromNow(5), end: daysFromNow(7), days: 3, reason: "Family function — brother's wedding",    status: "pending",  approvedBy: null },
    { userId: teachers[3]?._id,         role: "teacher",    type: "emergency", start: daysAgo(2),  end: daysAgo(1),  days: 2, reason: "Family medical emergency",                      status: "approved", approvedBy: adminId },
    { userId: staffMap["Accountant"]?._id, role: "accountant", type: "sick",   start: daysAgo(8),  end: daysAgo(7),  days: 2, reason: "Severe headache — doctor consultation",         status: "approved", approvedBy: adminId },
    { userId: staffMap["Librarian"]?._id,  role: "librarian",  type: "casual", start: daysFromNow(3), end: daysFromNow(3), days: 1, reason: "Attending library science seminar",       status: "pending",  approvedBy: null },
    { userId: staffMap["IT Support"]?._id, role: "it_support", type: "casual", start: daysAgo(3),  end: daysAgo(3),  days: 1, reason: "Personal work",                                 status: "rejected", approvedBy: adminId, rejReason: "Critical maintenance task pending" },
    { userId: teachers[4]?._id,         role: "teacher",    type: "other",     start: daysFromNow(10), end: daysFromNow(12), days: 3, reason: "Attending national-level sports event as spectator", status: "pending", approvedBy: null },
  ];
  let leaveCount = 0;
  for (const l of leaveDefs) {
    if (!l.userId) continue;
    const exists = await LeaveRequest.findOne({ schoolId, userId: l.userId, startDate: l.start });
    if (!exists) {
      const doc = { schoolId, userId: l.userId, role: l.role, leaveType: l.type, startDate: l.start, endDate: l.end, totalDays: l.days, reason: l.reason, status: l.status };
      if (l.approvedBy && l.status === "approved") { doc.approvedBy = l.approvedBy; doc.approvedAt = daysAgo(1); }
      if (l.status === "rejected") { doc.approvedBy = l.approvedBy; doc.rejectionReason = l.rejReason || "Not approved"; }
      await LeaveRequest.create(doc);
      leaveCount++;
    }
  }
  ok(`Leave Requests: ${leaveCount}`);

  // ── 26. Transport + Routes ────────────────────────────────────────────────────
  const transportDefs = [
    { busNumber: "DL-01-AB-1234", driverName: "Mohan Lal",    driverContact: "9820001001", capacity: 40, route: "Route A – South Delhi",   status: "In Use" },
    { busNumber: "DL-01-CD-5678", driverName: "Ramesh Yadav", driverContact: "9820001002", capacity: 35, route: "Route B – West Delhi",    status: "In Use" },
    { busNumber: "DL-01-EF-9012", driverName: "Sunil Kumar",  driverContact: "9820001003", capacity: 45, route: "Route C – East Delhi",    status: "In Use" },
    { busNumber: "DL-01-GH-3456", driverName: "Anil Sharma",  driverContact: "9820001004", capacity: 30, route: "Route D – Noida",         status: "Available" },
    { busNumber: "DL-01-IJ-7890", driverName: "Vijay Singh",  driverContact: "9820001005", capacity: 40, route: "Reserve",                  status: "Maintenance" },
  ];
  const transportDocs = [];
  let transCount = 0;
  for (const t of transportDefs) {
    let doc = await Transport.findOne({ schoolId, busNumber: t.busNumber });
    if (!doc) { doc = await Transport.create({ schoolId, academicYearId: ayId, ...t }); transCount++; }
    transportDocs.push(doc);
  }
  ok(`Transport vehicles: ${transCount}`);

  const routeDefs = [
    { name: "Route A – South Delhi", bus: "DL-01-AB-1234", stops: ["Saket", "Lajpat Nagar", "Defence Colony", "GK-1", "GK-2", "Malviya Nagar"], students: 38 },
    { name: "Route B – West Delhi",  bus: "DL-01-CD-5678", stops: ["Janakpuri", "Uttam Nagar", "Dwarka Sec-6", "Dwarka Sec-10", "Palam"],        students: 32 },
    { name: "Route C – East Delhi",  bus: "DL-01-EF-9012", stops: ["Mayur Vihar", "Preet Vihar", "Vaishali", "Indirapuram", "Vasundhara"],       students: 41 },
    { name: "Route D – Noida",       bus: "DL-01-GH-3456", stops: ["Noida Sec-15", "Noida Sec-18", "Noida Sec-62", "Greater Noida"],             students: 28 },
  ];
  let routeCount = 0;
  for (const r of routeDefs) {
    const exists = await TransportRoute.findOne({ schoolId, name: r.name });
    if (!exists) { await TransportRoute.create({ schoolId, academicYearId: ayId, ...r }); routeCount++; }
  }
  ok(`Transport routes: ${routeCount}`);

  // ── 27. Hostel Rooms + Student Assignments ────────────────────────────────────
  const hostelRoomDefs = [
    { roomNumber: "H-101", capacity: 4 },
    { roomNumber: "H-102", capacity: 4 },
    { roomNumber: "H-103", capacity: 6 },
    { roomNumber: "H-201", capacity: 4 },
    { roomNumber: "H-202", capacity: 6 },
    { roomNumber: "H-203", capacity: 4 },
    { roomNumber: "H-301", capacity: 2 },
    { roomNumber: "H-302", capacity: 2 },
  ];
  let roomCount = 0;
  for (const r of hostelRoomDefs) {
    const exists = await HostelRoom.findOne({ schoolId, roomNumber: r.roomNumber });
    if (!exists) { await HostelRoom.create({ schoolId, academicYearId: ayId, roomNumber: r.roomNumber, capacity: r.capacity, students: [] }); roomCount++; }
  }
  ok(`Hostel rooms: ${roomCount}`);

  // Assign first 6 students to hostel rooms (HostelRoom.students is the actual allocation
  // record every hostel feature — attendance, leave, dashboard — reads from)
  let hostelCount = 0;
  const hostelRoomNumbers = hostelRoomDefs.map((r) => r.roomNumber);
  for (let i = 0; i < Math.min(studentObjects.length, 6); i++) {
    const { stuUser } = studentObjects[i];
    const roomNumber  = hostelRoomNumbers[Math.floor(i / 2)];
    const room = await HostelRoom.findOne({ schoolId, roomNumber });
    if (!room) continue;
    const alreadyAssigned = room.students.some((s) => s.studentId?.toString() === stuUser._id.toString());
    if (!alreadyAssigned) {
      room.students.push({ studentId: stuUser._id, name: stuUser.name });
      await room.save();
      hostelCount++;
    }
  }
  ok(`Hostel assignments: ${hostelCount}`);

  // Attendance history — last 5 days (morning session), so the History tab and dashboard
  // "last attendance" widget have something to show instead of appearing empty
  const hostelAssignedStudents = [];
  for (const roomNumber of hostelRoomNumbers) {
    const room = await HostelRoom.findOne({ schoolId, roomNumber });
    if (!room) continue;
    room.students.forEach((s) => {
      if (s.studentId) hostelAssignedStudents.push({ studentId: s.studentId, name: s.name, roomNumber: room.roomNumber });
    });
  }
  const hostelWardenUser = staffMap["Hostel Warden"];
  let attendanceCount = 0;
  if (hostelWardenUser && hostelAssignedStudents.length > 0) {
    for (let d = 1; d <= 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const exists = await HostelAttendance.findOne({ schoolId, date, session: "morning" });
      if (exists) continue;
      const records = hostelAssignedStudents.map((s, idx) => ({
        studentId: s.studentId,
        studentName: s.name,
        roomNumber: s.roomNumber,
        status: idx === 0 && d === 2 ? "absent" : idx === 1 && d === 3 ? "leave" : "present",
      }));
      await HostelAttendance.create({ schoolId, academicYearId: ayId, date, session: "morning", records, markedBy: hostelWardenUser._id });
      attendanceCount++;
    }
  }
  ok(`Hostel attendance history: ${attendanceCount}`);

  // ── 28. Inventory ────────────────────────────────────────────────────────────
  const inventoryDefs = [
    { name: "Desktop Computer",          category: "IT Equipment",     itemType: "asset",  qty: 45,  unit: "pcs",    allocated: 40, location: "Computer Lab 1 & 2",  minThreshold: 5 },
    { name: "Printer",                   category: "IT Equipment",     itemType: "asset",  qty: 8,   unit: "pcs",    allocated: 8,  location: "Admin Block",          minThreshold: 2 },
    { name: "Projector",                 category: "IT Equipment",     itemType: "asset",  qty: 12,  unit: "pcs",    allocated: 11, location: "Classrooms",           minThreshold: 2 },
    { name: "Science Lab Equipment Set", category: "Lab",              itemType: "asset",  qty: 20,  unit: "sets",   allocated: 18, location: "Science Lab",          minThreshold: 3 },
    { name: "Microscope",                category: "Lab",              itemType: "asset",  qty: 15,  unit: "pcs",    allocated: 15, location: "Biology Lab",          minThreshold: 2 },
    { name: "Whiteboard Marker (Red)",   category: "Stationery",       itemType: "supply", qty: 120, unit: "pcs",    allocated: 80, location: "Storeroom",            minThreshold: 20 },
    { name: "Whiteboard Marker (Black)", category: "Stationery",       itemType: "supply", qty: 200, unit: "pcs",    allocated: 140, location: "Storeroom",           minThreshold: 30 },
    { name: "A4 Paper Ream",             category: "Stationery",       itemType: "supply", qty: 50,  unit: "reams",  allocated: 25, location: "Admin Storeroom",      minThreshold: 10 },
    { name: "Library Book – Fiction",    category: "Library",          itemType: "asset",  qty: 350, unit: "books",  allocated: 220, location: "Library",             minThreshold: 50 },
    { name: "Library Book – Reference",  category: "Library",          itemType: "asset",  qty: 180, unit: "books",  allocated: 90, location: "Library",              minThreshold: 20 },
    { name: "First Aid Kit",             category: "Medical",          itemType: "supply", qty: 5,   unit: "kits",   allocated: 5,  location: "Medical Room",         minThreshold: 2 },
    { name: "Student Chair",             category: "Furniture",        itemType: "asset",  qty: 500, unit: "pcs",    allocated: 480, location: "Classrooms",          minThreshold: 20 },
    { name: "Teacher's Desk",            category: "Furniture",        itemType: "asset",  qty: 30,  unit: "pcs",    allocated: 28, location: "Classrooms",           minThreshold: 3 },
    { name: "CCTV Camera",              category: "Security",         itemType: "asset",  qty: 24,  unit: "pcs",    allocated: 22, location: "Campus",               minThreshold: 2 },
    { name: "Fire Extinguisher",         category: "Safety Equipment", itemType: "asset",  qty: 18,  unit: "pcs",    allocated: 18, location: "All Blocks",           minThreshold: 3 },
  ];
  let invCount = 0;
  for (const item of inventoryDefs) {
    const exists = await Inventory.findOne({ schoolId, name: item.name });
    if (!exists) { await Inventory.create({ schoolId, academicYearId: ayId, ...item }); invCount++; }
  }
  ok(`Inventory items: ${invCount}`);

  // ── 29. Admission Inquiries ──────────────────────────────────────────────────
  const receptionUser = staffMap["Receptionist"] || admin;
  const inquiryDefs = [
    { studentName: "Aryan Kapoor",    dob: "2013-04-12", gender: "male",   cls: "Class 5",  parentName: "Raj Kapoor",    phone: "9900001001", email: "raj.kapoor@email.com",    addr: "Saket, New Delhi",       prevSchool: "St. Mary's School", status: "new",             source: "walk-in" },
    { studentName: "Prisha Malhotra", dob: "2011-08-22", gender: "female", cls: "Class 7",  parentName: "Amit Malhotra", phone: "9900001002", email: "amit.m@gmail.com",        addr: "Dwarka, New Delhi",      prevSchool: "Cambridge School",  status: "contacted",       source: "phone" },
    { studentName: "Dev Sharma",      dob: "2012-11-05", gender: "male",   cls: "Class 6",  parentName: "Ravi Sharma",   phone: "9900001003", email: "ravi.sharma@email.com",   addr: "Rohini, Delhi",          prevSchool: "DAV School",        status: "visit_scheduled", source: "referral" },
    { studentName: "Isha Singh",      dob: "2010-02-18", gender: "female", cls: "Class 8",  parentName: "Prem Singh",    phone: "9900001004", email: "prem.singh@yahoo.com",    addr: "Vaishali, Ghaziabad",    prevSchool: "KV School",         status: "docs_submitted",  source: "website" },
    { studentName: "Kabir Jain",      dob: "2013-07-30", gender: "male",   cls: "Class 5",  parentName: "Sanjeev Jain",  phone: "9900001005", email: "sanjeev.j@hotmail.com",   addr: "Pitampura, Delhi",       prevSchool: "",                  status: "approved",        source: "walk-in" },
    { studentName: "Nisha Rawat",     dob: "2011-01-14", gender: "female", cls: "Class 7",  parentName: "Dinesh Rawat",  phone: "9900001006", email: "dinesh.r@email.com",      addr: "Palam, New Delhi",       prevSchool: "Bal Bharti School", status: "enrolled",        source: "referral" },
    { studentName: "Aditya Verma",    dob: "2009-05-22", gender: "male",   cls: "Class 9",  parentName: "Suresh Verma",  phone: "9900001007", email: "suresh.verma@gmail.com",  addr: "Lajpat Nagar, Delhi",    prevSchool: "Modern School",     status: "rejected",        source: "website" },
    { studentName: "Kavya Patel",     dob: "2012-09-03", gender: "female", cls: "Class 6",  parentName: "Mukesh Patel",  phone: "9900001008", email: "mukesh.patel@gmail.com",  addr: "Indirapuram, Gzb",       prevSchool: "Ryan School",       status: "new",             source: "social_media" },
    { studentName: "Ishaan Khanna",   dob: "2010-12-25", gender: "male",   cls: "Class 8",  parentName: "Deepak Khanna", phone: "9900001009", email: "deepak.k@email.com",      addr: "Mayur Vihar, Delhi",     prevSchool: "GD Goenka",         status: "contacted",       source: "phone" },
    { studentName: "Sanya Mehta",     dob: "2013-03-08", gender: "female", cls: "Class 5",  parentName: "Arun Mehta",    phone: "9900001010", email: "arun.mehta@yahoo.com",    addr: "Janakpuri, Delhi",       prevSchool: "",                  status: "visit_scheduled", source: "walk-in" },
  ];
  let inqCount = 0;
  for (const inq of inquiryDefs) {
    const exists = await AdmissionInquiry.findOne({ schoolId, studentName: inq.studentName, parentPhone: inq.phone });
    if (!exists) {
      await AdmissionInquiry.create({ schoolId, studentName: inq.studentName, dateOfBirth: new Date(inq.dob), gender: inq.gender, applyingClass: inq.cls, academicYear: ay.name, parentName: inq.parentName, parentPhone: inq.phone, parentEmail: inq.email, relationship: "father", address: inq.addr, previousSchool: inq.prevSchool, status: inq.status, source: inq.source, followUpDate: daysFromNow(3), notes: "Interested in science stream. Father works in IT sector.", assignedTo: receptionUser._id });
      inqCount++;
    }
  }
  ok(`Admission Inquiries: ${inqCount}`);

  // ── 30. Complaints ────────────────────────────────────────────────────────────
  const parentUsers = [];
  for (const d of studentDefs.slice(0, 5)) {
    const parentEmail = `parent.${d.email.split("@")[0]}@dps.demo`;
    const pu = await User.findOne({ email: parentEmail });
    if (pu) parentUsers.push(pu);
  }
  const complaintDefs = [
    { userId: parentUsers[0]?._id, subject: "Bus route delay – consistently 20 minutes late", desc: "The school bus on Route A is arriving 20 minutes late every morning for the past 2 weeks, causing students to miss assembly.", status: "in_progress" },
    { userId: parentUsers[1]?._id, subject: "Mid-term marks not uploaded to portal", desc: "My child appeared for mid-term exams 3 weeks ago. Marks are still not visible on the parent portal.", status: "open" },
    { userId: teachers[0]?._id,    subject: "Insufficient chalk and markers in classrooms", desc: "Classrooms in Block B have not been restocked with markers and chalk for over a week.", status: "resolved" },
    { userId: parentUsers[2]?._id, subject: "Classroom too hot – no working fans in Room 5A", desc: "Two ceiling fans in Class 5A are broken. Children are sweating during lessons. Urgent repair needed.", status: "in_progress" },
    { userId: parentUsers[3]?._id, subject: "Canteen serving unhygienic food", desc: "Found a cockroach in the food served at the canteen last Thursday. Serious hygiene issue.", status: "open" },
    { userId: teachers[2]?._id,    subject: "Projector not working in Room 12 for 2 weeks", desc: "The projector in Room 12 has been reported multiple times via support tickets but still not fixed.", status: "closed" },
  ];
  let complaintCount = 0;
  for (const c of complaintDefs) {
    if (!c.userId) continue;
    const exists = await Complaint.findOne({ schoolId, userId: c.userId, subject: c.subject });
    if (!exists) { await Complaint.create({ schoolId, userId: c.userId, subject: c.subject, description: c.desc, status: c.status }); complaintCount++; }
  }
  ok(`Complaints: ${complaintCount}`);

  // ── 31. Employee profiles + PayrollStructures + PayrollCycles + Entries ──────
  const allEmployeeUsers = [...teachers, ...Object.values(staffMap)];

  const salaryByRole = {
    "Teacher":             45000, "Principal":           95000, "Vice Principal":      75000,
    "Accountant":          40000, "Librarian":           35000, "IT Support":          42000,
    "Counselor":           38000, "Receptionist":        28000, "Security":            22000,
    "Hostel Warden":       32000, "Transport Manager":   36000, "Exam Coordinator":    40000,
    "Subject Coordinator": 40000,
  };

  /* Build salary component breakdown from a gross figure */
  function buildStructure(gross) {
    const basic            = Math.round(gross * 0.40);
    const hra              = Math.round(basic * 0.20);
    const da               = Math.round(basic * 0.10);
    const conveyance       = 1600;
    const medical          = 1250;
    const specialAllowance = Math.max(0, gross - basic - hra - da - conveyance - medical);
    const professionalTax  = gross > 10000 ? 200 : 0;
    return {
      basic, hra, da, conveyance, medical, specialAllowance,
      deductions: { professionalTax, tds: 0, lateFine: 0 },
      grossMonthly: gross,
      // PF/ESI on/off is a school-wide switch on PayrollPolicy (Payroll Settings) now, not a
      // per-structure field — nothing to set here.
      professionalTaxEnabled: gross > 10000,
      effectiveFrom: new Date("2025-04-01"),
      status: "active", approvalStatus: "approved",
    };
  }

  /* ── 31a. Employee records ── */
  const employeeMap = {}; // userId string → Employee doc
  let empCount = 0;
  for (const u of allEmployeeUsers) {
    let emp = await Employee.findOne({ schoolId, userId: u._id });
    if (!emp) {
      const deptDoc  = u.departmentId  ? await Department.findById(u.departmentId)  : null;
      const desgDoc  = u.designationId ? await Designation.findById(u.designationId): null;
      const roleName = roles.find((r) => String(r._id) === String(u.roleId))?.name || "Teacher";
      emp = await Employee.create({
        userId:         u._id,
        schoolId,
        academicYearId: ayId,
        phoneNo:        u.phone || "9800000000",
        gender:         u.gender || "Male",
        dateOfBirth:    u.dateOfBirth || new Date("1985-01-01"),
        employeeCode:   u.regId   || `EMP${String(empCount + 1).padStart(3, "0")}`,
        department:     deptDoc?.name  || roleName,
        designation:    desgDoc?.title || roleName,
        employmentType: "Permanent",
        joinDate:       u.joiningDate  || new Date("2018-04-01"),
        isActive:       true,
        schoolMappings: [{ schoolId, role: roleName, isPrimary: true }],
      });
      empCount++;
    }
    employeeMap[String(u._id)] = emp;
  }
  ok(`Employee profiles: ${empCount} new`);

  /* ── 31a2. PayrollPolicy (Payroll Settings) — statutory-default single policy ── */
  let policy = await PayrollPolicy.findOne({ schoolId });
  if (!policy) {
    policy = await PayrollPolicy.create({
      schoolId,
      effectiveFrom: new Date("2025-04-01"),
      notes: "Statutory defaults per India EPF/ESI rules",
      createdBy: adminId,
    });
    ok("PayrollPolicy: 1 new (statutory defaults)");
  } else {
    ok("PayrollPolicy: already exists");
  }

  /* ── 31b. PayrollStructure per employee ── */
  let psCount = 0;
  for (const [userIdStr, emp] of Object.entries(employeeMap)) {
    const u        = allEmployeeUsers.find((u) => String(u._id) === userIdStr);
    const roleName = roles.find((r) => String(r._id) === String(u?.roleId))?.name || "Teacher";
    const gross    = salaryByRole[roleName] || 35000;
    const exists   = await PayrollStructure.findOne({ schoolId, employeeId: emp._id, status: "active" });
    if (!exists) {
      await PayrollStructure.create({ schoolId, employeeId: emp._id, ...buildStructure(gross), approvedBy: adminId });
      psCount++;
    }
  }
  ok(`PayrollStructures: ${psCount}`);

  /* ── 31c. PayrollCycles + Entries — last 4 months relative to today, ending at the
     current month, so the payroll UI (which defaults to viewing the current month) always
     has something to show regardless of when this seed is run. ── */
  const WORKING_DAYS = 26;
  const monthsBack = (n) => {
    const d = new Date();
    d.setDate(1); // avoid month-length rollover (e.g. Jan 31 - 1 month != Dec)
    d.setMonth(d.getMonth() - n);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };
  const payrollMonths = [
    { ...monthsBack(3), status: "paid"   },
    { ...monthsBack(2), status: "paid"   },
    { ...monthsBack(1), status: "locked" },
    { ...monthsBack(0), status: "draft"  },
  ];

  let cycleCount = 0, entryCount = 0;
  for (const pm of payrollMonths) {
    let cycle = await PayrollCycle.findOne({ schoolId, month: pm.month, year: pm.year });
    if (!cycle) {
      cycle = await PayrollCycle.create({
        schoolId, month: pm.month, year: pm.year,
        cycleType: "monthly", status: pm.status,
        processedBy: adminId,
        lockedAt: pm.status !== "draft"  ? daysAgo(5) : null,
        paidAt:   pm.status === "paid"   ? daysAgo(3) : null,
      });
      cycleCount++;
    }

    for (const [userIdStr, emp] of Object.entries(employeeMap)) {
      const u        = allEmployeeUsers.find((u) => String(u._id) === userIdStr);
      const roleName = roles.find((r) => String(r._id) === String(u?.roleId))?.name || "Teacher";
      const gross    = salaryByRole[roleName] || 35000;
      // Use the employee's actual persisted structure (falling back to a fresh build only if
      // it's somehow missing), the same way a real payroll cycle generation would.
      const structureDoc = await PayrollStructure.findOne({ schoolId, employeeId: emp._id, status: "active" });
      const s = structureDoc || buildStructure(gross);

      const exists = await PayrollEntry.findOne({ payrollCycleId: cycle._id, employeeId: emp._id });
      if (!exists) {
        const presentDays = Math.floor(Math.random() * 3) + 23; // 23–25
        const leaveDays   = Math.floor(Math.random() * 2);       // 0–1

        // Run the actual calculation engine — the same one every real payroll cycle uses —
        // so seeded entries never drift from what the app itself would compute.
        const calculated = calculatePayrollEntry({
          structure: s,
          attendance: { workingDays: WORKING_DAYS, presentDays, leaveDays },
          policy,
          employeeStatutory: emp.statutoryCompliance,
        });

        try {
          await PayrollEntry.create({
            payrollCycleId: cycle._id, schoolId, employeeId: emp._id,
            workingDays: calculated.attendance.workingDays,
            presentDays: calculated.attendance.presentDays,
            paidLeaves: calculated.attendance.paidLeaves,
            lopDays: calculated.attendance.lopDays,
            earningsBreakdown: calculated.earningsBreakdown,
            deductionsBreakdown: calculated.deductionsBreakdown,
            employerContributions: calculated.employerContributions,
            statutorySnapshot: {
              uan: emp.statutoryCompliance?.uan || null,
              esicNumber: emp.statutoryCompliance?.esicNumber || null,
            },
            grossEarnings: calculated.grossEarnings,
            totalDeductions: calculated.totalDeductions,
            netPay: calculated.netPay,
            warnings:      calculated.attendance.lopDays > 2 ? ["High LOP days — verify attendance"] : [],
            paymentStatus: pm.status === "paid" ? "paid"  : "pending",
            paymentMode:   pm.status === "paid" ? "bank"  : null,
            paidAt:        pm.status === "paid" ? daysAgo(3) : null,
            transactionRef: pm.status === "paid"
              ? `SAL-${pm.year}${String(pm.month).padStart(2, "0")}-${emp._id}`
              : null,
          });
          entryCount++;
        } catch (e) { if (e.code !== 11000) throw e; }
      }
    }
  }
  ok(`PayrollCycles: ${cycleCount}, PayrollEntries: ${entryCount}`);

  // ── 32. Support Tickets ───────────────────────────────────────────────────────
  const reporter  = teachers[0] || admin;
  const itUser    = staffMap["IT Support"] || admin;
  const ticketDefs = [
    { title: "Projector not working in Room 12",     desc: "Projector stopped displaying. Need urgent fix.", cat: "Technical", priority: "High",   status: "Open",        daysAgoN: 3  },
    { title: "Printer paper jam – Admin Block",      desc: "HP LaserJet showing paper jam error repeatedly.", cat: "Technical", priority: "Medium", status: "In Progress", daysAgoN: 5  },
    { title: "Student fee receipt not generating",   desc: "PDF export fails for students admitted after April 2025.", cat: "Finance",   priority: "High",   status: "In Progress", daysAgoN: 7  },
    { title: "Library catalog system down",          desc: "Library system shows connection refused error.", cat: "Technical", priority: "Urgent", status: "Open",        daysAgoN: 1  },
    { title: "Attendance report showing wrong data", desc: "Monthly attendance wrong absent count for Class 8B.", cat: "Academic",  priority: "Medium", status: "Open",        daysAgoN: 2  },
    { title: "WiFi issue in Computer Lab 2",         desc: "Students in Lab 2 unable to connect to school WiFi.", cat: "Technical", priority: "High",   status: "Resolved",    daysAgoN: 10 },
    { title: "CCTV camera 3 offline",               desc: "Camera near main gate offline. Security concern.", cat: "Technical", priority: "Urgent", status: "Resolved",    daysAgoN: 12 },
    { title: "Email notifications not sending",      desc: "Automated exam-result emails not reaching parents.", cat: "Technical", priority: "High",   status: "Open",        daysAgoN: 4  },
    { title: "Transport GPS not updating",           desc: "GPS tracker for Bus Route 3 stopped live location updates.", cat: "Transport", priority: "Medium", status: "In Progress", daysAgoN: 6  },
    { title: "Request for classroom furniture",      desc: "Class 10A needs 5 additional chairs and 2 desks.", cat: "General",   priority: "Low",    status: "Open",        daysAgoN: 8  },
  ];
  let ticketCount = 0;
  for (const t of ticketDefs) {
    const exists = await SupportTicket.findOne({ schoolId, title: t.title });
    if (!exists) {
      await SupportTicket.create({ schoolId, title: t.title, description: t.desc, category: t.cat, priority: t.priority, status: t.status, createdBy: reporter._id, assignedTo: itUser._id, resolvedBy: t.status === "Resolved" ? itUser._id : null, resolvedAt: t.status === "Resolved" ? daysAgo(t.daysAgoN - 2) : null, updates: t.status !== "Open" ? [{ note: "Team is working on this issue", updatedBy: itUser._id, updatedAt: daysAgo(Math.max(1, t.daysAgoN - 1)) }] : [] });
      ticketCount++;
    }
  }
  ok(`Support Tickets: ${ticketCount}`);

  // ── 33. School Events ─────────────────────────────────────────────────────────
  const eventDefs = [
    { title: "Annual Sports Day 2025",        type: "Activity", desc: "Annual inter-house sports competition.",            location: "School Ground",      audience: "All",      start: daysFromNow(20),  end: daysFromNow(21),  color: "#FF6B35" },
    { title: "Independence Day Celebration",  type: "Holiday",  desc: "National Independence Day flag hoisting.",          location: "Assembly Ground",    audience: "All",      start: daysFromNow(55),  end: daysFromNow(55),  color: "#F7931E" },
    { title: "Parent-Teacher Meeting – July", type: "Meeting",  desc: "Quarterly PTM for Classes 6–10.",                   location: "Classrooms",         audience: "Parents",  start: daysFromNow(15),  end: daysFromNow(15),  color: "#6B48FF" },
    { title: "Science Exhibition 2025",       type: "Activity", desc: "Inter-class science project exhibition.",           location: "School Hall",        audience: "All",      start: daysFromNow(30),  end: daysFromNow(31),  color: "#00B4D8" },
    { title: "Dussehra Holiday",              type: "Holiday",  desc: "School closed for Dussehra.",                       location: "",                   audience: "All",      start: daysFromNow(45),  end: daysFromNow(45),  color: "#EF233C" },
    { title: "Mid-Term Exams (Concluded)",    type: "Exam",     desc: "Mid-term examinations for all classes.",            location: "Classrooms",         audience: "Students", start: daysFromNow(-18), end: daysFromNow(-12), color: "#457B9D" },
    { title: "Staff Development Workshop",    type: "Meeting",  desc: "Monthly training session for all teaching staff.",  location: "Conference Room",    audience: "Teachers", start: daysFromNow(8),   end: daysFromNow(8),   color: "#2D6A4F" },
    { title: "Annual Prize Distribution",     type: "Event",    desc: "Prize distribution for top-performing students.",   location: "School Auditorium",  audience: "All",      start: daysFromNow(60),  end: daysFromNow(60),  color: "#D4A017" },
    { title: "Board Exam Preparation Camp",   type: "Activity", desc: "Special revision classes for Class 10 board prep.", location: "Classrooms",         audience: "Students", start: daysFromNow(3),   end: daysFromNow(14),  color: "#9B2335" },
    { title: "Teachers' Day Celebration",     type: "Event",    desc: "Students celebrate Teachers Day with performances.", location: "School Hall",        audience: "All",      start: daysFromNow(-5),  end: daysFromNow(-5),  color: "#4CAF50" },
  ];
  let eventCount = 0;
  for (const e of eventDefs) {
    const exists = await SchoolEvent.findOne({ schoolId, title: e.title });
    if (!exists) { await SchoolEvent.create({ schoolId, title: e.title, type: e.type, description: e.desc, location: e.location, audience: e.audience, startDate: e.start, endDate: e.end, allDay: true, color: e.color, status: e.start < new Date() ? "completed" : "scheduled", createdBy: adminId }); eventCount++; }
  }
  ok(`School Events: ${eventCount}`);

  // ── 34. Notifications ────────────────────────────────────────────────────────
  const notifDefs = [
    { title: "Mid-Term Results Published",          msg: "Mid-term results for Classes 6-10 are now available on the portal.",                          level: "all",  roles: [] },
    { title: "Parent-Teacher Meeting – July 15",    msg: "Dear Parents, PTM is on July 15 from 9 AM to 1 PM. Kindly confirm attendance.",              level: "role", roles: ["Parent"] },
    { title: "Annual Sports Day Registration Open", msg: "Students must register with their class teacher for sports events by July 10.",              level: "role", roles: ["Student"] },
    { title: "Staff Meeting – July 5 at 3 PM",      msg: "All staff must attend the monthly meeting on July 5 in the conference room at 3 PM.",        level: "role", roles: ["Teacher"] },
    { title: "Fee Payment Reminder – 2nd Quarter",  msg: "Q2 fee installment is due July 10. Pay on time to avoid late charges.",                      level: "role", roles: ["Parent"] },
    { title: "New Study Materials Uploaded",        msg: "Teachers have uploaded new study materials for Mathematics and Science. Check the portal.",   level: "role", roles: ["Student"] },
    { title: "Leave Request Approval",              msg: "Your leave request for July 2-4 has been approved by the administration.",                    level: "role", roles: ["Teacher"] },
    { title: "Science Exhibition – Participation",  msg: "Students wishing to participate in Science Exhibition must submit their project title by July 5.", level: "role", roles: ["Student"] },
  ];
  let notifCount = 0;
  for (const n of notifDefs) {
    const exists = await Notification.findOne({ schoolId, title: n.title });
    if (!exists) { await Notification.create({ schoolId, title: n.title, message: n.msg, level: n.level, targetRoles: n.roles, channels: { inApp: true, email: true, sms: false, whatsapp: false }, deliveryStats: { sent: 150, opened: 98, failed: 2 }, status: "sent", readBy: [], createdBy: admin.name, createdById: adminId }); notifCount++; }
  }
  ok(`Notifications: ${notifCount}`);

  // ── 35. Activity Logs ────────────────────────────────────────────────────────
  const adminRole = await Role.findOne({ name: "School Admin" });
  const logDefs = [
    { action: "USER_CREATED",       desc: "Created 20 student accounts for 2025-26",           daysAgoN: 14 },
    { action: "EXAM_PUBLISHED",     desc: "Published Mid-Term schedule for Classes 6-10",       daysAgoN: 20 },
    { action: "NOTIFICATION_SENT",  desc: "Sent fee payment reminder to all parents",           daysAgoN: 7  },
    { action: "REPORT_EXPORTED",    desc: "Exported monthly attendance report for June 2025",   daysAgoN: 3  },
    { action: "EVENT_CREATED",      desc: "Created Annual Sports Day event",                    daysAgoN: 10 },
    { action: "USER_UPDATED",       desc: "Updated enrollment status for 5 students",           daysAgoN: 5  },
    { action: "FEE_STRUCTURE_SET",  desc: "Configured fee structure for academic year 2025-26", daysAgoN: 25 },
    { action: "SECTION_CREATED",    desc: "Created sections A & B for 6 classes",               daysAgoN: 30 },
    { action: "ACADEMIC_YEAR_SET",  desc: "Set 2025-2026 as the active academic year",          daysAgoN: 45 },
    { action: "BACKUP_COMPLETED",   desc: "Scheduled database backup completed successfully",   daysAgoN: 2  },
    { action: "PAYROLL_PROCESSED",  desc: "Processed June 2025 payroll for 17 employees",       daysAgoN: 4  },
    { action: "LEAVE_APPROVED",     desc: "Approved 4 leave requests from teaching staff",      daysAgoN: 6  },
    { action: "ADMISSION_UPDATED",  desc: "Updated 3 admission inquiries to enrolled status",   daysAgoN: 8  },
    { action: "TIMETABLE_CREATED",  desc: "Published timetable for Class 6 and Class 7",        daysAgoN: 15 },
  ];
  for (const l of logDefs) {
    const ts  = daysAgo(l.daysAgoN);
    const doc = await ActivityLog.create({ user: adminId, action: l.action, description: l.desc, role: adminRole?._id, school: schoolId, ipAddress: "192.168.1.10", userAgent: "SeedScript/1.0" });
    await ActivityLog.updateOne({ _id: doc._id }, { $set: { createdAt: ts, updatedAt: ts } });
  }
  ok(`Activity Logs: ${logDefs.length}`);

  // ── 36. Maintenance Tasks ────────────────────────────────────────────────────
  const itCreator = staffMap["IT Support"] || admin;
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
    if (!exists) { await MaintenanceTask.create({ title: t.title, description: t.desc, priority: t.priority, status: t.status, dueDate: daysFromNow(t.daysFromNowN), school: schoolId, createdBy: itCreator._id }); taskCount++; }
  }
  ok(`Maintenance Tasks: ${taskCount}`);

  // ── Done ──────────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed complete!  (password for all demo accounts: Demo@123)

ADMIN / MANAGEMENT:
  principal@dps.demo          (Principal)
  viceprincipal@dps.demo      (Vice Principal)
  examcoord@dps.demo          (Exam Coordinator)
  subjcoord@dps.demo          (Subject Coordinator)

TEACHERS:
  rajesh.kumar@dps.demo       (Math)
  priya.sharma@dps.demo       (Science)
  amit.singh@dps.demo         (English)
  sunita.verma@dps.demo       (Social Studies)
  deepak.joshi@dps.demo       (Hindi)

SUPPORT STAFF:
  accountant@dps.demo         (Accountant)
  librarian@dps.demo          (Librarian)
  itsupport@dps.demo          (IT Support)
  counselor@dps.demo          (Counselor)
  receptionist@dps.demo       (Receptionist)
  security@dps.demo           (Security)
  hostelwarden@dps.demo       (Hostel Warden)
  transport@dps.demo          (Transport Manager)

NEW ROLES (added today):
  sportsteacher@dps.demo      (Sports Teacher)
  labtechnician@dps.demo      (Lab Technician)
  medicalofficer@dps.demo     (Medical Officer)
  classteacher@dps.demo       (Class Teacher)

MULTI-ROLE DEMO:
  rajesh.kumar@dps.demo       (Teacher + Class Teacher additional role → Class 1A)
  priya.sharma@dps.demo       (Teacher + Exam Coordinator additional role → Class 2A)

STUDENTS (sample):
  aarav.s@dps.demo            (Class 1 – Sec A)
  diya.p@dps.demo             (Class 1 – Sec A)
  ...18 more students

PARENTS (sample):
  parent.aarav.s@dps.demo     → Aarav Sharma's parent

MODULES SEEDED:
  ✓ Departments (6) & Designations (19)
  ✓ New Roles (Sports Teacher, Lab Technician, Medical Officer, Class Teacher)
  ✓ Multi-role demo (additional roles assigned to Rajesh Kumar & Priya Sharma)
  ✓ Class Teacher Assignments (Rajesh → Cls 1A, Priya → Cls 2A, Amit → Cls 3B)
  ✓ Teacher Assignments
  ✓ Timetable (TimeSlots + Periods)
  ✓ Assignments + Submissions
  ✓ Exam Marks (completed exams)
  ✓ Exam Results (published, ranked — powers Student/Parent "Grades")
  ✓ Question Bank (5 questions) + a live "Practice Quiz" exam, open now
  ✓ Lesson Plans
  ✓ Study Materials
  ✓ Fee Heads + Fee Structures + Student Fees + Installments
  ✓ Student Attendance (30 days)
  ✓ Staff Attendance (20 days)
  ✓ Leave Requests
  ✓ Transport Vehicles + Routes
  ✓ Hostel Rooms + Assignments
  ✓ Inventory (15 items)
  ✓ Admission Inquiries (10)
  ✓ Complaints (6)
  ✓ Employee profiles (17 staff + teachers)
  ✓ PayrollStructures (salary components per employee)
  ✓ PayrollCycles (Apr/May/Jun 2025) + PayrollEntries
  ✓ Support Tickets
  ✓ School Events
  ✓ Notifications
  ✓ Activity Logs
  ✓ Maintenance Tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

seed()
  .catch((err) => { console.error("❌ Seed failed:", err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

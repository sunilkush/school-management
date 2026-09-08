/**
 * Runs scripts/seedDemoModules.mjs against a throwaway in-memory database seeded with just enough
 * base data, then checks what it actually produced. Never points at the real database.
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

import { School } from "../src/models/school.model.js";
import { Role } from "../src/models/Roles.model.js";
import { User } from "../src/models/user.model.js";
import { AcademicYear } from "../src/models/AcademicYear.model.js";
import { Student } from "../src/models/student.model.js";
import { StudentEnrollment } from "../src/models/StudentEnrollment.model.js";
import { Transport } from "../src/models/Transport.model.js";
import { TransportRoute } from "../src/models/TransportRoute.model.js";
import { Subject } from "../src/models/subject.model.js";
import { Exam } from "../src/models/exam.model.js";

const rs = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger", args: ["--setParameter", "maxTransactionLockRequestTimeoutMillis=5000"] },
});
const uri = rs.getUri("demo_seed_check");
process.env.MONGOOSE_URI = uri;

await mongoose.connect(uri);
const oid = () => new mongoose.Types.ObjectId();

const school = await School.create({ name: "Demo Public School", email: "demo@school.test" });
const adminRole = await Role.create({ name: "School Admin", schoolId: school._id, type: "system", code: "SA" });
const teacherRole = await Role.create({ name: "Teacher", schoolId: school._id, type: "system", code: "TCH" });
const studentRole = await Role.create({ name: "Student", schoolId: school._id, type: "system", code: "STU" });
const parentRole = await Role.create({ name: "Parent", schoolId: school._id, type: "system", code: "PAR" });

const admin = await User.create({ name: "Admin", email: "admin@demo.test", password: "Password123!", roleId: adminRole._id, schoolId: school._id, isActive: true });
const year = await AcademicYear.create({ schoolId: school._id, name: "2025-2026", startDate: new Date("2025-06-01"), endDate: new Date("2026-04-30"), isActive: true, status: "active" });

const classId = oid();
const sectionId = oid();

for (let i = 0; i < 12; i += 1) {
  await User.create({ name: `Teacher ${i}`, email: `t${i}@demo.test`, password: "Password123!", roleId: teacherRole._id, schoolId: school._id, isActive: true });
}
for (let i = 0; i < 25; i += 1) {
  const u = await User.create({ name: `Student ${i}`, email: `s${i}@demo.test`, password: "Password123!", roleId: studentRole._id, schoolId: school._id, isActive: true });
  const st = await Student.create({ userId: u._id, schoolId: school._id, dateOfBirth: new Date("2012-05-05") });
  await StudentEnrollment.create({ studentId: st._id, schoolId: school._id, academicYearId: year._id, schoolClassId: classId, sectionId, registrationNumber: `REG-${i}`, rollNumber: i + 1, admissionDate: new Date(), status: "Active" });
}
// Parents exist so the survey step has an audience to resolve — without them it correctly skips,
// and a step that skips is a step this script is not checking.
for (let i = 0; i < 10; i += 1) {
  await User.create({ name: `Parent ${i}`, email: `p${i}@demo.test`, password: "Password123!", roleId: parentRole._id, schoolId: school._id, isActive: true });
}
for (const name of ["Route A – South Delhi", "Route B – West Delhi", "Route C – East Delhi"]) {
  await TransportRoute.create({ schoolId: school._id, academicYearId: year._id, name, bus: "DL-01", stops: [] });
}
for (let i = 0; i < 3; i += 1) {
  await Transport.create({ schoolId: school._id, academicYearId: year._id, busNumber: `DL-01-AB-${1000 + i}`, driverName: `Driver ${i + 1}`, capacity: 40, status: "In Use" });
}
const subject = await Subject.create({ schoolId: school._id, name: "Mathematics", code: "MATH", academicYearId: year._id });
const subject2 = await Subject.create({ schoolId: school._id, name: "Science", code: "SCI", academicYearId: year._id });
for (let i = 0; i < 3; i += 1) {
  await Exam.create({ academicYearId: year._id, schoolId: school._id, title: `Unit Test ${i + 1}`, examCode: `UT${i + 1}`, schoolClassId: classId, sectionId, subjectId: i === 0 ? subject._id : subject2._id, examType: "written", examDate: new Date(), startTime: new Date(), endTime: new Date(Date.now() + 3600000), durationMinutes: 60, totalMarks: 100, passingMarks: 33, createdBy: admin._id });
}
console.log("base fixture ready\n");

/* ── run the seeder in this same process and wait for it ── */
const { main } = await import("./seedDemoModules.mjs");
await main();

/* ── check what it produced ── */
const reconnect = async () => {
  if (mongoose.connection.readyState !== 1) await mongoose.connect(uri);
  await mongoose.connection.asPromise();
};
await reconnect();
const count = async (c, q = {}) => mongoose.connection.db.collection(c).countDocuments(q);

const snapshot = async () => ({
  "ledger accounts": await count("ledgeraccounts"),
  "journal entries": await count("journalentries"),
  "income rows": await count("incomes"),
  "expense rows": await count("expenses"),
  "routes with stops": await count("transportroutes", { "stopPoints.0": { $exists: true } }),
  "trips": await count("transporttrips"),
  "trips running now": await count("transporttrips", { status: "running" }),
  "trail points": await count("vehiclelocations"),
  "attendance devices": await count("attendancedevices"),
  "cards enrolled": await count("attendancecredentials"),
  "device punches": await count("devicepunches"),
  "unmatched punches": await count("devicepunches", { userId: null }),
  "attendance from device": await count("attendances", { source: "device" }),
  "online classes": await count("onlineclasses"),
  "online joins": await count("onlineclassjoins"),
  "report card templates": await count("reportcardtemplates"),
  "surveys": await count("surveys"),
  "survey responses": await count("surveyresponses"),
  "survey participation": await count("surveyparticipations"),
  "students with PEN": await count("students", { "compliance.pen": { $nin: ["", null] } }),
  "students left incomplete": await count("students", { "compliance.pen": "" }),
  "RTE students": await count("students", { "compliance.rteAdmission": true }),
});

const first = await snapshot();
console.log("\n=== what landed in the database ===");
for (const [k, v] of Object.entries(first)) console.log(`  ${String(v).padStart(4)}  ${k}`);
const s2 = await mongoose.connection.db.collection("schools").findOne({});
console.log(`\n  UDISE code: ${s2?.compliance?.udiseCode}`);

console.log("\n=== re-running (must not duplicate) ===");
await main();
await reconnect();
const second = await snapshot();
let drift = 0;
for (const [k, v] of Object.entries(second)) {
  if (first[k] !== v) { drift += 1; console.log(`  CHANGED  ${k}: ${first[k]} -> ${v}`); }
}
console.log(drift === 0 ? "  (no counts changed)\n✅ idempotent" : `\n❌ ${drift} counts changed`);

await mongoose.disconnect();
await rs.stop();
